/**
 * Widget para gestionar colaboradores con sistema farmCode
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useAccountStore } from '../../stores/accountStore';
import { useFarmStore } from '../../stores/farmStore';
import { getPlanColor } from '../../utils/farmUtils';

interface InviteCollaboratorWidgetProps {
  style?: any;
}

export const InviteCollaboratorWidget: React.FC<InviteCollaboratorWidgetProps> = ({
  style,
}) => {
  const { isDark, colors } = useTheme();
  const { account } = useAccountStore();
  const {
    currentFarm,
    getCollaboratorSummary,
  } = useFarmStore();

  // Obtener estadísticas de colaboradores
  const collaboratorSummary = currentFarm ? getCollaboratorSummary(currentFarm.id) : null;
  const progressPercentage = collaboratorSummary 
    ? (collaboratorSummary.totalCollaborators / collaboratorSummary.limit) * 100
    : 0;


  const getProgressColor = () => {
    if (progressPercentage >= 90) return '#EF4444'; // Rojo
    if (progressPercentage >= 70) return '#F59E0B'; // Amarillo
    return colors.primary[500]; // Azul
  };

  if (!currentFarm || !collaboratorSummary) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background.secondary }, style]}>
        <ActivityIndicator color={colors.primary[500]} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Cargando información...
        </Text>
      </View>
    );
  }

  // Colores verdes para dark y light mode
  const greenColor = isDark ? '#66BB6A' : '#2E7D32';
  const greenBackground = isDark ? 'rgba(102, 187, 106, 0.15)' : 'rgba(46, 125, 50, 0.1)';
  const greenText = isDark ? '#A5D6A7' : '#1B5E20';
  const buttonBackground = isDark ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)';
  const buttonBorder = isDark ? 'rgba(102, 187, 106, 0.3)' : 'rgba(46, 125, 50, 0.2)';

  const handlePress = () => {
    router.push('/(tabs)/settings/colaboradores' as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        styles.buttonContainer,
        {
          backgroundColor: buttonBackground,
          borderColor: buttonBorder,
          borderWidth: 2,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header Compacto con título invitador */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(102, 187, 106, 0.25)' : 'rgba(46, 125, 50, 0.15)' }]}>
            <Ionicons name="people-circle" size={24} color={greenColor} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.inviteTitle, { color: greenColor }]}>
              Invita Colaboradores a Tu Granja
            </Text>
            <Text style={[styles.inviteSubtitle, { color: colors.text.secondary }]}>
              Trabaja en equipo y mejora la gestión de tu granja
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {account?.subscription && (
            <View style={[styles.planBadge, { backgroundColor: getPlanColor(account.subscription.plan, colors) }]}>
              <Text style={[styles.planText, { color: colors.text.inverse }]}>
                {account.subscription.plan}
              </Text>
            </View>
          )}
          <View style={[styles.arrowContainer, { backgroundColor: greenColor }]}>
            <Ionicons name="chevron-forward" size={20} color={colors.text.inverse} />
          </View>
        </View>
      </View>

      {/* Progress Bar Compacto */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
            {collaboratorSummary.totalCollaborators} / {collaboratorSummary.limit === -1 ? '∞' : collaboratorSummary.limit}
          </Text>
          <Text style={[styles.progressNumbers, { color: colors.text.primary }]}>
            {collaboratorSummary.isAtLimit 
              ? 'Límite alcanzado'
              : collaboratorSummary.limit === -1 
                ? 'Ilimitados'
                : `${collaboratorSummary.limit - collaboratorSummary.totalCollaborators} disponibles`
            }
          </Text>
        </View>

        {collaboratorSummary.limit !== -1 && (
          <View style={[styles.progressContainer, { backgroundColor: colors.background.tertiary }]}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundColor: getProgressColor(),
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Upgrade hint si está cerca del límite */}
      {progressPercentage >= 80 && collaboratorSummary.limit !== -1 && (
        <View style={[styles.upgradeHint, { backgroundColor: isDark ? '#3F2700' : '#FEF3C7' }]}>
          <Ionicons name="warning" size={14} color={isDark ? '#FCD34D' : '#D97706'} />
          <Text style={[styles.upgradeText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
            Considera actualizar tu plan
          </Text>
        </View>
      )}

      {/* Indicador de acción */}
      <View style={styles.actionHint}>
        <Text style={[styles.actionHintText, { color: greenColor }]}>
          Toca para gestionar colaboradores
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    ...shadows.md,
  },
  buttonContainer: {
    overflow: 'hidden',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    gap: spacing[2],
  },
  loadingText: {
    fontSize: typography.sizes.sm,
  },
  
  // Header Compacto
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  inviteTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  inviteSubtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: borderRadius.sm,
  },
  planText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
  },

  // Progress Section Compacto
  progressSection: {
    marginBottom: spacing[2],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  progressNumbers: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as '500',
  },
  progressContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Invite Button
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[2],
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },

  // Invite Form
  inviteForm: {
    gap: spacing[3],
  },
  emailInput: {
    marginBottom: spacing[2],
  },
  roleSelector: {
    marginBottom: spacing[3],
  },
  roleSelectorLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    marginBottom: spacing[2],
  },
  roleOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing[1],
  },
  roleOptionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as '500',
  },

  // Form Actions
  formActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
  },
  sendButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },

  // Upgrade Hint Compacto
  upgradeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.sm,
    marginTop: spacing[2],
    gap: spacing[1],
  },
  upgradeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as '500',
    flex: 1,
  },
  actionHint: {
    marginTop: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 125, 50, 0.2)',
  },
  actionHintText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as '600',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
