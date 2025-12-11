/**
 * Tipos para el sistema de Granjas (Farm)
 * La granja solo contiene datos de la granja, NO datos de suscripción
 */

export interface Farm {
  id: string;
  name: string; // Nombre principal de la granja
  displayName?: string; // Nombre para mostrar (opcional)
  description?: string;
  farmCode: string; // Código único de 8 caracteres para acceso
  
  // Información de la granja
  farmInfo: {
    location?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    establishedDate?: Date;
    totalArea?: number; // Hectáreas
    capacity?: number; // Capacidad total de aves
  };
  
  // Configuración específica de la granja
  // Todas las configuraciones operativas y de negocio de la granja
  settings: {
    // Precios específicos de esta granja
    defaultEggPrice: number; // Precio por unidad de huevo (DOP)
    defaultChickenPricePerPound: number; // Precio por libra de pollo de engorde (DOP)
    defaultLevantePricePerUnit: number; // Precio por unidad de pollo israelí (DOP)
    
    // Configuraciones de crecimiento y operativas
    israeliGrowthDays: number; // Días promedio de crecimiento para israelíes
    engordeGrowthDays: number; // Días promedio de crecimiento para engorde
    targetEngordeWeight: number; // Peso objetivo en libras para pollos de engorde
    acceptableMortalityRate: number; // Porcentaje de mortalidad aceptable
    eggsPerBox: number; // Cantidad estándar de huevos por caja para ventas
    
    // Configuración de facturación específica de la granja
    invoiceSettings: {
      prefix: string;
      nextNumber: number;
      format: string;
      taxRate?: number;
      currency: string;
    };
    
    // Configuración de notificaciones específica de la granja
    notifications: {
      alertsEnabled: boolean;
      emailNotifications: boolean;
      smsNotifications: boolean;
      pushNotifications: boolean;
      mostrarAlertasExito: boolean;
      mostrarAlertasError: boolean;
      mostrarAlertasConfirmacion: boolean;
      sonidoAlertas: boolean;
      vibrarEnAlertas: boolean;
    };
    
    // Configuración regional específica de la granja
    timezone: string;
    language: string;
  };
  
  // Propietario y metadatos
  ownerId: string; // UID del usuario que creó la granja
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Configuración por defecto para nuevas granjas
export const DEFAULT_FARM_SETTINGS = {
  // Precios por defecto
  defaultEggPrice: 8.0, // DOP por unidad
  defaultChickenPricePerPound: 65.0, // DOP por libra
  defaultLevantePricePerUnit: 150.0, // DOP por ave
  
  // Configuraciones de crecimiento y operativas
  israeliGrowthDays: 45, // días
  engordeGrowthDays: 42, // días
  targetEngordeWeight: 4.5, // libras
  acceptableMortalityRate: 5.0, // porcentaje
  eggsPerBox: 30, // Cantidad estándar de huevos por caja
  
  invoiceSettings: {
    prefix: 'FAC',
    nextNumber: 1,
    format: 'FAC-{number}',
    taxRate: 0.18, // 18% ITBIS en República Dominicana
    currency: 'DOP',
  },
  
  notifications: {
    alertsEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    mostrarAlertasExito: true,
    mostrarAlertasError: true,
    mostrarAlertasConfirmacion: true,
    sonidoAlertas: true,
    vibrarEnAlertas: true,
  },
  
  timezone: 'America/Santo_Domingo',
  language: 'es',
};
