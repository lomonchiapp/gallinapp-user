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
  
  // Verificadores
  hasFeatureAccess: (feature: string) => Promise<boolean>;
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
    }
  }, [user]);

  /**
   * Carga información de suscripción
   */
  const loadSubscriptionInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const info = await subscriptionService.getSubscriptionInfo();
      setSubscriptionInfo(info);
    } catch (err: any) {
      console.error('Error cargando información de suscripción:', err);
      setError(err.message || 'Error cargando suscripción');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Compra una suscripción
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
      // La cancelación real se hace desde la tienda, solo mostramos instrucciones
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
    
    // Verificadores
    hasFeatureAccess,
    checkUsageLimit,
    
    // Utilidades
    isPremium,
    isActive,
    daysUntilExpiration,
    canUpgrade,
  };
};


