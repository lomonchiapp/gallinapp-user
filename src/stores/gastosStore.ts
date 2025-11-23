/**
 * Store para la gestión de gastos usando Zustand
 */

import { create } from 'zustand';
import {
    obtenerEstadisticasGastos,
    obtenerGastos,
    registrarGasto as registrarGastoService,
    subscribeToGastosByTipo
} from '../services/gastos.service';
import { Gasto } from '../types';
import { TipoAve } from '../types/enums';

interface EstadisticasGastos {
  ponedoras: number;
  israelies: number;
  engorde: number;
  total: number;
}

interface GastosState {
  // Estado
  gastos: Gasto[];
  gastoActual: Gasto | null;
  estadisticas: EstadisticasGastos | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  cargarGastos: (loteId?: string, tipoLote?: TipoAve) => Promise<void>;
  subscribeToGastosByTipo: (tipoLote: TipoAve) => () => void;
  cargarGasto: (id: string) => Promise<void>;
  registrarGasto: (gasto: Omit<Gasto, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  cargarEstadisticas: () => Promise<void>;
  actualizarGasto: (id: string, gasto: Partial<Gasto>) => Promise<void>;
  eliminarGasto: (id: string) => Promise<void>;
  clearError: () => void;
}

// Ya no necesitamos las funciones simuladas

export const useGastosStore = create<GastosState>((set, get) => ({
  // Estado inicial
  gastos: [],
  gastoActual: null,
  estadisticas: null,
  isLoading: false,
  error: null,
  
  // Cargar gastos
  cargarGastos: async (loteId?: string, tipoLote?: TipoAve) => {
    set({ isLoading: true, error: null });
    console.log('🔄 Cargando gastos...', { loteId, tipoLote });

    try {
      const gastos = await obtenerGastos(loteId, tipoLote);
      console.log(`✅ Cargados ${gastos.length} gastos`);
      set({ gastos, isLoading: false });
    } catch (error: any) {
      console.error('❌ Error al cargar gastos:', error);
      set({
        isLoading: false,
        error: error.message || 'Error al cargar gastos'
      });
    }
  },

  // Suscribirse a gastos en tiempo real
  subscribeToGastosByTipo: (tipoLote: TipoAve) => {
    console.log('💰 GastosStore: Suscribiéndose a gastos para', tipoLote);

    return subscribeToGastosByTipo(tipoLote, (gastosTipo) => {
      console.log('💰 GastosStore: Actualizando gastos desde suscripción:', gastosTipo.length);
      // Combinar gastos en lugar de reemplazarlos
      set((state) => {
        // Filtrar gastos del tipo actual y agregar los nuevos
        const gastosOtrosTipos = state.gastos.filter(g => g.tipoLote !== tipoLote);
        const gastosCombinados = [...gastosOtrosTipos, ...gastosTipo];
        return {
          gastos: gastosCombinados,
          error: null
        };
      });
    });
  },
  
  // Cargar un gasto específico
  cargarGasto: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Buscar en el estado actual primero
      const gastoEnMemoria = get().gastos.find(g => g.id === id);
      if (gastoEnMemoria) {
        set({ gastoActual: gastoEnMemoria, isLoading: false });
        return;
      }
      
      // Si no está en memoria, simular carga desde Firebase
      // TODO: Implementar servicio real
      set({ isLoading: false, error: 'Gasto no encontrado' });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar gasto'
      });
    }
  },
  
  // Registrar nuevo gasto
  registrarGasto: async (gasto: Omit<Gasto, 'id' | 'createdBy' | 'createdAt'>) => {
    set({ isLoading: true, error: null });
    console.log('🔄 Registrando gasto:', gasto);
    
    try {
      const nuevoGasto = await registrarGastoService(gasto);
      
      set(state => ({ 
        gastos: [nuevoGasto, ...state.gastos],
        gastoActual: nuevoGasto,
        isLoading: false 
      }));
      
      // Actualizar estadísticas
      get().cargarEstadisticas();
      
      console.log('✅ Gasto registrado correctamente:', nuevoGasto);
    } catch (error: any) {
      console.error('❌ Error al registrar gasto:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar gasto'
      });
    }
  },
  
  // Cargar estadísticas
  cargarEstadisticas: async () => {
    try {
      const estadisticas = await obtenerEstadisticasGastos();
      set({ estadisticas });
    } catch (error: any) {
      console.error('❌ Error al cargar estadísticas:', error);
    }
  },
  
  // Actualizar gasto
  actualizarGasto: async (id: string, gasto: Partial<Gasto>) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar servicio real de actualización
      
      // Actualizar en el estado
      set(state => {
        const gastoActualizado = state.gastoActual && state.gastoActual.id === id
          ? { ...state.gastoActual, ...gasto }
          : state.gastoActual;
          
        const gastosActualizados = state.gastos.map(g => 
          g.id === id ? { ...g, ...gasto } : g
        );
        
        return { 
          gastos: gastosActualizados,
          gastoActual: gastoActualizado,
          isLoading: false 
        };
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al actualizar gasto'
      });
    }
  },
  
  // Eliminar gasto
  eliminarGasto: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Implementar servicio real de eliminación
      
      // Remover del estado
      set(state => ({
        gastos: state.gastos.filter(g => g.id !== id),
        gastoActual: state.gastoActual?.id === id ? null : state.gastoActual,
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al eliminar gasto'
      });
    }
  },
  
  // Limpiar error
  clearError: () => set({ error: null })
}));
