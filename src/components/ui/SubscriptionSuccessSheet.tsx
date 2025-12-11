/**
 * SubscriptionSuccessSheet - Sheet de bienvenida cuando se actualiza el plan exitosamente
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { SubscriptionPlan } from '../../types/organization';

interface SubscriptionSuccessSheetProps {
  visible: boolean;
  onClose: () => void;
  newPlan: SubscriptionPlan;
  previousPlan?: SubscriptionPlan;
}

const PLAN_NAMES = {
  [SubscriptionPlan.FREE]: 'Gratuito',
  [SubscriptionPlan.BASIC]: 'Básico',
  [SubscriptionPlan.PRO]: 'Profesional',
  [SubscriptionPlan.ENTERPRISE]: 'Empresarial',
};

const PLAN_COLORS = {
  [SubscriptionPlan.FREE]: '#6B7280',
  [SubscriptionPlan.BASIC]: '#3B82F6',
  [SubscriptionPlan.PRO]: '#06B6D4',
  [SubscriptionPlan.ENTERPRISE]: '#F59E0B',
};

export const SubscriptionSuccessSheet: React.FC<SubscriptionSuccessSheetProps> = ({
  visible,
  onClose,
  newPlan,
  previousPlan,
}) => {
  const { colors, isDark } = useTheme();

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
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
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animaciones
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      logoScaleAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible]);

  const planColor = PLAN_COLORS[newPlan] || colors.primary[500];
  const isUpgrade = previousPlan === SubscriptionPlan.FREE || 
                   (previousPlan === SubscriptionPlan.BASIC && newPlan !== SubscriptionPlan.BASIC) ||
                   (previousPlan === SubscriptionPlan.PRO && newPlan === SubscriptionPlan.ENTERPRISE);

  const confettiRotation = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <StatusBar style="light" />
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header con gradiente */}
          <LinearGradient
            colors={[planColor, planColor + 'DD', planColor + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Confetti animado */}
            <Animated.View
              style={[
                styles.confettiContainer,
                {
                  transform: [{ rotate: confettiRotation }],
                  opacity: confettiAnim,
                },
              ]}
            >
              <Ionicons name="sparkles" size={100} color="#FFFFFF" style={styles.confetti1} />
              <Ionicons name="star" size={80} color="#FFD700" style={styles.confetti2} />
              <Ionicons name="sparkles" size={90} color="#FFFFFF" style={styles.confetti3} />
            </Animated.View>

            {/* Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScaleAnim }],
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

            {/* Título */}
            <Animated.View
              style={{
                opacity: fadeAnim,
              }}
            >
              <Text style={styles.title}>¡Bienvenido a {PLAN_NAMES[newPlan]}!</Text>
              <Text style={styles.subtitle}>
                {isUpgrade
                  ? 'Tu plan ha sido actualizado exitosamente'
                  : 'Tu suscripción está activa'}
              </Text>
            </Animated.View>
          </LinearGradient>

          {/* Contenido */}
          <View style={[styles.content, { backgroundColor: colors.background.primary }]}>
            {/* Badge de éxito */}
            <View style={[styles.successBadge, { backgroundColor: colors.success[50] }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success[500]} />
              <Text style={[styles.successText, { color: colors.success[700] }]}>
                Suscripción Activada
              </Text>
            </View>

            {/* Información del plan */}
            <View style={[styles.planInfo, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.planRow}>
                <Text style={[styles.planLabel, { color: colors.text.secondary }]}>
                  Plan Anterior:
                </Text>
                <Text style={[styles.planValue, { color: colors.text.primary }]}>
                  {previousPlan ? PLAN_NAMES[previousPlan] : 'Ninguno'}
                </Text>
              </View>
              <View style={styles.planRow}>
                <Text style={[styles.planLabel, { color: colors.text.secondary }]}>
                  Plan Actual:
                </Text>
                <Text style={[styles.planValue, { color: planColor, fontWeight: 'bold' }]}>
                  {PLAN_NAMES[newPlan]}
                </Text>
              </View>
            </View>

            {/* Beneficios */}
            <View style={styles.benefitsContainer}>
              <Text style={[styles.benefitsTitle, { color: colors.text.primary }]}>
                Ahora tienes acceso a:
              </Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Todas las funcionalidades premium
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Soporte prioritario
                  </Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success[500]} />
                  <Text style={[styles.benefitText, { color: colors.text.primary }]}>
                    Actualizaciones automáticas
                  </Text>
                </View>
              </View>
            </View>

            {/* Botón de cerrar */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: planColor }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>¡Empezar a usar!</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  header: {
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  confettiContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  confetti1: {
    position: 'absolute',
    top: '10%',
    left: '10%',
  },
  confetti2: {
    position: 'absolute',
    top: '20%',
    right: '15%',
  },
  confetti3: {
    position: 'absolute',
    bottom: '15%',
    left: '20%',
  },
  logoContainer: {
    marginBottom: spacing[4],
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  logo: {
    width: 150,
    height: 40,
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: spacing[5],
  },
  successBadge: {
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
  },
  successText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as '600',
    marginTop: spacing[2],
  },
  planInfo: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: typography.sizes.base,
  },
  planValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
  },
  benefitsContainer: {
    marginBottom: spacing[4],
  },
  benefitsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[3],
  },
  benefitsList: {
    gap: spacing[3],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  benefitText: {
    fontSize: typography.sizes.base,
    flex: 1,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
    ...shadows.md,
  },
  closeButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    color: '#FFFFFF',
  },
});

