/**
 * Widget de Bienvenida - Componente introductorio
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../../components/theme-provider';
import { colors, spacing, typography, borderRadius } from '../../../constants/designSystem';
import Card from '../../ui/Card';
import { useOrganizationStore } from '../../../stores/organizationStore';

export const WelcomeWidget: React.FC = () => {
  const { currentOrganization } = useOrganizationStore();
  const { colors: themeColors, isDark } = useTheme();
  const organizationName = currentOrganization?.displayName || 'tu granja';

  // Colores del degradado para dark y light mode
  const gradientColors = isDark
    ? ['#1e3a5f', '#2d4a7a', '#345DAD', '#4a6bb8'] as const
    : ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5'] as const;

  return (
    <Card style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)' }]}>
            <Ionicons name="sparkles" size={32} color={isDark ? '#FFD700' : '#FFFFFF'} />
          </View>
          <Text style={[styles.title, { color: isDark ? themeColors.text.primary : '#FFFFFF' }]}>
            ¡Bienvenido a {organizationName}!
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? themeColors.text.secondary : 'rgba(255, 255, 255, 0.9)' }]}>
            Comienza gestionando tus lotes y monitorea el rendimiento de tu operación avícola
          </Text>
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={isDark ? '#81C784' : '#FFFFFF'} 
              />
              <Text style={[styles.featureText, { color: isDark ? themeColors.text.primary : '#FFFFFF' }]}>
                Gestión de lotes
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={isDark ? '#81C784' : '#FFFFFF'} 
              />
              <Text style={[styles.featureText, { color: isDark ? themeColors.text.primary : '#FFFFFF' }]}>
                Análisis financiero
              </Text>
            </View>
            <View style={styles.feature}>
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={isDark ? '#81C784' : '#FFFFFF'} 
              />
              <Text style={[styles.featureText, { color: isDark ? themeColors.text.primary : '#FFFFFF' }]}>
                Reportes en tiempo real
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: borderRadius.lg,
    padding: spacing[5],
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
  },
  features: {
    width: '100%',
    gap: spacing[2],
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing[2],
    fontWeight: typography.weights.medium as '500',
  },
});

