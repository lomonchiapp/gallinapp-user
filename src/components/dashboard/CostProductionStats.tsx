/**
 * Componente de Estadísticas de Costos de Producción
 * Muestra un análisis avanzado de los costos unitarios por tipo de lote y desglose de gastos
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { colors } from '../../constants/colors';
import { borderRadius, spacing, typography } from '../../constants/designSystem';
import { obtenerEstadisticasGastos } from '../../services/gastos.service';
import Card from '../ui/Card';

interface CostProductionStatsProps {
  isLoading?: boolean;
}

export default function CostProductionStats({ isLoading = false }: CostProductionStatsProps) {
  const { colors: themeColors, isDark } = useTheme();
  const [stats, setStats] = useState<{
    ponedoras: number;
    israelies: number;
    engorde: number;
    total: number;
  } | null>(null);
  
  const [loadingStats, setLoadingStats] = useState(true);

  // Colores vibrantes para cada categoría en dark y light mode
  const categoryColors = {
    ponedoras: {
      dot: isDark ? '#FFD700' : '#F57C00', // Dorado/Amarillo
      bar: isDark ? '#FFD700' : '#FF9800',
      text: isDark ? '#FFE082' : '#E65100',
    },
    engorde: {
      dot: isDark ? '#FF8A65' : '#D84315', // Naranja/Rojo
      bar: isDark ? '#FF8A65' : '#FF5722',
      text: isDark ? '#FFAB91' : '#BF360C',
    },
    levantes: {
      dot: isDark ? '#81C784' : '#388E3C', // Verde
      bar: isDark ? '#81C784' : '#4CAF50',
      text: isDark ? '#A5D6A7' : '#1B5E20',
    },
  };

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
          <ActivityIndicator size="small" color={themeColors.primary[500]} />
          <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>
            Cargando análisis de costos...
          </Text>
        </View>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return null; // No mostrar si no hay datos
  }

  return (
    <Card style={[styles.card, { backgroundColor: themeColors.background.secondary }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 152, 0, 0.1)' }]}>
            <Ionicons 
              name="pie-chart" 
              size={24} 
              color={isDark ? '#FFC107' : '#FF9800'} 
            />
          </View>
          <Text style={[styles.title, { color: themeColors.text.primary }]}>
            Análisis de Costos
          </Text>
        </View>
        <View style={[styles.totalBadge, { backgroundColor: isDark ? 'rgba(52, 93, 173, 0.3)' : 'rgba(52, 93, 173, 0.1)' }]}>
          <Text style={[styles.totalLabel, { color: themeColors.text.secondary }]}>
            Total:
          </Text>
          <Text style={[styles.totalValue, { color: themeColors.primary[500] }]}>
            {formatCurrency(stats.total)}
          </Text>
        </View>
      </View>

      <View style={styles.breakdownContainer}>
        {/* Ponedoras */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: categoryColors.ponedoras.dot }]} />
            <Text style={[styles.categoryName, { color: themeColors.text.primary }]}>
              Ponedoras
            </Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={[styles.categoryAmount, { color: categoryColors.ponedoras.text }]}>
              {formatCurrency(stats.ponedoras)}
            </Text>
            <Text style={[styles.categoryPercentage, { color: themeColors.text.secondary }]}>
              {formatPercentage(stats.ponedoras, stats.total)}
            </Text>
          </View>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 152, 0, 0.15)' }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: categoryColors.ponedoras.bar,
                width: formatPercentage(stats.ponedoras, stats.total)
              }
            ]} 
          />
        </View>

        {/* Engorde */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: categoryColors.engorde.dot }]} />
            <Text style={[styles.categoryName, { color: themeColors.text.primary }]}>
              Engorde
            </Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={[styles.categoryAmount, { color: categoryColors.engorde.text }]}>
              {formatCurrency(stats.engorde)}
            </Text>
            <Text style={[styles.categoryPercentage, { color: themeColors.text.secondary }]}>
              {formatPercentage(stats.engorde, stats.total)}
            </Text>
          </View>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(255, 138, 101, 0.2)' : 'rgba(255, 87, 34, 0.15)' }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: categoryColors.engorde.bar,
                width: formatPercentage(stats.engorde, stats.total)
              }
            ]} 
          />
        </View>

        {/* Levantes (Israelíes) */}
        <View style={styles.categoryRow}>
          <View style={styles.categoryInfo}>
            <View style={[styles.dot, { backgroundColor: categoryColors.levantes.dot }]} />
            <Text style={[styles.categoryName, { color: themeColors.text.primary }]}>
              Levantes
            </Text>
          </View>
          <View style={styles.categoryValues}>
            <Text style={[styles.categoryAmount, { color: categoryColors.levantes.text }]}>
              {formatCurrency(stats.israelies)}
            </Text>
            <Text style={[styles.categoryPercentage, { color: themeColors.text.secondary }]}>
              {formatPercentage(stats.israelies, stats.total)}
            </Text>
          </View>
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(129, 199, 132, 0.2)' : 'rgba(76, 175, 80, 0.15)' }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: categoryColors.levantes.bar,
                width: formatPercentage(stats.israelies, stats.total)
              }
            ]} 
          />
        </View>
      </View>

      <View style={[
        styles.insightContainer, 
        { 
          backgroundColor: isDark ? 'rgba(52, 93, 173, 0.2)' : 'rgba(52, 93, 173, 0.1)',
          borderLeftWidth: 3,
          borderLeftColor: themeColors.primary[500],
        }
      ]}>
        <Ionicons 
          name="bulb-outline" 
          size={20} 
          color={isDark ? '#90CAF9' : themeColors.primary[500]} 
        />
        <Text style={[styles.insightText, { color: themeColors.text.primary }]}>
          El mayor centro de costos es{' '}
          <Text style={[styles.insightHighlight, { color: themeColors.primary[500] }]}>
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
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
    gap: spacing[2],
  },
  loadingText: {
    fontSize: typography.sizes.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  totalLabel: {
    fontSize: typography.sizes.sm,
  },
  totalValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  breakdownContainer: {
    gap: spacing[4],
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  categoryValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  categoryAmount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as '700',
  },
  categoryPercentage: {
    fontSize: typography.sizes.xs,
    width: 45,
    textAlign: 'right',
    fontWeight: typography.weights.medium as '500',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[5],
    gap: spacing[2],
  },
  insightText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  insightHighlight: {
    fontWeight: typography.weights.bold as '700',
  },
});

