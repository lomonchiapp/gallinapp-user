/**
 * Componente de alerta de maduración
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { TipoAve } from '../../types';
import { evaluateMaturation, getUrgencyColor, getUrgencyIcon } from '../../utils/maturationUtils';

interface MaturationAlertProps {
  tipoAve: TipoAve;
  fechaNacimiento: Date;
  pesoPromedio?: number;
  style?: any;
}

export default function MaturationAlert({ 
  tipoAve, 
  fechaNacimiento, 
  pesoPromedio = 0, 
  style 
}: MaturationAlertProps) {
  const status = evaluateMaturation(tipoAve, fechaNacimiento, pesoPromedio);
  const urgencyColor = getUrgencyColor(status.urgency);
  const urgencyIcon = getUrgencyIcon(status.urgency);

  return (
    <View style={[styles.container, { borderLeftColor: urgencyColor }, style]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={urgencyIcon as any} 
            size={20} 
            color={urgencyColor} 
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {status.isReady ? 'Listo para ' : 'En desarrollo'}
            {tipoAve === TipoAve.PONEDORA ? 'postura' : 'venta'}
          </Text>
          {status.daysToMaturity > 0 && (
            <Text style={styles.subtitle}>
              {status.daysToMaturity} días restantes
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.recommendation}>
        {status.recommendation}
      </Text>

      {/* Indicadores de estado */}
      <View style={styles.indicators}>
        <View style={styles.indicator}>
          <Text style={styles.indicatorLabel}>Edad</Text>
          <View style={[styles.indicatorBadge, getAgeStatusStyle(status.ageStatus)]}>
            <Text style={[styles.indicatorText, getAgeStatusTextStyle(status.ageStatus)]}>
              {getAgeStatusLabel(status.ageStatus)}
            </Text>
          </View>
        </View>

        {pesoPromedio > 0 && (
          <View style={styles.indicator}>
            <Text style={styles.indicatorLabel}>Peso</Text>
            <View style={[styles.indicatorBadge, getWeightStatusStyle(status.weightStatus)]}>
              <Text style={[styles.indicatorText, getWeightStatusTextStyle(status.weightStatus)]}>
                {getWeightStatusLabel(status.weightStatus)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// Funciones auxiliares para estilos y etiquetas
const getAgeStatusStyle = (status: string) => {
  switch (status) {
    case 'young': return { backgroundColor: colors.primary + '20' };
    case 'optimal': return { backgroundColor: colors.success + '20' };
    case 'old': return { backgroundColor: colors.danger + '20' };
    default: return { backgroundColor: colors.lightGray };
  }
};

const getAgeStatusTextStyle = (status: string) => {
  switch (status) {
    case 'young': return { color: colors.primary };
    case 'optimal': return { color: colors.success };
    case 'old': return { color: colors.danger };
    default: return { color: colors.textMedium };
  }
};

const getWeightStatusStyle = (status: string) => {
  switch (status) {
    case 'underweight': return { backgroundColor: colors.warning + '20' };
    case 'optimal': return { backgroundColor: colors.success + '20' };
    case 'overweight': return { backgroundColor: colors.danger + '20' };
    default: return { backgroundColor: colors.lightGray };
  }
};

const getWeightStatusTextStyle = (status: string) => {
  switch (status) {
    case 'underweight': return { color: colors.warning };
    case 'optimal': return { color: colors.success };
    case 'overweight': return { color: colors.danger };
    default: return { color: colors.textMedium };
  }
};

const getAgeStatusLabel = (status: string) => {
  switch (status) {
    case 'young': return 'Joven';
    case 'optimal': return 'Óptima';
    case 'old': return 'Madura';
    default: return 'N/A';
  }
};

const getWeightStatusLabel = (status: string) => {
  switch (status) {
    case 'underweight': return 'Bajo';
    case 'optimal': return 'Óptimo';
    case 'overweight': return 'Alto';
    default: return 'N/A';
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  recommendation: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
    marginBottom: 16,
  },
  indicators: {
    flexDirection: 'row',
    gap: 12,
  },
  indicator: {
    flex: 1,
  },
  indicatorLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
    fontWeight: '500',
  },
  indicatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
});



































