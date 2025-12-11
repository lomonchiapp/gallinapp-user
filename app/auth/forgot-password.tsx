/**
 * Pantalla de recuperación de contraseña - Gallinapp
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
import ForgotPasswordForm from '../../src/components/forms/ForgotPasswordForm';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
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
              style={styles.iconCard}
              elevation="md"
            >
              <Ionicons name="key" size={40} color={colors.primary[500]} />
            </AnimatedCard>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
              <Text style={styles.subtitle}>
                No te preocupes, te enviaremos un enlace de recuperación
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <AnimatedCard 
            animationType="slideUp" 
            delay={400}
            style={styles.formContainer}
            elevation="lg"
          >
            <ForgotPasswordForm />
          </AnimatedCard>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              El enlace de recuperación expira en 24 horas por seguridad
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
    width: 160,
    height: 160,
    top: -80,
    right: -80,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: 150,
    left: -50,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[8],
    minHeight: height * 0.8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  iconCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.full,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral[0],
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
    paddingHorizontal: spacing[2],
  },
  formContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    marginHorizontal: spacing[1],
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing[6],
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