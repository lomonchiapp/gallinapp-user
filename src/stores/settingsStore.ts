/**
 * Store unificado para gestión de configuraciones
 * Maneja UserSettings y FarmSettings de forma centralizada
 */

import { create } from 'zustand';
import { FarmSettings, UserSettings } from '../types/settings';
import {
  getFarmSettings,
  updateFarmSettings,
  validateFarmSettings
} from '../services/settings/farm-settings.service';
import {
  clearUserSettingsCache,
  createDefaultUserSettings,
  getUserSettings,
  subscribeToUserSettings,
  updateUserSettings
} from '../services/settings/user-settings.service';

interface SettingsState {
  // User Settings
  userSettings: UserSettings | null;
  userSettingsLoading: boolean;
  userSettingsError: string | null;
  
  // Farm Settings
  farmSettings: FarmSettings | null;
  farmSettingsLoading: boolean;
  farmSettingsError: string | null;
  
  // Actions - User Settings
  loadUserSettings: (userId: string) => Promise<void>;
  updateUserSettings: (userId: string, updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>) => Promise<void>;
  subscribeToUserSettings: (userId: string) => (() => void) | null;
  
  // Actions - Farm Settings
  loadFarmSettings: (farmId: string) => Promise<void>;
  updateFarmSettings: (farmId: string, updates: Partial<FarmSettings>) => Promise<void>;
  validateFarmSettings: (settings: Partial<FarmSettings>) => string[];
  
  // General
  clearErrors: () => void;
  clearCache: (userId?: string) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Estado inicial
  userSettings: null,
  userSettingsLoading: false,
  userSettingsError: null,
  
  farmSettings: null,
  farmSettingsLoading: false,
  farmSettingsError: null,
  
  // ============================================================================
  // USER SETTINGS ACTIONS
  // ============================================================================
  
  loadUserSettings: async (userId: string) => {
    set({ userSettingsLoading: true, userSettingsError: null });
    try {
      const settings = await getUserSettings(userId);
      set({
        userSettings: settings,
        userSettingsLoading: false,
      });
    } catch (error: any) {
      set({
        userSettingsLoading: false,
        userSettingsError: error.message || 'Error al cargar configuración de usuario',
      });
    }
  },
  
  updateUserSettings: async (userId: string, updates) => {
    set({ userSettingsLoading: true, userSettingsError: null });
    try {
      const updatedSettings = await updateUserSettings(userId, updates);
      set({
        userSettings: updatedSettings,
        userSettingsLoading: false,
      });
    } catch (error: any) {
      set({
        userSettingsLoading: false,
        userSettingsError: error.message || 'Error al actualizar configuración',
      });
      throw error;
    }
  },
  
  subscribeToUserSettings: (userId: string) => {
    console.log('🔔 [SettingsStore] Suscribiendo a User Settings');
    
    return subscribeToUserSettings(userId, (settings) => {
      set({ userSettings: settings });
    });
  },
  
  // ============================================================================
  // FARM SETTINGS ACTIONS
  // ============================================================================
  
  loadFarmSettings: async (farmId: string) => {
    set({ farmSettingsLoading: true, farmSettingsError: null });
    try {
      const settings = await getFarmSettings(farmId);
      set({
        farmSettings: settings,
        farmSettingsLoading: false,
      });
    } catch (error: any) {
      set({
        farmSettingsLoading: false,
        farmSettingsError: error.message || 'Error al cargar configuración de la granja',
      });
    }
  },
  
  updateFarmSettings: async (farmId: string, updates) => {
    set({ farmSettingsLoading: true, farmSettingsError: null });
    try {
      // Validar antes de actualizar
      const errors = get().validateFarmSettings(updates);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      
      await updateFarmSettings(farmId, updates);
      
      // Recargar settings después de actualizar
      await get().loadFarmSettings(farmId);
      
      set({ farmSettingsLoading: false });
    } catch (error: any) {
      set({
        farmSettingsLoading: false,
        farmSettingsError: error.message || 'Error al actualizar configuración de la granja',
      });
      throw error;
    }
  },
  
  validateFarmSettings: (settings: Partial<FarmSettings>) => {
    return validateFarmSettings(settings);
  },
  
  // ============================================================================
  // GENERAL ACTIONS
  // ============================================================================
  
  clearErrors: () => {
    set({
      userSettingsError: null,
      farmSettingsError: null,
    });
  },
  
  clearCache: (userId?: string) => {
    clearUserSettingsCache(userId);
    console.log('🧹 [SettingsStore] Cache limpiado');
  },
  
  reset: () => {
    set({
      userSettings: null,
      userSettingsLoading: false,
      userSettingsError: null,
      farmSettings: null,
      farmSettingsLoading: false,
      farmSettingsError: null,
    });
    console.log('🔄 [SettingsStore] Store reseteado');
  },
}));



