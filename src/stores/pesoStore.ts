/**
 * Store para gestionar registros de peso usando Zustand
 */

import { create } from 'zustand';
import { obtenerRegistrosPesoPorTipo, subscribeToPesoRegistros } from '../services/peso.service';
import { TipoAve } from '../types';
import { PesoRegistro } from '../types/pesoRegistro';

interface PesoState {
  // Estados
  registrosPeso: PesoRegistro[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Acciones
  loadRegistrosByTipo: (tipoAve: TipoAve) => Promise<void>;
  subscribeToPesosByTipo: (tipoAve: TipoAve) => () => void;
  getRegistrosByLote: (loteId: string) => PesoRegistro[];
  getUltimoRegistroByLote: (loteId: string) => PesoRegistro | null;
  addRegistro: (registro: PesoRegistro) => void;
  clearRegistros: () => void;
  clearError: () => void;
}

export const usePesoStore = create<PesoState>((set, get) => ({
  // Estado inicial
  registrosPeso: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Cargar registros por tipo de ave
  loadRegistrosByTipo: async (tipoAve: TipoAve) => {
    console.log('⚖️ PesoStore: Cargando registros de peso para', tipoAve);
    set({ isLoading: true, error: null });
    
    try {
      const registros = await obtenerRegistrosPesoPorTipo(tipoAve);
      console.log('⚖️ PesoStore: Registros cargados:', registros.length);
      
      // Filtrar registros existentes del mismo tipo y agregar los nuevos
      const { registrosPeso: existingRegistros } = get();
      const filteredExisting = existingRegistros.filter(r => r.tipoLote !== tipoAve);
      const newRegistros = [...filteredExisting, ...registros];
      
      set({ 
        registrosPeso: newRegistros,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      console.error('⚖️ PesoStore: Error cargando registros:', error);
      set({ 
        error: error.message || 'Error al cargar registros de peso',
        isLoading: false 
      });
    }
  },

  // Suscribirse a registros de peso en tiempo real
  subscribeToPesosByTipo: (tipoAve: TipoAve) => {
    console.log('⚖️ PesoStore: Suscribiéndose a registros de peso para', tipoAve);
    
    return subscribeToPesoRegistros(tipoAve, (registros) => {
      console.log('⚖️ PesoStore: Actualizando registros desde suscripción:', registros.length);
      
      // Filtrar registros existentes del mismo tipo y agregar los nuevos
      const { registrosPeso: existingRegistros } = get();
      const filteredExisting = existingRegistros.filter(r => r.tipoLote !== tipoAve);
      const newRegistros = [...filteredExisting, ...registros];
      
      set({ 
        registrosPeso: newRegistros,
        lastUpdated: new Date(),
        error: null
      });
    });
  },

  // Obtener registros de un lote específico
  getRegistrosByLote: (loteId: string) => {
    const { registrosPeso } = get();
    return registrosPeso
      .filter(registro => registro.loteId === loteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  // Obtener el último registro de un lote
  getUltimoRegistroByLote: (loteId: string) => {
    const { getRegistrosByLote } = get();
    const registros = getRegistrosByLote(loteId);
    return registros.length > 0 ? registros[0] : null;
  },

  // Agregar un nuevo registro (para cuando se registra un peso)
  addRegistro: (registro: PesoRegistro) => {
    const { registrosPeso } = get();
    set({ 
      registrosPeso: [registro, ...registrosPeso],
      lastUpdated: new Date()
    });
  },

  // Limpiar registros
  clearRegistros: () => {
    set({ 
      registrosPeso: [],
      lastUpdated: null 
    });
  },

  // Limpiar error
  clearError: () => set({ error: null })
}));
