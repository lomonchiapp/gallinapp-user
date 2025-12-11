/**
 * Adaptador de compatibilidad: Organization ↔ Farm
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo adapta entre tipos, no lógica de negocio
 * - Open/Closed: Extensible sin modificar código existente
 * - Liskov Substitution: Organization puede usarse donde se espera Farm
 * 
 * Este adaptador permite que el código existente siga funcionando
 * mientras migramos gradualmente a Farm como Single Source of Truth
 */

import { useFarmStore } from '../../stores/farmStore';
import { DEFAULT_FARM_SETTINGS, Farm, SubscriptionPlan, SubscriptionStatus } from '../../types/farm';
import { Organization } from '../../types/organization';

/**
 * Adaptador que convierte Organization → Farm
 * Permite usar Organizations como Farms temporalmente
 */
export class OrganizationFarmAdapter {
  /**
   * Convierte Organization → Farm
   */
  static organizationToFarm(org: Organization): Farm {
    return {
      id: org.id,
      name: org.name,
      displayName: org.displayName,
      description: org.description,
      farmCode: this.generateFarmCodeFromOrgId(org.id), // Generar código basado en ID
      farmInfo: {
        location: org.businessInfo?.address,
        address: org.businessInfo?.address,
        phone: org.businessInfo?.phone,
        email: org.businessInfo?.email,
        logo: org.businessInfo?.logo,
      },
      settings: {
        defaultEggPrice: org.settings?.defaultEggPrice ?? DEFAULT_FARM_SETTINGS.defaultEggPrice,
        defaultChickenPricePerPound: org.settings?.defaultChickenPricePerPound ?? DEFAULT_FARM_SETTINGS.defaultChickenPricePerPound,
        defaultLevantePricePerUnit: org.settings?.defaultLevantePricePerUnit ?? DEFAULT_FARM_SETTINGS.defaultLevantePricePerUnit,
        eggsPerBox: org.settings?.eggsPerBox ?? DEFAULT_FARM_SETTINGS.eggsPerBox,
        israeliGrowthDays: org.settings?.israeliGrowthDays ?? DEFAULT_FARM_SETTINGS.israeliGrowthDays,
        engordeGrowthDays: org.settings?.engordeGrowthDays ?? DEFAULT_FARM_SETTINGS.engordeGrowthDays,
        targetEngordeWeight: org.settings?.targetEngordeWeight ?? DEFAULT_FARM_SETTINGS.targetEngordeWeight,
        acceptableMortalityRate: org.settings?.acceptableMortalityRate ?? DEFAULT_FARM_SETTINGS.acceptableMortalityRate,
        invoiceSettings: org.settings?.invoiceSettings ?? DEFAULT_FARM_SETTINGS.invoiceSettings,
        notifications: org.settings?.notifications ?? DEFAULT_FARM_SETTINGS.notifications,
        timezone: org.settings?.timezone ?? DEFAULT_FARM_SETTINGS.timezone,
        language: org.settings?.language ?? DEFAULT_FARM_SETTINGS.language,
      },
      subscription: {
        plan: this.mapSubscriptionPlan(org.subscription.plan),
        status: this.mapSubscriptionStatus(org.subscription.status),
        startDate: org.subscription.startDate,
        endDate: org.subscription.endDate,
        limits: {
          maxLotes: org.subscription.limits.maxLotes,
          maxCollaborators: org.subscription.limits.maxUsers, // maxUsers → maxCollaborators
          maxStorage: org.subscription.limits.maxStorage,
          maxTransactions: org.subscription.limits.maxTransactions,
          features: {
            analytics: org.subscription.limits.features.analytics,
            exports: org.subscription.limits.features.exports,
            apiAccess: org.subscription.limits.features.apiAccess,
            customReports: org.subscription.limits.features.customReports,
            multiLocation: org.subscription.limits.features.multiLocation,
            integrations: org.subscription.limits.features.integrations,
            advancedAlerts: false, // Nuevo campo
          },
        },
        stripeCustomerId: org.subscription.stripeCustomerId,
        stripeSubscriptionId: org.subscription.stripeSubscriptionId,
      },
      ownerId: org.createdBy,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      isActive: org.isActive,
    };
  }

