/**
 * Dashboard comparativo entre lotes
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../constants/colors';
import { ComparativaLotes, LoteComparativo, obtenerDatosComparativos } from '../../services/analytics.service';
import { TipoAve } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import Card from './Card';

interface ComparativeDashboardProps {
  tipoAve: TipoAve;
  onLotePress?: (loteId: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ComparativeDashboard({ tipoAve, onLotePress }: ComparativDashboardProps) {
  const [datos, setDatos] = useState<ComparativaLotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'finalizados'>('todos');
  const [ordenPor, setOrdenPor] = useState<'fecha' | 'peso' | 'mortalidad' | 'crecimiento'>('fecha');

  useEffect(() => {
    cargarDatos();
  }, [tipoAve]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const resultado = await obtenerDatosComparativos(tipoAve, true);
      setDatos(resultado);
    } catch (err) {
      setError('Error al cargar datos comparativos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLotesFiltrados = (): LoteComparativo[] => {
    if (!datos) return [];
    
    let lotesFiltrados = [...datos.lotes];
    
    // Aplicar filtro de estado
    if (filtroEstado === 'activos') {
      lotesFiltrados = lotesFiltrados.filter(lote => lote.estado === 'activo');
    } else if (filtroEstado === 'finalizados') {
      lotesFiltrados = lotesFiltrados.filter(lote => lote.estado === 'finalizado');
    }
    
    // Aplicar ordenamiento
    lotesFiltrados.sort((a, b) => {
      switch (ordenPor) {
        case 'peso':
          return b.pesoPromedio - a.pesoPromedio;
        case 'mortalidad':
          return a.tasaMortalidad - b.tasaMortalidad;
        case 'crecimiento':
          return b.gananciaPromedioDiaria - a.gananciaPromedioDiaria;
        case 'fecha':
        default:
          return b.fechaInicio.getTime() - a.fechaInicio.getTime();
      }
    });
    
    return lotesFiltrados;
  };

  const getPerformanceColor = (valor: number, tipo: 'peso' | 'mortalidad' | 'crecimiento', promedio: number): string => {
    switch (tipo) {
      case 'peso':
      case 'crecimiento':
        return valor >= promedio * 1.1 ? colors.success : 
               valor >= promedio * 0.9 ? colors.primary : colors.warning;
      case 'mortalidad':
        return valor <= promedio * 0.8 ? colors.success : 
               valor <= promedio * 1.2 ? colors.primary : colors.danger;
      default:
        return colors.primary;
    }
  };

  const getTipoAveLabel = (tipo: TipoAve): string => {
    switch (tipo) {
      case TipoAve.POLLO_LEVANTE: return 'Levante';
      case TipoAve.POLLO_ENGORDE: return 'Engorde';
      case TipoAve.PONEDORA: return 'Ponedoras';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando comparativa...</Text>
      </View>
    );
  }

  if (error || !datos) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error || 'Error desconocido'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={cargarDatos}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lotesFiltrados = getLotesFiltrados();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Comparativo - {getTipoAveLabel(tipoAve)}</Text>
        <Text style={styles.subtitle}>{lotesFiltrados.length} lotes analizados</Text>
      </View>

      {/* Resumen de promedios */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Promedios Generales</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{datos.promedios.pesoPromedio.toFixed(2)} kg</Text>
            <Text style={styles.metricLabel}>Peso Promedio</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{datos.promedios.mortalidadPromedio.toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Mortalidad</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{(datos.promedios.gananciaPromedio * 1000).toFixed(0)}g/día</Text>
            <Text style={styles.metricLabel}>Crecimiento</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{datos.promedios.edadPromedio.toFixed(0)} días</Text>
            <Text style={styles.metricLabel}>Edad Promedio</Text>
          </View>
        </View>
      </Card>

      {/* Mejores lotes */}
      {(datos.mejorLote.mejorCrecimiento || datos.mejorLote.menorMortalidad) && (
        <Card style={styles.bestLotesCard}>
          <Text style={styles.cardTitle}>Lotes Destacados</Text>
          
          {datos.mejorLote.mejorCrecimiento && (
            <TouchableOpacity 
              style={styles.bestLoteItem}
              onPress={() => onLotePress?.(datos.mejorLote.mejorCrecimiento!.id)}
            >
              <View style={styles.bestLoteIcon}>
                <Ionicons name="trending-up" size={20} color={colors.success} />
              </View>
              <View style={styles.bestLoteInfo}>
                <Text style={styles.bestLoteTitle}>Mejor Crecimiento</Text>
                <Text style={styles.bestLoteName}>{datos.mejorLote.mejorCrecimiento.nombre}</Text>
                <Text style={styles.bestLoteValue}>
                  {(datos.mejorLote.mejorCrecimiento.gananciaPromedioDiaria * 1000).toFixed(0)}g/día
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {datos.mejorLote.menorMortalidad && (
            <TouchableOpacity 
              style={styles.bestLoteItem}
              onPress={() => onLotePress?.(datos.mejorLote.menorMortalidad!.id)}
            >
              <View style={styles.bestLoteIcon}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              </View>
              <View style={styles.bestLoteInfo}>
                <Text style={styles.bestLoteTitle}>Menor Mortalidad</Text>
                <Text style={styles.bestLoteName}>{datos.mejorLote.menorMortalidad.nombre}</Text>
                <Text style={styles.bestLoteValue}>
                  {datos.mejorLote.menorMortalidad.tasaMortalidad.toFixed(1)}%
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Controles de filtrado */}
      <Card style={styles.filtersCard}>
        <View style={styles.filtersRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Estado:</Text>
            <View style={styles.filterButtons}>
              {(['todos', 'activos', 'finalizados'] as const).map(estado => (
                <TouchableOpacity
                  key={estado}
                  style={[
                    styles.filterButton,
                    filtroEstado === estado && styles.filterButtonActive
                  ]}
                  onPress={() => setFiltroEstado(estado)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filtroEstado === estado && styles.filterButtonTextActive
                  ]}>
                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Ordenar por:</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'fecha', label: 'Fecha' },
                { key: 'peso', label: 'Peso' },
                { key: 'mortalidad', label: 'Mortalidad' },
                { key: 'crecimiento', label: 'Crecimiento' }
              ].map(orden => (
                <TouchableOpacity
                  key={orden.key}
                  style={[
                    styles.filterButton,
                    ordenPor === orden.key && styles.filterButtonActive
                  ]}
                  onPress={() => setOrdenPor(orden.key as any)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    ordenPor === orden.key && styles.filterButtonTextActive
                  ]}>
                    {orden.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {/* Lista de lotes comparativa */}
      <View style={styles.lotesContainer}>
        {lotesFiltrados.map((lote, index) => (
          <TouchableOpacity
            key={lote.id}
            style={styles.loteCard}
            onPress={() => onLotePress?.(lote.id)}
          >
            <View style={styles.loteHeader}>
              <View style={styles.loteRank}>
                <Text style={styles.loteRankText}>#{index + 1}</Text>
              </View>
              <View style={styles.loteInfo}>
                <Text style={styles.loteNombre}>{lote.nombre}</Text>
                <Text style={styles.loteFecha}>{formatDate(lote.fechaInicio)}</Text>
                <View style={styles.loteStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: lote.estado === 'activo' ? colors.success + '20' : colors.textMedium + '20' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: lote.estado === 'activo' ? colors.success : colors.textMedium }
                    ]}>
                      {lote.estado === 'activo' ? 'Activo' : 'Finalizado'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.loteMetrics}>
              <View style={styles.loteMetric}>
                <Text style={[
                  styles.loteMetricValue,
                  { color: getPerformanceColor(lote.pesoPromedio, 'peso', datos.promedios.pesoPromedio) }
                ]}>
                  {lote.pesoPromedio.toFixed(2)} kg
                </Text>
                <Text style={styles.loteMetricLabel}>Peso</Text>
              </View>
              
              <View style={styles.loteMetric}>
                <Text style={[
                  styles.loteMetricValue,
                  { color: getPerformanceColor(lote.tasaMortalidad, 'mortalidad', datos.promedios.mortalidadPromedio) }
                ]}>
                  {lote.tasaMortalidad.toFixed(1)}%
                </Text>
                <Text style={styles.loteMetricLabel}>Mortalidad</Text>
              </View>
              
              <View style={styles.loteMetric}>
                 <Text style={[
                   styles.loteMetricValue,
                   { color: getPerformanceColor(lote.gananciaPromedioDiaria, 'crecimiento', datos.promedios.gananciaPromedio) }
                 ]}>
                   {(lote.gananciaPromedioDiaria * 1000).toFixed(0)}g/día
                 </Text>
                <Text style={styles.loteMetricLabel}>Crecimiento</Text>
              </View>
              
              <View style={styles.loteMetric}>
                <Text style={styles.loteMetricValue}>
                  {lote.edadActual} días
                </Text>
                <Text style={styles.loteMetricLabel}>Edad</Text>
              </View>
            </View>

            {/* Indicador de rendimiento relativo */}
            <View style={styles.performanceIndicator}>
              {lote.pesoPromedio >= datos.promedios.pesoPromedio * 1.1 && (
                <View style={styles.performanceBadge}>
                  <Ionicons name="trending-up" size={12} color={colors.success} />
                  <Text style={[styles.performanceBadgeText, { color: colors.success }]}>
                    Alto rendimiento
                  </Text>
                </View>
              )}
              {lote.tasaMortalidad <= datos.promedios.mortalidadPromedio * 0.8 && (
                <View style={styles.performanceBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={[styles.performanceBadgeText, { color: colors.primary }]}>
                    Baja mortalidad
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {lotesFiltrados.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="analytics" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay lotes para comparar</Text>
          <Text style={styles.emptyText}>
            Los lotes aparecerán aquí cuando tengas datos registrados
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 4,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  bestLotesCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  bestLoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  bestLoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bestLoteInfo: {
    flex: 1,
  },
  bestLoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  bestLoteName: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  bestLoteValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 2,
  },
  filtersCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  filtersRow: {
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.veryLightGray,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  lotesContainer: {
    paddingHorizontal: 16,
  },
  loteCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  loteRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loteRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  loteInfo: {
    flex: 1,
  },
  loteNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  loteFecha: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  loteStatus: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loteMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  loteMetric: {
    alignItems: 'center',
    flex: 1,
  },
  loteMetricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loteMetricLabel: {
    fontSize: 10,
    color: colors.textMedium,
    marginTop: 2,
  },
  performanceIndicator: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
  },
  performanceBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 8,
  },
});
