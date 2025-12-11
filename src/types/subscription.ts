/**
 * Tipos centralizados para suscripciones
 * Single Source of Truth para datos de suscripción
 */

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
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
  maxCollaborators: number;
  maxStorage: number; // GB
  maxTransactions: number; // por mes
  features: {
    analytics: boolean;
    exports: boolean;
    apiAccess: boolean;
    customReports: boolean;
    multiLocation: boolean;
    integrations: boolean;
    advancedAlerts: boolean;
  };
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  limits: SubscriptionLimits;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: Date;
}

// Límites por plan - Single Source of Truth
export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  [SubscriptionPlan.FREE]: {
    maxLotes: 2,
    maxCollaborators: 1, // Solo el owner
    maxStorage: 1, // 1GB
    maxTransactions: 100,
    features: {
      analytics: false,
      exports: false,
      apiAccess: false,
      customReports: false,
      multiLocation: false,
      integrations: false,
      advancedAlerts: false,
    }
  },
  [SubscriptionPlan.BASIC]: {
    maxLotes: 10,
    maxCollaborators: 3,
    maxStorage: 5, // 5GB
    maxTransactions: 500,
    features: {
      analytics: true,
      exports: true,
      apiAccess: false,
      customReports: false,
      multiLocation: false,
      integrations: false,
      advancedAlerts: true,
    }
  },
  [SubscriptionPlan.PRO]: {
    maxLotes: 50,
    maxCollaborators: 10,
    maxStorage: 25, // 25GB
    maxTransactions: 2000,
    features: {
      analytics: true,
      exports: true,
      apiAccess: true,
      customReports: true,
      multiLocation: true,
      integrations: false,
      advancedAlerts: true,
    }
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxLotes: -1, // Unlimited
    maxCollaborators: -1, // Unlimited
    maxStorage: -1, // Unlimited
    maxTransactions: -1, // Unlimited
    features: {
      analytics: true,
      exports: true,
      apiAccess: true,
      customReports: true,
      multiLocation: true,
      integrations: true,
      advancedAlerts: true,
    }
  }
};

// Suscripción por defecto para nuevas cuentas
export const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: SubscriptionPlan.FREE,
  status: SubscriptionStatus.TRIALING,
  startDate: new Date(),
  limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE],
  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días
};



