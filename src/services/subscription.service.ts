/**
 * Subscription Service - Gestión de suscripciones con Stripe + RevenueCat
 */

import Purchases, { 
  PurchasesPackage, 
  CustomerInfo, 
  PurchasesOffering,
  LOG_LEVEL
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Alert, Platform } from 'react-native';
import { 
  SubscriptionPlan, 
  SubscriptionStatus,
  Organization,
  SUBSCRIPTION_LIMITS
} from '../types/organization';
import { organizationService } from './organization.service';
import { ENV } from '../config/env';

// Configuración de planes
const REVENUE_CAT_CONFIG = {
  // La misma clave funciona para iOS y Android en modo test
  iosApiKey: ENV.REVENUECAT_API_KEY,
  androidApiKey: ENV.REVENUECAT_API_KEY,
  // Nombre del entitlement en RevenueCat Dashboard
  entitlementId: 'basic',
  // Identificadores de productos en RevenueCat
  products: {
    basic: {
      monthly: 'basic_monthly',
      quarterly: 'basic_trimestral',
      annual: 'basic_annual',
    },
    pro: {
      monthly: 'pro_monthly',
      quarterly: 'pro_trimestral',
      annual: 'pro_annual',
    },
    enterprise: {
      monthly: 'enterprise_monthly',
      quarterly: 'enterprise_trimestral',
      annual: 'enterprise_annual',
    }
  }
};

interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
  period?: 'monthly' | 'quarterly' | 'annual' | 'unknown';
}

class SubscriptionService {
  private isInitialized = false;

