/**
 * Store para gestionar el registro de mortalidad usando Zustand
 */

import { create } from 'zustand';
import {
    obtenerRegistrosMortalidad,
    obtenerTotalMortalidad,
    registrarMortalidad,
    suscribirseAMortalidad
} from '../services/mortality.service';
import { RegistroMortalidad, TipoAve } from '../types';

// Definimos la interfaz para el registro de mortalidad

import { usePonedorasStore } from './ponedorasStore';

interface MortalityState {
  // Estado - ahora agrupado por tipo de ave
  registrosPorTipo: Record<TipoAve, RegistroMortalidad[]>;
  totalMortalidadPorTipo: Record<TipoAve, number>;
  isLoadingPorTipo: Record<TipoAve, boolean>;
  error: string | null;
  
  // Getters de conveniencia para compatibilidad
  registros: RegistroMortalidad[];
  totalMortalidad: number;
  isLoading: boolean;
  
  // Acciones
  loadRegistrosMortalidad: (loteId?: string, tipoLote?: TipoAve) => Promise<void>;
  loadRegistrosPorTipo: (tipoLote: TipoAve) => Promise<void>;
  suscribirseAMortalidadPorTipo: (tipoLote: TipoAve) => () => void;
  registrarNuevaMortalidad: (loteId: string, tipoLote: TipoAve, cantidad: number, causa?: string) => Promise<void>;
  clearError: () => void;
  getRegistrosPorTipo: (tipoLote: TipoAve) => RegistroMortalidad[];
  getTotalPorTipo: (tipoLote: TipoAve) => number;
}

