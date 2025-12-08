/**
 * Hook unificado simple que combina todos los tipos de lotes
 */

import { useCallback, useMemo } from 'react';
import { TipoAve } from '../types';
import { useEngorde } from './useEngorde';
import { useIsraelies } from './useLevantes';
import { usePonedoras } from './usePonedoras';
import { useEngordeStore } from '../stores/engordeStore';
import { useLevantesStore } from '../stores/levantesStore';
import { usePonedorasStore } from '../stores/ponedorasStore';

export interface LoteConTipo {
    id: string;
    nombre: string;
    fechaInicio: Date;
    numeroAves: number;
    raza: string;
    estadoSalud: string;
    activo: boolean;
    tipoLote: TipoAve;
    // Campos específicos opcionales
    edadInicial?: number;
    precioVentaUnidad?: number;
    tipo?: TipoAve;
}

export interface EstadisticasUnificadas {
    totalLotes: number;
    lotesActivos: number;
    lotesFinalizados: number;
    totalAves: number;
    avesActivas: number;
    lotesPorTipo: {
        ponedoras: number;
        israelies: number;
        engorde: number;
    };
}

/**
 * Hook unificado que combina todos los tipos de lotes
 */
export const useLotesUnificado = () => {
    const ponedoras = usePonedoras();
    const israelies = useIsraelies();
    const engorde = useEngorde();
    
    // Estados combinados
    const isLoading = useMemo(() => 
        ponedoras.isLoading || israelies.isLoading || engorde.isLoading,
        [ponedoras.isLoading, israelies.isLoading, engorde.isLoading]
    );
    
    const error = useMemo(() => 
        ponedoras.error || israelies.error || engorde.error,
        [ponedoras.error, israelies.error, engorde.error]
    );
    
    // Lotes combinados
    const todosLosLotes = useMemo((): LoteConTipo[] => {
        const lotesPonedoras: LoteConTipo[] = ponedoras.lotes.map(lote => ({
            id: lote.id,
            nombre: lote.nombre,
            fechaInicio: lote.fechaInicio,
            numeroAves: lote.numeroAves,
            raza: lote.raza,
            estadoSalud: lote.estadoSalud,
            activo: lote.activo,
            tipoLote: TipoAve.PONEDORA,
            tipo: lote.tipo
        }));
        
        const lotesIsraelies: LoteConTipo[] = israelies.lotes.map(lote => ({
            id: lote.id,
            nombre: lote.nombre,
            fechaInicio: lote.fechaInicio,
            numeroAves: lote.numeroAves,
            raza: lote.raza,
            estadoSalud: lote.estadoSalud,
            activo: lote.activo,
            tipoLote: TipoAve.POLLO_ISRAELI,
            edadInicial: lote.edadInicial,
            precioVentaUnidad: lote.precioVentaUnidad
        }));
        
        const lotesEngorde: LoteConTipo[] = engorde.lotes.map(lote => ({
            id: lote.id,
            nombre: lote.nombre,
            fechaInicio: lote.fechaInicio,
            numeroAves: lote.numeroAves,
            raza: lote.raza,
            estadoSalud: lote.estadoSalud,
            activo: lote.activo,
            tipoLote: TipoAve.POLLO_ENGORDE,
            tipo: lote.tipo
        }));
        
        return [...lotesPonedoras, ...lotesIsraelies, ...lotesEngorde]
            .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
    }, [ponedoras.lotes, israelies.lotes, engorde.lotes]);
    
    // Estadísticas unificadas
    const estadisticasUnificadas = useMemo((): EstadisticasUnificadas => {
        const totalLotes = todosLosLotes.length;
        const lotesActivos = todosLosLotes.filter(lote => lote.activo).length;
        const lotesFinalizados = totalLotes - lotesActivos;
        
        const totalAves = todosLosLotes.reduce((total, lote) => total + lote.numeroAves, 0);
        const avesActivas = todosLosLotes
            .filter(lote => lote.activo)
            .reduce((total, lote) => total + lote.numeroAves, 0);
        
        return {
            totalLotes,
            lotesActivos,
            lotesFinalizados,
            totalAves,
            avesActivas,
            lotesPorTipo: {
                ponedoras: ponedoras.lotes.length,
                israelies: israelies.lotes.length,
                engorde: engorde.lotes.length
            }
        };
    }, [todosLosLotes, ponedoras.lotes.length, israelies.lotes.length, engorde.lotes.length]);
    
    // Funciones de carga
    const cargarTodosLosLotes = useCallback(async () => {
        console.log('🔄 Cargando todos los lotes...');
        await Promise.all([
            ponedoras.cargarLotes(),
            israelies.cargarLotes(),
            engorde.cargarLotes()
        ]);
        console.log('✅ Todos los lotes cargados');
    }, [ponedoras.cargarLotes, israelies.cargarLotes, engorde.cargarLotes]);
    
    const clearAllErrors = () => {
        ponedoras.clearError();
        israelies.clearError();
        engorde.clearError();
    };
    
    return {
        // Estados combinados
        isLoading,
        error,
        todosLosLotes,
        estadisticasUnificadas,
        
        // Hooks específicos (para acceso directo)
        ponedoras,
        israelies,
        engorde,
        
        // Funciones unificadas
        cargarTodosLosLotes,
        clearAllErrors,
        
        // Utilidades
        obtenerTipoLote: (lote: LoteConTipo) => lote.tipoLote,
        esLoteActivo: (lote: LoteConTipo) => lote.activo,
        obtenerEdadLote: (lote: LoteConTipo) => {
            const diasTranscurridos = Math.floor(
                (Date.now() - new Date(lote.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // Para israelíes, sumar la edad inicial
            if (lote.tipoLote === TipoAve.POLLO_ISRAELI && lote.edadInicial) {
                return lote.edadInicial + diasTranscurridos;
            }
            
            return diasTranscurridos;
        }
    };
};

/**
 * Hook que retorna los stores directamente (para compatibilidad)
 * @deprecated Usar useLotesUnificado en su lugar
 */
export const useLotes = () => {
    const ponedorasStore = usePonedorasStore();
    const israeliesStore = useLevantesStore(); // Alias para compatibilidad
    const engordeStore = useEngordeStore();
    
    const unificado = useLotesUnificado();
    
    return {
        ...unificado,
        ponedorasStore,
        israeliesStore, // Alias para compatibilidad
        engordeStore,
    };
};
