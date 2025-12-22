/**
 * Tipos para el sistema multi-tenant de Gallinapp
 */

export interface Organization {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  
  // Información de la empresa
  businessInfo: {
    nit?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
  
  // Configuración específica de la organización
  settings: {
    // Configuración avícola
    defaultEggPrice: number;
    defaultChickenPricePerPound: number;
    defaultLevantePricePerUnit: number;
    eggsPerBox: number;
    
    // Configuración de crecimiento
    israeliGrowthDays: number;
    engordeGrowthDays: number;
    targetEngordeWeight: number;
    acceptableMortalityRate: number;
    
    // Configuración de facturación
    invoiceSettings: {
      prefix: string;
      nextNumber: number;
      format: string;
      taxRate?: number;
      currency: string;
    };
    
    // Configuración de notificaciones
    notifications: {
      alertsEnabled: boolean;
      emailNotifications: boolean;
      smsNotifications: boolean;
      pushNotifications: boolean;
    };
  };
  
  // Plan de suscripción
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: Date;
    endDate?: Date;
    limits: SubscriptionLimits;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  
  // Metadatos
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing'
}

export interface SubscriptionLimits {
  maxLotes: number;
  maxUsers: number;
  maxStorage: number; // MB
  maxTransactions: number; // por mes
  features: {
    analytics: boolean;
    exports: boolean;
    apiAccess: boolean;
    customReports: boolean;
    multiLocation: boolean;
    integrations: boolean;
  };
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  displayName: string;
  role: OrganizationRole;
  permissions: Permission[];
  isActive: boolean;
  invitedBy?: string;
  joinedAt: Date;
  lastActiveAt?: Date;
}

export enum OrganizationRole {
  ADMIN = 'admin',       // Acceso completo, puede gestionar usuarios y suscripción
  MANAGER = 'manager',   // Puede gestionar lotes y generar reportes
  OPERATOR = 'operator', // Solo puede operar lotes asignados
  VIEWER = 'viewer'      // Solo lectura
}

export interface Permission {
  resource: string; // 'lotes', 'ventas', 'reportes', etc.
  actions: string[]; // 'create', 'read', 'update', 'delete'
  conditions?: Record<string, any>; // Condiciones específicas
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  role: OrganizationRole;
  permissions: Permission[];
  invitedBy: string;
  invitedByName: string;
  createdAt: Date;
  expiresAt: Date;
  isAccepted: boolean;
  acceptedAt?: Date;
  token: string;
}

export interface UserOrganizations {
  userId: string;
  organizations: {
    [organizationId: string]: {
      role: OrganizationRole;
      permissions: Permission[];
      isActive: boolean;
      joinedAt: Date;
    };
  };
  currentOrganization?: string; // ID de la organización activa
  updatedAt: Date;
}

// Plan limits configuration
export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  [SubscriptionPlan.FREE]: {
    maxLotes: 1,
    maxUsers: 1,
    maxStorage: 100, // 100MB
    maxTransactions: 50,
    features: {
      analytics: false,
      exports: false,
      apiAccess: false,
      customReports: false,
      multiLocation: false,
      integrations: false,
    }
  },
  [SubscriptionPlan.BASIC]: {
    maxLotes: 5,
    maxUsers: 3,
    maxStorage: 1000, // 1GB
    maxTransactions: 500,
    features: {
      analytics: true,
      exports: true,
      apiAccess: false,
      customReports: false,
      multiLocation: false,
      integrations: false,
    }
  },
  [SubscriptionPlan.PRO]: {
    maxLotes: 50,
    maxUsers: 10,
    maxStorage: 5000, // 5GB
    maxTransactions: 5000,
    features: {
      analytics: true,
      exports: true,
      apiAccess: true,
      customReports: true,
      multiLocation: true,
      integrations: false,
    }
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxLotes: -1, // Unlimited
    maxUsers: -1, // Unlimited
    maxStorage: -1, // Unlimited
    maxTransactions: -1, // Unlimited
    features: {
      analytics: true,
      exports: true,
      apiAccess: true,
      customReports: true,
      multiLocation: true,
      integrations: true,
    }
  }
};



