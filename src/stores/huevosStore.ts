/**
 * Store para gestionar registros de huevos usando Zustand
 */

import { create } from 'zustand';
import { HuevoRegistro } from '../types/ponedoras/HuevoRegistro';
import { obtenerRegistrosProduccionPorLote, obtenerTodosRegistrosProduccion } from '../services/ponedoras.service';

interface HuevosState {
  // Estados
  registrosHuevos: HuevoRegistro[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Acciones
  loadAllRegistros: () => Promise<void>;
  loadRegistrosByLote: (loteId: string) => Promise<void>;
  getRegistrosByLote: (loteId: string) => HuevoRegistro[];
  getUltimoRegistroByLote: (loteId: string) => HuevoRegistro | null;
  addRegistro: (registro: HuevoRegistro) => void;
  clearRegistros: () => void;
  clearError: () => void;
}

export const useHuevosStore = create<HuevosState>((set, get) => ({
  // Estado inicial
  registrosHuevos: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Cargar todos los registros de huevos del usuario
  loadAllRegistros: async () => {
    console.log('🥚 HuevosStore: Cargando todos los registros de huevos');
    set({ isLoading: true, error: null });
    
    try {
      const registros = await obtenerTodosRegistrosProduccion();
      console.log('🥚 HuevosStore: Registros de producción cargados:', registros.length);
      
      // Convertir a HuevoRegistro format
      const huevoRegistros: HuevoRegistro[] = registros.map(registro => ({
        id: registro.id,
        loteId: registro.loteId,
        fecha: registro.fecha,
        cantidad: registro.cantidadHuevosPequenos + 
                  registro.cantidadHuevosMedianos + 
                  registro.cantidadHuevosGrandes + 
                  registro.cantidadHuevosExtraGrandes
      }));
      
      set({ 
        registrosHuevos: huevoRegistros,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      console.error('🥚 HuevosStore: Error cargando registros:', error);
      set({ 
        error: error.message || 'Error al cargar registros de huevos',
        isLoading: false 
      });
    }
  },

  // Cargar registros de un lote específico
  loadRegistrosByLote: async (loteId: string) => {
    console.log('🥚 HuevosStore: Cargando registros de huevos para lote', loteId);
    set({ isLoading: true, error: null });
    
    try {
      const registros = await obtenerRegistrosProduccionPorLote(loteId);
      console.log('🥚 HuevosStore: Registros cargados:', registros.length);
      
      // Convertir a HuevoRegistro format
      const huevoRegistros: HuevoRegistro[] = registros.map(registro => ({
        id: registro.id,
        loteId: registro.loteId,
        fecha: registro.fecha,
        cantidad: registro.cantidadHuevosPequenos + 
                  registro.cantidadHuevosMedianos + 
                  registro.cantidadHuevosGrandes + 
                  registro.cantidadHuevosExtraGrandes
      }));
      
      // Actualizar o agregar registros para este lote
      const { registrosHuevos: existingRegistros } = get();
      const filteredExisting = existingRegistros.filter(r => r.loteId !== loteId);
      const newRegistros = [...filteredExisting, ...huevoRegistros];
      
      set({ 
        registrosHuevos: newRegistros,
        isLoading: false,
        lastUpdated: new Date()
      });
    } catch (error: any) {
      console.error('🥚 HuevosStore: Error cargando registros:', error);
      set({ 
        error: error.message || 'Error al cargar registros de huevos',
        isLoading: false 
      });
    }
  },

  // Obtener registros de un lote específico
  getRegistrosByLote: (loteId: string) => {
    const { registrosHuevos } = get();
    return registrosHuevos
      .filter(registro => registro.loteId === loteId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  // Obtener el último registro de un lote
  getUltimoRegistroByLote: (loteId: string) => {
    const { getRegistrosByLote } = get();
    const registros = getRegistrosByLote(loteId);
    return registros.length > 0 ? registros[0] : null;
  },

  // Agregar un nuevo registro (para cuando se registra producción)
  addRegistro: (registro: HuevoRegistro) => {
    const { registrosHuevos } = get();
    set({ 
      registrosHuevos: [registro, ...registrosHuevos],
      lastUpdated: new Date()
    });
  },

  // Limpiar registros
  clearRegistros: () => {
    set({ 
      registrosHuevos: [],
      lastUpdated: null 
    });
  },

  // Limpiar error
  clearError: () => set({ error: null })
}));