export const useMortalityStore = create<MortalityState>((set, get) => ({
  // Estado inicial agrupado por tipo
  registrosPorTipo: {
    [TipoAve.POLLO_ENGORDE]: [],
    [TipoAve.POLLO_LEVANTE]: [],
    [TipoAve.PONEDORA]: [],
  },
  totalMortalidadPorTipo: {
    [TipoAve.POLLO_ENGORDE]: 0,
    [TipoAve.POLLO_LEVANTE]: 0,
    [TipoAve.PONEDORA]: 0,
  },
  isLoadingPorTipo: {
    [TipoAve.POLLO_ENGORDE]: false,
    [TipoAve.POLLO_LEVANTE]: false,
    [TipoAve.PONEDORA]: false,
  },
  error: null,
  
  // Getters de compatibilidad (devuelven array vacío por defecto)
  registros: [],
  totalMortalidad: 0,
  isLoading: false,
  
  // Getter para obtener registros por tipo
  getRegistrosPorTipo: (tipoLote: TipoAve) => {
    return get().registrosPorTipo[tipoLote] || [];
  },
  
  // Getter para obtener total por tipo
  getTotalPorTipo: (tipoLote: TipoAve) => {
    return get().totalMortalidadPorTipo[tipoLote] || 0;
  },
  
  // Cargar registros de mortalidad (legacy - mantener compatibilidad)
  loadRegistrosMortalidad: async (loteId?: string, tipoLote?: TipoAve) => {
    // Si se especifica un tipoLote, actualizar isLoadingPorTipo
    if (tipoLote) {
      set(state => ({
        isLoadingPorTipo: {
          ...state.isLoadingPorTipo,
          [tipoLote]: true
        },
        isLoading: true,
        error: null
      }));
    } else {
      set({ isLoading: true, error: null });
    }
    
    try {
      console.log('🔄 Cargando registros de mortalidad:', { loteId, tipoLote });
      const registros = await obtenerRegistrosMortalidad(loteId, tipoLote);
      
      // Si se especificó un lote, calculamos el total
      let total = 0;
      if (loteId && tipoLote) {
        total = await obtenerTotalMortalidad(loteId, tipoLote);
      } else {
        // Si no se especificó un lote, el total es la suma de todos los registros
        total = registros.reduce((sum, registro) => sum + registro.cantidad, 0);
      }
      
      console.log(`✅ Cargados ${registros.length} registros de mortalidad`, { tipoLote });
      
      // Si se especificó un tipoLote, actualizar registrosPorTipo
      if (tipoLote) {
        set(state => ({
          registrosPorTipo: {
            ...state.registrosPorTipo,
            [tipoLote]: registros
          },
          totalMortalidadPorTipo: {
            ...state.totalMortalidadPorTipo,
            [tipoLote]: total
          },
          isLoadingPorTipo: {
            ...state.isLoadingPorTipo,
            [tipoLote]: false
          },
          registros,
          totalMortalidad: total,
          isLoading: false
        }));
      } else {
        set({ 
          registros, 
          totalMortalidad: total,
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('❌ Error al cargar registros de mortalidad:', error);
      if (tipoLote) {
        set(state => ({
          isLoadingPorTipo: {
            ...state.isLoadingPorTipo,
            [tipoLote]: false
          },
          isLoading: false,
          error: error.message || 'Error al cargar registros de mortalidad'
        }));
      } else {
        set({ 
          isLoading: false, 
          error: error.message || 'Error al cargar registros de mortalidad' 
        });
      }
    }
  },

  // Cargar TODOS los registros por tipo de ave
  loadRegistrosPorTipo: async (tipoLote: TipoAve) => {
    set(state => ({
      isLoadingPorTipo: {
        ...state.isLoadingPorTipo,
        [tipoLote]: true
      },
      isLoading: true,
      error: null
    }));
    
    try {
      console.log('🔄 Cargando TODOS los registros de mortalidad para:', tipoLote);
      // Sin loteId específico - trae todos los registros del tipo
      const registros = await obtenerRegistrosMortalidad(undefined, tipoLote);
      
      const total = registros.reduce((sum, registro) => sum + registro.cantidad, 0);
      
      console.log(`✅ Cargados ${registros.length} registros de mortalidad para ${tipoLote}`);
      
      set(state => ({
        registrosPorTipo: {
          ...state.registrosPorTipo,
          [tipoLote]: registros
        },
        totalMortalidadPorTipo: {
          ...state.totalMortalidadPorTipo,
          [tipoLote]: total
        },
        isLoadingPorTipo: {
          ...state.isLoadingPorTipo,
          [tipoLote]: false
        },
        registros,
        totalMortalidad: total,
        isLoading: false
      }));
    } catch (error: any) {
      console.error('❌ Error al cargar registros de mortalidad por tipo:', error);
      set(state => ({
        isLoadingPorTipo: {
          ...state.isLoadingPorTipo,
          [tipoLote]: false
        },
        isLoading: false,
        error: error.message || 'Error al cargar registros de mortalidad'
      }));
    }
  },

  // Suscribirse a cambios en tiempo real por tipo de ave
  suscribirseAMortalidadPorTipo: (tipoLote: TipoAve) => {
    console.log('🔔 Suscribiéndose a mortalidad en tiempo real:', tipoLote);
    
    const unsubscribe = suscribirseAMortalidad(tipoLote, (registros) => {
      const total = registros.reduce((sum, registro) => sum + registro.cantidad, 0);
      
      console.log(`🔔 Registros de mortalidad actualizados: ${registros.length} para ${tipoLote}`);
      
      // Actualizar solo los datos de este tipo específico
      set(state => ({ 
        registrosPorTipo: {
          ...state.registrosPorTipo,
          [tipoLote]: registros
        },
        totalMortalidadPorTipo: {
          ...state.totalMortalidadPorTipo,
          [tipoLote]: total
        },
        isLoadingPorTipo: {
          ...state.isLoadingPorTipo,
          [tipoLote]: false
        },
        // Actualizar también los valores legacy para compatibilidad
        registros,
        totalMortalidad: total,
        isLoading: false
      }));
    });
    
    return unsubscribe;
  },
  
  // Registrar nueva mortalidad
  registrarNuevaMortalidad: async (loteId: string, tipoLote: TipoAve, cantidad: number, causa?: string) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoRegistro = await registrarMortalidad(loteId, tipoLote, cantidad, causa);
      
      // Actualizar el estado con el nuevo registro
      set(state => ({
        registros: [nuevoRegistro, ...state.registros],
        totalMortalidad: state.totalMortalidad + cantidad,
        isLoading: false
      }));
      
      // Actualizar directamente el store correspondiente
      if (tipoLote === TipoAve.PONEDORA) {
        usePonedorasStore.getState().actualizarDespuesMortalidad(loteId, cantidad);
      }
      
      console.log(`✅ Mortalidad registrada y estado actualizado: ${cantidad} aves en lote ${loteId}`);
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar mortalidad' 
      });
    }
  },
  
  // Limpiar error
  clearError: () => set({ error: null }),
}));



