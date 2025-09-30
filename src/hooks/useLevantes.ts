/**
 * Hook específico para lotes de pollos de levante
 */

import { useCallback, useMemo } from 'react';
import { useLevantesStore } from '../stores/levantesStore';
import { EstadoLote, LoteLevante } from '../types';
import { calculateAgeInDays } from '../utils/dateUtils';

export interface EstadisticasLevantes {
    totalLotes: number;
    lotesActivos: number;
    lotesFinalizados: number;
    totalAves: number;
    avesActivas: number;
    edadPromedioLotes: number;
    lotesListosVenta: number;
}

/**
 * Hook principal para manejo de lotes de levante
 */
export const useLevantes = () => {
    const store = useLevantesStore();
    
    // Estadísticas calculadas
    const estadisticas = useMemo((): EstadisticasLevantes => {
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
        
        // Calcular lotes listos para venta (>= 42 días desde nacimiento)
        const lotesListosVenta = lotesActivosConEdad.filter(lote => {
            const edadEnDias = calculateAgeInDays(lote.fechaNacimiento);
            return edadEnDias >= 42;
        }).length;
        
        return {
            totalLotes,
            lotesActivos,
            lotesFinalizados,
            totalAves,
            avesActivas,
            edadPromedioLotes,
            lotesListosVenta
        };
    }, [store.lotes]);
    
    // Funciones CRUD
    const crearLote = useCallback(async (loteData: Omit<LoteLevante, 'id'>) => {
        console.log('🐔 useLevantes: Creando lote de levante...', loteData);
        await store.crearLote(loteData);
    }, [store]);
    
    const actualizarLote = useCallback(async (id: string, loteData: Partial<LoteLevante>) => {
        console.log('🐔 useLevantes: Actualizando lote de levante...', { id, loteData });
        await store.actualizarLote(id, loteData);
    }, [store]);
    
    const finalizarLote = useCallback(async (id: string) => {
        console.log('🐔 useLevantes: Finalizando lote de levante...', id);
        await store.finalizarLote(id);
    }, [store]);
    
    // Funciones de consulta
    const obtenerLotePorId = useCallback((id: string): LoteLevante | undefined => {
        return store.lotes.find(lote => lote.id === id);
    }, [store.lotes]);
    
    const obtenerLotesActivos = useCallback((): LoteLevante[] => {
        return store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO);
    }, [store.lotes]);
    
    const obtenerLotesPorRaza = useCallback((raza: string): LoteLevante[] => {
        return store.lotes.filter(lote => lote.raza === raza);
    }, [store.lotes]);
    
    // Funciones específicas para pollos de levante
    const calcularEdadActual = useCallback((lote: LoteLevante): number => {
        const edadEnDias = Math.floor(
            calculateAgeInDays(lote.fechaNacimiento)
        );
        return edadEnDias;
    }, []);
    
    const estaListoParaVenta = useCallback((lote: LoteLevante): boolean => {
        const edadActual = calcularEdadActual(lote);
        return edadActual >= 42; // 6 semanas aproximadamente
    }, [calcularEdadActual]);
    
    const calcularPesoEstimado = useCallback((lote: LoteLevante): number => {
        const edadActual = calcularEdadActual(lote);
        
        // Curva de crecimiento aproximada para pollos de levante
        if (edadActual <= 7) return 0.15; // 150g
        if (edadActual <= 14) return 0.35; // 350g
        if (edadActual <= 21) return 0.65; // 650g
        if (edadActual <= 28) return 1.0;  // 1kg
        if (edadActual <= 35) return 1.4;  // 1.4kg
        if (edadActual <= 42) return 1.8;  // 1.8kg
        if (edadActual <= 49) return 2.2;  // 2.2kg
        if (edadActual <= 56) return 2.6;  // 2.6kg
        return 2.8; // Peso máximo aproximado
    }, [calcularEdadActual]);
    
    const obtenerLotesListosParaVenta = useCallback((): LoteLevante[] => {
        return store.lotes.filter(lote => lote.estado === EstadoLote.ACTIVO && estaListoParaVenta(lote));
    }, [store.lotes, estaListoParaVenta]);
    
    const calcularValorEstimadoLote = useCallback((lote: LoteLevante, precioPorKg: number = 0): number => {
        const pesoEstimado = calcularPesoEstimado(lote);
        return lote.cantidadActual * pesoEstimado * precioPorKg;
    }, [calcularPesoEstimado]);
    
    return {
        // Estado del store
        lotes: store.lotes,
        loteActual: store.loteActual,
        registrosEdad: store.registrosEdad,
        mortalidad: store.mortalidad,
        gastos: store.gastos,
        ventas: store.ventas,
        estadisticas: store.estadisticas,
        filtro: store.filtro,
        isLoading: store.isLoading,
        error: store.error,
        
        // Estadísticas calculadas
        estadisticasCalculadas: estadisticas,
        
        // Funciones CRUD - Lotes
        cargarLotes: store.cargarLotes,
        cargarLote: store.cargarLote,
        crearLote,
        actualizarLote,
        finalizarLote,
        
        // Funciones de consulta
        obtenerLotePorId,
        obtenerLotesActivos,
        obtenerLotesPorRaza,
        obtenerLotesListosParaVenta,
        
        // Funciones específicas de pollos de levante
        calcularEdadActual,
        estaListoParaVenta,
        calcularPesoEstimado,
        calcularValorEstimadoLote,
        
        // Funciones - Registros de Edad
        cargarRegistrosEdad: store.cargarRegistrosEdad,
        registrarEdad: store.registrarEdad,
        
        // Funciones - Mortalidad
        cargarMortalidad: store.cargarMortalidad,
        registrarMortalidad: store.registrarMortalidad,
        
        // Funciones - Gastos
        cargarGastos: store.cargarGastos,
        registrarGasto: store.registrarGasto,
        
        // Funciones - Ventas
        cargarVentas: store.cargarVentas,
        registrarVenta: store.registrarVenta,
        
        // Funciones - Estadísticas
        calcularEstadisticas: store.calcularEstadisticas,
        
        // Funciones - Filtros
        setFiltro: store.setFiltro,
        
        // Utilidades
        clearError: store.clearError
    };
};
