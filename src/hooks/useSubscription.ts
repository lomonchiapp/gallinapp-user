/**
 * Hook para gestión de suscripciones
 */

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '../services/subscription.service';
import { useMultiTenantAuthStore } from '../stores/multiTenantAuthStore';
import { SubscriptionPlan, SubscriptionStatus } from '../types/organization';

interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}

interface PresentPaywallResult {
  success: boolean;
  previousPlan?: SubscriptionPlan;
  newPlan?: SubscriptionPlan;
}

interface UseSubscriptionReturn {
  // Estado
  subscriptionInfo: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  purchaseSubscription: (plan: SubscriptionPlan) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  presentPaywall: () => Promise<PresentPaywallResult>;
  cancelCurrentSubscription: () => Promise<boolean>;
  
  // Verificadores
  hasFeatureAccess: (feature: string) => Promise<boolean>;
  checkEntitlement: () => Promise<boolean>;
  checkUsageLimit: (resource: 'lotes' | 'users' | 'transactions', currentUsage: number) => Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
  }>;
  
  // Utilidades
  isPremium: boolean;
  isActive: boolean;
  daysUntilExpiration: number | null;
  canUpgrade: boolean;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useMultiTenantAuthStore();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicializa el servicio de suscripción
   */
  const initializeService = useCallback(async () => {
    if (!user) return;

    try {
      await subscriptionService.initialize(user.uid);
      await loadSubscriptionInfo();
    } catch (err: any) {
      console.error('Error inicializando servicio de suscripción:', err);
      setError(err.message || 'Error inicializando suscripciones');
      // Si falla, establecer plan FREE por defecto
      setSubscriptionInfo({
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.INACTIVE,
      });
    }
  }, [user]);

  /**
   * Carga información de suscripción actual desde RevenueCat
   */
  const loadSubscriptionInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const info = await subscriptionService.getSubscriptionInfo();
      setSubscriptionInfo(info);
      console.log('✅ Suscripción cargada:', info);
    } catch (err: any) {
      console.error('Error cargando información de suscripción:', err);
      setError(err.message || 'Error cargando suscripción');
      // Si hay error, asumir plan gratuito
      setSubscriptionInfo({
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.INACTIVE,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Compra una suscripción (deprecado - usar presentPaywall)
   */
  const purchaseSubscription = useCallback(async (plan: SubscriptionPlan): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await subscriptionService.purchaseSubscription(plan);
      
      if (success) {
        await loadSubscriptionInfo();
      }
      
      return success;
    } catch (err: any) {
      console.error('Error comprando suscripción:', err);
      setError(err.message || 'Error en la compra');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSubscriptionInfo]);

  /**
   * Cancela suscripción
   */
  const cancelSubscription = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      await subscriptionService.cancelSubscription();
      // La cancelación real se hace desde la tienda
    } catch (err: any) {
      console.error('Error cancelando suscripción:', err);
      setError(err.message || 'Error cancelando suscripción');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Restaura compras
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await subscriptionService.restorePurchases();
      
      if (success) {
        await loadSubscriptionInfo();
      }
      
      return success;
    } catch (err: any) {
      console.error('Error restaurando compras:', err);
      setError(err.message || 'Error restaurando compras');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSubscriptionInfo]);

  /**
   * Refresca información de suscripción
   */
  const refreshSubscription = useCallback(async (): Promise<void> => {
    await loadSubscriptionInfo();
  }, [loadSubscriptionInfo]);

  /**
   * Presenta el paywall de RevenueCat
   * Retorna el plan anterior y el nuevo plan si hubo cambio
   */
  const presentPaywall = useCallback(async (): Promise<{
    success: boolean;
    previousPlan?: SubscriptionPlan;
    newPlan?: SubscriptionPlan;
  }> => {
    try {
      setIsLoading(true);
      
      // Guardar plan anterior antes de comprar
      const previousPlan = subscriptionInfo?.plan;
      
      const success = await subscriptionService.presentPaywall();
      
      if (success) {
        // Forzar actualización de CustomerInfo inmediatamente
        console.log('🔄 Forzando actualización de CustomerInfo...');
        try {
          await subscriptionService.refreshCustomerInfo();
        } catch (error) {
          console.warn('⚠️ No se pudo forzar actualización:', error);
        }
        
        // Esperar un momento para que RevenueCat procese la compra
        console.log('⏳ Esperando procesamiento de RevenueCat...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recargar información después de compra exitosa
        console.log('🔄 Recargando información de suscripción (intento 1)...');
        await loadSubscriptionInfo();
        
        // Obtener el nuevo plan directamente del servicio
        let updatedInfo = await subscriptionService.getSubscriptionInfo();
        
        // Si el plan sigue siendo FREE, intentar más veces con polling
        let attempts = 0;
        const maxAttempts = 3;
        
        while (updatedInfo.plan === SubscriptionPlan.FREE && attempts < maxAttempts && previousPlan === SubscriptionPlan.FREE) {
          attempts++;
          console.log(`🔄 Intento ${attempts}/${maxAttempts}: Plan aún es FREE, esperando más tiempo...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Forzar actualización nuevamente
          try {
            await subscriptionService.refreshCustomerInfo();
          } catch (error) {
            console.warn('⚠️ Error en actualización forzada:', error);
          }
          
          await loadSubscriptionInfo();
          updatedInfo = await subscriptionService.getSubscriptionInfo();
        }
        
        console.log('✅ Plan detectado después de compra:', {
          previousPlan,
          newPlan: updatedInfo.plan,
          status: updatedInfo.status,
          attempts,
        });
        
        return {
          success: true,
          previousPlan,
          newPlan: updatedInfo.plan,
        };
      }
      
      return { success: false };
    } catch (err: any) {
      console.error('Error presentando paywall:', err);
      setError(err.message || 'Error mostrando opciones de suscripción');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [loadSubscriptionInfo, subscriptionInfo]);

  /**
   * Verifica si el usuario tiene el entitlement activo
   */
  const checkEntitlement = useCallback(async (): Promise<boolean> => {
    try {
      return await subscriptionService.checkEntitlement();
    } catch (err) {
      console.error('Error verificando entitlement:', err);
      return false;
    }
  }, []);

  /**
   * Verifica acceso a características
   */
  const hasFeatureAccess = useCallback(async (feature: string): Promise<boolean> => {
    try {
      return await subscriptionService.hasFeatureAccess(feature);
    } catch (err) {
      console.error('Error verificando acceso a característica:', err);
      return false;
    }
  }, []);

  /**
   * Verifica límites de uso
   */
  const checkUsageLimit = useCallback(async (
    resource: 'lotes' | 'users' | 'transactions', 
    currentUsage: number
  ) => {
    try {
      return await subscriptionService.checkUsageLimit(resource, currentUsage);
    } catch (err) {
      console.error('Error verificando límites:', err);
      return { allowed: true, limit: -1, remaining: -1 };
    }
  }, []);

  // Inicializar cuando el usuario cambie
  useEffect(() => {
    if (user) {
      initializeService();
    } else {
      setSubscriptionInfo(null);
      setError(null);
    }
  }, [user, initializeService]);

  // Valores computados
  const isPremium = subscriptionInfo?.plan !== SubscriptionPlan.FREE;
  const isActive = subscriptionInfo?.status === SubscriptionStatus.ACTIVE;
  
  const daysUntilExpiration = subscriptionInfo?.currentPeriodEnd 
    ? Math.ceil((subscriptionInfo.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  const canUpgrade = subscriptionInfo?.plan === SubscriptionPlan.FREE || 
                     subscriptionInfo?.plan === SubscriptionPlan.BASIC;

  /**
   * Cancela la suscripción actual (para pruebas)
   */
  const cancelCurrentSubscription = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await subscriptionService.cancelCurrentSubscription();
      
      if (success) {
        // Recargar información
        await loadSubscriptionInfo();
      }
      
      return success;
    } catch (err: any) {
      console.error('Error cancelando suscripción:', err);
      setError(err.message || 'Error cancelando suscripción');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSubscriptionInfo]);

  return {
    // Estado
    subscriptionInfo,
    isLoading,
    error,
    
    // Acciones
    purchaseSubscription,
    cancelSubscription,
    restorePurchases,
    refreshSubscription,
    presentPaywall,
    cancelCurrentSubscription,
    
    // Verificadores
    hasFeatureAccess,
    checkEntitlement,
    checkUsageLimit,
    
    // Utilidades
    isPremium,
    isActive,
    daysUntilExpiration,
    canUpgrade,
  };
};


