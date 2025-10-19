/**
 * Servicio para comparar el desempeño real de los lotes con las métricas de referencia
 */

import { calculateAgeInDays } from '../utils/dateUtils';
import {
    obtenerMetricaEngordePorRaza,
    obtenerMetricaLevantesPorRaza,
    obtenerMetricaPonedorasPorRaza
} from './metricas-referencia.service';

export enum NivelDesempeno {
    EXCELENTE = 'EXCELENTE',
    BUENO = 'BUENO',
    ACEPTABLE = 'ACEPTABLE',
    POR_DEBAJO = 'POR_DEBAJO',
    CRITICO = 'CRITICO',
}

export interface ComparacionDesempeno {
    nivelDesempeno: NivelDesempeno;
    porcentajeVsEsperado: number;
    valorEsperado: number;
    valorActual: number;
    diferencia: number;
    mensaje: string;
    color: string;
    requiereAtencion: boolean;
}

export interface AlertaDesempeno {
    tipo: 'PESO' | 'PRODUCCION' | 'MORTALIDAD' | 'CONVERSION';
    nivel: 'INFO' | 'WARNING' | 'DANGER';
    titulo: string;
    mensaje: string;
    valorActual: number;
    valorEsperado: number;
    recomendaciones: string[];
}

/**
 * Comparar peso de lote de engorde con métrica de referencia
 */
export const compararPesoEngorde = async (
    lote: any,
    raza?: string
): Promise<ComparacionDesempeno | null> => {
    try {
        const razaLote = raza || lote.raza || 'COBB';
        const metrica = await obtenerMetricaEngordePorRaza(razaLote);
        
        if (!metrica || !metrica.pesosPorEdad || metrica.pesosPorEdad.length === 0) {
            return null;
        }

        const edadDias = calculateAgeInDays(new Date(lote.fechaNacimiento));
        const pesoActualLibras = lote.pesoPromedio || 0;
        
        // Buscar el peso esperado para la edad actual
        const pesoReferencia = metrica.pesosPorEdad.find(p => p.edad === edadDias) ||
            interpolaPesoEsperado(metrica.pesosPorEdad, edadDias);
        
        if (!pesoReferencia) {
            return null;
        }

        // Convertir gramos a libras (1 lb = 453.592 g)
        const pesoEsperadoLibras = pesoReferencia.pesoPromedio / 453.592;
        const diferencia = pesoActualLibras - pesoEsperadoLibras;
        const porcentajeVsEsperado = pesoEsperadoLibras > 0 
            ? (pesoActualLibras / pesoEsperadoLibras) * 100 
            : 0;

        return evaluarDesempeno(
            pesoActualLibras,
            pesoEsperadoLibras,
            porcentajeVsEsperado,
            'peso'
        );
    } catch (error) {
        console.error('Error al comparar peso de engorde:', error);
        return null;
    }
};

/**
 * Comparar peso de lote de levantes con métrica de referencia
 */
export const compararPesoLevantes = async (
    lote: any,
    raza?: string
): Promise<ComparacionDesempeno | null> => {
    try {
        const razaLote = raza || lote.raza || 'COBB';
        const metrica = await obtenerMetricaLevantesPorRaza(razaLote);
        
        if (!metrica || !metrica.pesosPorEdad || metrica.pesosPorEdad.length === 0) {
            return null;
        }

        const edadDias = calculateAgeInDays(new Date(lote.fechaNacimiento));
        const pesoActualLibras = lote.pesoPromedio || 0;
        
        const pesoReferencia = metrica.pesosPorEdad.find(p => p.edad === edadDias) ||
            interpolaPesoEsperado(metrica.pesosPorEdad, edadDias);
        
        if (!pesoReferencia) {
            return null;
        }

        // Convertir gramos a libras
        const pesoEsperadoLibras = pesoReferencia.pesoPromedio / 453.592;
        const diferencia = pesoActualLibras - pesoEsperadoLibras;
        const porcentajeVsEsperado = pesoEsperadoLibras > 0 
            ? (pesoActualLibras / pesoEsperadoLibras) * 100 
            : 0;

        return evaluarDesempeno(
            pesoActualLibras,
            pesoEsperadoLibras,
            porcentajeVsEsperado,
            'peso'
        );
    } catch (error) {
        console.error('Error al comparar peso de levantes:', error);
        return null;
    }
};

/**
 * Comparar producción de ponedoras con métrica de referencia
 */