  /**
   * Convierte Farm → Organization (para compatibilidad inversa)
   */
  static farmToOrganization(farm: Farm): Organization {
    return {
      id: farm.id,
      name: farm.name,
      displayName: farm.displayName || farm.name,
      description: farm.description,
      businessInfo: {
        address: farm.farmInfo?.address,
        phone: farm.farmInfo?.phone,
        email: farm.farmInfo?.email,
        logo: farm.farmInfo?.logo,
      },
      settings: {
        defaultEggPrice: farm.settings.defaultEggPrice,
        defaultChickenPricePerPound: farm.settings.defaultChickenPricePerPound,
        defaultLevantePricePerUnit: farm.settings.defaultLevantePricePerUnit,
        eggsPerBox: farm.settings.eggsPerBox,
        israeliGrowthDays: farm.settings.israeliGrowthDays,
        engordeGrowthDays: farm.settings.engordeGrowthDays,
        targetEngordeWeight: farm.settings.targetEngordeWeight,
        acceptableMortalityRate: farm.settings.acceptableMortalityRate,
        invoiceSettings: farm.settings.invoiceSettings,
        notifications: farm.settings.notifications,
      },
      subscription: {
        plan: this.mapSubscriptionPlanReverse(farm.subscription.plan),
        status: this.mapSubscriptionStatusReverse(farm.subscription.status),
        startDate: farm.subscription.startDate,
        endDate: farm.subscription.endDate,
        limits: {
          maxLotes: farm.subscription.limits.maxLotes,
          maxUsers: farm.subscription.limits.maxCollaborators, // maxCollaborators → maxUsers
          maxStorage: farm.subscription.limits.maxStorage,
          maxTransactions: farm.subscription.limits.maxTransactions,
          features: {
            analytics: farm.subscription.limits.features.analytics,
            exports: farm.subscription.limits.features.exports,
            apiAccess: farm.subscription.limits.features.apiAccess,
            customReports: farm.subscription.limits.features.customReports,
            multiLocation: farm.subscription.limits.features.multiLocation,
            integrations: farm.subscription.limits.features.integrations,
          },
        },
        stripeCustomerId: farm.subscription.stripeCustomerId,
        stripeSubscriptionId: farm.subscription.stripeSubscriptionId,
      },
      createdBy: farm.ownerId,
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt,
      isActive: farm.isActive,
    };
  }

  /**
   * Genera un farmCode temporal basado en el ID de la organización
   * Esto permite compatibilidad mientras migramos
   */
  private static generateFarmCodeFromOrgId(orgId: string): string {
    // Usar los primeros 8 caracteres del ID y rellenar si es necesario
    const code = orgId.substring(0, 8).toUpperCase().padEnd(8, '0');
    return code;
  }

  private static mapSubscriptionPlan(plan: string): SubscriptionPlan {
    const planMap: Record<string, SubscriptionPlan> = {
      'free': SubscriptionPlan.FREE,
      'basic': SubscriptionPlan.BASIC,
      'pro': SubscriptionPlan.PRO,
      'enterprise': SubscriptionPlan.ENTERPRISE,
    };
    return planMap[plan.toLowerCase()] || SubscriptionPlan.FREE;
  }

  private static mapSubscriptionPlanReverse(plan: SubscriptionPlan): string {
    const reverseMap: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.FREE]: 'free',
      [SubscriptionPlan.BASIC]: 'basic',
      [SubscriptionPlan.PRO]: 'pro',
      [SubscriptionPlan.ENTERPRISE]: 'enterprise',
    };
    return reverseMap[plan] || 'free';
  }

  private static mapSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': SubscriptionStatus.ACTIVE,
      'inactive': SubscriptionStatus.INACTIVE,
      'cancelled': SubscriptionStatus.CANCELLED,
      'past_due': SubscriptionStatus.PAST_DUE,
      'trialing': SubscriptionStatus.TRIALING,
    };
    return statusMap[status.toLowerCase()] || SubscriptionStatus.INACTIVE;
  }

  private static mapSubscriptionStatusReverse(status: SubscriptionStatus): string {
    const reverseMap: Record<SubscriptionStatus, string> = {
      [SubscriptionStatus.ACTIVE]: 'active',
      [SubscriptionStatus.INACTIVE]: 'inactive',
      [SubscriptionStatus.CANCELLED]: 'cancelled',
      [SubscriptionStatus.PAST_DUE]: 'past_due',
      [SubscriptionStatus.TRIALING]: 'trialing',
    };
    return reverseMap[status] || 'inactive';
  }
}

/**
 * Hook de compatibilidad que permite usar Organization como Farm
 * Útil durante la migración gradual
 */
export const useOrganizationAsFarm = () => {
  const { currentFarm, farms } = useFarmStore();
  
  // Si hay una farm actual, usarla
  // Si no, intentar obtener de organizationStore y adaptar
  return {
    currentFarm,
    farms,
    // Métodos de compatibilidad
    getCurrentFarmOrOrganization: () => {
      if (currentFarm) return currentFarm;
      
      // Intentar obtener de organizationStore
      const { useOrganizationStore } = require('../../stores/organizationStore');
      const { currentOrganization } = useOrganizationStore.getState();
      
      if (currentOrganization) {
        return OrganizationFarmAdapter.organizationToFarm(currentOrganization);
      }
      
      return null;
    },
  };
};
