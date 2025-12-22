/**
 * Panel de administración para migración Organization → Farm
 * 
 * Permite a los administradores:
 * - Verificar organizaciones sin migrar
 * - Ejecutar migración
 * - Ver resultados
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useFarmMigration } from '../../hooks/useFarmMigration';

interface MigrationPanelProps {
  style?: any;
}

export const MigrationPanel: React.FC<MigrationPanelProps> = ({ style }) => {
  const { isDark, colors } = useTheme();
  const {
    hasUnmigratedOrganizations,
    isChecking,
    isMigrating,
    migrationResult,
    checkUnmigratedOrganizations,
    migrateAllOrganizations,
    needsMigration,
  } = useFarmMigration();

  const renderMigrationResult = () => {
    if (!migrationResult) return null;

    return (
      <View style={[styles.resultContainer, { backgroundColor: colors.background.secondary }]}>
        <View style={styles.resultHeader}>
          <Ionicons
            name={migrationResult.success ? 'checkmark-circle' : 'alert-circle'}
            size={24}
            color={migrationResult.success ? colors.primary[500] : colors.error[500]}
          />
          <Text style={[styles.resultTitle, { color: colors.text.primary }]}>
            {migrationResult.success ? 'Migración Exitosa' : 'Migración con Errores'}
          </Text>
        </View>

        <View style={styles.resultStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary[500] }]}>
              {migrationResult.migratedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
              Migradas
            </Text>
          </View>

          {migrationResult.errors.length > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.error[500] }]}>
                {migrationResult.errors.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Errores
              </Text>
            </View>
          )}

          {migrationResult.warnings.length > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                {migrationResult.warnings.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>
                Advertencias
              </Text>
            </View>
          )}
        </View>

        {migrationResult.errors.length > 0 && (
          <View style={styles.errorsList}>
            <Text style={[styles.errorsTitle, { color: colors.text.primary }]}>
              Errores:
            </Text>
            {migrationResult.errors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <Text style={[styles.errorText, { color: colors.error[500] }]}>
                  {error.organizationName}: {error.error}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }, style]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name="sync" size={24} color={colors.primary[500]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Migración Organization → Farm
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Migra organizaciones al nuevo sistema de farms
          </Text>
        </View>
      </View>

      {/* Estado actual */}
      <View style={[styles.statusContainer, { backgroundColor: colors.background.tertiary }]}>
        {isChecking ? (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
            <Text style={[styles.statusText, { color: colors.text.secondary }]}>
              Verificando organizaciones...
            </Text>
          </View>
        ) : needsMigration ? (
          <View style={styles.statusRow}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={[styles.statusText, { color: colors.text.primary }]}>
              Hay organizaciones sin migrar
            </Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
            <Text style={[styles.statusText, { color: colors.text.primary }]}>
              Todas las organizaciones están migradas
            </Text>
          </View>
        )}
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.background.tertiary },
            isChecking && styles.actionButtonDisabled
          ]}
          onPress={checkUnmigratedOrganizations}
          disabled={isChecking}
        >
          <Ionicons name="refresh" size={18} color={colors.text.primary} />
          <Text style={[styles.actionButtonText, { color: colors.text.primary }]}>
            Verificar
          </Text>
        </TouchableOpacity>

        {needsMigration && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              { backgroundColor: colors.primary[500] },
              isMigrating && styles.actionButtonDisabled
            ]}
            onPress={migrateAllOrganizations}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Ionicons name="rocket" size={18} color={colors.text.inverse} />
            )}
            <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
              {isMigrating ? 'Migrando...' : 'Migrar Todo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resultados */}
      {renderMigrationResult()}

      {/* Información */}
      <View style={[styles.infoContainer, { backgroundColor: colors.background.tertiary }]}>
        <Ionicons name="information-circle" size={16} color={colors.primary[500]} />
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          La migración convierte Organizations a Farms manteniendo todos los datos.
          Los usuarios y permisos se migran automáticamente.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.sizes.sm,
  },
  statusContainer: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusText: {
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  primaryButton: {
    flex: 2,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  resultContainer: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  resultTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[3],
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  statLabel: {
    fontSize: typography.sizes.xs,
  },
  errorsList: {
    marginTop: spacing[3],
  },
  errorsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[2],
  },
  errorItem: {
    marginBottom: spacing[1],
  },
  errorText: {
    fontSize: typography.sizes.sm,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  infoText: {
    fontSize: typography.sizes.xs,
    flex: 1,
    lineHeight: typography.sizes.xs * 1.4,
  },
});



