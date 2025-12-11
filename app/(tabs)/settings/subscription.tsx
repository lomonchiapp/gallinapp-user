/**
 * Página de gestión de suscripción
 * Muestra detalles del plan, uso de límites, métodos de pago y permite cambiar/cancelar plan
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { SubscriptionSuccessSheet } from '../../../src/components/ui/SubscriptionSuccessSheet';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';
import { useSubscription } from '../../../src/hooks/useSubscription';
import { useFarmStore } from '../../../src/stores/farmStore';
import { useMultiTenantAuthStore } from '../../../src/stores/multiTenantAuthStore';
import { SubscriptionPlan, SubscriptionStatus } from '../../../src/types/organization';
import {
    SUBSCRIPTION_LIMITS,
    SubscriptionPlan as SubscriptionPlanLimits
} from '../../../src/types/subscription';

export default function SubscriptionScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useMultiTenantAuthStore();
  const { farms } = useFarmStore();
  const {
    subscriptionInfo,
    isLoading,
    purchaseSubscription,
    cancelSubscription,
    restorePurchases,
    refreshSubscription,
    presentPaywall,
    checkEntitlement,
    cancelCurrentSubscription,
    isPremium,
    isActive,
    daysUntilExpiration,
  } = useSubscription();

  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Cargar info al montar
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  // Información de planes
  const PLAN_INFO = {
    [SubscriptionPlan.FREE]: {
      name: 'Gratuito',
      price: '$0',
      period: '',
      color: colors.neutral[500],
      description: 'Perfecto para empezar',
    },
    [SubscriptionPlan.BASIC]: {
      name: 'Básico',
      price: '$19.99',
      period: '/mes',
      color: colors.primary[500],
      description: 'Para granjas pequeñas',
    },
    [SubscriptionPlan.PRO]: {
      name: 'Profesional',
      price: '$49.99',
      period: '/mes',
      color: colors.info[500],
      description: 'Para granjas medianas',
    },
    [SubscriptionPlan.ENTERPRISE]: {
      name: 'Empresarial',
      price: '$99.99',
      period: '/mes',
      color: colors.warning[500],
      description: 'Para granjas grandes',
    },
  };

  const STATUS_INFO = {
    [SubscriptionStatus.ACTIVE]: {
      label: 'Activa',
      color: colors.success[500],
      icon: 'checkmark-circle' as const,
    },
    [SubscriptionStatus.INACTIVE]: {
      label: 'Inactiva',
      color: colors.neutral[500],
      icon: 'pause-circle' as const,
    },
    [SubscriptionStatus.CANCELLED]: {
      label: 'Cancelada',
      color: colors.error[500],
      icon: 'close-circle' as const,
    },
    [SubscriptionStatus.PAST_DUE]: {
      label: 'Vencida',
      color: colors.warning[500],
      icon: 'warning' as const,
    },
    [SubscriptionStatus.TRIALING]: {
      label: 'Prueba',
      color: colors.info[500],
      icon: 'time' as const,
    },
  };

  // Calcular uso actual
  const currentUsage = {
    lotes: farms.length,
    collaborators: 1, // TODO: calcular desde el store
    storage: 0, // TODO: implementar
    transactions: 0, // TODO: implementar
  };

  const currentPlan = subscriptionInfo?.plan || SubscriptionPlan.FREE;
  const currentStatus = subscriptionInfo?.status || SubscriptionStatus.INACTIVE;
  
  // Mapear plan de organization.ts a subscription.ts para acceder a los límites
  const planKeyMap: Record<string, SubscriptionPlanLimits> = {
    'free': SubscriptionPlanLimits.FREE,
    'basic': SubscriptionPlanLimits.BASIC,
    'pro': SubscriptionPlanLimits.PRO,
    'enterprise': SubscriptionPlanLimits.ENTERPRISE,
  };
  
  const limitsKey = planKeyMap[currentPlan] || SubscriptionPlanLimits.FREE;
  const limits = SUBSCRIPTION_LIMITS[limitsKey];

  // Handlers
  const handleChangePlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPlanSelector(true);
  };

  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [successSheetData, setSuccessSheetData] = useState<{
    newPlan: SubscriptionPlan;
    previousPlan?: SubscriptionPlan;
  } | null>(null);

  /**
   * Muestra el paywall de RevenueCat
   */
  const handleShowPaywall = async () => {
    setIsPurchasing(true);
    
    try {
      const result = await presentPaywall();
      
      if (result.success && result.newPlan) {
        // Solo mostrar sheet si el plan realmente cambió y no es FREE
        if (result.newPlan !== SubscriptionPlan.FREE && result.newPlan !== result.previousPlan) {
          // Mostrar sheet de bienvenida con el nuevo plan
          setSuccessSheetData({
            newPlan: result.newPlan,
            previousPlan: result.previousPlan,
          });
          setShowSuccessSheet(true);
        } else if (result.newPlan === SubscriptionPlan.FREE) {
          // Si el plan sigue siendo FREE después de comprar, mostrar mensaje con opción de verificar
          Alert.alert(
            'Procesando compra',
            'Tu compra está siendo procesada. Esto puede tardar unos momentos. ¿Deseas verificar ahora?',
            [
              { text: 'Más tarde', style: 'cancel' },
              {
                text: 'Verificar ahora',
                onPress: async () => {
                  try {
                    setIsPurchasing(true);
                    // Intentar restaurar compras para forzar actualización
                    const restored = await restorePurchases();
                    if (restored) {
                      await refreshSubscription();
                      Alert.alert(
                        '¡Compra encontrada!',
                        'Tu compra ha sido restaurada exitosamente. Tu plan debería actualizarse ahora.',
                        [{ text: 'Entendido' }]
                      );
                    } else {
                      Alert.alert(
                        'Aún procesando',
                        'Tu compra aún se está procesando. Por favor, espera unos minutos y vuelve a intentar, o cierra y reabre la app.',
                        [{ text: 'Entendido' }]
                      );
                    }
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'No se pudo verificar la compra');
                  } finally {
                    setIsPurchasing(false);
                  }
                },
              },
            ]
          );
        }
        // Recargar información
        await refreshSubscription();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar la suscripción');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!selectedPlan) return;

    if (selectedPlan === SubscriptionPlan.FREE) {
      Alert.alert(
        'Cambiar a Plan Gratuito',
        '¿Estás seguro de que deseas cambiar al plan gratuito? Perderás acceso a las características premium.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelSubscription();
                setShowPlanSelector(false);
                Alert.alert('Éxito', 'Se ha cancelado tu suscripción. Tendrás acceso hasta el final del período pagado.');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'No se pudo cancelar la suscripción');
              }
            },
          },
        ]
      );
      return;
    }

    // Cerrar modal y mostrar paywall de RevenueCat
    setShowPlanSelector(false);
    await handleShowPaywall();
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro de que deseas cancelar tu suscripción? Mantendrás el acceso hasta el final del período actual.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert('Suscripción Cancelada', 'Tu suscripción será cancelada al final del período actual.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo cancelar la suscripción');
            }
          },
        },
      ]
    );
  };

  const handleRestorePurchases = async () => {
    try {
      setIsPurchasing(true);
      const success = await restorePurchases();
      
      if (success) {
        Alert.alert('Compras Restauradas', 'Tus compras han sido restauradas exitosamente.');
      } else {
        Alert.alert('Sin Compras', 'No se encontraron compras anteriores para restaurar.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron restaurar las compras');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelForTesting = () => {
    Alert.alert(
      '🚫 Cancelar Suscripción',
      '⚠️ Esta función es solo para pruebas. ¿Deseas resetear tu suscripción al plan gratuito?',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsPurchasing(true);
              const success = await cancelCurrentSubscription();
              
              if (success) {
                Alert.alert(
                  '✅ Suscripción Cancelada',
                  'Tu suscripción ha sido cancelada. Ahora tienes el plan gratuito.',
                  [{ text: 'Entendido' }]
                );
                await refreshSubscription();
              } else {
                Alert.alert('Error', 'No se pudo cancelar la suscripción');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error cancelando suscripción');
            } finally {
              setIsPurchasing(false);
            }
          },
        },
      ]
    );
  };

  // Renderizar límite individual
  const renderLimit = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    current: number,
    limit: number,
    unit: string = ''
  ) => {
    const percentage = limit === -1 ? 100 : Math.min((current / limit) * 100, 100);
    const isNearLimit = percentage >= 80 && percentage < 100;
    const isOverLimit = percentage >= 100;
    const isUnlimited = limit === -1;

    return (
      <View key={label} style={styles.limitItem}>
        <View style={styles.limitHeader}>
          <View style={styles.limitLabelContainer}>
            <View style={[styles.limitIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name={icon} size={18} color={colors.primary[500]} />
            </View>
            <Text style={[styles.limitLabel, { color: colors.text.primary }]}>
              {label}
            </Text>
          </View>
          <Text
            style={[
              styles.limitValue,
              {
                color: isOverLimit
                  ? colors.error[500]
                  : isNearLimit
                  ? colors.warning[500]
                  : colors.text.secondary,
              },
            ]}
          >
            {current} {unit} / {isUnlimited ? '∞' : `${limit} ${unit}`}
          </Text>
        </View>
        {!isUnlimited && (
          <View style={[styles.progressBar, { backgroundColor: colors.neutral[200] }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: isOverLimit
                    ? colors.error[500]
                    : isNearLimit
                    ? colors.warning[500]
                    : colors.primary[500],
                },
              ]}
            />
          </View>
        )}
      </View>
    );
  };

  // Renderizar tarjeta de plan en el selector
  const renderPlanCard = (plan: SubscriptionPlan) => {
    const info = PLAN_INFO[plan];
    const planLimitsKey = planKeyMap[plan] || 'FREE';
    const planLimits = SUBSCRIPTION_LIMITS[planLimitsKey];
    const isCurrentPlan = plan === currentPlan;
    const isSelected = plan === selectedPlan;

    return (
      <TouchableOpacity
        key={plan}
        style={[
          styles.planSelectorCard,
          {
            backgroundColor: colors.background.secondary,
            borderColor: isSelected ? info.color : colors.border.light,
            borderWidth: isSelected ? 2 : 1,
          },
          isCurrentPlan && { opacity: 0.7 },
        ]}
        onPress={() => !isCurrentPlan && setSelectedPlan(plan)}
        disabled={isCurrentPlan}
        activeOpacity={0.7}
      >
        {isCurrentPlan && (
          <View style={[styles.currentPlanBadge, { backgroundColor: colors.success[500] }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.text.inverse} />
            <Text style={[styles.currentPlanText, { color: colors.text.inverse }]}>
              Plan Actual
            </Text>
          </View>
        )}

        <View style={styles.planSelectorHeader}>
          <Text style={[styles.planSelectorName, { color: colors.text.primary }]}>
            {info.name}
          </Text>
          <View style={styles.planSelectorPriceContainer}>
            <Text style={[styles.planSelectorPrice, { color: info.color }]}>
              {info.price}
            </Text>
            {info.period && (
              <Text style={[styles.planSelectorPeriod, { color: colors.text.secondary }]}>
                {info.period}
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.planSelectorDescription, { color: colors.text.secondary }]}>
          {info.description}
        </Text>

        <View style={styles.planSelectorFeatures}>
          <View style={styles.planFeatureRow}>
            <Ionicons name="layers-outline" size={16} color={colors.text.secondary} />
            <Text style={[styles.planFeatureText, { color: colors.text.secondary }]}>
              {planLimits.maxLotes === -1 ? 'Lotes ilimitados' : `Hasta ${planLimits.maxLotes} lotes`}
            </Text>
          </View>
          <View style={styles.planFeatureRow}>
            <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
            <Text style={[styles.planFeatureText, { color: colors.text.secondary }]}>
              {planLimits.maxCollaborators === -1
                ? 'Colaboradores ilimitados'
                : `Hasta ${planLimits.maxCollaborators} colaboradores`}
            </Text>
          </View>
          <View style={styles.planFeatureRow}>
            <Ionicons
              name={planLimits.features.analytics ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={planLimits.features.analytics ? colors.success[500] : colors.neutral[300]}
            />
            <Text
              style={[
                styles.planFeatureText,
                {
                  color: planLimits.features.analytics
                    ? colors.text.secondary
                    : colors.neutral[400],
                },
              ]}
            >
              Analytics avanzados
            </Text>
          </View>
          <View style={styles.planFeatureRow}>
            <Ionicons
              name={planLimits.features.apiAccess ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={planLimits.features.apiAccess ? colors.success[500] : colors.neutral[300]}
            />
            <Text
              style={[
                styles.planFeatureText,
                {
                  color: planLimits.features.apiAccess
                    ? colors.text.secondary
                    : colors.neutral[400],
                },
              ]}
            >
              Acceso API
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && !subscriptionInfo) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AppHeader
            variant="fixed"
            showBack={true}
            onBackPress={() => router.back()}
            title1="Suscripción"
            subtitle="Gestiona tu plan"
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
              Cargando información de suscripción...
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper transitionType="fade">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        
        <AppHeader
          variant="fixed"
          showBack={true}
          onBackPress={() => router.back()}
          title1="Suscripción"
          subtitle="Gestiona tu plan y pagos"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Card: Plan Actual */}
          <Card style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <View>
                <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                  Plan Actual
                </Text>
                <View style={styles.planNameContainer}>
                  <Text style={[styles.currentPlanName, { color: colors.text.primary }]}>
                    {PLAN_INFO[currentPlan].name}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${STATUS_INFO[currentStatus].color}20` },
                    ]}
                  >
                    <Ionicons
                      name={STATUS_INFO[currentStatus].icon}
                      size={14}
                      color={STATUS_INFO[currentStatus].color}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: STATUS_INFO[currentStatus].color },
                      ]}
                    >
                      {STATUS_INFO[currentStatus].label}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.planDescription, { color: colors.text.secondary }]}>
                  {PLAN_INFO[currentPlan].description}
                </Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceAmount, { color: PLAN_INFO[currentPlan].color }]}>
                  {PLAN_INFO[currentPlan].price}
                </Text>
                {PLAN_INFO[currentPlan].period && (
                  <Text style={[styles.pricePeriod, { color: colors.text.secondary }]}>
                    {PLAN_INFO[currentPlan].period}
                  </Text>
                )}
              </View>
            </View>

            {/* Información de renovación */}
            {subscriptionInfo?.currentPeriodEnd && (
              <View
                style={[
                  styles.renewalInfo,
                  { backgroundColor: colors.background.primary },
                ]}
              >
                <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                <Text style={[styles.renewalText, { color: colors.text.secondary }]}>
                  {subscriptionInfo.cancelAtPeriodEnd
                    ? 'Expira el '
                    : 'Se renueva el '}
                  {subscriptionInfo.currentPeriodEnd.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                {daysUntilExpiration !== null && (
                  <View
                    style={[
                      styles.daysRemainingBadge,
                      {
                        backgroundColor:
                          daysUntilExpiration <= 7
                            ? colors.error[50]
                            : colors.primary[50],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysRemainingText,
                        {
                          color:
                            daysUntilExpiration <= 7
                              ? colors.error[500]
                              : colors.primary[500],
                        },
                      ]}
                    >
                      {daysUntilExpiration} días
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.actionButtonsContainer}>
              {currentPlan !== SubscriptionPlan.ENTERPRISE && (
                <Button
                  title="Mejorar Plan"
                  onPress={handleShowPaywall}
                  variant="primary"
                  style={styles.actionButton}
                  loading={isPurchasing}
                />
              )}
              {currentPlan !== SubscriptionPlan.FREE && !subscriptionInfo?.cancelAtPeriodEnd && (
                <Button
                  title="Cambiar Plan"
                  onPress={handleShowPaywall}
                  variant="outline"
                  style={styles.actionButton}
                  loading={isPurchasing}
                />
              )}
            </View>
          </Card>

          {/* Card: Uso y Límites */}
          <Card style={styles.limitsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="speedometer-outline" size={24} color={colors.primary[500]} />
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Uso del Plan
              </Text>
            </View>

            <View style={styles.limitsContainer}>
              {renderLimit('layers-outline', 'Lotes', currentUsage.lotes, limits.maxLotes, '')}
              {renderLimit(
                'people-outline',
                'Colaboradores',
                currentUsage.collaborators,
                limits.maxCollaborators,
                ''
              )}
              {renderLimit(
                'cloud-outline',
                'Almacenamiento',
                currentUsage.storage,
                limits.maxStorage,
                'GB'
              )}
              {renderLimit(
                'receipt-outline',
                'Transacciones',
                currentUsage.transactions,
                limits.maxTransactions,
                ''
              )}
            </View>
          </Card>

          {/* Card: Características del Plan */}
          <Card style={styles.featuresCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-outline" size={24} color={colors.primary[500]} />
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Características
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              {Object.entries(limits.features).map(([feature, included]) => {
                const featureNames: Record<string, string> = {
                  analytics: 'Analytics Avanzados',
                  exports: 'Exportación de Datos',
                  apiAccess: 'Acceso API',
                  customReports: 'Reportes Personalizados',
                  multiLocation: 'Múltiples Ubicaciones',
                  integrations: 'Integraciones',
                  advancedAlerts: 'Alertas Avanzadas',
                };

                return (
                  <View key={feature} style={styles.featureItem}>
                    <Ionicons
                      name={included ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={included ? colors.success[500] : colors.neutral[300]}
                    />
                    <Text
                      style={[
                        styles.featureText,
                        {
                          color: included ? colors.text.primary : colors.neutral[400],
                          textDecorationLine: included ? 'none' : 'line-through',
                        },
                      ]}
                    >
                      {featureNames[feature] || feature}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Card: Gestión de Pagos */}
          <Card style={styles.paymentCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="card-outline" size={24} color={colors.primary[500]} />
              <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
                Gestión de Pagos
              </Text>
            </View>

            <View style={styles.paymentInfoContainer}>
              <Ionicons 
                name={currentPlan === SubscriptionPlan.FREE ? "information-circle-outline" : "shield-checkmark-outline"} 
                size={48} 
                color={colors.primary[500]} 
                style={styles.paymentIcon}
              />
              <Text style={[styles.paymentInfoTitle, { color: colors.text.primary }]}>
                {currentPlan === SubscriptionPlan.FREE 
                  ? 'No requiere método de pago'
                  : 'Pago seguro a través de tu tienda'
                }
              </Text>
              <Text style={[styles.paymentInfoDescription, { color: colors.text.secondary }]}>
                {currentPlan === SubscriptionPlan.FREE 
                  ? 'El plan gratuito no requiere información de pago'
                  : 'Los pagos se procesan de forma segura a través de App Store o Google Play. Puedes gestionar tu método de pago desde la configuración de tu cuenta.'
                }
              </Text>
            </View>

            {currentPlan !== SubscriptionPlan.FREE && (
              <View style={styles.paymentActionsContainer}>
                <TouchableOpacity
                  style={[styles.paymentActionButton, { borderColor: colors.border.light }]}
                  onPress={() => {
                    Alert.alert(
                      'Gestionar Método de Pago',
                      `Para actualizar tu método de pago, ve a:\n\n${
                        Platform.OS === 'ios' 
                          ? '• Configuración de iOS\n• Tu nombre\n• Suscripciones\n• Gallinapp'
                          : '• Google Play Store\n• Menú\n• Suscripciones\n• Gallinapp'
                      }`,
                      [{ text: 'Entendido', style: 'default' }]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="card" size={20} color={colors.text.primary} />
                  <Text style={[styles.paymentActionText, { color: colors.text.primary }]}>
                    Actualizar método de pago
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.text.secondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentActionButton, { borderColor: colors.border.light }]}
                  onPress={() => {
                    Alert.alert(
                      'Ver Historial de Compras',
                      `Para ver tu historial de compras y facturas, ve a:\n\n${
                        Platform.OS === 'ios' 
                          ? '• Configuración de iOS\n• Tu nombre\n• Compras\n• Ver historial'
                          : '• Google Play Store\n• Menú\n• Historial de pedidos'
                      }`,
                      [{ text: 'Entendido', style: 'default' }]
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="receipt-outline" size={20} color={colors.text.primary} />
                  <Text style={[styles.paymentActionText, { color: colors.text.primary }]}>
                    Ver historial de compras
                  </Text>
                  <Ionicons name="open-outline" size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Card: Opciones Adicionales */}
          <Card style={styles.optionsCard}>
            <Button
              title="Restaurar Compras"
              onPress={handleRestorePurchases}
              variant="outline"
              style={styles.optionButton}
              loading={isPurchasing}
            />

            {/* Botón para cancelar suscripción (solo para pruebas en modo oscuro) */}
            {isDark && (
              <Button
                title="🚫 Cancelar Suscripción (Pruebas)"
                onPress={handleCancelForTesting}
                variant="outline"
                style={[styles.optionButton, { borderColor: colors.error[500], marginTop: spacing[2] }]}
                loading={isPurchasing}
              />
            )}

            {currentPlan !== SubscriptionPlan.FREE && !subscriptionInfo?.cancelAtPeriodEnd && (
              <Button
                title="Cancelar Suscripción"
                onPress={handleCancelSubscription}
                variant="danger"
                style={styles.optionButton}
              />
            )}

            {subscriptionInfo?.cancelAtPeriodEnd && (
              <View
                style={[
                  styles.cancelledNotice,
                  { backgroundColor: colors.warning[50] },
                ]}
              >
                <Ionicons name="warning" size={20} color={colors.warning[500]} />
                <Text style={[styles.cancelledNoticeText, { color: colors.warning[500] }]}>
                  Tu suscripción está programada para cancelarse el{' '}
                  {subscriptionInfo.currentPeriodEnd?.toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
          </Card>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Modal: Selector de Plan */}
        <Modal
          visible={showPlanSelector}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPlanSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Seleccionar Plan
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPlanSelector(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {Object.values(SubscriptionPlan).map(renderPlanCard)}
              </ScrollView>

              <View style={[styles.modalFooter, { borderTopColor: colors.border.light }]}>
                <Button
                  title="Cancelar"
                  onPress={() => setShowPlanSelector(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title={isPurchasing ? 'Procesando...' : 'Confirmar Cambio'}
                  onPress={handleConfirmPlanChange}
                  variant="primary"
                  style={styles.modalButton}
                  loading={isPurchasing}
                  disabled={!selectedPlan || selectedPlan === currentPlan || isPurchasing}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Sheet de bienvenida después de compra exitosa */}
        {successSheetData && (
          <SubscriptionSuccessSheet
            visible={showSuccessSheet}
            onClose={() => {
              setShowSuccessSheet(false);
              setSuccessSheetData(null);
            }}
            newPlan={successSheetData.newPlan}
            previousPlan={successSheetData.previousPlan}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  loadingText: {
    marginTop: spacing[4],
    fontSize: typography.sizes.base,
  },

  // Current Plan Card
  currentPlanCard: {
    marginBottom: spacing[4],
    padding: spacing[5],
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  currentPlanName: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold as '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as '600',
  },
  planDescription: {
    fontSize: typography.sizes.base,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold as '700',
  },
  pricePeriod: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  renewalText: {
    flex: 1,
    fontSize: typography.sizes.sm,
  },
  daysRemainingBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  daysRemainingText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },

  // Limits Card
  limitsCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  limitsContainer: {
    gap: spacing[4],
  },
  limitItem: {
    gap: spacing[2],
  },
  limitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  limitIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
  },
  limitValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  progressBar: {
    height: 6,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Features Card
  featuresCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  featuresGrid: {
    gap: spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  featureText: {
    fontSize: typography.sizes.base,
  },

  // Payment Card
  paymentCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  paymentInfoContainer: {
    alignItems: 'center',
    padding: spacing[4],
  },
  paymentIcon: {
    marginBottom: spacing[3],
  },
  paymentInfoTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as '600',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  paymentInfoDescription: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  paymentActionsContainer: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  paymentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[2],
  },
  paymentActionText: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
  },

  // Options Card
  optionsCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
    gap: spacing[2],
  },
  optionButton: {
    width: '100%',
  },
  cancelledNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[2],
  },
  cancelledNoticeText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.normal * typography.sizes.sm,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
  },
  modalCloseButton: {
    padding: spacing[2],
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalScrollContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  planSelectorCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  currentPlanBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  currentPlanText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as '600',
  },
  planSelectorHeader: {
    marginBottom: spacing[2],
  },
  planSelectorName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[2],
  },
  planSelectorPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
  },
  planSelectorPrice: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
  },
  planSelectorPeriod: {
    fontSize: typography.sizes.base,
  },
  planSelectorDescription: {
    fontSize: typography.sizes.base,
    marginBottom: spacing[3],
  },
  planSelectorFeatures: {
    gap: spacing[2],
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  planFeatureText: {
    fontSize: typography.sizes.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[2],
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
  },

  bottomSpacing: {
    height: spacing[4],
  },
});

