/**
 * Hook específico para lotes de pollos de engorde
 */

import { useCallback, useMemo } from 'react';
import { useEngordeStore } from '../stores/engordeStore';
import { EstadoLote, LoteEngorde, TipoAve } from '../types';
import { ActualizarLoteBase, CrearLoteBase } from '../types/loteBase';
import { calculateAgeInDays } from '../utils/dateUtils';

export interface CrearLoteEngorde extends CrearLoteBase {
    tipo: TipoAve.POLLO_ENGORDE;
}

export interface EstadisticasEngorde {
    totalLotes: number;
    lotesActivos: number;
    lotesFinalizados: number;
    totalAves: number;
    avesActivas: number;
    edadPromedioLotes: number;
    conversionAlimenticiaPromedio: number;
}

/**
 * Hook principal para manejo de lotes de engorde
 */
export const useEngorde = () => {
    const store = useEngordeStore();
    
    // Estadísticas calculadas
    const estadisticas = useMemo((): EstadisticasEngorde => {
        const totalLotes = store.lotes.length;
        const lotesActivos = store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO).length;
        const lotesFinalizados = totalLotes - lotesActivos;
        
        const totalAves = store.lotes.reduce((total, lote) => total + lote.cantidadActual, 0);
        const avesActivas = store.lotes
            .filter(lote => lote.estado === EstadoLote.ACTIVO)
            .reduce((total, lote) => total + lote.cantidadActual, 0);
        
        // Calcular edad promedio de lotes activos basada en fecha de nacimiento
        const lotesActivosConEdad = store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO);
        const edadPromedioLotes = lotesActivosConEdad.length > 0
            ? lotesActivosConEdad.reduce((total, lote) => {
                const edadEnDias = calculateAgeInDays(lote.fechaNacimiento);
                return total + edadEnDias;
            }, 0) / lotesActivosConEdad.length
            : 0;
        
        return {
            totalLotes,
            lotesActivos,
            lotesFinalizados,
            totalAves,
            avesActivas,
            edadPromedioLotes,
            conversionAlimenticiaPromedio: 0 // Placeholder - calcular desde registros
        };
    }, [store.lotes]);
    
    // Funciones específicas
    const crearLote = useCallback(async (loteData: CrearLoteEngorde) => {
        console.log('🐔 useEngorde: Creando lote...', loteData);
        await store.crearLote(loteData);
    }, [store]);
    
    const actualizarLote = useCallback(async (id: string, loteData: ActualizarLoteBase) => {
        console.log('🐔 useEngorde: Actualizando lote...', { id, loteData });
        await store.actualizarLote(id, loteData);
    }, [store]);
    
    const finalizarLote = useCallback(async (id: string) => {
        console.log('🐔 useEngorde: Finalizando lote...', id);
        await store.finalizarLote(id);
    }, [store]);
    
    const obtenerLotePorId = useCallback((id: string): LoteEngorde | undefined => {
        return store.lotes.find(lote => lote.id === id);
    }, [store.lotes]);
    
    const obtenerLotesActivos = useCallback((): LoteEngorde[] => {
        return store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO);
    }, [store.lotes]);
    
    const obtenerLotesPorRaza = useCallback((raza: string): LoteEngorde[] => {
        return store.lotes.filter(lote => lote.raza === raza);
    }, [store.lotes]);
    
    // Funciones específicas para engorde
    const obtenerEdadLote = useCallback((lote: LoteEngorde): number => {
        const edadEnDias = Math.floor(
            calculateAgeInDays(lote.fechaNacimiento)
        );
        return edadEnDias;
    }, []);
    
    const calcularConversionAlimenticia = useCallback((loteId: string): number => {
        // TODO: Implementar cálculo real desde registros de peso y alimento
        console.log('📊 Calculando conversión alimenticia para lote:', loteId);
        return 0;
    }, []);
    
    const calcularGananciaDiariaPeso = useCallback((loteId: string): number => {
        // TODO: Implementar cálculo real desde registros de peso
        console.log('📊 Calculando ganancia diaria de peso para lote:', loteId);
        return 0;
    }, []);
    
    const calcularPesoPromedioEstimado = useCallback((lote: LoteEngorde): number => {
        const edadEnDias = obtenerEdadLote(lote);
        
        // Curva de crecimiento aproximada para pollos de engorde
        if (edadEnDias <= 7) return 0.2;   // 200g
        if (edadEnDias <= 14) return 0.5;  // 500g
        if (edadEnDias <= 21) return 0.9;  // 900g
        if (edadEnDias <= 28) return 1.4;  // 1.4kg
        if (edadEnDias <= 35) return 2.0;  // 2kg
        if (edadEnDias <= 42) return 2.5;  // 2.5kg
        if (edadEnDias <= 49) return 3.0;  // 3kg
        return 3.2; // Peso máximo aproximado
    }, [obtenerEdadLote]);
    
    const estaListoParaSacrificio = useCallback((lote: LoteEngorde): boolean => {
        const edadActual = obtenerEdadLote(lote);
        const pesoEstimado = calcularPesoPromedioEstimado(lote);
        
        // Listo si tiene más de 35 días y peso estimado > 2kg
        return edadActual >= 35 && pesoEstimado >= 2.0;
    }, [obtenerEdadLote, calcularPesoPromedioEstimado]);
    
    const obtenerLotesListosParaSacrificio = useCallback((): LoteEngorde[] => {
        return store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && estaListoParaSacrificio(lote));
    }, [store.lotes, estaListoParaSacrificio]);
    
    const calcularRendimientoEsperado = useCallback((lote: LoteEngorde): number => {
        const pesoPromedio = calcularPesoPromedioEstimado(lote);
        const rendimientoCanal = 0.75; // 75% de rendimiento típico
        return lote.cantidadActual * pesoPromedio * rendimientoCanal;
    }, [calcularPesoPromedioEstimado]);
    
    return {
        // Estado del store
        lotes: store.lotes,
        loteActual: store.loteActual,
        isLoading: store.isLoading,
        error: store.error,
        
        // Estadísticas
        estadisticas,
        
        // Funciones CRUD
        cargarLotes: store.cargarLotes,
        cargarLote: store.cargarLote,
        crearLote,
        actualizarLote,
        finalizarLote,
        
        // Funciones de consulta
        obtenerLotePorId,
        obtenerLotesActivos,
        obtenerLotesPorRaza,
        obtenerLotesListosParaSacrificio,
        
        // Funciones específicas de engorde
        obtenerEdadLote,
        calcularConversionAlimenticia,
        calcularGananciaDiariaPeso,
        calcularPesoPromedioEstimado,
        estaListoParaSacrificio,
        calcularRendimientoEsperado,
        
        // Utilidades
        clearError: store.clearError
    };
};
