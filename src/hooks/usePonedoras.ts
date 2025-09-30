/**
 * Hook específico para lotes de gallinas ponedoras
 */

import { useCallback, useMemo } from 'react';
import { usePonedorasStore } from '../stores/ponedorasStore';
import { EstadoLote, LotePonedora, TipoAve } from '../types';
import { ActualizarLoteBase, CrearLoteBase } from '../types/loteBase';

export interface CrearLotePonedora extends CrearLoteBase {
    tipo: TipoAve.PONEDORA;
}

export interface EstadisticasPonedoras {
    totalLotes: number;
    lotesActivos: number;
    lotesFinalizados: number;
    totalAves: number;
    avesActivas: number;
    promedioProduccionDiaria: number;
    tasaPosturaPromedio: number;
}

/**
 * Hook principal para manejo de lotes de ponedoras
 */
export const usePonedoras = () => {
    const store = usePonedorasStore();
    
    // Estadísticas calculadas
    const estadisticas = useMemo((): EstadisticasPonedoras => {
        const totalLotes = store.lotes.length;
        const lotesActivos = store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO).length;
        const lotesFinalizados = totalLotes - lotesActivos;
        
        const totalAves = store.lotes.reduce((total, lote) => total + lote.cantidadActual, 0);
        const avesActivas = store.lotes
            .filter(lote => lote.estado === EstadoLote.ACTIVO)
            .reduce((total, lote) => total + lote.cantidadActual, 0);
        
        return {
            totalLotes,
            lotesActivos,
            lotesFinalizados,
            totalAves,
            avesActivas,
            promedioProduccionDiaria: 0, // Placeholder - calcular desde registros
            tasaPosturaPromedio: 0 // Placeholder - calcular desde registros
        };
    }, [store.lotes]);
    
    // Funciones específicas
    const crearLote = useCallback(async (loteData: CrearLotePonedora) => {
        console.log('🐔 usePonedoras: Creando lote...', loteData);
        await store.crearLote(loteData);
    }, [store]);
    
    const actualizarLote = useCallback(async (id: string, loteData: ActualizarLoteBase) => {
        console.log('🐔 usePonedoras: Actualizando lote...', { id, loteData });
        await store.actualizarLote(id, loteData as any);
    }, [store]);
    
    const finalizarLote = useCallback(async (id: string) => {
        console.log('🐔 usePonedoras: Finalizando lote...', id);
        await store.actualizarLote(id, { estado: EstadoLote.FINALIZADO });
    }, [store]);
    
    const obtenerLotePorId = useCallback((id: string): LotePonedora | undefined => {
        return store.lotes.find(lote => lote.id === id);
    }, [store.lotes]);
    
    const obtenerLotesActivos = useCallback((): LotePonedora[] => {
        return store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO);
    }, [store.lotes]);
    
    const obtenerLotesPorRaza = useCallback((raza: string): LotePonedora[] => {
        return store.lotes.filter(lote => lote.raza === raza);
    }, [store.lotes]);
    
    // Funciones de análisis específicas para ponedoras
    const calcularProduccionPromedio = useCallback((loteId: string): number => {
        // TODO: Implementar cálculo real desde registros de producción
        console.log('📊 Calculando producción promedio para lote:', loteId);
        return 0;
    }, []);
    
    const calcularTasaPostura = useCallback((loteId: string): number => {
        // TODO: Implementar cálculo real de tasa de postura
        console.log('📊 Calculando tasa de postura para lote:', loteId);
        return 0;
    }, []);
    
    const obtenerEdadLote = useCallback((lote: LotePonedora): number => {
        const diasTranscurridos = Math.floor(
            (Date.now() - new Date(lote.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
        );
        return diasTranscurridos;
    }, []);
    
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
        
        // Funciones de análisis
        calcularProduccionPromedio,
        calcularTasaPostura,
        obtenerEdadLote,
        
        // Utilidades
        clearError: store.clearError
    };
};
