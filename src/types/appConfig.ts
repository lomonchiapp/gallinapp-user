/**
 * Configuración global del sistema (System Config)
 * 
 * IMPORTANTE: Este archivo define SOLO la configuración global del SISTEMA.
 * NO incluye:
 * - Precios de productos (eso va en FarmSettings)
 * - Parámetros de producción específicos (eso va en FarmSettings)
 * - Preferencias de usuario (eso va en UserSettings)
 * 
 * Solo lectura en esta app - se configura desde panel administrativo.
 * 
 * Ver: docs/settings-architecture.md para entender la arquitectura completa.
 */

import { SubscriptionPlan } from './subscription';

export interface AppConfig {
  id: string;
  version: string; // Versión de la configuración
  
  // ============================================================================
  // LÍMITES DEL SISTEMA POR PLAN
  // ============================================================================
  
  limits: {
    [SubscriptionPlan.FREE]: SystemLimits;
    [SubscriptionPlan.BASIC]: SystemLimits;
    [SubscriptionPlan.PROFESSIONAL]: SystemLimits;
    [SubscriptionPlan.ENTERPRISE]: SystemLimits;
  };
  
  // ============================================================================
  // CONSTANTES DEL DOMINIO AVÍCOLA
  // ============================================================================
  
  constants: {
    // Rangos válidos para precios (validación)
    eggPrice: {
      min: number;  // Precio mínimo válido por huevo
      max: number;  // Precio máximo válido por huevo
    };
    
    chickenPrice: {
      min: number;  // Precio mínimo por libra
      max: number;  // Precio máximo por libra
    };
    
    // Rangos válidos para parámetros de producción
    growthDays: {
      min: number;  // Días mínimos de crecimiento
      max: number;  // Días máximos de crecimiento
    };
    
    weight: {
      min: number;  // Peso mínimo objetivo (libras)
      max: number;  // Peso máximo objetivo (libras)
    };
    
    mortalityRate: {
      min: number;  // 0%
      max: number;  // 100%
    };
    
    // Valores estándar de la industria (solo referencia)
    industry: {
      defaultEggsPerBox: number;          // Estándar de la industria
      defaultProductionCycle: number;     // Días de un ciclo típico
      averageMortalityRate: number;       // % promedio de la industria
    };
  };
  
  // ============================================================================
  // FEATURES HABILITADAS
  // ============================================================================
  
  features: {
    // Módulos principales habilitados
    enabledModules: ('ponedoras' | 'levantes' | 'engorde' | 'ventas' | 'gastos' | 'reportes' | 'inventario')[];
    
    // Features experimentales o en beta
    experimentalFeatures: {
      aiRecommendations: boolean;      // IA para recomendaciones
      advancedAnalytics: boolean;      // Análisis avanzados
      multiCurrency: boolean;          // Soporte multi-moneda
      offlineMode: boolean;            // Modo offline
      voiceCommands: boolean;          // Comandos de voz
    };
    
    // Integraciones disponibles
    integrations: {
      stripe: boolean;                  // Pagos con Stripe
      whatsapp: boolean;                // Notificaciones por WhatsApp
      email: boolean;                   // Notificaciones por Email
      sms: boolean;                     // Notificaciones por SMS
    };
  };
  
  // ============================================================================
  // CONFIGURACIÓN DE SEGURIDAD
  // ============================================================================
  
  security: {
    sessionTimeout: number;              // Minutos de inactividad
    maxLoginAttempts: number;            // Intentos antes de bloqueo
    passwordMinLength: number;           // Longitud mínima de contraseña
    requireMFA: boolean;                 // Requerir autenticación 2FA
    dataRetentionDays: number;           // Días de retención de datos
  };
  
  // ============================================================================
  // MANTENIMIENTO
  // ============================================================================
  
  maintenance: {
    enabled: boolean;                    // Modo mantenimiento activo
    message?: string;                    // Mensaje a mostrar
    estimatedEnd?: Date;                 // Fecha estimada de finalización
  };
  
  // Metadata
  updatedAt: Date;
  updatedBy: string; // UID del admin que actualizó
}

/**
 * Límites del sistema por plan de suscripción
 */
export interface SystemLimits {
  // Granjas
  maxFarms: number;                      // Granjas por cuenta
  maxCollaboratorsPerFarm: number;       // Colaboradores por granja
  
  // Lotes y aves
  maxLotsPerFarm: number;                // Lotes por granja
  maxBirdsPerLot: number;                // Aves por lote
  
  // Almacenamiento y datos
  storageQuotaMB: number;                // MB de almacenamiento
  maxDocumentsPerFarm: number;           // Documentos/facturas por granja
  