export const compararProduccionPonedoras = async (
    lote: any,
    tasaPosturaActual: number,
    raza?: string
): Promise<ComparacionDesempeno | null> => {
    try {
        const razaLote = raza || lote.raza || 'LOHMANN BROWN';
        const metrica = await obtenerMetricaPonedorasPorRaza(razaLote);
        
        if (!metrica || !metrica.produccionPorEdad || metrica.produccionPorEdad.length === 0) {
            return null;
        }

        const edadDias = calculateAgeInDays(new Date(lote.fechaNacimiento));
        const edadSemanas = Math.floor(edadDias / 7);
        
        // Buscar la tasa esperada para la edad actual
        const produccionReferencia = metrica.produccionPorEdad.find(p => p.edad === edadSemanas);
        
        if (!produccionReferencia) {
            return null;
        }

        const tasaEsperada = produccionReferencia.tasaPostura;
        const diferencia = tasaPosturaActual - tasaEsperada;
        const porcentajeVsEsperado = tasaEsperada > 0 
            ? (tasaPosturaActual / tasaEsperada) * 100 
            : 0;

        return evaluarDesempeno(
            tasaPosturaActual,
            tasaEsperada,
            porcentajeVsEsperado,
            'produccion'
        );
    } catch (error) {
        console.error('Error al comparar producción de ponedoras:', error);
        return null;
    }
};

/**
 * Comparar mortalidad con métrica de referencia
 */
export const compararMortalidad = async (
    lote: any,
    tasaMortalidadActual: number,
    raza?: string
): Promise<ComparacionDesempeno | null> => {
    try {
        const razaLote = raza || lote.raza || 'COBB';
        let mortalidadEsperada = 5; // Default 5%

        // Obtener la mortalidad esperada según el tipo de lote
        if (lote.tipo === 'gallina_ponedora') {
            const metrica = await obtenerMetricaPonedorasPorRaza(razaLote);
            if (metrica) mortalidadEsperada = metrica.mortalidadEsperada || 5;
        } else if (lote.tipo === 'pollo_engorde') {
            const metrica = await obtenerMetricaEngordePorRaza(razaLote);
            if (metrica) mortalidadEsperada = metrica.mortalidadEsperada || 5;
        } else {
            const metrica = await obtenerMetricaLevantesPorRaza(razaLote);
            if (metrica) mortalidadEsperada = metrica.mortalidadEsperada || 5;
        }

        const diferencia = tasaMortalidadActual - mortalidadEsperada;
        // Para mortalidad, mientras menor mejor, así que invertimos el porcentaje
        const porcentajeVsEsperado = mortalidadEsperada > 0 
            ? (mortalidadEsperada / tasaMortalidadActual) * 100 
            : 100;

        return evaluarDesempeno(
            tasaMortalidadActual,
            mortalidadEsperada,
            porcentajeVsEsperado,
            'mortalidad'
        );
    } catch (error) {
        console.error('Error al comparar mortalidad:', error);
        return null;
    }
};

/**
 * Generar alertas de desempeño para un lote
 */
