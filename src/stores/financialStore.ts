/**
 * Store para estadísticas financieras
 */

import { create } from 'zustand';
import {
    EstadisticasFinancieras,
    EstadisticasLote,
    calcularEstadisticasFinancieras,
    calcularEstadisticasLote
} from '../services/financial.service';
import { AppConfig } from '../types/appConfig';

interface FinancialState {
  // Estado
  estadisticasGenerales: EstadisticasFinancieras | null;
  estadisticasLotes: EstadisticasLote[];
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  cargarEstadisticasGenerales: (
    config: AppConfig,
    lotesPonedoras: any[],
    lotesEngorde: any[],
    lotesIsraelies: any[]
  ) => Promise<void>;
  cargarEstadisticasLote: (lote: any, config: AppConfig) => Promise<void>;
  cargarTodasLasEstadisticas: (
    config: AppConfig,
    lotesPonedoras: any[],
    lotesEngorde: any[],
    lotesIsraelies: any[]
  ) => Promise<void>;
  clearError: () => void;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  // Estado inicial
  estadisticasGenerales: null,
  estadisticasLotes: [],
  isLoading: false,
  error: null,
  
  // Cargar estadísticas generales
  cargarEstadisticasGenerales: async (config, lotesPonedoras, lotesEngorde, lotesIsraelies) => {
    set({ isLoading: true, error: null });
    try {
      const estadisticas = await calcularEstadisticasFinancieras(
        config, 
        lotesPonedoras, 
        lotesEngorde, 
        lotesIsraelies
      );
      set({ estadisticasGenerales: estadisticas, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar estadísticas financieras'
      });
    }
  },
  
  // Cargar estadísticas de un lote específico
  cargarEstadisticasLote: async (lote, config) => {
    try {
      const estadisticasLote = await calcularEstadisticasLote(lote, config);
      set(state => ({
        estadisticasLotes: [
          ...state.estadisticasLotes.filter(e => e.loteId !== lote.id),
          estadisticasLote
        ]
      }));
    } catch (error: any) {
      console.error('Error al cargar estadísticas del lote:', error);
    }
  },
  
  // Cargar todas las estadísticas (generales + lotes)
  cargarTodasLasEstadisticas: async (config, lotesPonedoras, lotesEngorde, lotesIsraelies) => {
    set({ isLoading: true, error: null });
    try {
      // Cargar estadísticas generales
      const estadisticasGenerales = await calcularEstadisticasFinancieras(
        config, 
        lotesPonedoras, 
        lotesEngorde, 
        lotesIsraelies
      );
      
      // Cargar estadísticas de lotes individuales
      const estadisticasLotes: EstadisticasLote[] = [];
      const todosLosLotes = [...lotesPonedoras, ...lotesEngorde, ...lotesIsraelies];
      
      for (const lote of todosLosLotes) {
        try {
          const estadisticasLote = await calcularEstadisticasLote(lote, config);
          estadisticasLotes.push(estadisticasLote);
        } catch (error) {
          console.error(`Error al calcular estadísticas del lote ${lote.id}:`, error);
        }
      }
      
      set({ 
        estadisticasGenerales, 
        estadisticasLotes, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar estadísticas'
      });
    }
  },
  
  // Limpiar errores
  clearError: () => set({ error: null }),
}));











