  // Exportaciones y reportes
  maxExportsPerMonth: number;            // Exportaciones mensuales
  maxReportGenerations: number;          // Reportes generados por mes
  
  // API y automatización
  apiCallsPerDay: number;                // Llamadas API por día
  webhooksEnabled: boolean;              // Webhooks disponibles
  
  // Características premium
  advancedReportsEnabled: boolean;       // Reportes avanzados
  aiInsightsEnabled: boolean;            // Insights con IA
  prioritySupport: boolean;              // Soporte prioritario
  customBrandingEnabled: boolean;        // Personalización de marca
}

/**
 * Configuración por defecto del sistema
 */
export const DEFAULT_SYSTEM_CONFIG: Omit<AppConfig, 'id' | 'updatedAt' | 'updatedBy'> = {
  version: '1.0.0',
  
  limits: {
    [SubscriptionPlan.FREE]: {
      maxFarms: 1,
      maxCollaboratorsPerFarm: 2,
      maxLotsPerFarm: 10,
      maxBirdsPerLot: 1000,
      storageQuotaMB: 100,
      maxDocumentsPerFarm: 50,
      maxExportsPerMonth: 5,
      maxReportGenerations: 10,
      apiCallsPerDay: 100,
      webhooksEnabled: false,
      advancedReportsEnabled: false,
      aiInsightsEnabled: false,
      prioritySupport: false,
      customBrandingEnabled: false,
    },
    [SubscriptionPlan.BASIC]: {
      maxFarms: 2,
      maxCollaboratorsPerFarm: 5,
      maxLotsPerFarm: 30,
      maxBirdsPerLot: 5000,
      storageQuotaMB: 1000,
      maxDocumentsPerFarm: 200,
      maxExportsPerMonth: 20,
      maxReportGenerations: 50,
      apiCallsPerDay: 1000,
      webhooksEnabled: true,
      advancedReportsEnabled: true,
      aiInsightsEnabled: false,
      prioritySupport: false,
      customBrandingEnabled: false,
    },
    [SubscriptionPlan.PROFESSIONAL]: {
      maxFarms: 5,
      maxCollaboratorsPerFarm: 15,
      maxLotsPerFarm: 100,
      maxBirdsPerLot: 20000,
      storageQuotaMB: 5000,
      maxDocumentsPerFarm: 1000,
      maxExportsPerMonth: 100,
      maxReportGenerations: 200,
      apiCallsPerDay: 10000,
      webhooksEnabled: true,
      advancedReportsEnabled: true,
      aiInsightsEnabled: true,
      prioritySupport: true,
      customBrandingEnabled: true,
    },
    [SubscriptionPlan.ENTERPRISE]: {
      maxFarms: 999,  // Ilimitado en práctica
      maxCollaboratorsPerFarm: 999,
      maxLotsPerFarm: 999,
      maxBirdsPerLot: 999999,
      storageQuotaMB: 50000,
      maxDocumentsPerFarm: 99999,
      maxExportsPerMonth: 9999,
      maxReportGenerations: 9999,
      apiCallsPerDay: 100000,
      webhooksEnabled: true,
      advancedReportsEnabled: true,
      aiInsightsEnabled: true,
      prioritySupport: true,
      customBrandingEnabled: true,
    },
  },
  
  constants: {
    eggPrice: {
      min: 1.0,    // DOP
      max: 100.0,  // DOP
    },
    chickenPrice: {
      min: 10.0,   // DOP/libra
      max: 500.0,  // DOP/libra
    },
    growthDays: {
      min: 1,
      max: 365,
    },
    weight: {
      min: 0.1,    // libras
      max: 50.0,   // libras
    },
    mortalityRate: {
      min: 0.0,    // %
      max: 100.0,  // %
    },
    industry: {
      defaultEggsPerBox: 30,
      defaultProductionCycle: 42,
      averageMortalityRate: 5.0,
    },
  },
  
  features: {
    enabledModules: ['ponedoras', 'levantes', 'engorde', 'ventas', 'gastos', 'reportes', 'inventario'],
    experimentalFeatures: {
      aiRecommendations: false,
      advancedAnalytics: false,
      multiCurrency: false,
      offlineMode: false,
      voiceCommands: false,
    },
    integrations: {
      stripe: true,
      whatsapp: true,
      email: true,
      sms: false,
    },
  },
  
  security: {
    sessionTimeout: 60,           // 1 hora
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMFA: false,
    dataRetentionDays: 365,       // 1 año
  },
  
  maintenance: {
    enabled: false,
  },
};
