/**
 * Componente de Estadísticas de Costos de Producción
 * Muestra un análisis avanzado de los costos unitarios por tipo de lote y desglose de gastos
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { obtenerEstadisticasGastos } from '../../services/gastos.service';
import Card from '../ui/Card';

interface CostProductionStatsProps {
  isLoading?: boolean;
}

export default function CostProductionStats({ isLoading = false }: CostProductionStatsProps) {
  const [stats, setStats] = useState<{
    ponedoras: number;
    israelies: number;
    engorde: number;
    total: number;
  } | null>(null);
  
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await obtenerEstadisticasGastos();
        setStats(data);
      } catch (error) {
        console.error('Error loading cost stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  const loading = isLoading || loadingStats;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando análisis de costos...</Text>
        </View>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return null; // No mostrar si no hay datos
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="pie-chart" size={24} color={colors.textDark} />
          <Text style={styles.title}>Análisis de Costos</Text>
        </View>
        <Text style={styles.totalLabel}>
          Total: <Text style={styles.totalValue}>{formatCurrency(stats.total)}</Text>
        </Text>
      </View>

      <View style={styles.breakdownContainer}>
        {/* Ponedoras */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.categoryName}>Ponedoras</Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={styles.categoryAmount}>{formatCurrency(stats.ponedoras)}</Text>
            <Text style={styles.categoryPercentage}>
              {formatPercentage(stats.ponedoras, stats.total)}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: colors.primary,
                width: formatPercentage(stats.ponedoras, stats.total)
              }
            ]} 
          />
        </View>

        {/* Engorde */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: colors.warning }]} />
            <Text style={styles.categoryName}>Engorde</Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={styles.categoryAmount}>{formatCurrency(stats.engorde)}</Text>
            <Text style={styles.categoryPercentage}>
              {formatPercentage(stats.engorde, stats.total)}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: colors.warning,
                width: formatPercentage(stats.engorde, stats.total)
              }
            ]} 
          />
        </View>

        {/* Levantes (Israelíes) */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: colors.success }]} />
            <Text style={styles.categoryName}>Levantes</Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={styles.categoryAmount}>{formatCurrency(stats.israelies)}</Text>
            <Text style={styles.categoryPercentage}>
              {formatPercentage(stats.israelies, stats.total)}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: colors.success,
                width: formatPercentage(stats.israelies, stats.total)
              }
            ]} 
          />
        </View>
      </View>

      <View style={styles.insightContainer}>
        <Ionicons name="bulb-outline" size={20} color={colors.secondary} />
        <Text style={styles.insightText}>
          El mayor centro de costos es{' '}
          <Text style={styles.insightHighlight}>
            {stats.ponedoras > stats.engorde && stats.ponedoras > stats.israelies ? 'Ponedoras' :
             stats.engorde > stats.ponedoras && stats.engorde > stats.israelies ? 'Engorde' : 'Levantes'}
          </Text>
          {' '}con un {Math.max(
            (stats.ponedoras/stats.total)*100, 
            (stats.engorde/stats.total)*100, 
            (stats.israelies/stats.total)*100
          ).toFixed(1)}% del total.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: colors.textMedium,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  totalValue: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  breakdownContainer: {
    gap: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  categoryValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryAmount: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
  },
  categoryPercentage: {
    fontSize: 12,
    color: colors.textMedium,
    width: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.veryLightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.secondary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: colors.secondary,
  },
});

