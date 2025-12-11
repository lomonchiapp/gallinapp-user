/**
 * Pantalla de bienvenida profesional al estilo “Silicon Valley”
 * Inspiración: experiencias como Spotify / onboarding moderno.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, typography } from '../src/constants/designSystem';
import { useAuthStore } from '../src/stores/authStore';

const { height } = Dimensions.get('window');

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Si ya está autenticado, enviarlo directo al dashboard
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  const goToLogin = () => router.push('/auth/login');
  const goToRegister = () => router.push('/auth/register');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />

      {/* Fondo con gradiente de marca */}
      <LinearGradient
        colors={[colors.primary[500], colors.secondary[500], colors.primary[600]]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Elementos decorativos */}
      <View style={styles.decorativeElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <View style={styles.content}>
        {/* Marca / Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Gallinapp</Text>
          <Text style={styles.tagline}>Gestión Avícola Profesional</Text>
        </View>

        {/* Benefits */}
        <View style={styles.featuresCard}>
          <View style={styles.featureRow}>
            <Ionicons name="analytics" size={18} color={colors.neutral[0]} />
            <Text style={styles.featureText}>Analytics en tiempo real</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="people" size={18} color={colors.neutral[0]} />
            <Text style={styles.featureText}>Equipos colaborativos seguros</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="shield-checkmark" size={18} color={colors.neutral[0]} />
            <Text style={styles.featureText}>Seguridad multi-tenant empresarial</Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={goToRegister}>
            <Text style={styles.primaryButtonText}>Comenzar gratis</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={goToLogin}>
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          14 días de prueba • Sin tarjeta de crédito • Listo para tu equipo
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[500],
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -80,
    right: -80,
  },
  circle2: {
    width: 160,
    height: 160,
    top: height * 0.3,
    left: -80,
  },
  circle3: {
    width: 100,
    height: 100,
    bottom: 120,
    right: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing[3],
  },
  appName: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
  },
  tagline: {
    fontSize: typography.sizes.lg,
    color: colors.neutral[0],
    opacity: 0.9,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  featuresCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  featureText: {
    marginLeft: spacing[2],
    fontSize: typography.sizes.base,
    color: colors.neutral[0],
    opacity: 0.95,
  },
  actions: {
    width: '100%',
    marginBottom: spacing[4],
  },
  primaryButton: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  primaryButtonText: {
    color: colors.primary[500],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  secondaryButton: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[0],
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.neutral[0],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[0],
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
});
