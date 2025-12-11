/**
 * Dashboard de análisis de costos de producción de huevos
 * Pantalla dedicada para mostrar el análisis completo según requerimientos del cliente
 */

import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

import CostoProduccionHuevos from '../../../../src/components/ui/CostoProduccionHuevos';
import { useCostosProduccionHuevos } from '../../../../src/hooks/useCostosProduccionHuevos';
import { usePonedorasStore } from '../../../../src/stores/ponedorasStore';

const screenWidth = Dimensions.get('window').width;

export default function DashboardCostosHuevos() {
  const router = useRouter();
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  
  const [refreshing, setRefreshing] = useState(false);
  const [vistaActual, setVistaActual] = useState<'resumen' | 'fases' | 'tendencias' | 'alertas'>('resumen');

  // Estados del store
  const { 
    lotes, 
    loteActual,
    cargarLote,
    costosProduccion,
    calcularCostoProduccionDiario,
    analizarCostoPorFases,
    obtenerEstadisticasRendimientoCostos
  } = usePonedorasStore();

  // Hook personalizado para costos
  const {
    analisisPorFases,
    estadisticasRendimiento,
    reporte,
    isLoadingAnalisis,
    isLoadingEstadisticas,
    error,
    refetchAll
  } = useCostosProduccionHuevos();

  // Cargar datos del lote
  useEffect(() => {
    if (loteId) {
      cargarDatosIniciales();
    }
  }, [loteId]);

  const cargarDatosIniciales = async () => {
    if (!loteId) return;
    
    try {
      await Promise.all([
        cargarLote(loteId),
        calcularCostoProduccionDiario(loteId),
        analizarCostoPorFases(loteId),
        obtenerEstadisticasRendimientoCostos(loteId, 30)
      ]);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
      Alert.alert('Error', 'No se pudieron cargar los datos del lote');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await cargarDatosIniciales();
      if (loteId) {
        await refetchAll(loteId);
      }
    } catch (err) {
      console.error('Error al refrescar:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Encontrar el lote actual
  const lote = lotes.find(l => l.id === loteId) || loteActual;

  // Componente de navegación entre vistas
  const VistaNavegacion = () => (
    <View style={styles.navegacionContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { key: 'resumen', label: 'Resumen', icon: 'dashboard' },
          { key: 'fases', label: 'Por Fases', icon: 'timeline' },
          { key: 'tendencias', label: 'Tendencias', icon: 'trending-up' },
          { key: 'alertas', label: 'Alertas', icon: 'notification-important' }
        ].map((vista) => (
          <TouchableOpacity
            key={vista.key}
            style={[
              styles.navegacionBoton,
              vistaActual === vista.key && styles.navegacionBotonActivo
            ]}
            onPress={() => setVistaActual(vista.key as any)}
          >
            <MaterialIcons 
              name={vista.icon as any} 
              size={20} 
              color={vistaActual === vista.key ? '#fff' : '#3498db'} 
            />
            <Text style={[
              styles.navegacionTexto,
              vistaActual === vista.key && styles.navegacionTextoActivo
            ]}>
              {vista.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderVistaResumen = () => (
    <View style={styles.vistaContainer}>
      {/* Componente principal de costo */}
      <CostoProduccionHuevos
        loteId={loteId!}
        nombreLote={lote?.nombre}
        showDetailed={false}
      />
      
      {/* Métricas destacadas */}
      <MetricasDestacadas />
      
      {/* Comparativa rápida */}
      <ComparativaRapida />
    </View>
  );

  const renderVistaFases = () => (
    <View style={styles.vistaContainer}>
      <Text style={styles.vistaTitle}>Análisis por Fases de Costo</Text>
      
      {analisisPorFases ? (
        <>
          {/* Fase Inicial */}
          <FaseInicialCard analisis={analisisPorFases} />
          
          {/* Fase Productiva */}
          <FaseProductivaCard analisis={analisisPorFases} />
          
          {/* Comparativa entre fases */}
          <ComparativaFases analisis={analisisPorFases} />
        </>
      ) : (
        <Text style={styles.loadingText}>
          {isLoadingAnalisis ? 'Cargando análisis por fases...' : 'No hay datos de análisis disponibles'}
        </Text>
      )}
    </View>
  );

  const renderVistaTendencias = () => (
    <View style={styles.vistaContainer}>
      <Text style={styles.vistaTitle}>Tendencias de Costo</Text>
      
      {estadisticasRendimiento ? (
        <>
          {/* Gráfico de tendencias */}
          <GraficoTendenciasCosto />
          
          {/* Métricas de tendencia */}
          <TendenciasMetricas estadisticas={estadisticasRendimiento} />
        </>
      ) : (
        <Text style={styles.loadingText}>
          {isLoadingEstadisticas ? 'Cargando tendencias...' : 'No hay datos de tendencias disponibles'}
        </Text>
      )}
    </View>
  );

  const renderVistaAlertas = () => (
    <View style={styles.vistaContainer}>
      <Text style={styles.vistaTitle}>Alertas y Recomendaciones</Text>
      <AlertasDetalladas />
    </View>
  );

  const MetricasDestacadas = () => {
    const costoActual = costosProduccion.costoDelDia?.costoPorHuevo || 0;
    const rentabilidad = analisisPorFases?.rentabilidad || 0;
    const eficiencia = estadisticasRendimiento?.eficienciaProduccion || 0;
    
    return (
      <View style={styles.metricas}>
        <Text style={styles.seccionTitulo}>Métricas Destacadas</Text>
        <View style={styles.metricasGrid}>
          <View style={styles.metricaCard}>
            <MaterialIcons name="attach-money" size={32} color="#27ae60" />
            <Text style={styles.metricaValor}>${costoActual.toFixed(2)}</Text>
            <Text style={styles.metricaLabel}>Costo por Huevo Hoy</Text>
          </View>
          
          <View style={styles.metricaCard}>
            <MaterialIcons name="trending-up" size={32} color="#3498db" />
            <Text style={styles.metricaValor}>{rentabilidad.toFixed(1)}%</Text>
            <Text style={styles.metricaLabel}>Rentabilidad</Text>
          </View>
          
          <View style={styles.metricaCard}>
            <MaterialIcons name="speed" size={32} color="#f39c12" />
            <Text style={styles.metricaValor}>{eficiencia.toFixed(1)}%</Text>
            <Text style={styles.metricaLabel}>Eficiencia</Text>
          </View>
        </View>
      </View>
    );
  };

  const ComparativaRapida = () => {
    if (!analisisPorFases) return null;

    const costoFaseInicial = analisisPorFases.faseInicial.costoUnitario;
    const costoFaseProductiva = analisisPorFases.faseProductiva.costoPromedioPorHuevo;

    return (
      <View style={styles.comparativa}>
        <Text style={styles.seccionTitulo}>Comparativa de Costos</Text>
        
        <View style={styles.comparativaItem}>
          <Text style={styles.comparativaLabel}>Costo Inicial (por gallina)</Text>
          <Text style={styles.comparativaValor}>${costoFaseInicial.toFixed(2)}</Text>
        </View>
        
        <View style={styles.comparativaItem}>
          <Text style={styles.comparativaLabel}>Costo Productivo (por huevo)</Text>
          <Text style={styles.comparativaValor}>${costoFaseProductiva.toFixed(2)}</Text>
        </View>
        
        <View style={styles.comparativaItem}>
          <Text style={styles.comparativaLabel}>Costo Total Integrado</Text>
          <Text style={styles.comparativaValor}>
            ${analisisPorFases.costoPromedioIntegral.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const FaseInicialCard = ({ analisis }: { analisis: any }) => (
    <View style={styles.faseCard}>
      <View style={styles.faseHeader}>
        <MaterialIcons name="baby-changing-station" size={24} color="#e74c3c" />
        <Text style={styles.faseTitle}>Fase Inicial (Crianza)</Text>
      </View>
      
      <View style={styles.faseMetricas}>
        <View style={styles.faseMetricaItem}>
          <Text style={styles.faseMetricaLabel}>Costo Total</Text>
          <Text style={styles.faseMetricaValor}>
            ${analisis.faseInicial.costoTotal.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.faseMetricaItem}>
          <Text style={styles.faseMetricaLabel}>Costo por Gallina</Text>
          <Text style={styles.faseMetricaValor}>
            ${analisis.faseInicial.costoUnitario.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.faseMetricaItem}>
          <Text style={styles.faseMetricaLabel}>Duración</Text>
          <Text style={styles.faseMetricaValor}>
            {analisis.faseInicial.duracionDias} días
          </Text>
        </View>
      </View>
    </View>
  );

  const FaseProductivaCard = ({ analisis }: { analisis: any }) => (
    <View style={styles.faseCard}>
      <View style={styles.faseHeader}>
        <MaterialIcons name="egg" size={24} color="#f39c12" />
        <Text style={styles.faseTitle}>Fase Productiva</Text>
      </View>
      
      <View style={styles.faseMetricas}>
        <View style={styles.faseMetricaItem}>
          <Text style={styles.faseMetricaLabel}>Huevos Totales</Text>
          <Text style={styles.faseMetricaValor}>
            {analisis.faseProductiva.huevosTotalesProducidos.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.faseMetricaItem}>
          <Text style={styles.faseMetricaLabel}>Costo por Huevo</Text>
          <Text style={styles.faseMetricaValor}>
            ${analisis.faseProductiva.costoPromedioPorHuevo.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.faseMetricaItem}>
          <Text style={styles.faseMetricaLabel}>Días en Producción</Text>
          <Text style={styles.faseMetricaValor}>
            {analisis.faseProductiva.diasEnProduccion}
          </Text>
        </View>
      </View>
    </View>
  );

  const ComparativaFases = ({ analisis }: { analisis: any }) => {
    const data = {
      labels: ['Fase Inicial', 'Fase Productiva'],
      datasets: [
        {
          data: [
            analisis.faseInicial.costoTotal,
            analisis.faseProductiva.gastoTotalMantenimiento
          ]
        }
      ]
    };

    return (
      <View style={styles.graficoContainer}>
        <Text style={styles.graficoTitulo}>Distribución de Costos por Fase</Text>
        <BarChart
          data={data}
          width={screenWidth - 40}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
            style: { borderRadius: 16 }
          }}
          style={styles.grafico}
        />
      </View>
    );
  };

  const GraficoTendenciasCosto = () => {
    // Simulamos datos de tendencia (en una implementación real vendría del servicio)
    const data = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [
        {
          data: [2.8, 3.1, 2.9, 3.2],
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <View style={styles.graficoContainer}>
        <Text style={styles.graficoTitulo}>Tendencia de Costo por Huevo (Últimas 4 semanas)</Text>
        <LineChart
          data={data}
          width={screenWidth - 40}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
            style: { borderRadius: 16 }
          }}
          style={styles.grafico}
          bezier
        />
      </View>
    );
  };

  const TendenciasMetricas = ({ estadisticas }: { estadisticas: any }) => (
    <View style={styles.tendenciasContainer}>
      <Text style={styles.seccionTitulo}>Análisis de Tendencias</Text>
      
      <View style={styles.tendenciaItem}>
        <MaterialIcons 
          name={estadisticas.tendenciaCosto === 'INCREMENTO' ? 'trending-up' : 
                estadisticas.tendenciaCosto === 'DECREMENTO' ? 'trending-down' : 'trending-flat'} 
          size={24} 
          color={estadisticas.tendenciaCosto === 'INCREMENTO' ? '#e74c3c' : 
                estadisticas.tendenciaCosto === 'DECREMENTO' ? '#27ae60' : '#f39c12'} 
        />
        <View style={styles.tendenciaTexto}>
          <Text style={styles.tendenciaLabel}>Tendencia de Costo</Text>
          <Text style={styles.tendenciaValor}>{estadisticas.tendenciaCosto}</Text>
        </View>
      </View>
      
      <View style={styles.tendenciaItem}>
        <MaterialIcons name="show-chart" size={24} color="#3498db" />
        <View style={styles.tendenciaTexto}>
          <Text style={styles.tendenciaLabel}>Promedio Diario</Text>
          <Text style={styles.tendenciaValor}>
            ${estadisticas.gastoPromedioPorDia?.toFixed(2) || '0.00'}
          </Text>
        </View>
      </View>
    </View>
  );

  const AlertasDetalladas = () => {
    const alertas = estadisticasRendimiento?.alertas || [];
    
    if (alertas.length === 0) {
      return (
        <View style={styles.noAlertasContainer}>
          <MaterialIcons name="check-circle" size={64} color="#27ae60" />
          <Text style={styles.noAlertasTexto}>
            ¡Excelente! No hay alertas activas para este lote
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.alertasContainer}>
        {alertas.map((alerta, index) => (
          <AlertaItem key={index} alerta={alerta} />
        ))}
      </View>
    );
  };

  const AlertaItem = ({ alerta }: { alerta: any }) => (
    <View style={[styles.alertaItem, 
      { borderLeftColor: alerta.severidad === 'CRITICAL' ? '#e74c3c' : '#f39c12' }
    ]}>
      <MaterialIcons 
        name={alerta.severidad === 'CRITICAL' ? 'error' : 'warning'} 
        size={24} 
        color={alerta.severidad === 'CRITICAL' ? '#e74c3c' : '#f39c12'} 
      />
      <View style={styles.alertaContenido}>
        <Text style={styles.alertaMensaje}>{alerta.mensaje}</Text>
        <Text style={styles.alertaRecomendacion}>{alerta.accionRecomendada}</Text>
        <Text style={styles.alertaValores}>
          Actual: {alerta.valorActual?.toFixed(2)} | Referencia: {alerta.valorReferencia?.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  if (!loteId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTexto}>No se especificó un lote para analizar</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerTexto}>
          <Text style={styles.headerTitulo}>Costos de Producción</Text>
          <Text style={styles.headerSubtitulo}>{lote?.nombre || 'Cargando...'}</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Navegación */}
      <VistaNavegacion />

      {/* Contenido principal */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error" size={20} color="#e74c3c" />
            <Text style={styles.errorBannerTexto}>{error}</Text>
          </View>
        )}

        {vistaActual === 'resumen' && renderVistaResumen()}
        {vistaActual === 'fases' && renderVistaFases()}
        {vistaActual === 'tendencias' && renderVistaTendencias()}
        {vistaActual === 'alertas' && renderVistaAlertas()}
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  } as any,
  headerTexto: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  headerSubtitulo: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  navegacionContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  navegacionBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f9fa'
  } as any,
  navegacionBotonActivo: {
    backgroundColor: '#3498db'
  },
  navegacionTexto: {
    marginLeft: 6,
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500'
  },
  navegacionTextoActivo: {
    color: '#fff'
  },
  scrollView: {
    flex: 1
  },
  vistaContainer: {
    padding: 16
  },
  vistaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center'
  },
  loadingText: {
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 16,
    marginTop: 40
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorTexto: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20
  },
  botonVolver: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  botonVolverTexto: {
    color: '#fff',
    fontWeight: '600'
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f2',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c'
  } as any,
  errorBannerTexto: {
    marginLeft: 8,
    color: '#e74c3c',
    flex: 1
  },
  metricas: {
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
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12
  },
  metricasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  } as any,
  metricaCard: {
    alignItems: 'center',
    flex: 1,
    padding: 12
  },
  metricaValor: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4
  },
  metricaLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  comparativa: {
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
  comparativaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  } as any,
  comparativaLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  comparativaValor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  faseCard: {
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
  faseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  } as any,
  faseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8
  },
  faseMetricas: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  } as any,
  faseMetricaItem: {
    alignItems: 'center',
    flex: 1
  },
  faseMetricaLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 4
  },
  faseMetricaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center'
  },
  graficoContainer: {
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
  graficoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center'
  },
  grafico: {
    borderRadius: 16
  },
  tendenciasContainer: {
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
  tendenciaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  } as any,
  tendenciaTexto: {
    marginLeft: 12,
    flex: 1
  },
  tendenciaLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  tendenciaValor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  noAlertasContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  noAlertasTexto: {
    fontSize: 16,
    color: '#27ae60',
    textAlign: 'center',
    marginTop: 16
  },
  alertasContainer: {
    paddingBottom: 20
  },
  alertaItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  } as any,
  alertaContenido: {
    marginLeft: 12,
    flex: 1
  },
  alertaMensaje: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4
  },
  alertaRecomendacion: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4
  },
  alertaValores: {
    fontSize: 11,
    color: '#95a5a6'
  }
};

export { DashboardCostosHuevos };

