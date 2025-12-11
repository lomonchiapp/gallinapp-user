/**
 * UpgradePlanSheet - Sheet fullscreen para mejorar plan cuando intentan acceder a funcionalidad Pro
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useSubscription } from '../../hooks/useSubscription';
import { subscriptionService } from '../../services/subscription.service';
import { SubscriptionPlan } from '../../types/organization';
import { SubscriptionSuccessSheet } from './SubscriptionSuccessSheet';

interface UpgradePlanSheetProps {
  visible: boolean;
  onClose: () => void;
  requiredPlan?: SubscriptionPlan;
  featureName?: string;
}

export const UpgradePlanSheet: React.FC<UpgradePlanSheetProps> = ({
  visible,
  onClose,
  requiredPlan = SubscriptionPlan.PRO,
  featureName = 'esta funcionalidad',
}) => {
  const { colors, isDark } = useTheme();
  const { presentPaywall, isLoading: isSubscriptionLoading, subscriptionInfo, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [successSheetData, setSuccessSheetData] = useState<{
    newPlan: SubscriptionPlan;
    previousPlan?: SubscriptionPlan;
  } | null>(null);

  // Verificación de seguridad
  if (!colors) {
    return null;
  }

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(200),
          Animated.spring(logoScaleAnim, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.loop(
            Animated.sequence([
              Animated.timing(logoRotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(logoRotateAnim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ])
          ),
        ]),
      ]).start();

      // Animación de pulso para el botón
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Reset animaciones al cerrar
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.9);
      logoScaleAnim.setValue(0);
      logoRotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  /**
   * Maneja la compra del plan a través de RevenueCat
   */
  const handleUpgrade = async () => {
    try {
      setIsProcessing(true);
      
      // Guardar plan anterior
      const previousPlan = subscriptionInfo?.plan;
      
      // Presentar paywall de RevenueCat
      const result = await presentPaywall();
      
      if (result.success && result.newPlan) {
        // Solo mostrar sheet si el plan realmente cambió y no es FREE
        if (result.newPlan !== SubscriptionPlan.FREE && result.newPlan !== previousPlan) {
          // Compra exitosa - cerrar este modal y mostrar sheet de bienvenida
          setIsProcessing(false);
          onClose();
          
          // Mostrar sheet de bienvenida
          setSuccessSheetData({
            newPlan: result.newPlan,
            previousPlan: previousPlan,
          });
          setShowSuccessSheet(true);
        } else if (result.newPlan === SubscriptionPlan.FREE) {
          // Si el plan sigue siendo FREE después de comprar, mostrar mensaje con opción de verificar
          setIsProcessing(false);
          Alert.alert(
            'Procesando compra',
            'Tu compra está siendo procesada. Esto puede tardar unos momentos. ¿Deseas verificar ahora?',
            [
              { text: 'Más tarde', style: 'cancel', onPress: onClose },
              {
                text: 'Verificar ahora',
                onPress: async () => {
                  try {
                    setIsProcessing(true);
                    // Recargar información
                    await refreshSubscription();
                    // Verificar si ahora tiene acceso
                    const updatedInfo = await subscriptionService.getSubscriptionInfo();
                    if (updatedInfo.plan !== SubscriptionPlan.FREE) {
                      Alert.alert(
                        '¡Compra activada!',
                        `Tu plan ${updatedInfo.plan} está ahora activo. Ya puedes acceder a esta funcionalidad.`,
                        [{ text: 'Genial', onPress: onClose }]
                      );
                    } else {
                      Alert.alert(
                        'Aún procesando',
                        'Tu compra aún se está procesando. Por favor, espera unos minutos y vuelve a intentar.',
                        [{ text: 'Entendido', onPress: onClose }]
                      );
                    }
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'No se pudo verificar la compra');
                  } finally {
                    setIsProcessing(false);
                  }
                },
              },
            ]
          );
        } else {
          setIsProcessing(false);
        }
      } else {
        // Usuario canceló o hubo error
        setIsProcessing(false);
        // No cerrar el modal para que pueda intentar de nuevo
      }
    } catch (error: any) {
      console.error('Error en handleUpgrade:', error);
      setIsProcessing(false);
      Alert.alert(
        'Error',
        error.message || 'No se pudo procesar la compra. Por favor, intenta de nuevo.',
        [{ text: 'Entendido' }]
      );
    }
  };

  const handleClose = () => {
    onClose();
    // No hacer router.back() aquí, solo cerrar el sheet
    // El usuario debe quedarse en la pantalla pero sin acceso
  };

  const planFeatures = [
    { id: '1', title: 'Acceso completo', description: 'Todas las funcionalidades', icon: 'checkmark-circle' },
    { id: '2', title: 'Hasta 10 colaboradores', description: 'Equipo completo', icon: 'people' },
    { id: '3', title: 'Analytics avanzados', description: 'Reportes personalizados', icon: 'analytics' },
    { id: '4', title: 'Soporte 24/7', description: 'Atención prioritaria', icon: 'headset' },
    { id: '5', title: 'Exportación ilimitada', description: 'Datos sin límites', icon: 'download' },
  ];

  const renderFeatureCard = ({ item }: { item: { id: string; title: string; description: string; icon: string } }) => {
    return (
      <View style={[styles.featureCard, { backgroundColor: colors.background.secondary }]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureCardGradient}
        >
          <View style={[styles.featureIconContainer, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name={item.icon as any} size={24} color={colors.primary[500]} />
          </View>
          <Text style={[styles.featureCardTitle, { color: colors.text.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.featureCardDescription, { color: colors.text.secondary }]}>
            {item.description}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header con gradiente animado */}
        <LinearGradient
          colors={['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
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
            {/* Header top bar */}
            <View style={styles.headerTopBar}>
              <LinearGradient
                colors={['#FFFFFF', '#F3F4F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recommendedBadgeHeader}
              >
                <Text style={styles.recommendedBadgeHeaderText}>RECOMENDADO</Text>
              </LinearGradient>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Logo con círculo blanco */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [
                    { scale: logoScaleAnim },
                    { rotate: logoRotation },
                  ],
                },
              ]}
            >
              <View style={styles.logoCircle}>
                <Image
                  source={require('../../../assets/images/full-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center',
              }}
            >
              <Text style={styles.headerTitle}>
                Avanza a <Text style={styles.headerTitleBold}>Gallinapp Pro</Text>
              </Text>
              <Text style={styles.headerSubtitle}>
                Comienza a facturar tus ventas...
              </Text>

              {/* Badge de precio */}
              <View style={styles.priceBadgeContainer}>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeAmount}>
                    ${requiredPlan === SubscriptionPlan.PRO ? '49.99' : '99.99'}
                  </Text>
                  <Text style={styles.priceBadgePeriod}>/mes</Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Features horizontal list */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={[styles.featuresTitle, { color: colors.text.primary }]}>
              Todo lo que incluye:
            </Text>
            <FlatList
              data={planFeatures}
              renderItem={renderFeatureCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuresList}
              style={styles.featuresFlatList}
            />
          </Animated.View>

          {/* Beneficios adicionales con gradiente */}
          <Animated.View
            style={[
              styles.benefitsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.benefitsGradient}
            >
              <Ionicons name="star" size={32} color="#FFFFFF" />
              <Text style={styles.benefitsTitle}>
                Beneficios Exclusivos
              </Text>
              <Text style={styles.benefitsText}>
                Desbloquea todas las funcionalidades avanzadas y lleva tu granja al siguiente nivel
              </Text>
            </LinearGradient>
          </Animated.View>
        </ScrollView>

        {/* Footer con botón animado */}
        <Animated.View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.light,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeButtonGradient}
          >
            <TouchableOpacity
              onPress={handleUpgrade}
              style={styles.upgradeButtonTouchable}
              activeOpacity={0.8}
              disabled={isProcessing || isSubscriptionLoading}
            >
              {isProcessing || isSubscriptionLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.upgradeButtonText}>Procesando...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.upgradeButtonText}>Mejorar Plan Ahora</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.text.secondary }]}>
              Tal vez más tarde
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

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
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    ...shadows.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing[4],
  },
  recommendedBadgeHeader: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  recommendedBadgeHeaderText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  closeButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: spacing[2],
  },
  logoContainer: {
    marginBottom: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logo: {
    width: 180,
    height: 50,
  },
  headerTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.medium as '500',
    color: '#FFFFFF',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  headerTitleBold: {
    fontWeight: typography.weights.bold as '700',
  },
  headerSubtitle: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  priceBadgeContainer: {
    marginTop: spacing[2],
  },
  priceBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    ...shadows.md,
  },
  priceBadgeAmount: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    color: '#3B82F6',
  },
  priceBadgePeriod: {
    fontSize: typography.sizes.base,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  featuresTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[1],
  },
  featuresFlatList: {
    marginBottom: spacing[4],
  },
  featuresList: {
    paddingRight: spacing[4],
    gap: spacing[3],
  },
  featureCard: {
    width: 160,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    marginRight: spacing[3],
  },
  featureCardGradient: {
    padding: spacing[4],
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  featureCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  featureCardDescription: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  benefitsCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  benefitsGradient: {
    padding: spacing[5],
    alignItems: 'center',
    gap: spacing[2],
  },
  benefitsTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    color: '#FFFFFF',
  },
  benefitsText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    ...shadows.lg,
  },
  upgradeButtonGradient: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    ...shadows.md,
  },
  upgradeButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  upgradeButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  cancelText: {
    fontSize: typography.sizes.base,
  },
});

