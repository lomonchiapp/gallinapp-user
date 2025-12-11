/**
 * Pantalla de registro - Gallinapp
 * Registro multi-tenant con creación de organización
 */

import React from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../src/constants/designSystem';
import { AnimatedCard } from '../../src/components/ui/AnimatedCard';
import RegisterForm from '../../src/components/forms/RegisterForm';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary[500]} />
      
      {/* Background Gradient */}
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

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerContainer}>
            <AnimatedCard 
              animationType="bounce" 
              delay={200}
              style={styles.logoCard}
              elevation="md"
            >
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </AnimatedCard>
            
            <View style={styles.titleContainer}>
              <Text style={styles.appName}>¡Únete a Gallinapp!</Text>
              <Text style={styles.tagline}>Crea tu organización y comienza gratis</Text>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[300]} />
                  <Text style={styles.benefitText}>14 días de prueba gratis</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[300]} />
                  <Text style={styles.benefitText}>Sin tarjeta de crédito</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[300]} />
                  <Text style={styles.benefitText}>Configuración en 5 minutos</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Register Form Section */}
          <AnimatedCard 
            animationType="slideUp" 
            delay={400}
            style={styles.formContainer}
            elevation="lg"
          >
            <RegisterForm />
          </AnimatedCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary[500], // Azul marca #345DAD
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
    minHeight: height,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  logoCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  logo: {
    width: 60,
    height: 60,
  },
  titleContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  tagline: {
    fontSize: typography.sizes.base,
    color: colors.neutral[0],
    opacity: 0.9,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  benefitsList: {
    alignItems: 'flex-start',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  benefitText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[0],
    opacity: 0.9,
    marginLeft: spacing[2],
  },
  formContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginHorizontal: spacing[1],
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[0],
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.xs,
  },
});