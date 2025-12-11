/**
 * Utilidades centralizadas para Farms
 * Single Source of Truth para funciones relacionadas con farms
 */

import { Ionicons } from '@expo/vector-icons';
import { SubscriptionPlan } from '../types/subscription';

/**
 * Obtiene el color del plan de suscripción
 * Single Source of Truth para colores de planes
 */
export const getPlanColor = (plan: SubscriptionPlan, colors?: any): string => {
  // Si no se pasan colores, usar valores por defecto
  const defaultColors = {
    primary: {
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      700: '#1D4ED8',
    },
  };

  const themeColors = colors || defaultColors;

  switch (plan) {
    case SubscriptionPlan.FREE:
      return '#6B7280';
    case SubscriptionPlan.BASIC:
      return themeColors.primary?.[400] || '#60A5FA';
    case SubscriptionPlan.PRO:
      return themeColors.primary?.[500] || '#3B82F6';
    case SubscriptionPlan.ENTERPRISE:
      return '#8B5CF6';
    default:
      return themeColors.primary?.[400] || '#60A5FA';
  }
};

/**
 * Obtiene el icono del plan de suscripción
 * Single Source of Truth para iconos de planes
 */
export const getPlanIcon = (plan: SubscriptionPlan): keyof typeof Ionicons.glyphMap => {
  switch (plan) {
    case SubscriptionPlan.FREE:
      return 'star-outline';
    case SubscriptionPlan.BASIC:
      return 'star-outline';
    case SubscriptionPlan.PRO:
      return 'star';
    case SubscriptionPlan.ENTERPRISE:
      return 'diamond';
    default:
      return 'star-outline';
  }
};

