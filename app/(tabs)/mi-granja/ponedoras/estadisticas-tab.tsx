/**
 * Tab de Estadísticas de Gallinas Ponedoras
 */

import Card from '@/src/components/ui/Card';
import CostUnitarioBadge from '@/src/components/ui/CostUnitarioBadge';
import { colors } from '@/src/constants/colors';
import { useGastosSubscription } from '@/src/hooks/useGastosSubscription';
import { usePonedorasStore } from '@/src/stores/ponedorasStore';
import { EstadoLote, TipoAve } from '@/src/types/enums';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EstadisticasTab() {
  const { lotes, estadisticasLotes, cargarLotes, cargarEstadisticasLotes } = usePonedorasStore();
  const { gastos, estadisticasGastos } = useGastosSubscription(TipoAve.PONEDORA);
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'año'>('mes');

  useEffect(() => {
    cargarLotes();
    console.log('📊 EstadisticasTab Ponedoras: Componente montado');
  }, []);

  useEffect(() => {
    if (lotes.length > 0) {
      cargarEstadisticasLotes();
    }
  }, [lotes]);

  // Calcular estadísticas generales
  const estadisticasGenerales = useMemo(() => {
    const lotesActivos = lotes.filter(lote => lote.estado === EstadoLote.ACTIVO);
    const totalGallinas = lotesActivos.reduce((sum, lote) => sum + lote.cantidadActual, 0);
    const totalGallinasInicial = lotesActivos.reduce((sum, lote) => sum + lote.cantidadInicial, 0); // Para CPU
    const totalHuevos = Object.values(estadisticasLotes).reduce((sum, stats) => sum + (stats.huevos || 0), 0);
    const totalMuertes = Object.values(estadisticasLotes).reduce((sum, stats) => sum + (stats.muertes || 0), 0);
    
    // Calcular producción promedio por gallina
    const gallinasVivas = totalGallinas - totalMuertes;
    const produccionPromedio = gallinasVivas > 0 ? totalHuevos / gallinasVivas : 0;
    
    // Calcular tasa de mortalidad
    const tasaMortalidad = totalGallinas > 0 ? (totalMuertes / totalGallinas) * 100 : 0;
    
    return {
      totalLotes: lotes.length,
      lotesActivos: lotesActivos.length,
      totalGallinas,
      totalGallinasInicial, // Para cálculo de CPU
      totalHuevos,
      totalMuertes,
      produccionPromedio,
      tasaMortalidad,
      gallinasVivas
    };
  }, [lotes, estadisticasLotes]);

  // Calcular ingresos estimados (asumiendo precio por huevo)
  const precioHuevo = 0.5; // RD$ por huevo
  const ingresosEstimados = estadisticasGenerales.totalHuevos * precioHuevo;

  // Calcular gasto promedio por gallina usando los datos del hook
  const gastoPromedioPorGallina = estadisticasGenerales.gallinasVivas > 0
    ? estadisticasGastos.gastoTotal / estadisticasGenerales.gallinasVivas
    : 0;

  // Calcular estadísticas por lote
  const estadisticasPorLote = useMemo(() => {
    return lotes.map(lote => {
      const stats = estadisticasLotes[lote.id] || { huevos: 0, muertes: 0 };
      const gallinasVivas = lote.cantidadActual - stats.muertes;
      const produccionPorGallina = gallinasVivas > 0 ? stats.huevos / gallinasVivas : 0;
      const ingresosLote = stats.huevos * precioHuevo;
      
      return {
        ...lote,
        ...stats,
        gallinasVivas,
        produccionPorGallina,
        ingresosLote
      };
    }).sort((a, b) => b.ingresosLote - a.ingresosLote);
  }, [lotes, estadisticasLotes]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Resumen General */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen General</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Ionicons name="egg" size={24} color={colors.ponedoras} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.totalHuevos.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Huevos Totales</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="people" size={24} color={colors.ponedoras} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.gallinasVivas.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Gallinas Activas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.produccionPromedio.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Huevos/Gallina</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="cash" size={24} color={colors.success} />
            <Text style={styles.summaryValue}>${ingresosEstimados.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Ingresos Est.</Text>
          </View>
        </View>
      </Card>

      {/* Métricas de Rendimiento */}
      <Card style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Métricas de Rendimiento</Text>
        <View style={styles.metricsList}>
          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Tasa de Mortalidad</Text>
              <Text style={styles.metricDescription}>Porcentaje de gallinas perdidas</Text>
            </View>
            <View style={styles.metricValue}>
              <Text style={[styles.metricNumber, { color: estadisticasGenerales.tasaMortalidad > 10 ? colors.danger : colors.success }]}>
                {estadisticasGenerales.tasaMortalidad.toFixed(1)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Producción Diaria Promedio</Text>
              <Text style={styles.metricDescription}>Huevos por gallina por día</Text>
            </View>
            <View style={styles.metricValue}>
              <Text style={[styles.metricNumber, { color: colors.ponedoras }]}>
                {(estadisticasGenerales.produccionPromedio / 30).toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Lotes Activos</Text>
              <Text style={styles.metricDescription}>Total de lotes en producción</Text>
            </View>
            <View style={styles.metricValue}>
              <Text style={[styles.metricNumber, { color: colors.primary }]}>
                {estadisticasGenerales.lotesActivos}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Top Lotes por Rendimiento */}
      <Card style={styles.topLotesCard}>
        <Text style={styles.cardTitle}>Top Lotes por Rendimiento</Text>
        <Text style={styles.cardSubtitle}>Ordenados por ingresos estimados</Text>
        
        {estadisticasPorLote.slice(0, 5).map((lote, index) => (
          <View key={lote.id} style={styles.topLoteItem}>
            <View style={styles.topLoteRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.topLoteInfo}>
              <Text style={styles.topLoteName}>{lote.nombre}</Text>
              <Text style={styles.topLoteDetails}>
                {lote.gallinasVivas} gallinas • {lote.huevos} huevos • {lote.produccionPorGallina.toFixed(1)} huevos/gallina
              </Text>
            </View>
            <View style={styles.topLoteValue}>
              <Text style={styles.topLoteIngresos}>${lote.ingresosLote.toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Análisis de Eficiencia */}
      <Card style={styles.efficiencyCard}>
        <Text style={styles.cardTitle}>Análisis de Eficiencia</Text>
        
        <View style={styles.efficiencyItem}>
          <View style={styles.efficiencyIcon}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
          <View style={styles.efficiencyContent}>
            <Text style={styles.efficiencyLabel}>Lotes con Alta Producción</Text>
            <Text style={styles.efficiencyValue}>
              {estadisticasPorLote.filter(lote => lote.produccionPorGallina > 20).length} lotes
            </Text>
          </View>
        </View>
        
        <View style={styles.efficiencyItem}>
          <View style={styles.efficiencyIcon}>
            <Ionicons name="warning" size={20} color={colors.warning} />
          </View>
          <View style={styles.efficiencyContent}>
            <Text style={styles.efficiencyLabel}>Lotes con Baja Producción</Text>
            <Text style={styles.efficiencyValue}>
              {estadisticasPorLote.filter(lote => lote.produccionPorGallina < 10).length} lotes
            </Text>
          </View>
        </View>
        
        <View style={styles.efficiencyItem}>
          <View style={styles.efficiencyIcon}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
          </View>
          <View style={styles.efficiencyContent}>
            <Text style={styles.efficiencyLabel}>Lotes con Alta Mortalidad</Text>
            <Text style={styles.efficiencyValue}>
              {estadisticasPorLote.filter(lote => (lote.muertes / lote.cantidadActual) > 0.1).length} lotes
            </Text>
          </View>
        </View>
      </Card>

      {/* Proyecciones */}
      <Card style={styles.projectionCard}>
        <Text style={styles.cardTitle}>Proyecciones</Text>
        <Text style={styles.cardSubtitle}>Basado en el rendimiento actual</Text>
        
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Producción Mensual Estimada</Text>
          <Text style={styles.projectionValue}>
            {Math.round(estadisticasGenerales.produccionPromedio * estadisticasGenerales.gallinasVivas).toLocaleString()} huevos
          </Text>
        </View>
        
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Ingresos Mensuales Estimados</Text>
          <Text style={styles.projectionValue}>
            ${Math.round(estadisticasGenerales.produccionPromedio * estadisticasGenerales.gallinasVivas * precioHuevo).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Ingresos Anuales Estimados</Text>
          <Text style={styles.projectionValue}>
            ${Math.round(estadisticasGenerales.produccionPromedio * estadisticasGenerales.gallinasVivas * precioHuevo * 12).toLocaleString()}
          </Text>
        </View>
      </Card>

      {/* Información de Gastos de Producción */}
      <Card style={styles.gastosCard}>
        <Text style={styles.cardTitle}>Gastos de Producción</Text>
        <Text style={styles.cardSubtitle}>Información detallada de costos de producción</Text>

        <View style={styles.gastosSummary}>
          <View style={styles.gastoItem}>
            <Ionicons name="cash-outline" size={20} color={colors.danger} />
            <View style={styles.gastoInfo}>
              <Text style={styles.gastoLabel}>Gasto Total</Text>
              <Text style={styles.gastoValue}>${estadisticasGastos.gastoTotal.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.gastoItem}>
            <Ionicons name="person-outline" size={20} color={colors.warning} />
            <View style={styles.gastoInfo}>
              <Text style={styles.gastoLabel}>Gasto por Gallina</Text>
              <Text style={styles.gastoValue}>${gastoPromedioPorGallina.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.gastoItem}>
            <Ionicons name="receipt-outline" size={20} color={colors.info} />
            <View style={styles.gastoInfo}>
              <Text style={styles.gastoLabel}>Transacciones</Text>
              <Text style={styles.gastoValue}>{estadisticasGastos.numeroGastos}</Text>
            </View>
          </View>
        </View>

        {/* Desglose por Categorías */}
        <Text style={styles.sectionTitle}>Desglose por Categorías</Text>
        <View style={styles.categoriasContainer}>
          {Object.entries(estadisticasGastos.gastosPorCategoria).map(([categoria, total]) => (
            <View key={categoria} style={styles.categoriaItem}>
              <Text style={styles.categoriaNombre}>{categoria}</Text>
              <Text style={styles.categoriaTotal}>${total.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Costo de Producción Unitario */}
        <View style={styles.cpuSection}>
          <Text style={styles.sectionTitle}>Costo de Producción Unitario (CPU)</Text>
          <View style={styles.cpuContainer}>
            <CostUnitarioBadge
              costoTotal={estadisticasGastos.gastoTotal}
              cantidadInicial={estadisticasGenerales.totalGallinasInicial}
              cantidadActual={estadisticasGenerales.gallinasVivas}
              loteId="general"
              tipoLote="PONEDORA"
              size="medium"
              style={styles.cpuBadge}
            />
            <Text style={styles.cpuDescription}>
              Costo promedio por gallina basado en gastos totales
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 4,
  },
  metricsCard: {
    marginBottom: 16,
  },
  metricsList: {
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  metricDescription: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  metricValue: {
    alignItems: 'flex-end',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  topLotesCard: {
    marginBottom: 16,
  },
  topLoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  topLoteRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.ponedoras,
  },
  topLoteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topLoteName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  topLoteDetails: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  topLoteValue: {
    alignItems: 'flex-end',
  },
  topLoteIngresos: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  efficiencyCard: {
    marginBottom: 16,
  },
  efficiencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  efficiencyIcon: {
    width: 40,
    alignItems: 'center',
  },
  efficiencyContent: {
    flex: 1,
    marginLeft: 12,
  },
  efficiencyLabel: {
    fontSize: 16,
    color: colors.textDark,
  },
  efficiencyValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
    marginTop: 2,
  },
  projectionCard: {
    marginBottom: 16,
  },
  projectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  projectionLabel: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gastosCard: {
    marginBottom: 16,
  },
  gastosSummary: {
    marginBottom: 20,
  },
  gastoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  gastoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  gastoLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  gastoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
    marginTop: 16,
  },
  categoriasContainer: {
    marginBottom: 20,
  },
  categoriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoriaNombre: {
    fontSize: 14,
    color: colors.textDark,
    flex: 1,
  },
  categoriaTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cpuSection: {
    marginTop: 16,
  },
  cpuContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cpuBadge: {
    marginBottom: 8,
  },
  cpuDescription: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: 'center',
  },
});
