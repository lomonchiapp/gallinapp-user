/**
 * Pantalla de onboarding de planes de suscripción
 * Se muestra después del registro y antes del onboarding de granja
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionPlan } from '../../types/organization';
import { SubscriptionSuccessSheet } from '../ui/SubscriptionSuccessSheet';

interface PlanOnboardingScreenProps {
  onPlanSelected?: () => void;
}

const PLAN_INFO = {
  [SubscriptionPlan.FREE]: {
    name: 'Gratuito',
    price: '$0',
    period: '',
    color: '#6B7280',
    description: 'Perfecto para empezar',
    features: [
      'Hasta 1 granja',
      'Hasta 5 lotes activos',
      'Reportes básicos',
      'Soporte por email',
    ],
  },
  [SubscriptionPlan.BASIC]: {
    name: 'Básico',
    price: '$19.99',
    period: '/mes',
    color: '#3B82F6',
    description: 'Para granjas pequeñas',
    features: [
      'Hasta 3 granjas',
      'Lotes ilimitados',
      'Reportes avanzados',
      'Soporte prioritario',
      'Exportación de datos',
    ],
  },
  [SubscriptionPlan.PRO]: {
    name: 'Profesional',
    price: '$49.99',
    period: '/mes',
    color: '#06B6D4',
    description: 'Para granjas medianas',
    features: [
      'Granjas ilimitadas',
      'Lotes ilimitados',
      'Analytics avanzados',
      'Soporte 24/7',
      'Integraciones API',
      'Equipos colaborativos',
    ],
  },
  [SubscriptionPlan.ENTERPRISE]: {
    name: 'Empresarial',
    price: '$99.99',
    period: '/mes',
    color: '#F59E0B',
    description: 'Para granjas grandes',
    features: [
      'Todo lo de Pro',
      'Soporte dedicado',
      'Personalización',
      'Onboarding personalizado',
      'SLA garantizado',
    ],
  },
};

export const PlanOnboardingScreen: React.FC<PlanOnboardingScreenProps> = ({
  onPlanSelected,
}) => {
  const { colors, isDark } = useTheme();
  const { user } = useMultiTenantAuthStore();
  const { presentPaywall, isLoading: subscriptionLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [successSheetData, setSuccessSheetData] = useState<{
    newPlan: SubscriptionPlan;
    previousPlan?: SubscriptionPlan;
  } | null>(null);

  // Obtener nombre del usuario
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de pulso para el botón principal
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handleContinue = async () => {
    if (!selectedPlan) {
      Alert.alert('Selecciona un plan', 'Por favor elige un plan para continuar.');
      return;
    }

    // Si es FREE, continuar directamente sin compra
    if (selectedPlan === SubscriptionPlan.FREE) {
      onPlanSelected?.();
      return;
    }

    // Para planes de pago, mostrar paywall de RevenueCat
    try {
      setIsProcessing(true);
      
      const previousPlan = SubscriptionPlan.FREE;
      
      const result = await presentPaywall();
      
      if (result.success && result.newPlan) {
        // Solo mostrar sheet si el plan realmente cambió y no es FREE
        if (result.newPlan !== SubscriptionPlan.FREE && result.newPlan !== previousPlan) {
          setIsProcessing(false);
          
          // Mostrar sheet de bienvenida
          setSuccessSheetData({
            newPlan: result.newPlan,
            previousPlan: previousPlan,
          });
          setShowSuccessSheet(true);
        } else if (result.newPlan === SubscriptionPlan.FREE) {
          // Si el plan sigue siendo FREE después de comprar, mostrar mensaje
          setIsProcessing(false);
          Alert.alert(
            'Procesando compra',
            'Tu compra está siendo procesada. Por favor, espera unos momentos y vuelve a intentar.',
            [{ text: 'Entendido' }]
          );
        } else {
          setIsProcessing(false);
        }
      } else {
        // Usuario canceló o hubo error
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Error en handleContinue:', error);
      setIsProcessing(false);
      Alert.alert(
        'Error',
        error.message || 'No se pudo procesar la compra. Por favor, intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
    }
  };

  const handleSuccessSheetClose = () => {
    setShowSuccessSheet(false);
    setSuccessSheetData(null);
    // Continuar al onboarding de granja
    onPlanSelected?.();
  };

  const handleSkip = () => {
    Alert.alert(
      'Continuar con plan gratuito',
      'Puedes cambiar de plan en cualquier momento desde la configuración.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            setSelectedPlan(SubscriptionPlan.FREE);
            onPlanSelected?.();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con gradiente */}
        <LinearGradient
          colors={[colors.primary[500], colors.secondary[500]]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Image
              source={require('../../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>¡Bienvenido, {userName}!</Text>
            <Text style={styles.subtitleText}>
              Elige el plan perfecto para tu granja
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Planes */}
        <Animated.View
          style={[
            styles.plansContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {Object.entries(PLAN_INFO).map(([planKey, planInfo]) => {
            const plan = planKey as SubscriptionPlan;
            const isSelected = selectedPlan === plan;
            const isFree = plan === SubscriptionPlan.FREE;

            return (
              <TouchableOpacity
                key={plan}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: isSelected ? planInfo.color : colors.border.light,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  isSelected && shadows.md,
                ]}
                onPress={() => handleSelectPlan(plan)}
                activeOpacity={0.7}
              >
                {isSelected && (
                  <View
                    style={[
                      styles.selectedBadge,
                      { backgroundColor: planInfo.color },
                    ]}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text
                    style={[
                      styles.planName,
                      { color: colors.text.primary },
                    ]}
                  >
                    {planInfo.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text
                      style={[
                        styles.price,
                        { color: planInfo.color },
                      ]}
                    >
                      {planInfo.price}
                    </Text>
                    {planInfo.period && (
                      <Text
                        style={[
                          styles.period,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {planInfo.period}
                      </Text>
                    )}
                  </View>
                </View>

                <Text
                  style={[
                    styles.planDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {planInfo.description}
                </Text>

                <View style={styles.featuresContainer}>
                  {planInfo.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={planInfo.color}
                      />
                      <Text
                        style={[
                          styles.featureText,
                          { color: colors.text.primary },
                        ]}
                      >
                        {feature}
                      </Text>
                    </View>
                  ))}
                </View>

                {isFree && (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>Recomendado para empezar</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Botones de acción */}
        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: selectedPlan
                  ? PLAN_INFO[selectedPlan].color
                  : colors.neutral[400],
              },
              !selectedPlan && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!selectedPlan || isProcessing || subscriptionLoading}
            activeOpacity={0.8}
          >
            {isProcessing || subscriptionLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>
                {selectedPlan === SubscriptionPlan.FREE
                  ? 'Continuar con plan gratuito'
                  : 'Continuar'}
              </Text>
            )}
          </TouchableOpacity>

          {selectedPlan !== SubscriptionPlan.FREE && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isProcessing}
            >
              <Text
                style={[
                  styles.skipButtonText,
                  { color: colors.text.secondary },
                ]}
              >
                Omitir por ahora
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {/* Sheet de éxito después de compra */}
      {successSheetData && (
        <SubscriptionSuccessSheet
          visible={showSuccessSheet}
          onClose={handleSuccessSheetClose}
          newPlan={successSheetData.newPlan}
          previousPlan={successSheetData.previousPlan}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing[8],
  },
  headerGradient: {
    paddingTop: spacing[12],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[5],
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing[4],
  },
  welcomeText: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: typography.sizes.lg,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
  },
  planCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[4],
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  planName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  period: {
    fontSize: typography.sizes.base,
    marginLeft: spacing[1],
  },
  planDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[4],
  },
  featuresContainer: {
    marginTop: spacing[3],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  featureText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing[2],
    flex: 1,
  },
  freeBadge: {
    marginTop: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    fontSize: typography.sizes.xs,
    color: '#3B82F6',
    fontWeight: typography.weights.semibold,
  },
  actionsContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
  },
  continueButton: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  skipButton: {
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: typography.sizes.base,
  },
});


