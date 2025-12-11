/**
 * Pantalla de bienvenida del onboarding - elegir entre crear o unirse a granja
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
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

interface OnboardingWelcomeProps {
  isVisible: boolean;
  onChoice: (choice: 'create' | 'join') => void;
  onClose: () => void;
}

export const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({
  isVisible,
  onChoice,
  onClose,
}) => {
  const { isDark, colors } = useTheme();

  const options = [
    {
      key: 'create' as const,
      title: 'Crear Mi Granja',
      description: 'Comienza desde cero con tu propia instalación avícola',
      icon: 'add-circle',
      color: colors.primary[500],
      benefits: [
        'Control total de la configuración',
        'Invitar colaboradores con códigos',
        'Gestión completa de lotes',
        '14 días gratuitos para probar',
      ],
    },
    {
      key: 'join' as const,
      title: 'Unirse a una Granja',
      description: 'Únete a una granja existente como colaborador',
      icon: 'people',
      color: colors.secondary[500] || colors.primary[600],
      benefits: [
        'Acceso inmediato a granja activa',
        'Colaboración en equipo',
        'Roles y permisos definidos',
        'Solo necesitas un código de 8 dígitos',
      ],
    },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('../../../assets/images/full-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.welcomeTitle, { color: colors.text.primary }]}>
                ¡Bienvenido a Gallinapp!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.text.secondary }]}>
                La plataforma SaaS para gestión avícola profesional
              </Text>
            </View>

            {/* Opciones */}
            <View style={styles.optionsContainer}>
              <Text style={[styles.optionsTitle, { color: colors.text.primary }]}>
                ¿Cómo quieres comenzar?
              </Text>

              {options.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  onPress={() => onChoice(option.key)}
                  activeOpacity={0.9}
                >
                  <View style={styles.optionHeader}>
                    <View style={[styles.optionIcon, { backgroundColor: `${option.color}20` }]}>
                      <Ionicons name={option.icon} size={28} color={option.color} />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionTitle, { color: colors.text.primary }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, { color: colors.text.secondary }]}>
                        {option.description}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                  </View>

                  <View style={styles.benefitsList}>
                    {option.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Ionicons name="checkmark" size={14} color={option.color} />
                        <Text style={[styles.benefitText, { color: colors.text.secondary }]}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Información adicional */}
            <View style={[styles.infoSection, { backgroundColor: colors.background.tertiary }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
                <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                  ¿Qué es Gallinapp?
                </Text>
              </View>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Gallinapp es un SaaS diseñado específicamente para la industria avícola. 
                Gestiona múltiples granjas, controla la producción, analiza costos y 
                colabora con tu equipo en tiempo real.
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                <Text style={[styles.skipButtonText, { color: colors.text.tertiary }]}>
                  Saltar por ahora
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxWidth: 450,
    maxHeight: '95%',
    borderRadius: borderRadius.xl,
    ...shadows.xl,
  },
  scrollContent: {
    padding: spacing[6],
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: spacing[4],
  },
  welcomeTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
    lineHeight: typography.sizes.base * 1.5,
  },

  // Options
  optionsContainer: {
    marginBottom: spacing[6],
  },
  optionsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  optionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.sm,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  benefitsList: {
    gap: spacing[2],
    paddingLeft: spacing[2],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  benefitText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },

  // Info Section
  infoSection: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  infoTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  infoText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.5,
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  skipButtonText: {
    fontSize: typography.sizes.sm,
  },
});


