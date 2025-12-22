/**
 * Widget de Tipos de Negocio - Muestra estadísticas por tipo
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../../constants/designSystem';
import Card from '../../ui/Card';

interface BusinessTypesWidgetProps {
  ponedorasActivas: number;
  engordeActivos: number;
  israeliesActivos: number;
}

export const BusinessTypesWidget: React.FC<BusinessTypesWidgetProps> = ({
  ponedorasActivas,
  engordeActivos,
  israeliesActivos,
}) => {
  return (
    <View style={styles.container}>
      <Card style={StyleSheet.flatten([styles.card, { borderLeftColor: colors.primary[500] }])}>
        <View style={styles.header}>
          <Ionicons name="egg" size={20} color={colors.primary[500]} />
          <Text style={styles.title}>Ponedoras</Text>
        </View>
        <Text style={styles.value}>{ponedorasActivas} Lotes</Text>
      </Card>

      <Card style={StyleSheet.flatten([styles.card, { borderLeftColor: colors.warning[500] }])}>
        <View style={styles.header}>
          <Ionicons name="fast-food" size={20} color={colors.warning[500]} />
          <Text style={styles.title}>Engorde</Text>
        </View>
        <Text style={styles.value}>{engordeActivos} Lotes</Text>
      </Card>

      <Card style={StyleSheet.flatten([styles.card, { borderLeftColor: colors.success[500] }])}>
        <View style={styles.header}>
          <Ionicons name="nutrition" size={20} color={colors.success[500]} />
          <Text style={styles.title}>Levantes</Text>
        </View>
        <Text style={styles.value}>{israeliesActivos} Lotes</Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  card: {
    flex: 1,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderRadius: borderRadius.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginLeft: spacing[2],
  },
  value: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
  },
});




