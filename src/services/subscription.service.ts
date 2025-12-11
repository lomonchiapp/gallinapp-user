/**
 * Subscription Service - Gestión de suscripciones con Stripe + RevenueCat
 */

import Purchases, { 
  PurchasesPackage, 
  CustomerInfo, 
  PurchasesOffering,
  LOG_LEVEL
} from 'react-native-purchases';
import { Alert } from 'react-native';
import { 
  SubscriptionPlan, 
  SubscriptionStatus,
  Organization,
  SUBSCRIPTION_LIMITS
} from '../types/organization';
import { organizationService } from './organization.service';

// Configuración de planes
const REVENUE_CAT_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '',
  offerings: {
    [SubscriptionPlan.BASIC]: 'basic_monthly',
    [SubscriptionPlan.PRO]: 'pro_monthly', 
    [SubscriptionPlan.ENTERPRISE]: 'enterprise_monthly'
  }
};

interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}

class SubscriptionService {
  private isInitialized = false;

  /**
   * Inicializa RevenueCat
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configurar RevenueCat
      Purchases.setLogLevel(LOG_LEVEL.INFO);
      
      await Purchases.configure({
        apiKey: REVENUE_CAT_CONFIG.apiKey,
        appUserID: userId,
      });

      this.isInitialized = true;
      console.log('✅ RevenueCat inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando RevenueCat:', error);
      throw new Error('Error inicializando sistema de suscripciones');
    }
  }

  /**
   * Obtiene las ofertas disponibles
   */
  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('Error obteniendo ofertas:', error);
      return [];
    }
  }

  /**
   * Obtiene información de suscripción del usuario
   */
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    try {
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      
      // Determinar plan activo
      let currentPlan = SubscriptionPlan.FREE;
      let status = SubscriptionStatus.INACTIVE;
      let currentPeriodEnd: Date | undefined;
      let trialEnd: Date | undefined;

      if (customerInfo.activeSubscriptions.length > 0) {
        const activeSubscription = customerInfo.activeSubscriptions[0];
        
        // Mapear RevenueCat a nuestros planes
        currentPlan = this.mapRevenueCatToPlan(activeSubscription);
        status = SubscriptionStatus.ACTIVE;
        
        // Obtener información de la suscripción activa
        const entitlement = customerInfo.entitlements.active[activeSubscription];
        if (entitlement) {
          currentPeriodEnd = entitlement.expirationDate ? 
            new Date(entitlement.expirationDate) : undefined;
          
          if (entitlement.isActive && entitlement.willRenew) {
            status = SubscriptionStatus.ACTIVE;
          } else if (entitlement.isActive && !entitlement.willRenew) {
            status = SubscriptionStatus.CANCELLED;
          }
        }
      }

      return {
        plan: currentPlan,
        status,
        currentPeriodEnd,
        trialEnd,
        cancelAtPeriodEnd: status === SubscriptionStatus.CANCELLED
      };
    } catch (error) {
      console.error('Error obteniendo info de suscripción:', error);
      return {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.INACTIVE
      };
    }
  }

  /**
   * Compra una suscripción
   */
  async purchaseSubscription(plan: SubscriptionPlan): Promise<boolean> {
    try {
      const offerings = await this.getOfferings();
      const targetOffering = offerings.find(offering => 
        offering.identifier === REVENUE_CAT_CONFIG.offerings[plan]
      );

      if (!targetOffering) {
        throw new Error('Plan de suscripción no disponible');
      }

      const packageToPurchase = targetOffering.monthly || 
                                targetOffering.availablePackages[0];

      if (!packageToPurchase) {
        throw new Error('No hay paquetes disponibles para este plan');
      }

      // Realizar compra
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Verificar compra exitosa
      const hasActiveSubscription = customerInfo.activeSubscriptions.length > 0;
      
      if (hasActiveSubscription) {
        console.log('✅ Suscripción comprada exitosamente');
        await this.syncSubscriptionToOrganization();
        return true;
      } else {
        throw new Error('La compra no se completó correctamente');
      }
    } catch (error: any) {
      console.error('Error comprando suscripción:', error);
      
      // Manejar errores específicos de RevenueCat
      if (error.code === 'PURCHASE_CANCELLED') {
        console.log('Compra cancelada por el usuario');
        return false;
      }
      
      Alert.alert(
        'Error de Compra',
        error.message || 'No se pudo completar la compra. Inténtalo de nuevo.'
      );
      return false;
    }
  }

  /**
   * Cancela una suscripción (redirige a configuración de la tienda)
   */
  async cancelSubscription(): Promise<void> {
    try {
      // RevenueCat no puede cancelar directamente, debe hacerse desde la tienda
      Alert.alert(
        'Cancelar Suscripción',
        'Para cancelar tu suscripción, ve a la configuración de tu cuenta de App Store o Google Play.',
        [
          { text: 'Entendido', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Error al intentar cancelar:', error);
    }
  }

  /**
   * Restaura compras previas
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      const hasActiveSubscription = customerInfo.activeSubscriptions.length > 0;
      
      if (hasActiveSubscription) {
        console.log('✅ Compras restauradas exitosamente');
        await this.syncSubscriptionToOrganization();
        return true;
      } else {
        Alert.alert(
          'Sin Compras',
          'No se encontraron suscripciones activas para restaurar.'
        );
        return false;
      }
    } catch (error) {
      console.error('Error restaurando compras:', error);
      Alert.alert(
        'Error',
        'No se pudieron restaurar las compras. Inténtalo de nuevo.'
      );
      return false;
    }
  }

  /**
   * Verifica si una característica está disponible en el plan actual
   */
  async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      const subscriptionInfo = await this.getSubscriptionInfo();
      const limits = SUBSCRIPTION_LIMITS[subscriptionInfo.plan];
      
      // Verificar característica específica
      switch (feature) {
        case 'analytics':
          return limits.features.analytics;
        case 'exports':
          return limits.features.exports;
        case 'api_access':
          return limits.features.apiAccess;
        case 'custom_reports':
          return limits.features.customReports;
        case 'multi_location':
          return limits.features.multiLocation;
        case 'integrations':
          return limits.features.integrations;
        default:
          return true; // Características básicas siempre disponibles
      }
    } catch (error) {
      console.error('Error verificando acceso a característica:', error);
      return false;
    }
  }

  /**
   * Verifica límites de uso
   */
  async checkUsageLimit(resource: 'lotes' | 'users' | 'transactions', currentUsage: number): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
  }> {
    try {
      const subscriptionInfo = await this.getSubscriptionInfo();
      const limits = SUBSCRIPTION_LIMITS[subscriptionInfo.plan];
      
      let limit: number;
      switch (resource) {
        case 'lotes':
          limit = limits.maxLotes;
          break;
        case 'users':
          limit = limits.maxUsers;
          break;
        case 'transactions':
          limit = limits.maxTransactions;
          break;
        default:
          limit = -1; // Ilimitado
      }

      const allowed = limit === -1 || currentUsage < limit;
      const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);

      return { allowed, limit, remaining };
    } catch (error) {
      console.error('Error verificando límites:', error);
      return { allowed: true, limit: -1, remaining: -1 };
    }
  }

  /**
   * Sincroniza la suscripción con la organización en Firestore
   */
  private async syncSubscriptionToOrganization(): Promise<void> {
    try {
      const subscriptionInfo = await this.getSubscriptionInfo();
      const currentOrg = await organizationService.getCurrentOrganization();
      
      if (!currentOrg) {
        console.warn('No hay organización actual para sincronizar suscripción');
        return;
      }

      // Actualizar organización con nueva información de suscripción
      await organizationService.updateOrganization(currentOrg.id, {
        subscription: {
          ...currentOrg.subscription,
          plan: subscriptionInfo.plan,
          status: subscriptionInfo.status,
          limits: SUBSCRIPTION_LIMITS[subscriptionInfo.plan],
          endDate: subscriptionInfo.currentPeriodEnd
        }
      });

      console.log('✅ Suscripción sincronizada con la organización');
    } catch (error) {
      console.error('Error sincronizando suscripción:', error);
    }
  }

  /**
   * Mapea un identificador de RevenueCat a nuestro enum de planes
   */
  private mapRevenueCatToPlan(subscriptionId: string): SubscriptionPlan {
    if (subscriptionId.includes('basic')) return SubscriptionPlan.BASIC;
    if (subscriptionId.includes('pro')) return SubscriptionPlan.PRO;
    if (subscriptionId.includes('enterprise')) return SubscriptionPlan.ENTERPRISE;
    return SubscriptionPlan.FREE;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;


