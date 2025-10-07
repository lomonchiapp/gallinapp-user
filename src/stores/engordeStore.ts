/**
 * Store simplificado para el módulo de pollos de engorde usando Zustand
 */

import { create } from 'zustand';
import {
    actualizarLoteEngorde,
    crearLoteEngorde,
    eliminarLoteEngorde,
    finalizarLoteEngorde,
    obtenerLoteEngorde,
    obtenerLotesEngorde,
    suscribirseALotesEngorde
} from '../services/engorde.service';
import { LoteEngorde } from '../types';

interface EngordeState {
  // Estado
  lotes: LoteEngorde[];
  loteActual: LoteEngorde | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones - Lotes
  cargarLotes: () => Promise<void>;
  cargarLote: (id: string) => Promise<void>;
  crearLote: (lote: Omit<LoteEngorde, 'id'>) => Promise<void>;
  actualizarLote: (id: string, lote: Partial<LoteEngorde>) => Promise<void>;
  finalizarLote: (id: string) => Promise<void>;
  eliminarLote: (id: string) => Promise<void>;
  suscribirseAEngorde: () => () => void;
  
  // Acciones - Errores
  clearError: () => void;
}

export const useEngordeStore = create<EngordeState>((set, get) => ({
  // Estado inicial
  lotes: [],
  loteActual: null,
  isLoading: false,
  error: null,
  
  // Acciones - Lotes
  cargarLotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const lotes = await obtenerLotesEngorde();
      set({ lotes, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar lotes de engorde'
      });
    }
  },
  
  cargarLote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const lote = await obtenerLoteEngorde(id);
      set({ loteActual: lote, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar lote de engorde'
      });
    }
  },
  
  crearLote: async (lote: Omit<LoteEngorde, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const nuevoLote = await crearLoteEngorde(lote);
      // No agregamos manualmente al estado - la suscripción se encarga
      set({ 
        loteActual: nuevoLote, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al crear lote de engorde'
      });
    }
  },
  
  actualizarLote: async (id: string, lote: Partial<LoteEngorde>) => {
    set({ isLoading: true, error: null });
    try {
      await actualizarLoteEngorde(id, lote);
      
      // Actualizar en el estado
      set(state => {
        const loteActualizado = state.loteActual && state.loteActual.id === id
          ? { ...state.loteActual, ...lote }
          : state.loteActual;
          
        const lotesActualizados = state.lotes.map(l => 
          l.id === id ? { ...l, ...lote } : l
        );
        
        return { 
          lotes: lotesActualizados,
          loteActual: loteActualizado as LoteEngorde, 
          isLoading: false 
        };
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al actualizar lote de engorde'
      });
    }
  },
  
  finalizarLote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await finalizarLoteEngorde(id);
      
      // Actualizar en el estado
      set(state => {
        const loteActualizado = state.loteActual && state.loteActual.id === id
          ? { ...state.loteActual, activo: false }
          : state.loteActual;
          
        const lotesActualizados = state.lotes.map(l => 
          l.id === id ? { ...l, activo: false } : l
        );
        
        return { 
          lotes: lotesActualizados,
          loteActual: loteActualizado as LoteEngorde, 
          isLoading: false 
        };
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al finalizar lote de engorde'
      });
    }
  },

  eliminarLote: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await eliminarLoteEngorde(id);
      
      // Eliminar del estado
      set(state => {
        const lotesActualizados = state.lotes.filter(l => l.id !== id);
        const loteActualizado = state.loteActual && state.loteActual.id === id
          ? null
          : state.loteActual;
        
        return { 
          lotes: lotesActualizados,
          loteActual: loteActualizado, 
          isLoading: false 
        };
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al eliminar lote de engorde'
      });
    }
  },
  
  suscribirseAEngorde: () => {
    return suscribirseALotesEngorde((lotes) => {
      set({ lotes, error: null });
    });
  },
  
  // Acciones - Errores
  clearError: () => set({ error: null })
}));