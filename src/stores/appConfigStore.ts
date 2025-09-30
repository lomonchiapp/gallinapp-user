/**
 * Store para la configuración de la aplicación
 */

import { create } from 'zustand';
import {
    actualizarConfiguracion,
    obtenerConfiguracion,
    validarConfiguracion
} from '../services/appConfig.service';
import { AppConfig } from '../types/appConfig';

interface AppConfigState {
  // Estado
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  cargarConfiguracion: () => Promise<void>;
  actualizarConfig: (config: Partial<Omit<AppConfig, 'id' | 'updatedAt' | 'updatedBy'>>) => Promise<void>;
  validarConfig: (config: Partial<AppConfig>) => string[];
  clearError: () => void;
}

export const useAppConfigStore = create<AppConfigState>((set, get) => ({
  // Estado inicial
  config: null,
  isLoading: false,
  error: null,
  
  // Cargar configuración
  cargarConfiguracion: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await obtenerConfiguracion();
      set({ config, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al cargar configuración'
      });
    }
  },
  
  // Actualizar configuración
  actualizarConfig: async (configUpdate) => {
    set({ isLoading: true, error: null });
    try {
      // Validar antes de actualizar
      const errores = get().validarConfig(configUpdate);
      if (errores.length > 0) {
        throw new Error(errores.join(', '));
      }
      
      const configActualizada = await actualizarConfiguracion(configUpdate);
      set({ config: configActualizada, isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al actualizar configuración'
      });
      throw error;
    }
  },
  
  // Validar configuración
  validarConfig: (config) => {
    return validarConfiguracion(config);
  },
  
  // Limpiar errores
  clearError: () => set({ error: null }),
}));


