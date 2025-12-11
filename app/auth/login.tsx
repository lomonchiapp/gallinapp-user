/**
 * Pantalla de inicio de sesión - Gallinapp
 * Diseño moderno minimalista - Bienvenida + Login on demand
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import LoginForm from '../../src/components/forms/LoginForm';
import { borderRadius, colors, spacing, typography } from '../../src/constants/designSystem';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Animaciones de bienvenida
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(20)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const featuresFade = useRef(new Animated.Value(0)).current;
  const featuresSlide = useRef(new Animated.Value(20)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(20)).current;
  
  // Animaciones de transición
  const welcomeOpacity = useRef(new Animated.Value(1)).current;
  const welcomeScale = useRef(new Animated.Value(1)).current;
  const formSlide = useRef(new Animated.Value(height)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formScale = useRef(new Animated.Value(0.95)).current;

  // Animación inicial de bienvenida
  useEffect(() => {
    if (!showLoginForm) {
      // Resetear valores
      welcomeOpacity.setValue(1);
      welcomeScale.setValue(1);
      formOpacity.setValue(0);
      formScale.setValue(0.95);
      
      // Secuencia de animaciones de entrada
      Animated.sequence([
        // Logo con efecto dramático
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 30,
          friction: 7,
          useNativeDriver: true,
        }),
        // Título
        Animated.parallel([
          Animated.timing(titleFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(titleSlide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Subtítulo
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Características
        Animated.parallel([
          Animated.timing(featuresFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(featuresSlide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Botones
        Animated.parallel([
          Animated.timing(buttonsFade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(buttonsSlide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [showLoginForm]);

  // Animación de transición al formulario
  useEffect(() => {
    if (showLoginForm) {
      // Ocultar bienvenida con animación
      Animated.parallel([
        Animated.timing(welcomeOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(welcomeScale, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Mostrar formulario con animación
        Animated.parallel([
          Animated.spring(formSlide, {
            toValue: 0,
            tension: 50,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.timing(formOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(formScale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Ocultar formulario
      Animated.parallel([
        Animated.timing(formSlide, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(formOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(formScale, {
          toValue: 0.95,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Mostrar bienvenida
        Animated.parallel([
          Animated.timing(welcomeOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(welcomeScale, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [showLoginForm]);

  const navigateToRegister = () => router.push('/auth/register');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />

      {/* Background Gradient - mismo que registro */}
      <LinearGradient
        colors={[colors.primary[500], colors.secondary[500], colors.primary[600]]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Contenido principal - Bienvenida */}
      <Animated.View
        style={[
          styles.welcomeWrapper,
          {
            opacity: welcomeOpacity,
            transform: [{ scale: welcomeScale }],
            display: showLoginForm ? 'none' : 'flex',
          },
        ]}
        pointerEvents={showLoginForm ? 'none' : 'auto'}
      >
        <ScrollView
          contentContainerStyle={styles.welcomeContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeContent}>
            {/* Logo y marca */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <View style={styles.logoStroke} />
              <Image
                source={require('../../assets/images/full-logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: titleFade,
                transform: [{ translateY: titleSlide }],
              }}
            >
              <Text style={styles.heroTitle}>
                Gestión Avícola{'\n'}Inteligente
              </Text>
            </Animated.View>
            
            <Animated.View
              style={{
                opacity: subtitleFade,
              }}
            >
              <Text style={styles.heroSubtitle}>
                La plataforma completa para administrar tu granja.
              </Text>
            </Animated.View>

            {/* Características destacadas */}
            <Animated.View
              style={[
                styles.featuresGrid,
                {
                  opacity: featuresFade,
                  transform: [{ translateY: featuresSlide }],
                },
              ]}
            >
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.neutral[0]} />
                </View>
                <Text style={styles.featureText}>Seguridad{'\n'}Enterprise</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="flash" size={24} color={colors.neutral[0]} />
                </View>
                <Text style={styles.featureText}>Onboarding{'\n'}Rápido</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name="people" size={24} color={colors.neutral[0]} />
                </View>
                <Text style={styles.featureText}>Equipos{'\n'}Colaborativos</Text>
              </View>
            </Animated.View>

            {/* Botones principales */}
            <Animated.View
              style={[
                styles.mainActions,
                {
                  opacity: buttonsFade,
                  transform: [{ translateY: buttonsSlide }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowLoginForm(true)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="log-in" size={22} color={colors.primary[600]} />
                  <Text style={styles.primaryButtonText}>Acceder a mi cuenta</Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.primary[600]} />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setShowLoginForm(true);
                  setTimeout(() => navigateToRegister(), 100);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="rocket" size={20} color={colors.neutral[0]} />
                <Text style={styles.secondaryButtonText}>Crear cuenta gratis</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer info */}
            <Animated.View
              style={[
                styles.footerInfo,
                {
                  opacity: buttonsFade,
                },
              ]}
            >
              <View style={styles.footerBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[400]} />
                <Text style={styles.footerBadgeText}>14 días de prueba gratis</Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Formulario de login (aparece al presionar el botón) */}
      <Animated.View
        style={[
          styles.loginFormOverlay,
          {
            opacity: formOpacity,
            transform: [
              { translateY: formSlide },
              { scale: formScale },
            ],
            display: showLoginForm ? 'flex' : 'none',
          },
        ]}
        pointerEvents={showLoginForm ? 'auto' : 'none'}
      >
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              contentContainerStyle={styles.loginFormScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header del formulario */}
              <View style={styles.formHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowLoginForm(false)}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.neutral[0]} />
                </TouchableOpacity>
                
                <View style={styles.formHeaderInfo}>
                  <Text style={styles.formTitle}>Iniciar Sesión</Text>
                  <Text style={styles.formSubtitle}>Accede con tu cuenta o SSO</Text>
                </View>
              </View>

              {/* Formulario con inputs sobre fondo transparente */}
              <View style={styles.formContent}>
                <LoginForm />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
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
    left: 0,
    right: 0,
    top: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 180,
    height: 180,
    top: -90,
    right: -90,
  },
  circle2: {
    width: 120,
    height: 120,
    top: height * 0.25,
    left: -60,
  },
  circle3: {
    width: 80,
    height: 80,
    bottom: 120,
    right: 40,
  },

  // Pantalla de bienvenida
  welcomeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  welcomeContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[10],
  },
  welcomeContent: {
    width: '100%',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoStroke: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.neutral[0],
    opacity: 0.95,
    shadowColor: colors.neutral[0],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logoImage: {
    width: 320,
    height: 130,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
    textAlign: 'center',
    marginBottom: spacing[4],
    marginTop: spacing[6],
    lineHeight: typography.sizes['3xl'] * 1.3,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: typography.sizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.6,
    marginBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },

  // Grid de características
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[10],
    gap: spacing[6],
  },
  featureItem: {
    alignItems: 'center',
    maxWidth: 100,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  featureText: {
    color: colors.neutral[0],
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    lineHeight: typography.sizes.xs * 1.4,
  },

  // Botones principales
  mainActions: {
    width: '100%',
    marginBottom: spacing[8],
  },
  primaryButton: {
    marginBottom: spacing[4],
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  primaryButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary[600],
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    gap: spacing[2],
  },
  secondaryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[0],
  },

  // Footer info
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  footerBadgeText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },

  // Formulario de login (overlay)
  loginFormOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loginFormScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: Platform.OS === 'ios' ? spacing[8] : spacing[6],
    paddingBottom: spacing[8],
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  formHeaderInfo: {
    flex: 1,
  },
  formTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
  },
  formSubtitle: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContent: {
    // El formulario se renderiza sobre el fondo azul sin card
  },
});

