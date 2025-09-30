/**
 * Reporte de rendimiento detallado para un lote
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { colors } from '../../constants/colors';
import { PesoRegistro, TipoAve } from '../../types';
import { calculateAgeInDays } from '../../utils/dateUtils';
import { formatWeight, REFERENCE_WEIGHTS, WeightUnit } from '../../utils/weightUtils';
import Card from './Card';

interface PerformanceReportProps {
  loteId: string;
  tipoAve: TipoAve;
  fechaNacimiento: Date;
  cantidadInicial: number;
  cantidadActual: number;
  registrosPeso: PesoRegistro[];
  gastoTotal: number;
  ingresoTotal: number;
  style?: any;
}

export default function PerformanceReport({
  loteId,
  tipoAve,
  fechaNacimiento,
  cantidadInicial,
  cantidadActual,
  registrosPeso,
  gastoTotal,
  ingresoTotal,
  style
}: PerformanceReportProps) {
  
  // Calcular métricas de rendimiento
  const edadActual = calculateAgeInDays(fechaNacimiento);
  const tasaMortalidad = cantidadInicial > 0 ? ((cantidadInicial - cantidadActual) / cantidadInicial) * 100 : 0;
  const pesoPromedio = registrosPeso.length > 0 ? registrosPeso[0]?.pesoPromedio || 0 : 0;
  const margenGanancia = gastoTotal > 0 ? ((ingresoTotal - gastoTotal) / gastoTotal) * 100 : 0;
  
  // Calcular tasa de crecimiento
  let tasaCrecimiento = 0;
  if (registrosPeso.length >= 2) {
    const pesoInicial = registrosPeso[registrosPeso.length - 1]?.pesoPromedio || 0;
    const pesoActual = registrosPeso[0]?.pesoPromedio || 0;
    const diasTranscurridos = edadActual;
    tasaCrecimiento = diasTranscurridos > 0 ? (pesoActual - pesoInicial) / diasTranscurridos : 0;
  }

  // Obtener pesos de referencia según tipo de ave
  const referenceWeights = REFERENCE_WEIGHTS[tipoAve] || REFERENCE_WEIGHTS.POLLO_LEVANTE;
  
  // Calcular puntuación de rendimiento (0-100)
  const getPerformanceScore = (): number => {
    let score = 100;
    
    // Penalizar por mortalidad alta
    if (tasaMortalidad > 10) score -= 30;
    else if (tasaMortalidad > 5) score -= 15;
    else if (tasaMortalidad < 3) score += 10;
    
    // Evaluar peso vs referencia
    if (pesoPromedio >= referenceWeights.ideal) score += 15;
    else if (pesoPromedio >= referenceWeights.min) score += 5;
    else if (pesoPromedio < referenceWeights.min) score -= 20;
    
    // Evaluar rentabilidad
    if (margenGanancia > 20) score += 10;
    else if (margenGanancia > 10) score += 5;
    else if (margenGanancia < 0) score -= 25;
    
    // Evaluar crecimiento
    if (tasaCrecimiento > 0.05) score += 10; // Más de 0.05 lb/día
    else if (tasaCrecimiento < 0.02) score -= 15; // Menos de 0.02 lb/día
    
    return Math.max(0, Math.min(100, score));
  };

  const performanceScore = getPerformanceScore();
  
  const getScoreColor = (score: number): string => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.danger;
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Deficiente';
  };

  const getMetricColor = (value: number, type: 'mortality' | 'weight' | 'growth' | 'profit'): string => {
    switch (type) {
      case 'mortality':
        return value <= 3 ? colors.success : value <= 7 ? colors.warning : colors.danger;
      case 'weight':
        return value >= referenceWeights.ideal ? colors.success : 
               value >= referenceWeights.min ? colors.primary : colors.danger;
      case 'growth':
        return value >= 0.05 ? colors.success : value >= 0.02 ? colors.primary : colors.danger;
      case 'profit':
        return value >= 15 ? colors.success : value >= 5 ? colors.primary : 
               value >= 0 ? colors.warning : colors.danger;
      default:
        return colors.textMedium;
    }
  };

  return (
    <Card style={[styles.container, style]}>
      {/* Header con puntuación */}
      <View style={styles.scoreHeader}>
        <View style={styles.scoreSection}>
          <Text style={styles.sectionTitle}>Puntuación de Rendimiento</Text>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(performanceScore) + '20' }]}>
            <Text style={[styles.scoreValue, { color: getScoreColor(performanceScore) }]}>
              {performanceScore.toFixed(0)}
            </Text>
            <Text style={[styles.scoreLabel, { color: getScoreColor(performanceScore) }]}>
              {getScoreLabel(performanceScore)}
            </Text>
          </View>
        </View>
      </View>

      {/* Métricas detalladas */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>Métricas Clave</Text>
        
        <View style={styles.metricsGrid}>
          {/* Mortalidad */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="pulse" size={20} color={getMetricColor(tasaMortalidad, 'mortality')} />
              <Text style={styles.metricTitle}>Mortalidad</Text>
            </View>
            <Text style={[styles.metricValue, { color: getMetricColor(tasaMortalidad, 'mortality') }]}>
              {tasaMortalidad.toFixed(1)}%
            </Text>
            <Text style={styles.metricSubtitle}>
              {cantidadInicial - cantidadActual} de {cantidadInicial} aves
            </Text>
          </View>

          {/* Peso */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="scale" size={20} color={getMetricColor(pesoPromedio, 'weight')} />
              <Text style={styles.metricTitle}>Peso Promedio</Text>
            </View>
            <Text style={[styles.metricValue, { color: getMetricColor(pesoPromedio, 'weight') }]}>
              {formatWeight(pesoPromedio, WeightUnit.POUNDS)}
            </Text>
            <Text style={styles.metricSubtitle}>
              Meta: {formatWeight(referenceWeights.ideal, WeightUnit.POUNDS)}
            </Text>
          </View>

          {/* Crecimiento */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="trending-up" size={20} color={getMetricColor(tasaCrecimiento, 'growth')} />
              <Text style={styles.metricTitle}>Crecimiento</Text>
            </View>
            <Text style={[styles.metricValue, { color: getMetricColor(tasaCrecimiento, 'growth') }]}>
              {formatWeight(tasaCrecimiento, WeightUnit.POUNDS, 3)}/día
            </Text>
            <Text style={styles.metricSubtitle}>
              {edadActual} días de edad
            </Text>
          </View>

          {/* Rentabilidad */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Ionicons name="cash" size={20} color={getMetricColor(margenGanancia, 'profit')} />
              <Text style={styles.metricTitle}>ROI</Text>
            </View>
            <Text style={[styles.metricValue, { color: getMetricColor(margenGanancia, 'profit') }]}>
              {margenGanancia.toFixed(1)}%
            </Text>
            <Text style={styles.metricSubtitle}>
              RD${(ingresoTotal - gastoTotal).toFixed(0)} ganancia
            </Text>
          </View>
        </View>
      </View>

      {/* Eficiencia */}
      <View style={styles.efficiencySection}>
        <Text style={styles.sectionTitle}>Indicadores de Eficiencia</Text>
        
        <View style={styles.efficiencyMetrics}>
          <View style={styles.efficiencyItem}>
            <Text style={styles.efficiencyLabel}>Conversión Alimenticia</Text>
            <Text style={styles.efficiencyValue}>
              {registrosPeso.length > 0 ? 'N/A' : 'Sin datos'}
            </Text>
          </View>
          
          <View style={styles.efficiencyItem}>
            <Text style={styles.efficiencyLabel}>Costo por Libra</Text>
            <Text style={styles.efficiencyValue}>
              RD${pesoPromedio > 0 ? (gastoTotal / (cantidadActual * pesoPromedio)).toFixed(2) : '0.00'}
            </Text>
          </View>
          
          <View style={styles.efficiencyItem}>
            <Text style={styles.efficiencyLabel}>Supervivencia</Text>
            <Text style={[styles.efficiencyValue, { 
              color: (100 - tasaMortalidad) >= 95 ? colors.success : 
                     (100 - tasaMortalidad) >= 90 ? colors.primary : colors.warning 
            }]}>
              {(100 - tasaMortalidad).toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  scoreHeader: {
    marginBottom: 20,
  },
  scoreSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  scoreBadge: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  metricsSection: {
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMedium,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 11,
    color: colors.textMedium,
  },
  efficiencySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  efficiencyMetrics: {
    gap: 12,
  },
  efficiencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  efficiencyLabel: {
    fontSize: 14,
    color: colors.textMedium,
    fontWeight: '500',
  },
  efficiencyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
  },
});