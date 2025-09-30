/**
 * Tab de Estadísticas de Pollos Levantes
 */

import { EstadoLote, TipoAve } from '@/src/types/enums';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../../../src/components/ui/Card';
import CostUnitarioBadge from '../../../src/components/ui/CostUnitarioBadge';
import { colors } from '../../../src/constants/colors';
import { useGastosSubscription } from '../../../src/hooks/useGastosSubscription';
import { useLevantesStore } from '../../../src/stores/levantesStore';

export default function EstadisticasTab() {
  const { lotes, suscribirseALevantes } = useLevantesStore();
  const { gastos, estadisticasGastos } = useGastosSubscription(TipoAve.POLLO_LEVANTE);
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'año'>('mes');

  useEffect(() => {
    const unsubscribe = suscribirseALevantes();
    console.log('📊 EstadisticasTab Levantes: Componente montado');
    return () => unsubscribe;
  }, []);

  // Función para calcular edad en semanas
  const calcularEdadEnSemanas = (fechaNacimiento: any) => {
    try {
      let fecha: Date;
      
      // Manejar diferentes tipos de fecha (timestamp de Firebase, string, Date)
      if (fechaNacimiento && typeof fechaNacimiento === 'object' && fechaNacimiento.seconds) {
        // Timestamp de Firebase
        fecha = new Date(fechaNacimiento.seconds * 1000);
      } else if (typeof fechaNacimiento === 'string') {
        // String de fecha
        fecha = new Date(fechaNacimiento);
      } else if (fechaNacimiento instanceof Date) {
        // Objeto Date
        fecha = fechaNacimiento;
      } else {
        console.warn('Tipo de fecha no reconocido:', typeof fechaNacimiento, fechaNacimiento);
        return 0;
      }
      
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaNacimiento);
        return 0;
      }
      
      const ahora = new Date();
      const diferenciaMs = ahora.getTime() - fecha.getTime();
      const semanas = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24 * 7));
      return Math.max(0, semanas); // No permitir valores negativos
    } catch (error) {
      console.error('Error calculando edad en semanas:', error, fechaNacimiento);
      return 0;
    }
  };

  // Función para calcular edad en días
  const calcularEdadEnDias = (fechaNacimiento: any) => {
    try {
      let fecha: Date;
      
      // Manejar diferentes tipos de fecha (timestamp de Firebase, string, Date)
      if (fechaNacimiento && typeof fechaNacimiento === 'object' && fechaNacimiento.seconds) {
        // Timestamp de Firebase
        fecha = new Date(fechaNacimiento.seconds * 1000);
      } else if (typeof fechaNacimiento === 'string') {
        // String de fecha
        fecha = new Date(fechaNacimiento);
      } else if (fechaNacimiento instanceof Date) {
        // Objeto Date
        fecha = fechaNacimiento;
      } else {
        console.warn('Tipo de fecha no reconocido:', typeof fechaNacimiento, fechaNacimiento);
        return 0;
      }
      
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaNacimiento);
        return 0;
      }
      
      const ahora = new Date();
      const diferenciaMs = ahora.getTime() - fecha.getTime();
      const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
      return Math.max(0, dias); // No permitir valores negativos
    } catch (error) {
      console.error('Error calculando edad en días:', error, fechaNacimiento);
      return 0;
    }
  };

  // Calcular estadísticas generales
  const estadisticasGenerales = useMemo(() => {
    if (!lotes || lotes.length === 0) {
      return {
        totalLotes: 0,
        lotesActivos: 0,
        totalPollos: 0,
        totalMuertes: 0,
        edadPromedio: 0,
        tasaMortalidad: 0,
        pollosVivos: 0
      };
    }

    const lotesActivos = lotes.filter(lote => lote.estado === EstadoLote.ACTIVO);
    const totalPollos = lotesActivos.reduce((sum, lote) => sum + lote.cantidadActual, 0);
    const totalMuertes = 0; // TODO: Implementar cuando tengamos estadísticas de mortalidad
    
    // Calcular edad promedio en semanas
    const edadPromedio = lotesActivos.length > 0 
      ? lotesActivos.reduce((sum, lote) => {
          return sum + calcularEdadEnSemanas(lote.fechaNacimiento);
        }, 0) / lotesActivos.length
      : 0;
    
    // Calcular tasa de mortalidad
    const tasaMortalidad = totalPollos > 0 ? (totalMuertes / totalPollos) * 100 : 0;
    
    return {
      totalLotes: lotes.length,
      lotesActivos: lotesActivos.length,
      totalPollos,
      totalMuertes,
      edadPromedio,
      tasaMortalidad,
      pollosVivos: totalPollos - totalMuertes
    };
  }, [lotes]);

  // Calcular gasto promedio por pollo usando los datos del hook
  const gastoPromedioPorPollo = estadisticasGenerales.pollosVivos > 0
    ? estadisticasGastos.gastoTotal / estadisticasGenerales.pollosVivos
    : 0;

  // Calcular estadísticas por lote
  const estadisticasPorLote = useMemo(() => {
    if (!lotes || lotes.length === 0) return [];
    
    return lotes.map(lote => {
      const edadSemanas = calcularEdadEnSemanas(lote.fechaNacimiento);
      const muertes = 0; // TODO: Implementar cuando tengamos estadísticas de mortalidad
      const pollosVivos = lote.cantidadActual - muertes;
      
      return {
        ...lote,
        edadSemanas,
        muertes,
        pollosVivos
      };
    }).sort((a, b) => b.cantidadActual - a.cantidadActual);
  }, [lotes]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Resumen General */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen General</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Ionicons name="nutrition" size={24} color={colors.israelies} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.totalPollos.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Pollos Totales</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="people" size={24} color={colors.israelies} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.pollosVivos.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Pollos Activos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="calendar" size={24} color={colors.success} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.edadPromedio.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>Semanas Promedio</Text>
          </View>
          <View style={styles.summaryItem}>
            <Ionicons name="list" size={24} color={colors.primary} />
            <Text style={styles.summaryValue}>{estadisticasGenerales.lotesActivos}</Text>
            <Text style={styles.summaryLabel}>Lotes Activos</Text>
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
              <Text style={styles.metricDescription}>Porcentaje de pollos perdidos</Text>
            </View>
            <View style={styles.metricValue}>
              <Text style={[styles.metricNumber, { color: estadisticasGenerales.tasaMortalidad > 5 ? colors.danger : colors.success }]}>
                {estadisticasGenerales.tasaMortalidad.toFixed(1)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>Edad Promedio</Text>
              <Text style={styles.metricDescription}>Semanas promedio de los lotes</Text>
            </View>
            <View style={styles.metricValue}>
              <Text style={[styles.metricNumber, { color: colors.israelies }]}>
                {estadisticasGenerales.edadPromedio.toFixed(1)} semanas
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

      {/* Top Lotes por Cantidad */}
      <Card style={styles.topLotesCard}>
        <Text style={styles.cardTitle}>Top Lotes por Cantidad</Text>
        <Text style={styles.cardSubtitle}>Ordenados por número de pollos</Text>
        
        {estadisticasPorLote.slice(0, 5).map((lote, index) => (
          <View key={lote.id} style={styles.topLoteItem}>
            <View style={styles.topLoteRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.topLoteInfo}>
              <Text style={styles.topLoteName}>{lote.nombre}</Text>
              <Text style={styles.topLoteDetails}>
                {lote.pollosVivos} pollos • {lote.edadSemanas} semanas ({calcularEdadEnDias(lote.fechaNacimiento)}d) • {lote.raza}
              </Text>
            </View>
            <View style={styles.topLoteValue}>
              <Text style={styles.topLoteCantidad}>{lote.cantidadActual}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Análisis de Edades */}
      <Card style={styles.efficiencyCard}>
        <Text style={styles.cardTitle}>Análisis de Edades</Text>
        
        <View style={styles.efficiencyItem}>
          <View style={styles.efficiencyIcon}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </View>
          <View style={styles.efficiencyContent}>
            <Text style={styles.efficiencyLabel}>Lotes Jóvenes (0-4 semanas)</Text>
            <Text style={styles.efficiencyValue}>
              {estadisticasPorLote.filter(lote => lote.edadSemanas <= 4).length} lotes
            </Text>
          </View>
        </View>
        
        <View style={styles.efficiencyItem}>
          <View style={styles.efficiencyIcon}>
            <Ionicons name="warning" size={20} color={colors.warning} />
          </View>
          <View style={styles.efficiencyContent}>
            <Text style={styles.efficiencyLabel}>Lotes Intermedios (5-8 semanas)</Text>
            <Text style={styles.efficiencyValue}>
              {estadisticasPorLote.filter(lote => lote.edadSemanas > 4 && lote.edadSemanas <= 8).length} lotes
            </Text>
          </View>
        </View>
        
        <View style={styles.efficiencyItem}>
          <View style={styles.efficiencyIcon}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
          </View>
          <View style={styles.efficiencyContent}>
            <Text style={styles.efficiencyLabel}>Lotes Maduros (+8 semanas)</Text>
            <Text style={styles.efficiencyValue}>
              {estadisticasPorLote.filter(lote => lote.edadSemanas > 8).length} lotes
            </Text>
          </View>
        </View>
      </Card>

      {/* Proyecciones de Crecimiento */}
      <Card style={styles.projectionCard}>
        <Text style={styles.cardTitle}>Proyecciones de Crecimiento</Text>
        <Text style={styles.cardSubtitle}>Basado en el estado actual de los lotes</Text>
        
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Pollos Listos para Venta (8+ semanas)</Text>
          <Text style={styles.projectionValue}>
            {estadisticasPorLote.filter(lote => lote.edadSemanas >= 8).length} lotes
          </Text>
        </View>
        
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Pollos en Crecimiento (4-7 semanas)</Text>
          <Text style={styles.projectionValue}>
            {estadisticasPorLote.filter(lote => lote.edadSemanas >= 4 && lote.edadSemanas < 8).length} lotes
          </Text>
        </View>
        
        <View style={styles.projectionItem}>
          <Text style={styles.projectionLabel}>Pollos en Desarrollo (0-3 semanas)</Text>
          <Text style={styles.projectionValue}>
            {estadisticasPorLote.filter(lote => lote.edadSemanas < 4).length} lotes
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
              <Text style={styles.gastoLabel}>Gasto por Pollo</Text>
              <Text style={styles.gastoValue}>${gastoPromedioPorPollo.toFixed(2)}</Text>
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
              cantidadActual={estadisticasGenerales.pollosVivos}
              loteId="general"
              tipoLote="POLLO_LEVANTE"
              size="medium"
              style={styles.cpuBadge}
            />
            <Text style={styles.cpuDescription}>
              Costo promedio por pollo basado en gastos totales
            </Text>
          </View>
        </View>
      </Card>

      {/* Distribución por Raza */}
      <Card style={styles.breedCard}>
        <Text style={styles.cardTitle}>Distribución por Raza</Text>
        <Text style={styles.cardSubtitle}>Cantidad de pollos por tipo de raza</Text>
        
        {(() => {
          const razas = estadisticasPorLote.reduce((acc, lote) => {
            acc[lote.raza] = (acc[lote.raza] || 0) + lote.cantidadActual;
            return acc;
          }, {} as Record<string, number>);
          
          return Object.entries(razas).map(([raza, cantidad]) => (
            <View key={raza} style={styles.breedItem}>
              <Text style={styles.breedName}>{raza}</Text>
              <Text style={styles.breedCount}>{cantidad} pollos</Text>
            </View>
          ));
        })()}
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
    color: colors.israelies,
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
  topLoteCantidad: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.israelies,
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
  breedCard: {
    marginBottom: 16,
  },
  breedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  breedName: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  breedCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.israelies,
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
