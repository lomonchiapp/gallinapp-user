/**
 * Componente para mostrar el análisis de costo de producción de huevos
 * Implementa las especificaciones del cliente para el cálculo de costos diarios
 */

import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import {
    useAlertasCostoHuevos,
    useCostoDelDiaActual,
    useCostosProduccionHuevos
} from '../../hooks/useCostosProduccionHuevos';
import { AlertaCostoHuevo } from '../../types/costosProduccionHuevos';

interface CostoProduccionHuevosProps {
  loteId: string;
  nombreLote?: string;
  showDetailed?: boolean;
  onNavigateToDetails?: () => void;
}

export const CostoProduccionHuevos: React.FC<CostoProduccionHuevosProps> = ({
  loteId,
  nombreLote,
  showDetailed = false,
  onNavigateToDetails
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Hooks para datos de costos
  const {
    costoDelDia,
    analisisPorFases,
    estadisticasRendimiento,
    isLoadingCostoDiario,
    isLoadingAnalisis,
    isLoadingEstadisticas,
    error,
    calcularCostoDiario,
    analizarCostoPorFases,
    obtenerEstadisticasRendimiento,
    refetchAll
  } = useCostosProduccionHuevos();

  const { costo: costoActual, isLoading: loadingCostoActual } = useCostoDelDiaActual(loteId);
  const { alertas, alertasCriticas, alertasWarning } = useAlertasCostoHuevos(loteId);

  // Cargar datos iniciales
  useEffect(() => {
    if (loteId) {
      if (showDetailed) {
        refetchAll(loteId);
      } else {
        calcularCostoDiario(loteId);
      }
    }
  }, [loteId, showDetailed]);

  // Manejar refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (showDetailed) {
        await refetchAll(loteId);
      } else {
        await calcularCostoDiario(loteId);
      }
    } catch (err) {
      console.error('Error al refrescar datos de costo:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Mostrar error si existe
  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={32} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showDetailed) {
    return <CostoProduccionDetallado />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Costo del día actual */}
      <CostoDelDiaCard 
        costo={costoActual}
        isLoading={loadingCostoActual || isLoadingCostoDiario}
        costoDelDia={costoDelDia}
        nombreLote={nombreLote}
      />

      {/* Alertas si existen */}
      {alertas.length > 0 && (
        <AlertasCard 
          alertas={alertas.slice(0, 3)} 
          totalCriticas={alertasCriticas}
          totalWarning={alertasWarning}
        />
      )}

      {/* Métricas rápidas */}
      {analisisPorFases && (
        <MetricasRapidas 
          analisis={analisisPorFases}
          estadisticas={estadisticasRendimiento}
        />
      )}

      {/* Botón para ver detalles */}
      {onNavigateToDetails && (
        <TouchableOpacity style={styles.detailsButton} onPress={onNavigateToDetails}>
          <MaterialIcons name="analytics" size={20} color="#3498db" />
          <Text style={styles.detailsButtonText}>Ver Análisis Completo</Text>
          <MaterialIcons name="chevron-right" size={20} color="#3498db" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

// Componente para mostrar el costo del día actual
const CostoDelDiaCard: React.FC<{
  costo: number | null;
  isLoading: boolean;
  costoDelDia: any;
  nombreLote?: string;
}> = ({ costo, isLoading, costoDelDia, nombreLote }) => {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <View style={styles.costoDelDiaCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="egg" size={24} color="#f39c12" />
        <Text style={styles.cardTitle}>
          Costo por Huevo - {nombreLote || 'Hoy'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculando...</Text>
        </View>
      ) : costo !== null ? (
        <View style={styles.costoContainer}>
          <Text style={styles.costoActual}>{formatCurrency(costo)}</Text>
          <Text style={styles.costoSubtitle}>por huevo</Text>
          
          {costoDelDia && (
            <View style={styles.detallesDelDia}>
              <View style={styles.detalleRow}>
                <Text style={styles.detalleLabel}>Huevos producidos:</Text>
                <Text style={styles.detalleValue}>{costoDelDia.cantidadHuevos}</Text>
              </View>
              <View style={styles.detalleRow}>
                <Text style={styles.detalleLabel}>Gasto total del día:</Text>
                <Text style={styles.detalleValue}>{formatCurrency(costoDelDia.gastoTotalDelDia)}</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            Sin datos de producción para hoy
          </Text>
        </View>
      )}
    </View>
  );
};

// Componente para mostrar alertas
const AlertasCard: React.FC<{
  alertas: AlertaCostoHuevo[];
  totalCriticas: number;
  totalWarning: number;
}> = ({ alertas, totalCriticas, totalWarning }) => {
  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'COSTO_ALTO': return 'trending-up';
      case 'BAJA_PRODUCCION': return 'trending-down';
      case 'INEFICIENCIA': return 'warning';
      case 'INCREMENTO_GASTOS': return 'show-chart';
      default: return 'info';
    }
  };

  const getAlertColor = (severidad: string) => {
    switch (severidad) {
      case 'CRITICAL': return '#e74c3c';
      case 'WARNING': return '#f39c12';
      default: return '#3498db';
    }
  };

  return (
    <View style={styles.alertasCard}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="notification-important" size={24} color="#e74c3c" />
        <Text style={styles.cardTitle}>Alertas de Costo</Text>
        <View style={styles.alertasBadge}>
          <Text style={styles.alertasBadgeText}>
            {totalCriticas + totalWarning}
          </Text>
        </View>
      </View>

      {alertas.map((alerta, index) => (
        <View key={index} style={styles.alertaItem}>
          <MaterialIcons 
            name={getAlertIcon(alerta.tipo) as any}
            size={20} 
            color={getAlertColor(alerta.severidad)} 
          />
          <View style={styles.alertaContent}>
            <Text style={styles.alertaMensaje}>{alerta.mensaje}</Text>
            <Text style={styles.alertaRecomendacion}>{alerta.accionRecomendada}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Componente para métricas rápidas
const MetricasRapidas: React.FC<{
  analisis: any;
  estadisticas: any;
}> = ({ analisis, estadisticas }) => {
  return (
    <View style={styles.metricasCard}>
      <Text style={styles.cardTitle}>Métricas de Rendimiento</Text>
      
      <View style={styles.metricasGrid}>
        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>
            {analisis?.rentabilidad?.toFixed(1) || '0'}%
          </Text>
          <Text style={styles.metricaLabel}>Rentabilidad</Text>
        </View>
        
        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>
            {estadisticas?.eficienciaProduccion?.toFixed(1) || '0'}%
          </Text>
          <Text style={styles.metricaLabel}>Eficiencia</Text>
        </View>
        
        <View style={styles.metricaItem}>
          <Text style={styles.metricaValor}>
            {estadisticas?.promedioHuevosPorDia?.toFixed(0) || '0'}
          </Text>
          <Text style={styles.metricaLabel}>Huevos/día</Text>
        </View>
      </View>
    </View>
  );
};

// Componente detallado (para pantalla completa)
const CostoProduccionDetallado: React.FC = () => {
  return (
    <ScrollView style={styles.detalladoContainer}>
      <Text style={styles.detalladoTitle}>Análisis Completo de Costos</Text>
      {/* Aquí iría el dashboard completo */}
      <Text style={styles.placeholderText}>
        Dashboard detallado próximamente...
      </Text>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginVertical: 10
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  costoDelDiaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    color: '#2c3e50'
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  loadingText: {
    color: '#7f8c8d',
    fontSize: 16
  },
  costoContainer: {
    alignItems: 'center'
  },
  costoActual: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#27ae60'
  },
  costoSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 16
  },
  detallesDelDia: {
    width: '100%',
    marginTop: 16
  },
  detalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  detalleLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  detalleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  noDataText: {
    color: '#7f8c8d',
    fontSize: 16,
    textAlign: 'center'
  },
  alertasCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  alertasBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8
  },
  alertasBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  alertaItem: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start'
  },
  alertaContent: {
    flex: 1,
    marginLeft: 12
  },
  alertaMensaje: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600'
  },
  alertaRecomendacion: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2
  },
  metricasCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  metricasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  metricaItem: {
    alignItems: 'center',
    flex: 1
  },
  metricaValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db'
  },
  metricaLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center'
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    flex: 1,
    marginLeft: 8
  },
  detalladoContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16
  },
  detalladoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center'
  },
  placeholderText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 40
  }
};

export default CostoProduccionHuevos;















