/**
 * Hook para el manejo de registros de mortalidad
 */

import { useCallback, useMemo } from 'react';
import { useMortalityStore } from '../stores/mortalityStore';
import { useLotes } from './useLotes';
import {
    RegistroMortalidad,
    TipoAve
} from '../types';

// Interfaces para el hook
export interface FiltroMortalidad {
    loteId?: string;
    tipoLote?: TipoAve;
    fechaDesde?: Date;
    fechaHasta?: Date;
    causa?: string;
}

export interface EstadisticasMortalidad {
    totalMortalidad: number;
    mortalidadPorTipo: Record<TipoAve, number>;
    mortalidadPorMes: Array<{
        mes: string;
        cantidad: number;
        porcentaje: number;
    }>;
    causasPrincipales: Array<{
        causa: string;
        cantidad: number;
        porcentaje: number;
    }>;
    tasaMortalidadPromedio: number;
}

/**
 * Hook para manejo de mortalidad
 */
export const useMortalidad = () => {
    const mortalityStore = useMortalityStore();
    const { todosLosLotes } = useLotes();
    
    // Estados derivados
    const registrosActivos = useMemo(() => 
        mortalityStore.registros.filter(registro => {
            const lote = todosLosLotes.find(l => l.id === registro.loteId);
            return lote && (
                lote.tipoLote === TipoAve.POLLO_ISRAELI 
                    ? (lote as any).activo 
                    : (lote as any).status === 'ACTIVO'
            );
        }),
        [mortalityStore.registros, todosLosLotes]
    );
    
    // Funciones principales
    const registrarMortalidad = useCallback(async (
        registro: Omit<RegistroMortalidad, 'id' | 'createdBy' | 'createdAt'>
    ) => {
        await mortalityStore.registrarMortalidad(registro);
    }, [mortalityStore]);
    
    const obtenerMortalidadPorLote = useCallback(async (loteId: string) => {
        await mortalityStore.cargarRegistrosPorLote(loteId);
    }, [mortalityStore]);
    
    const filtrarRegistros = useCallback((
        registros: RegistroMortalidad[], 
        filtro: FiltroMortalidad
    ): RegistroMortalidad[] => {
        return registros.filter(registro => {
            if (filtro.loteId && registro.loteId !== filtro.loteId) return false;
            if (filtro.tipoLote && registro.tipoLote !== filtro.tipoLote) return false;
            if (filtro.causa && !registro.causa?.toLowerCase().includes(filtro.causa.toLowerCase())) return false;
            
            const fechaRegistro = new Date(registro.fecha);
            if (filtro.fechaDesde && fechaRegistro < filtro.fechaDesde) return false;
            if (filtro.fechaHasta && fechaRegistro > filtro.fechaHasta) return false;
            
            return true;
        });
    }, []);
    
    // Funciones de análisis
    const calcularEstadisticas = useCallback((
        registros: RegistroMortalidad[]
    ): EstadisticasMortalidad => {
        const totalMortalidad = registros.reduce((total, registro) => total + registro.cantidad, 0);
        
        // Mortalidad por tipo
        const mortalidadPorTipo = registros.reduce((acc, registro) => {
            acc[registro.tipoLote] = (acc[registro.tipoLote] || 0) + registro.cantidad;
            return acc;
        }, {} as Record<TipoAve, number>);
        
        // Mortalidad por mes
        const mortalidadPorMes = registros.reduce((acc, registro) => {
            const fecha = new Date(registro.fecha);
            const mesAno = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            acc[mesAno] = (acc[mesAno] || 0) + registro.cantidad;
            return acc;
        }, {} as Record<string, number>);
        
        const mortalidadMensual = Object.entries(mortalidadPorMes)
            .map(([mes, cantidad]) => ({
                mes,
                cantidad,
                porcentaje: totalMortalidad > 0 ? (cantidad / totalMortalidad) * 100 : 0
            }))
            .sort((a, b) => a.mes.localeCompare(b.mes));
        
        // Causas principales
        const causas = registros.reduce((acc, registro) => {
            const causa = registro.causa || 'No especificada';
            acc[causa] = (acc[causa] || 0) + registro.cantidad;
            return acc;
        }, {} as Record<string, number>);
        
        const causasPrincipales = Object.entries(causas)
            .map(([causa, cantidad]) => ({
                causa,
                cantidad,
                porcentaje: totalMortalidad > 0 ? (cantidad / totalMortalidad) * 100 : 0
            }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 5); // Top 5 causas
        
        // Calcular tasa de mortalidad promedio
        const totalAves = todosLosLotes.reduce((total, lote) => total + lote.numeroAves, 0);
        const tasaMortalidadPromedio = totalAves > 0 ? (totalMortalidad / totalAves) * 100 : 0;
        
        return {
            totalMortalidad,
            mortalidadPorTipo,
            mortalidadPorMes: mortalidadMensual,
            causasPrincipales,
            tasaMortalidadPromedio
        };
    }, [todosLosLotes]);
    
    // Funciones de validación
    const validarRegistro = useCallback((registro: Partial<RegistroMortalidad>): string[] => {
        const errores: string[] = [];
        
        if (!registro.loteId) errores.push('Debe seleccionar un lote');
        if (!registro.cantidad || registro.cantidad <= 0) errores.push('La cantidad debe ser mayor a 0');
        if (!registro.fecha) errores.push('Debe especificar la fecha');
        if (!registro.tipoLote) errores.push('Debe especificar el tipo de lote');
        
        // Validar que la fecha no sea futura
        if (registro.fecha && new Date(registro.fecha) > new Date()) {
            errores.push('La fecha no puede ser futura');
        }
        
        return errores;
    }, []);
    
    // Utilidades
    const obtenerCausasComunes = useCallback((): string[] => {
        return [
            'Enfermedad respiratoria',
            'Problemas digestivos',
            'Estrés por calor',
            'Deficiencia nutricional',
            'Accidente',
            'Predador',
            'Edad avanzada',
            'Causa desconocida'
        ];
    }, []);
    
    const calcularTasaMortalidad = useCallback((
        mortalidad: number, 
        poblacionInicial: number
    ): number => {
        return poblacionInicial > 0 ? (mortalidad / poblacionInicial) * 100 : 0;
    }, []);
    
    const obtenerAlertasMortalidad = useCallback((): Array<{
        loteId: string;
        nombreLote: string;
        tipoLote: TipoAve;
        tasaMortalidad: number;
        severidad: 'baja' | 'media' | 'alta';
        mensaje: string;
    }> => {
        const alertas: any[] = [];
        
        todosLosLotes.forEach(lote => {
            const registrosLote = mortalityStore.registros.filter(r => r.loteId === lote.id);
            const totalMortalidad = registrosLote.reduce((total, r) => total + r.cantidad, 0);
            const tasaMortalidad = calcularTasaMortalidad(totalMortalidad, lote.numeroAves);
            
            let severidad: 'baja' | 'media' | 'alta' = 'baja';
            let mensaje = '';
            
            if (tasaMortalidad > 10) {
                severidad = 'alta';
                mensaje = `Tasa de mortalidad crítica: ${tasaMortalidad.toFixed(1)}%`;
            } else if (tasaMortalidad > 5) {
                severidad = 'media';
                mensaje = `Tasa de mortalidad elevada: ${tasaMortalidad.toFixed(1)}%`;
            } else if (tasaMortalidad > 2) {
                severidad = 'baja';
                mensaje = `Tasa de mortalidad moderada: ${tasaMortalidad.toFixed(1)}%`;
            }
            
            if (tasaMortalidad > 2) {
                alertas.push({
                    loteId: lote.id,
                    nombreLote: lote.nombre,
                    tipoLote: lote.tipoLote,
                    tasaMortalidad,
                    severidad,
                    mensaje
                });
            }
        });
        
        return alertas.sort((a, b) => b.tasaMortalidad - a.tasaMortalidad);
    }, [todosLosLotes, mortalityStore.registros, calcularTasaMortalidad]);
    
    return {
        // Estados
        isLoading: mortalityStore.isLoading,
        error: mortalityStore.error,
        registros: mortalityStore.registros,
        registrosActivos,
        
        // Funciones principales
        cargarTodosLosRegistros: mortalityStore.cargarTodosLosRegistros,
        registrarMortalidad,
        obtenerMortalidadPorLote,
        filtrarRegistros,
        
        // Análisis
        calcularEstadisticas,
        obtenerAlertasMortalidad,
        
        // Validaciones
        validarRegistro,
        
        // Utilidades
        obtenerCausasComunes,
        calcularTasaMortalidad,
        
        // Acciones
        clearError: mortalityStore.clearError
    };
};