  /**
   * Inicializa RevenueCat con configuración específica por plataforma
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configurar nivel de log (VERBOSE para desarrollo, INFO para producción)
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);
      
      // Configuración específica por plataforma
      const apiKey = Platform.OS === 'ios' 
        ? REVENUE_CAT_CONFIG.iosApiKey 
        : REVENUE_CAT_CONFIG.androidApiKey;

      // Debug: verificar variables de entorno
      console.log('🔍 RevenueCat Config Debug:', {
        platform: Platform.OS,
        iosApiKey: REVENUE_CAT_CONFIG.iosApiKey ? '✅ Configurada' : '❌ Vacía',
        androidApiKey: REVENUE_CAT_CONFIG.androidApiKey ? '✅ Configurada' : '❌ Vacía',
        apiKey: apiKey ? '✅ Configurada' : '❌ Vacía',
        envValue: ENV.REVENUECAT_API_KEY ? '✅ Existe' : '❌ Vacía',
      });

      if (!apiKey) {
        console.error('❌ RevenueCat API key no encontrada. Variables disponibles:', {
          REVENUECAT_API_KEY: ENV.REVENUECAT_API_KEY || 'NO DEFINIDA',
          REVENUECAT_APP_ID: ENV.REVENUECAT_APP_ID || 'NO DEFINIDA',
        });
        throw new Error('RevenueCat API key no configurada. Verifica las variables de entorno en EAS.');
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.isInitialized = true;
      console.log(`✅ RevenueCat inicializado correctamente (${Platform.OS})`);
    } catch (error) {
      console.error('❌ Error inicializando RevenueCat:', error);
      throw new Error('Error inicializando sistema de suscripciones');
    }
  }

  /**
   * Verifica si el usuario tiene acceso al entitlement premium
   */
  async checkEntitlement(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Verificar si tiene el entitlement activo
      const hasEntitlement = typeof customerInfo.entitlements?.active?.[REVENUE_CAT_CONFIG.entitlementId] !== 'undefined';
      
      console.log('🔐 Entitlement check:', hasEntitlement);
      return hasEntitlement;
    } catch (error) {
      console.error('Error verificando entitlement:', error);
      return false;
    }
  }

  /**
   * Presenta el paywall de RevenueCat
   * Retorna true si el usuario compró o restauró, false en caso contrario
   */
  async presentPaywall(): Promise<boolean> {
    try {
      console.log('💳 Presentando paywall...');
      
      // Presentar paywall para la oferta actual
      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
      
      console.log('💳 Resultado del paywall:', paywallResult);
      
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
          console.log('✅ Compra exitosa - Obteniendo información inmediata...');
          
          // Obtener CustomerInfo inmediatamente después de la compra
          try {
            const customerInfo = await Purchases.getCustomerInfo();
            console.log('📦 CustomerInfo inmediato después de compra:', {
              allPurchasedProductIds: customerInfo.allPurchasedProductIds || [],
              activeSubscriptions: customerInfo.activeSubscriptions || [],
              activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
              allEntitlements: Object.keys(customerInfo.entitlements?.all || {}),
            });
            
            // Intentar detectar el plan desde los productos comprados si el entitlement no está disponible aún
            if (customerInfo.allPurchasedProductIds && customerInfo.allPurchasedProductIds.length > 0) {
              const purchasedProduct = customerInfo.allPurchasedProductIds[0];
              console.log('🛒 Producto comprado detectado:', purchasedProduct);
            }
          } catch (error) {
            console.warn('⚠️ No se pudo obtener CustomerInfo inmediatamente:', error);
          }
          
          // Esperar un momento para que RevenueCat procese la compra
          await new Promise(resolve => setTimeout(resolve, 1500));
          console.log('🔄 Sincronizando con organización...');
          // Sincronizar con Firestore después de compra exitosa
          await this.syncSubscriptionToOrganization();
          return true;
          
        case PAYWALL_RESULT.RESTORED:
          console.log('✅ Compras restauradas - Esperando procesamiento de RevenueCat...');
          // Esperar un momento para que RevenueCat procese la restauración
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('🔄 Sincronizando con organización...');
          // Sincronizar con Firestore después de restaurar
          await this.syncSubscriptionToOrganization();
          return true;
          
        case PAYWALL_RESULT.CANCELLED:
          console.log('❌ Usuario canceló');
          return false;
          
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log('⚠️ Paywall no se pudo presentar');
          return false;
          
        case PAYWALL_RESULT.ERROR:
          console.log('❌ Error en el paywall');
          return false;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error presentando paywall:', error);
      Alert.alert(
        'Error',
        'No se pudo mostrar las opciones de suscripción. Por favor, intenta más tarde.'
      );
      return false;
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
      console.log('🔄 Obteniendo información de suscripción...');
      
      // Verificar si RevenueCat está inicializado
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat no está inicializado. Retornando plan FREE.');
        return {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.INACTIVE
        };
      }

      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      
      console.log('📦 Customer Info recibido:', {
        originalAppUserId: customerInfo.originalAppUserId,
        allPurchasedProductIds: customerInfo.allPurchasedProductIds || [],
        activeSubscriptions: customerInfo.activeSubscriptions || [],
        entitlements: Object.keys(customerInfo.entitlements?.all || {}),
        activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
      });
      
      // Determinar plan activo usando entitlements
      let currentPlan = SubscriptionPlan.FREE;
      let status = SubscriptionStatus.INACTIVE;
      let currentPeriodEnd: Date | undefined;
      let trialEnd: Date | undefined;

      // Verificar entitlement principal
      let entitlement = customerInfo.entitlements?.active?.[REVENUE_CAT_CONFIG.entitlementId];
      
      // Si no hay entitlement activo, verificar en todos los entitlements
      if (!entitlement) {
        const allEntitlement = customerInfo.entitlements?.all?.[REVENUE_CAT_CONFIG.entitlementId];
        if (allEntitlement) {
          console.log('⚠️ Entitlement encontrado pero no activo:', {
            identifier: allEntitlement.identifier,
            isActive: allEntitlement.isActive,
            productIdentifier: allEntitlement.productIdentifier,
          });
          entitlement = allEntitlement;
        }
      }
      
      // Si aún no hay entitlement, intentar detectar desde productos comprados
      if (!entitlement && customerInfo.allPurchasedProductIds && customerInfo.allPurchasedProductIds.length > 0) {
        console.log('🔍 Intentando detectar plan desde productos comprados...');
        const purchasedProduct = customerInfo.allPurchasedProductIds[0];
        const detectedPlan = this.mapRevenueCatToPlan(purchasedProduct);
        
        if (detectedPlan !== SubscriptionPlan.FREE) {
          console.log('✅ Plan detectado desde producto comprado:', {
            productId: purchasedProduct,
            plan: detectedPlan,
          });
          currentPlan = detectedPlan;
          status = SubscriptionStatus.ACTIVE;
          // Intentar obtener fecha de expiración desde activeSubscriptions
          if (customerInfo.activeSubscriptions && customerInfo.activeSubscriptions.length > 0) {
            const activeSub = customerInfo.activeSubscriptions[0];
            if (activeSub && activeSub.expirationDate) {
              currentPeriodEnd = new Date(activeSub.expirationDate);
            }
          }
        }
      }
      
      if (entitlement) {
        console.log('✅ Entitlement encontrado:', {
          identifier: entitlement.identifier,
          productIdentifier: entitlement.productIdentifier,
          isActive: entitlement.isActive,
          willRenew: entitlement.willRenew,
          expirationDate: entitlement.expirationDate,
          periodType: entitlement.periodType,
          store: entitlement.store,
        });
        
        // Usuario tiene acceso premium
        const mappedPlan = this.mapRevenueCatToPlan(entitlement.productIdentifier);
        const period = this.getSubscriptionPeriod(entitlement.productIdentifier);
        console.log('🗺️ Mapeo de plan:', {
          productIdentifier: entitlement.productIdentifier,
          mappedPlan,
          period,
        });
        
        currentPlan = mappedPlan;
        
        // Determinar estado
        if (entitlement.isActive && entitlement.willRenew) {
          status = SubscriptionStatus.ACTIVE;
        } else if (entitlement.isActive && !entitlement.willRenew) {
          status = SubscriptionStatus.CANCELLED;
        }
        
        // Fechas
        currentPeriodEnd = entitlement.expirationDate ? 
          new Date(entitlement.expirationDate) : undefined;
      } else if (currentPlan === SubscriptionPlan.FREE) {
        console.log('ℹ️ No se encontró entitlement activo. Usuario en plan FREE.');
        console.log('📋 Entitlements disponibles:', {
          all: Object.keys(customerInfo.entitlements.all || {}),
          active: Object.keys(customerInfo.entitlements.active || {}),
          expected: REVENUE_CAT_CONFIG.entitlementId,
        });
        console.log('📦 Productos comprados:', customerInfo.allPurchasedProductIds || []);
        console.log('📱 Suscripciones activas:', customerInfo.activeSubscriptions || []);
      }

      // Detectar período de facturación
      let period: 'monthly' | 'quarterly' | 'annual' | 'unknown' = 'unknown';
      if (entitlement) {
        period = this.getSubscriptionPeriod(entitlement.productIdentifier);
      } else if (customerInfo.activeSubscriptions && customerInfo.activeSubscriptions.length > 0) {
        period = this.getSubscriptionPeriod(customerInfo.activeSubscriptions[0]);
      }

      console.log('📊 Subscription info final:', {
        plan: currentPlan,
        status,
        period,
        hasEntitlement: !!entitlement
      });

      return {
        plan: currentPlan,
        status,
        currentPeriodEnd,
        trialEnd,
        cancelAtPeriodEnd: status === SubscriptionStatus.CANCELLED,
        period,
      };
    } catch (error: any) {
      console.error('❌ Error obteniendo info de suscripción:', {
        message: error?.message || 'Sin mensaje',
        code: error?.code || 'Sin código',
        underlyingError: error?.underlyingError || 'Sin error subyacente',
        fullError: error
      });
      
      // Retornar plan FREE como fallback
      return {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.INACTIVE
      };
    }
  }

  /**
   * Compra una suscripción
   * NOTA: Este método está deprecado. Usar presentPaywall() en su lugar.
   * Se mantiene por compatibilidad.
   */
  async purchaseSubscription(plan: SubscriptionPlan): Promise<boolean> {
    console.log('⚠️ purchaseSubscription está deprecado. Usa presentPaywall() en su lugar.');
    
    try {
      // Obtener ofertas disponibles
      const offerings = await this.getOfferings();
      
      if (offerings.length === 0) {
        throw new Error('No hay ofertas disponibles');
      }

      // Usar la primera oferta disponible (generalmente "Default")
      const defaultOffering = offerings[0];
      
      // Seleccionar paquete mensual por defecto
      const packageToPurchase = defaultOffering.monthly || 
                                defaultOffering.availablePackages[0];

      if (!packageToPurchase) {
        throw new Error('No hay paquetes disponibles');
      }

      console.log('💳 Comprando paquete:', packageToPurchase.identifier);

      // Realizar compra
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Verificar compra exitosa
      const hasActiveSubscription = customerInfo.activeSubscriptions?.length > 0;
      
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
        console.log('❌ Compra cancelada por el usuario');
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
      const result = await Purchases.restorePurchases();
      console.log('📦 Restore result:', result);
      
      if (!result || !result.customerInfo) {
        console.warn('⚠️ No customerInfo in restore result');
        return false;
      }
      
      const { customerInfo } = result;
      const hasActiveSubscription = customerInfo.activeSubscriptions?.length > 0;
      
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

      // Construir objeto de actualización sin campos undefined
      const subscriptionUpdate: any = {
        ...currentOrg.subscription,
        plan: subscriptionInfo.plan,
        status: subscriptionInfo.status,
        limits: SUBSCRIPTION_LIMITS[subscriptionInfo.plan],
      };

      // Solo agregar endDate si existe
      if (subscriptionInfo.currentPeriodEnd) {
        subscriptionUpdate.endDate = subscriptionInfo.currentPeriodEnd;
      } else {
        // Si no hay endDate, eliminar el campo si existía antes
        delete subscriptionUpdate.endDate;
      }

      console.log('🔄 Sincronizando suscripción:', {
        plan: subscriptionInfo.plan,
        status: subscriptionInfo.status,
        hasEndDate: !!subscriptionInfo.currentPeriodEnd,
      });

      // Actualizar organización con nueva información de suscripción
      await organizationService.updateOrganization(currentOrg.id, {
        subscription: subscriptionUpdate
      });

      console.log('✅ Suscripción sincronizada con la organización');
    } catch (error) {
      console.error('Error sincronizando suscripción:', error);
      throw error; // Re-lanzar para que el hook pueda manejarlo
    }
  }

  /**
   * Mapea un identificador de RevenueCat a nuestro enum de planes
   * Ahora diferencia entre mensual, trimestral y anual
   */
  private mapRevenueCatToPlan(productIdentifier: string): SubscriptionPlan {
    if (!productIdentifier) {
      console.warn('⚠️ productIdentifier vacío o undefined');
      return SubscriptionPlan.FREE;
    }

    const identifier = productIdentifier.toLowerCase();
    
    console.log('🔍 Mapeando plan desde productIdentifier:', {
      original: productIdentifier,
      lowercased: identifier,
    });

    // Mapeo más específico primero (orden importante para evitar falsos positivos)
    if (identifier.includes('enterprise')) {
      console.log('✅ Mapeado a ENTERPRISE');
      return SubscriptionPlan.ENTERPRISE;
    }
    if (identifier.includes('pro') && !identifier.includes('enterprise')) {
      console.log('✅ Mapeado a PRO');
      return SubscriptionPlan.PRO;
    }
    if (identifier.includes('basic')) {
      console.log('✅ Mapeado a BASIC');
      return SubscriptionPlan.BASIC;
    }
    
    console.warn('⚠️ No se pudo mapear productIdentifier:', productIdentifier);
    return SubscriptionPlan.FREE;
  }

  /**
   * Obtiene el tipo de período de suscripción (mensual, trimestral, anual)
   */
  private getSubscriptionPeriod(productIdentifier: string): 'monthly' | 'quarterly' | 'annual' | 'unknown' {
    if (!productIdentifier) return 'unknown';
    
    const identifier = productIdentifier.toLowerCase();
    
    if (identifier.includes('monthly') || identifier.includes('mensual')) {
      return 'monthly';
    }
    if (identifier.includes('trimestral') || identifier.includes('quarterly')) {
      return 'quarterly';
    }
    if (identifier.includes('annual') || identifier.includes('yearly')) {
      return 'annual';
    }
    
    return 'unknown';
  }

  /**
   * Cancela la suscripción actual (para pruebas)
   */
  async cancelCurrentSubscription(): Promise<boolean> {
    try {
      console.log('🚫 Cancelando suscripción actual...');
      
      // En ambiente de prueba, no podemos cancelar directamente
      // Pero podemos simular el estado cancelado actualizando Firestore
      const currentOrg = await organizationService.getCurrentOrganization();
      
      if (!currentOrg) {
        throw new Error('No hay organización actual');
      }

      // Actualizar organización a plan FREE
      await organizationService.updateOrganization(currentOrg.id, {
        subscription: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.INACTIVE,
          limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE],
          endDate: new Date(), // Fecha actual como fin
        }
      });

      console.log('✅ Suscripción cancelada (simulado para pruebas)');
      return true;
    } catch (error) {
      console.error('❌ Error cancelando suscripción:', error);
      return false;
    }
  }

  /**
   * Fuerza la actualización del CustomerInfo desde RevenueCat
   */
  async refreshCustomerInfo(): Promise<CustomerInfo> {
    try {
      console.log('🔄 Forzando actualización de CustomerInfo...');
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('✅ CustomerInfo actualizado:', {
        allPurchasedProductIds: customerInfo.allPurchasedProductIds || [],
        activeSubscriptions: customerInfo.activeSubscriptions || [],
        activeEntitlements: Object.keys(customerInfo.entitlements?.active || {}),
      });
      return customerInfo;
    } catch (error) {
      console.error('❌ Error actualizando CustomerInfo:', error);
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;