export const generarAlertasDesempeno = async (
    lote: any,
    comparaciones: {
        peso?: ComparacionDesempeno;
        produccion?: ComparacionDesempeno;
        mortalidad?: ComparacionDesempeno;
    }
): Promise<AlertaDesempeno[]> => {
    const alertas: AlertaDesempeno[] = [];

    if (comparaciones.peso && comparaciones.peso.requiereAtencion) {
        alertas.push({
            tipo: 'PESO',
            nivel: comparaciones.peso.nivelDesempeno === NivelDesempeno.CRITICO ? 'DANGER' : 'WARNING',
            titulo: 'Peso por debajo del estándar',
            mensaje: comparaciones.peso.mensaje,
            valorActual: comparaciones.peso.valorActual,
            valorEsperado: comparaciones.peso.valorEsperado,
            recomendaciones: [
                'Revisar la calidad del alimento',
                'Verificar el consumo de agua',
                'Evaluar posibles enfermedades',
                'Consultar con un veterinario'
            ]
        });
    }

    if (comparaciones.produccion && comparaciones.produccion.requiereAtencion) {
        alertas.push({
            tipo: 'PRODUCCION',
            nivel: comparaciones.produccion.nivelDesempeno === NivelDesempeno.CRITICO ? 'DANGER' : 'WARNING',
            titulo: 'Producción por debajo del estándar',
            mensaje: comparaciones.produccion.mensaje,
            valorActual: comparaciones.produccion.valorActual,
            valorEsperado: comparaciones.produccion.valorEsperado,
            recomendaciones: [
                'Revisar la iluminación del galpón',
                'Verificar el programa de alimentación',
                'Evaluar el estrés en las aves',
                'Revisar la temperatura ambiente'
            ]
        });
    }

    if (comparaciones.mortalidad && comparaciones.mortalidad.requiereAtencion) {
        alertas.push({
            tipo: 'MORTALIDAD',
            nivel: comparaciones.mortalidad.nivelDesempeno === NivelDesempeno.CRITICO ? 'DANGER' : 'WARNING',
            titulo: 'Mortalidad elevada',
            mensaje: comparaciones.mortalidad.mensaje,
            valorActual: comparaciones.mortalidad.valorActual,
            valorEsperado: comparaciones.mortalidad.valorEsperado,
            recomendaciones: [
                'Implementar medidas de bioseguridad inmediatas',
                'Consultar con un veterinario URGENTE',
                'Revisar condiciones ambientales del galpón',
                'Verificar la calidad del alimento y agua',
                'Aislar aves enfermas'
            ]
        });
    }

    return alertas;
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Interpolar peso esperado cuando no hay un valor exacto para la edad
 */
function interpolaPesoEsperado(pesosPorEdad: any[], edadDias: number): any | null {
    if (pesosPorEdad.length === 0) return null;

    // Si la edad es menor que el primer registro, usar el primero
    if (edadDias <= pesosPorEdad[0].edad) {
        return pesosPorEdad[0];
    }

    // Si la edad es mayor que el último registro, usar el último
    const ultimo = pesosPorEdad[pesosPorEdad.length - 1];
    if (edadDias >= ultimo.edad) {
        return ultimo;
    }

    // Buscar el rango donde está la edad
    for (let i = 0; i < pesosPorEdad.length - 1; i++) {
        const actual = pesosPorEdad[i];
        const siguiente = pesosPorEdad[i + 1];

        if (edadDias >= actual.edad && edadDias <= siguiente.edad) {
            // Interpolación lineal
            const proporcion = (edadDias - actual.edad) / (siguiente.edad - actual.edad);
            const pesoInterpolado = actual.pesoPromedio + 
                (siguiente.pesoPromedio - actual.pesoPromedio) * proporcion;

            return {
                edad: edadDias,
                pesoPromedio: pesoInterpolado,
                pesoMinimo: actual.pesoMinimo,
                pesoMaximo: siguiente.pesoMaximo
            };
        }
    }

    return null;
}

/**
 * Evaluar el nivel de desempeño basado en el porcentaje
 */
function evaluarDesempeno(
    valorActual: number,
    valorEsperado: number,
    porcentajeVsEsperado: number,
    tipo: 'peso' | 'produccion' | 'mortalidad'
): ComparacionDesempeno {
    let nivelDesempeno: NivelDesempeno;
    let mensaje: string;
    let color: string;
    let requiereAtencion: boolean = false;

    // Para mortalidad, la lógica es inversa (menor es mejor)
    if (tipo === 'mortalidad') {
        if (porcentajeVsEsperado >= 100) {
            nivelDesempeno = NivelDesempeno.EXCELENTE;
            mensaje = 'Mortalidad dentro del rango esperado';
            color = '#4CAF50';
        } else if (porcentajeVsEsperado >= 80) {
            nivelDesempeno = NivelDesempeno.BUENO;
            mensaje = 'Mortalidad ligeramente elevada';
            color = '#8BC34A';
        } else if (porcentajeVsEsperado >= 60) {
            nivelDesempeno = NivelDesempeno.ACEPTABLE;
            mensaje = 'Mortalidad moderadamente elevada';
            color = '#FFC107';
            requiereAtencion = true;
        } else if (porcentajeVsEsperado >= 40) {
            nivelDesempeno = NivelDesempeno.POR_DEBAJO;
            mensaje = 'Mortalidad alta - Requiere atención';
            color = '#FF9800';
            requiereAtencion = true;
        } else {
            nivelDesempeno = NivelDesempeno.CRITICO;
            mensaje = 'Mortalidad crítica - Acción inmediata requerida';
            color = '#F44336';
            requiereAtencion = true;
        }
    } else {
        // Para peso y producción (mayor es mejor)
        if (porcentajeVsEsperado >= 105) {
            nivelDesempeno = NivelDesempeno.EXCELENTE;
            mensaje = `${tipo === 'peso' ? 'Peso' : 'Producción'} por encima del estándar`;
            color = '#4CAF50';
        } else if (porcentajeVsEsperado >= 95) {
            nivelDesempeno = NivelDesempeno.BUENO;
            mensaje = `${tipo === 'peso' ? 'Peso' : 'Producción'} dentro del rango esperado`;
            color = '#8BC34A';
        } else if (porcentajeVsEsperado >= 85) {
            nivelDesempeno = NivelDesempeno.ACEPTABLE;
            mensaje = `${tipo === 'peso' ? 'Peso' : 'Producción'} ligeramente por debajo`;
            color = '#FFC107';
            requiereAtencion = true;
        } else if (porcentajeVsEsperado >= 70) {
            nivelDesempeno = NivelDesempeno.POR_DEBAJO;
            mensaje = `${tipo === 'peso' ? 'Peso' : 'Producción'} significativamente bajo`;
            color = '#FF9800';
            requiereAtencion = true;
        } else {
            nivelDesempeno = NivelDesempeno.CRITICO;
            mensaje = `${tipo === 'peso' ? 'Peso' : 'Producción'} crítico - Requiere intervención`;
            color = '#F44336';
            requiereAtencion = true;
        }
    }

    return {
        nivelDesempeno,
        porcentajeVsEsperado,
        valorEsperado,
        valorActual,
        diferencia: valorActual - valorEsperado,
        mensaje,
        color,
        requiereAtencion
    };
}
















