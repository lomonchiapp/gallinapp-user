/**
 * Dashboard Store - Configuración personalizable del dashboard por usuario
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum WidgetType {
  WELCOME = 'welcome',
  BUSINESS_TYPES = 'business_types',
  COST_STATS = 'cost_stats',
  TOP_LOTES = 'top_lotes',
  QUICK_ACTIONS = 'quick_actions',
  FINANCIAL_SUMMARY = 'financial_summary',
  RECENT_ACTIVITY = 'recent_activity',
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  enabled: boolean;
  order: number;
  config?: Record<string, any>;
}

interface DashboardConfig {
  widgets: DashboardWidget[];
  showWelcome: boolean;
  lastUpdated: Date;
}

interface DashboardState {
  config: DashboardConfig | null;
  isEditMode: boolean;
  isLoading: boolean;
  
  // Acciones
  loadConfig: (userId: string) => Promise<void>;
  saveConfig: (userId: string, config: DashboardConfig) => Promise<void>;
  toggleEditMode: () => void;
  updateWidgetOrder: (widgets: DashboardWidget[]) => void;
  toggleWidget: (widgetId: string) => void;
  resetToDefault: (userId: string) => Promise<void>;
  
  // Getters
  getEnabledWidgets: () => DashboardWidget[];
  getWidgetById: (widgetId: string) => DashboardWidget | undefined;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'welcome',
    type: WidgetType.WELCOME,
    enabled: true,
    order: 0,
  },
  {
    id: 'business_types',
    type: WidgetType.BUSINESS_TYPES,
    enabled: true,
    order: 1,
  },
  {
    id: 'cost_stats',
    type: WidgetType.COST_STATS,
    enabled: true,
    order: 2,
  },
  {
    id: 'top_lotes',
    type: WidgetType.TOP_LOTES,
    enabled: true,
    order: 3,
  },
  {
    id: 'quick_actions',
    type: WidgetType.QUICK_ACTIONS,
    enabled: true,
    order: 4,
  },
  {
    id: 'financial_summary',
    type: WidgetType.FINANCIAL_SUMMARY,
    enabled: false,
    order: 5,
  },
  {
    id: 'recent_activity',
    type: WidgetType.RECENT_ACTIVITY,
    enabled: false,
    order: 6,
  },
];

const getDefaultConfig = (): DashboardConfig => ({
  widgets: [...DEFAULT_WIDGETS],
  showWelcome: true,
  lastUpdated: new Date(),
});

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      config: null,
      isEditMode: false,
      isLoading: false,

      loadConfig: async (userId: string) => {
        try {
          set({ isLoading: true });
          
          const storageKey = `dashboard-config-${userId}`;
          const stored = await AsyncStorage.getItem(storageKey);
          
          if (stored) {
            const parsed = JSON.parse(stored);
            set({
              config: {
                ...parsed,
                lastUpdated: new Date(parsed.lastUpdated),
                widgets: parsed.widgets.map((w: any) => ({
                  ...w,
                  lastUpdated: w.lastUpdated ? new Date(w.lastUpdated) : undefined,
                })),
              },
            });
          } else {
            // Configuración por defecto
            const defaultConfig = getDefaultConfig();
            await get().saveConfig(userId, defaultConfig);
            set({ config: defaultConfig });
          }
        } catch (error) {
          console.error('Error cargando configuración del dashboard:', error);
          const defaultConfig = getDefaultConfig();
          set({ config: defaultConfig });
        } finally {
          set({ isLoading: false });
        }
      },

      saveConfig: async (userId: string, config: DashboardConfig) => {
        try {
          const storageKey = `dashboard-config-${userId}`;
          await AsyncStorage.setItem(storageKey, JSON.stringify({
            ...config,
            lastUpdated: new Date().toISOString(),
          }));
          
          set({ config });
        } catch (error) {
          console.error('Error guardando configuración del dashboard:', error);
          throw error;
        }
      },

      toggleEditMode: () => {
        set((state) => ({ isEditMode: !state.isEditMode }));
      },

      updateWidgetOrder: (widgets: DashboardWidget[]) => {
        const config = get().config;
        if (!config) return;

        const updatedConfig: DashboardConfig = {
          ...config,
          widgets: widgets.map((w, index) => ({ ...w, order: index })),
          lastUpdated: new Date(),
        };

        set({ config: updatedConfig });
      },

      toggleWidget: (widgetId: string) => {
        const config = get().config;
        if (!config) return;

        const updatedWidgets = config.widgets.map((w) =>
          w.id === widgetId ? { ...w, enabled: !w.enabled } : w
        );

        const updatedConfig: DashboardConfig = {
          ...config,
          widgets: updatedWidgets,
          lastUpdated: new Date(),
        };

        set({ config: updatedConfig });
      },

      resetToDefault: async (userId: string) => {
        const defaultConfig = getDefaultConfig();
        await get().saveConfig(userId, defaultConfig);
        set({ config: defaultConfig });
      },

      // Getters
      getEnabledWidgets: () => {
        const config = get().config;
        if (!config) return [];

        return config.widgets
          .filter((w) => w.enabled)
          .sort((a, b) => a.order - b.order);
      },

      getWidgetById: (widgetId: string) => {
        const config = get().config;
        if (!config) return undefined;

        return config.widgets.find((w) => w.id === widgetId);
      },
    }),
    {
      name: 'dashboard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (state) => ({
        config: state.config,
        isEditMode: false, // No persistir modo edición
      }),
    }
  )
);



