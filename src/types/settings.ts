/**
 * Arquitectura de Configuraciones del SaaS Avícola
 * 
 * 3 Niveles de Configuración:
 * 1. SystemConfig (App): Configuración global del sistema (read-only en esta app)
 * 2. UserSettings (Account/Profile): Preferencias personales del usuario
 * 3. FarmSettings: Configuraciones específicas de cada granja
 */

// ============================================================================
// 1. SYSTEM CONFIG (Global, Read-Only)
// ============================================================================

/**
 * Configuración global del sistema
 * Solo lectura en esta app - se gestiona desde panel administrativo
 */
export interface SystemConfig {
  id: string;
  
  // Límites del sistema
  limits: {
    maxFarmsPerAccount: number; // Por plan
    maxLotsPerFarm: number;
    maxCollaboratorsPerFarm: number;
    maxStoragePerFarm: number; // MB
  };
  
  // Constantes del dominio avícola
  constants: {
    minEggPrice: number;
    maxEggPrice: number;
    minGrowthDays: number;
    maxGrowthDays: number;
    defaultEggsPerBox: number;
  };
  
  // Features habilitadas
  features: {
    enabledModules: ('ponedoras' | 'levantes' | 'engorde' | 'ventas' | 'gastos' | 'reportes')[];
    experimentalFeatures: string[];
  };
  
  // Metadata
  version: string;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================================================
// 2. USER SETTINGS (Personal)
// ============================================================================

/**
 * Configuraciones personales del usuario
 * Se aplican a todas las granjas que accede
 */
export interface UserSettings {
  userId: string;
  
  // Apariencia
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
    colorScheme?: string; // Para futuros temas personalizados
  };
  
  // Regionalización
  regional: {
    timezone: string;           // ej: 'America/Santo_Domingo'
    language: string;            // ej: 'es', 'en'
    dateFormat: string;          // ej: 'DD/MM/YYYY', 'MM/DD/YYYY'
    timeFormat: '12h' | '24h';
    currency: string;            // ej: 'DOP', 'USD'
    numberFormat: string;        // ej: '1,000.00', '1.000,00'
  };
  
  // Notificaciones personales
  notifications: {
    enabled: boolean;
    
    // Canales
    channels: {
      push: boolean;
      email: boolean;
      sms: boolean;
    };
    
    // Preferencias por categoría
    categories: {
      production: boolean;      // Producción y operaciones
      financial: boolean;       // Ventas, gastos
      alerts: boolean;          // Alertas críticas
      farm: boolean;            // Notificaciones de la granja
      collaboration: boolean;   // Invitaciones, accesos
      system: boolean;          // Actualizaciones del sistema
    };
    
    // Horario de no molestar
    quietHours: {
      enabled: boolean;
      startTime: string;        // HH:mm format
      endTime: string;
    };
  };
  
  // Preferencias de UI
  ui: {
    defaultView: 'dashboard' | 'mi-granja';
    showTutorials: boolean;
    enableAnimations: boolean;
    enableHaptics: boolean;
  };
  
  // Metadata
  updatedAt: Date;
}

/**
 * Valores por defecto para nuevos usuarios
 */
export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
  },
  
  regional: {
    timezone: 'America/Santo_Domingo',
    language: 'es',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currency: 'DOP',
    numberFormat: '1,000.00',
  },
  
  notifications: {
    enabled: true,
    channels: {
      push: true,
      email: true,
      sms: false,
    },
    categories: {
      production: true,
      financial: true,
      alerts: true,
      farm: true,
      collaboration: true,
      system: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    },
  },
  
  ui: {
    defaultView: 'dashboard',
    showTutorials: true,
    enableAnimations: true,
    enableHaptics: true,
  },
};

// ============================================================================
// 3. FARM SETTINGS (Por Granja)
// ============================================================================

/**
 * Configuraciones específicas de cada granja
 * Ya definido en src/types/farm.ts como Farm.settings
 */
export interface FarmSettings {
  // Precios específicos de la granja
  pricing: {
    defaultEggPrice: number;
    defaultChickenPricePerPound: number;
    defaultLevantePricePerUnit: number;
  };
  
  // Parámetros de producción
  production: {
    israeliGrowthDays: number;
    engordeGrowthDays: number;
    targetEngordeWeight: number;
    acceptableMortalityRate: number;
    eggsPerBox: number;
  };
  
  // Facturación
  invoicing: {
    prefix: string;
    nextNumber: number;
    format: string;
    taxRate: number;
    currency: string;
    includeQR: boolean;
    includeTerms: boolean;
    terms?: string;
  };
  
  // Notificaciones de la granja
  notifications: {
    enabled: boolean;
    
    // Alertas operativas
    alerts: {
      highMortality: boolean;
      lowProduction: boolean;
      lowInventory: boolean;
      taskReminders: boolean;
    };
    
    // Configuración de alertas
    thresholds: {
      mortalityRate: number;      // % para alertar
      productionDropRate: number;  // % de caída para alertar
      inventoryDaysAlert: number;  // Días de inventario restante
    };
  };
  
  // Configuración regional de la granja
  regional: {
    timezone: string;
    language: string;
  };
}

/**
 * Valores por defecto para nuevas granjas
 */
export const DEFAULT_FARM_SETTINGS: FarmSettings = {
  pricing: {
    defaultEggPrice: 8.0,
    defaultChickenPricePerPound: 65.0,
    defaultLevantePricePerUnit: 150.0,
  },
  
  production: {
    israeliGrowthDays: 45,
    engordeGrowthDays: 42,
    targetEngordeWeight: 4.5,
    acceptableMortalityRate: 5.0,
    eggsPerBox: 30,
  },
  
  invoicing: {
    prefix: 'FAC',
    nextNumber: 1,
    format: 'FAC-{number}',
    taxRate: 0.18,
    currency: 'DOP',
    includeQR: false,
    includeTerms: true,
  },
  
  notifications: {
    enabled: true,
    alerts: {
      highMortality: true,
      lowProduction: true,
      lowInventory: true,
      taskReminders: true,
    },
    thresholds: {
      mortalityRate: 5.0,
      productionDropRate: 15.0,
      inventoryDaysAlert: 7,
    },
  },
  
  regional: {
    timezone: 'America/Santo_Domingo',
    language: 'es',
  },
};

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Categorías de configuración para organizar la UI
 */
export enum SettingsCategory {
  PROFILE = 'profile',                // Perfil del usuario
  APPEARANCE = 'appearance',          // Apariencia y tema
  NOTIFICATIONS = 'notifications',    // Notificaciones personales
  REGIONAL = 'regional',              // Idioma, zona horaria, formato
  FARM_GENERAL = 'farm_general',      // Info general de la granja
  FARM_PRICING = 'farm_pricing',      // Precios de la granja
  FARM_PRODUCTION = 'farm_production', // Parámetros de producción
  FARM_INVOICING = 'farm_invoicing',  // Configuración de facturación
  FARM_ALERTS = 'farm_alerts',        // Alertas de la granja
  ACCOUNT = 'account',                // Cuenta y suscripción
  SECURITY = 'security',              // Seguridad y privacidad
}

/**
 * Tipo de configuración
 */
export type SettingsType = 'system' | 'user' | 'farm';

/**
 * Contexto de configuración para determinar qué settings mostrar
 */
export interface SettingsContext {
  type: SettingsType;
  category: SettingsCategory;
  farmId?: string; // Requerido para settings de farm
}




