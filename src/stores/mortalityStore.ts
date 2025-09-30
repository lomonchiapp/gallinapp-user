/**
 * Store para gestionar el registro de mortalidad usando Zustand
 */

import { create } from 'zustand';
import {
  obtenerRegistrosMortalidad,
  obtenerTotalMortalidad,
  registrarMortalidad
} from '../services/mortality.service';
import { RegistroMortalidad, TipoAve } from '../types';

// Definimos la interfaz para el registro de mortalidad

import { usePonedorasStore } from './ponedorasStore';

interface MortalityState {
  // Estado
  registros: RegistroMortalidad[];
  totalMortalidad: number;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  loadRegistrosMortalidad: (loteId?: string, tipoLote?: TipoAve) => Promise<void>;
  loadRegistrosPorTipo: (tipoLote: TipoAve) => Promise<void>;
  registrarNuevaMortalidad: (loteId: string, tipoLote: TipoAve, cantidad: number, causa?: string) => Promise<void>;
  clearError: () => void;
}

export const useMortalityStore = create<MortalityState>((set, get) => ({
  // Estado inicial
  registros: [],
  totalMortalidad: 0,
  isLoading: false,
  error: null,
  
  // Cargar registros de mortalidad (legacy - mantener compatibilidad)
  loadRegistrosMortalidad: async (loteId?: string, tipoLote?: TipoAve) => {
    set({ isLoading: true, error: null });
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
      
      console.log(`✅ Cargados ${registros.length} registros de mortalidad`);
      set({ 
        registros, 
        totalMortalidad: total,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('❌ Error al cargar registros de mortalidad:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar registros de mortalidad' 
      });
    }
  },

  // Cargar TODOS los registros por tipo de ave
  loadRegistrosPorTipo: async (tipoLote: TipoAve) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔄 Cargando TODOS los registros de mortalidad para:', tipoLote);
      // Sin loteId específico - trae todos los registros del tipo
      const registros = await obtenerRegistrosMortalidad(undefined, tipoLote);
      
      const total = registros.reduce((sum, registro) => sum + registro.cantidad, 0);
      
      console.log(`✅ Cargados ${registros.length} registros de mortalidad para ${tipoLote}`);
      set({ 
        registros, 
        totalMortalidad: total,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('❌ Error al cargar registros de mortalidad por tipo:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar registros de mortalidad' 
      });
    }
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



