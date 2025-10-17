/**
 * Página de detalles del lote de levantes
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import GrowthChart from '../../../../src/components/ui/GrowthChart';
import MaturationAlert from '../../../../src/components/ui/MaturationAlert';
import PerformanceComparison from '../../../../src/components/ui/PerformanceComparison';
import PerformanceReport from '../../../../src/components/ui/PerformanceReport';
import { colors } from '../../../../src/constants/colors';
import { useGalpones } from '../../../../src/hooks/useGalpones';
import { usePerformanceMonitoring } from '../../../../src/hooks/usePerformanceMonitoring';
import { useVentasLote } from '../../../../src/hooks/useVentasLote';
import { exportarYCompartir } from '../../../../src/services/pdf-export.service';
import { obtenerRegistrosPeso } from '../../../../src/services/peso.service';
import { EstadisticasVentasLote, VentaLote } from '../../../../src/services/ventas.service';
import { useGastosStore } from '../../../../src/stores/gastosStore';
import { useLevantesStore } from '../../../../src/stores/levantesStore';
import { useMortalityStore } from '../../../../src/stores/mortalityStore';
import { EstadoLote, LoteLevante, PesoRegistro, TipoAve } from '../../../../src/types';
import { Galpon } from '../../../../src/types/galpon';
import { formatDate } from '../../../../src/utils/dateUtils';
import { formatWeight, WeightUnit } from '../../../../src/utils/weightUtils';

export default function DetallesLoteLevante() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabActivo, setTabActivo] = useState('general');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [registrosPeso, setRegistrosPeso] = useState<PesoRegistro[]>([]);
  const [exportingPDF, setExportingPDF] = useState(false);
  // Hook para manejar ventas del lote
  const { ventas: ventasLote, estadisticasVentas } = useVentasLote(id, TipoAve.POLLO_LEVANTE);

  const {
    loteActual,
    mortalidad,
    gastos,
    ventas: ventasStore,
    estadisticas,
    cargarLote,
    cargarMortalidad,
    cargarGastos,
    cargarVentas,
    calcularEstadisticas,
    isLoading,
    error
  } = useLevantesStore();

  const { 
    loadRegistrosPorTipo, 
    registros: registrosMortalidad 
  } = useMortalityStore();

  const { galpones, cargarGalpones } = useGalpones();
  
  // Monitoreo de desempeño vs benchmarks
  const { comparaciones, isLoading: loadingPerformance } = usePerformanceMonitoring(loteActual || undefined);

  // Cargar datos del lote al montar el componente
  useEffect(() => {
    if (id) {
      cargarDatosLote();
    }
  }, [id]);

  const cargarDatosLote = async () => {
    try {
      await Promise.all([
        cargarLote(id),
        cargarMortalidad(id),
        cargarGastos(id),
        cargarVentas(id),
        calcularEstadisticas(id),
        loadRegistrosPorTipo(TipoAve.POLLO_LEVANTE),
        cargarRegistrosPeso(),
        cargarGalpones(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos del lote:', error);
    }
  };

  const cargarRegistrosPeso = async () => {
    try {
      const registros = await obtenerRegistrosPeso(id, TipoAve.POLLO_LEVANTE);
      setRegistrosPeso(registros);
    } catch (error) {
      console.error('Error al cargar registros de peso:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosLote();
    setRefreshing(false);
  };

  const handleRegistrarPeso = () => {
    router.push({
      pathname: '/(tabs)/levantes/registrar-peso',
      params: { loteId: id }
    });
  };

  const handleRegistrarMuerte = () => {
    router.push({
      pathname: '/(tabs)/levantes/registrar-muerte',
      params: { loteId: id }
    });
  };

  const handleRegistrarGasto = () => {
    router.push({
      pathname: '/(tabs)/gastos',
      params: { 
        registrarGasto: id,
        tipo: TipoAve.POLLO_LEVANTE,
        nombre: loteActual?.nombre || 'Lote'
      }
    });
  };

  const handleExportarPDF = async () => {
    if (!loteActual) return;
    
    try {
      setExportingPDF(true);
      
      // Calcular estadísticas para el PDF
      const totalMuertes = registrosMortalidad
        .filter(registro => registro.loteId === loteActual.id)
        .reduce((sum, registro) => sum + registro.cantidad, 0);
      
      const edadActual = Math.floor((Date.now() - new Date(loteActual.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24));
      const tasaMortalidad = loteActual.cantidadInicial > 0 ? (totalMuertes / loteActual.cantidadInicial) * 100 : 0;

      const pdfData = {
        lote: {
          id: loteActual.id,
          nombre: loteActual.nombre,
          tipoAve: TipoAve.POLLO_LEVANTE,
          fechaInicio: loteActual.fechaInicio,
          fechaNacimiento: loteActual.fechaNacimiento,
          cantidadInicial: loteActual.cantidadInicial,
          cantidadActual: loteActual.cantidadActual,
          estado: loteActual.estado || 'ACTIVO'
        },
        estadisticas: {
          gastoTotal: estadisticas?.gastoTotal || 0,
          ingresoTotal: 0, // TODO: Agregar ingresoTotal a EstadisticasLoteLevante
          edadActual,
          mortalidadTotal: totalMuertes,
          tasaMortalidad
        },
        registrosPeso: registrosPeso.slice(0, 10), // Últimos 10 registros
      };

      await exportarYCompartir(pdfData);
      
    } catch (error) {
      console.error('Error exportando PDF:', error);
      // TODO: Mostrar alert de error
    } finally {
      setExportingPDF(false);
    }
  };

  const handleEliminarLote = () => {
    Alert.alert(
      'Eliminar Lote',
      `¿Estás seguro de que deseas eliminar el lote "${loteActual?.nombre}"? Esta acción no se puede deshacer.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { eliminarLote } = useLevantesStore.getState();
              await eliminarLote(id);
              Alert.alert('Éxito', 'Lote eliminado correctamente');
              router.back();
            } catch (error) {
              console.error('Error al eliminar lote:', error);
              Alert.alert('Error', 'No se pudo eliminar el lote');
            }
          }
        }
      ]
    );
  };

  if (isLoading && !loteActual) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando detalles del lote...</Text>
      </View>
    );
  }

  if (error || !loteActual) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
        <Text style={styles.errorTitle}>Error al cargar el lote</Text>
        <Text style={styles.errorText}>{error || 'Lote no encontrado'}</Text>
        <Button
          title="Volver"
          onPress={() => router.back()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: 'information-circle-outline' },
    { id: 'peso', label: 'Peso', icon: 'scale-outline' },
    { id: 'gastos', label: 'Gastos', icon: 'receipt-outline' },
    { id: 'ventas', label: 'Ventas', icon: 'cash-outline' },
    { id: 'mortalidad', label: 'Mortalidad', icon: 'warning-outline' },
    { id: 'rendimiento', label: 'Rendimiento', icon: 'analytics-outline' }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{loteActual.nombre}</Text>
          <Text style={styles.subtitle}>
            {loteActual.cantidadActual} pollos • {loteActual.raza}
          </Text>
          {loteActual.galponId && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={16} color={colors.secondary} />
              <Text style={styles.locationText}>
                {galpones.find((g) => g.id === loteActual.galponId)?.nombre ?? 'Galpón desconocido'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                tabActivo === tab.id && styles.activeTab
              ]}
              onPress={() => setTabActivo(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={tabActivo === tab.id ? colors.primary : colors.textMedium}
              />
              <Text
                style={[
                  styles.tabText,
                  tabActivo === tab.id && styles.activeTabText
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {tabActivo === 'general' && (
          <TabGeneral
            lote={loteActual}
            estadisticas={estadisticas}
            registrosMortalidad={registrosMortalidad}
            registrosPeso={registrosPeso}
            onRegistrarPeso={handleRegistrarPeso}
            onRegistrarMuerte={handleRegistrarMuerte}
            onRegistrarGasto={handleRegistrarGasto}
            galpones={galpones}
            comparaciones={comparaciones}
            loadingPerformance={loadingPerformance}
            ventas={ventasLote}
            estadisticasVentas={estadisticasVentas}
          />
        )}

        {tabActivo === 'peso' && (
          <TabPeso
            registros={registrosPeso}
            onRegistrarPeso={handleRegistrarPeso}
          />
        )}

        {tabActivo === 'gastos' && (
          <TabGastos
            lote={loteActual}
            loteId={id}
            onRegistrarGasto={handleRegistrarGasto}
          />
        )}

        {tabActivo === 'ventas' && (
          <TabVentas
            lote={loteActual}
            ventas={ventasLote}
            estadisticasVentas={estadisticasVentas}
          />
        )}

        {tabActivo === 'mortalidad' && (
          <TabMortalidad
            lote={loteActual}
            registros={registrosMortalidad}
            onRegistrarMuerte={handleRegistrarMuerte}
          />
        )}

        {tabActivo === 'rendimiento' && (
          <TabRendimiento
            lote={loteActual}
            registrosPeso={registrosPeso}
            registrosMortalidad={registrosMortalidad}
            estadisticas={estadisticas}
          />
        )}

        
      </ScrollView>

      {/* Modal del menú */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleExportarPDF();
              }}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={styles.menuItemText}>
                {exportingPDF ? 'Generando PDF...' : 'Exportar Reporte PDF'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleEliminarLote();
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>
                Eliminar Lote
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Componente para mostrar el progreso de maduración
function MaturationProgressCard({
  fechaNacimiento,
  diasMaduracion,
  pesoPromedio,
  cantidadActual
}: {
  fechaNacimiento: any;
  diasMaduracion: number;
  pesoPromedio: number;
  cantidadActual: number;
}) {
  // Calcular días transcurridos
  const fechaNac = fechaNacimiento?.toDate ? fechaNacimiento.toDate() : new Date(fechaNacimiento);
  const diasTranscurridos = Math.floor((Date.now() - fechaNac.getTime()) / (1000 * 60 * 60 * 24));
  const progreso = Math.min((diasTranscurridos / diasMaduracion) * 100, 100);
  const diasRestantes = Math.max(diasMaduracion - diasTranscurridos, 0);
  
  // Determinar estado de maduración
  let estadoColor = colors.primary;
  let estadoTexto = 'En Desarrollo';
  let estadoIcon: any = 'time-outline';
  
  if (progreso >= 100) {
    estadoColor = colors.success;
    estadoTexto = '¡Listo para Venta!';
    estadoIcon = 'checkmark-circle';
  } else if (progreso >= 80) {
    estadoColor = colors.warning;
    estadoTexto = 'Próximo a Maduración';
    estadoIcon = 'alert-circle';
  }

  return (
    <Card style={StyleSheet.flatten([styles.maturationCard, { borderLeftColor: estadoColor, borderLeftWidth: 4 }])}>
      <View style={styles.maturationHeader}>
        <Ionicons name={estadoIcon} size={24} color={estadoColor} />
        <Text style={StyleSheet.flatten([styles.maturationTitle, { color: estadoColor }])}>{estadoTexto}</Text>
      </View>
      
      <View style={styles.maturationProgressContainer}>
        <View style={styles.maturationProgressBar}>
          <View style={[styles.maturationProgressFill, { width: `${progreso}%`, backgroundColor: estadoColor }]} />
        </View>
        <Text style={styles.maturationProgressText}>{progreso.toFixed(0)}%</Text>
      </View>

      <View style={styles.maturationStatsGrid}>
        <View style={styles.maturationStatItem}>
          <Text style={styles.maturationStatValue}>{diasTranscurridos}</Text>
          <Text style={styles.maturationStatLabel}>Días Transcurridos</Text>
        </View>
        <View style={styles.maturationStatItem}>
          <Text style={styles.maturationStatValue}>{diasRestantes}</Text>
          <Text style={styles.maturationStatLabel}>Días Restantes</Text>
        </View>
        <View style={styles.maturationStatItem}>
          <Text style={styles.maturationStatValue}>{formatWeight(pesoPromedio, WeightUnit.POUNDS)}</Text>
          <Text style={styles.maturationStatLabel}>Peso Promedio</Text>
        </View>
        <View style={styles.maturationStatItem}>
          <Text style={styles.maturationStatValue}>{cantidadActual}</Text>
          <Text style={styles.maturationStatLabel}>Pollos Actuales</Text>
        </View>
      </View>

      {progreso >= 100 && (
        <View style={styles.maturationAlertBox}>
          <Ionicons name="information-circle" size={16} color={colors.success} />
          <Text style={StyleSheet.flatten([styles.maturationAlertText, { color: colors.success }])}>
            El lote ha alcanzado su período de maduración objetivo. Considere evaluar la venta.
          </Text>
        </View>
      )}
      
      {progreso >= 80 && progreso < 100 && (
        <View style={styles.maturationAlertBox}>
          <Ionicons name="information-circle" size={16} color={colors.warning} />
          <Text style={StyleSheet.flatten([styles.maturationAlertText, { color: colors.warning }])}>
            El lote está próximo a su maduración. Prepare la logística de venta.
          </Text>
        </View>
      )}
    </Card>
  );
}

// Componente Tab General
function TabGeneral({ 
  lote, 
  estadisticas, 
  registrosMortalidad,
  registrosPeso,
  onRegistrarPeso, 
  onRegistrarMuerte, 
  onRegistrarGasto,
  galpones,
  comparaciones,
  loadingPerformance,
  ventas: ventasLote,
  estadisticasVentas,
}: {
  lote: LoteLevante;
  estadisticas: any;
  registrosMortalidad: any[];
  registrosPeso: PesoRegistro[];
  onRegistrarPeso: () => void;
  onRegistrarMuerte: () => void;
  onRegistrarGasto: () => void;
  galpones: Galpon[];
  comparaciones: any;
  loadingPerformance: boolean;
  ventas: VentaLote[];
  estadisticasVentas: EstadisticasVentasLote | null;
}) {
  // Calcular muertes totales desde los registros reales (para mostrar estadísticas)
  const muertesTotales = registrosMortalidad
    .filter(registro => registro.loteId === lote.id)
    .reduce((total, registro) => total + registro.cantidad, 0);
  
  // Pollos actuales ya están actualizados en cantidadActual
  const pollosActuales = lote.cantidadActual;
  
  // Calcular peso promedio actual desde registros de peso
  const pesoPromedio = registrosPeso.length > 0 
    ? registrosPeso[0]?.pesoPromedio || 0 
    : 0;
  return (
    <View style={styles.tabContent}>
      {/* Resumen del lote */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen del Lote</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pollosActuales}</Text>
            <Text style={styles.summaryLabel}>Pollos Actuales</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatWeight(pesoPromedio, WeightUnit.POUNDS)}</Text>
            <Text style={styles.summaryLabel}>Peso Promedio</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {lote.cantidadInicial > 0 ? ((muertesTotales / lote.cantidadInicial) * 100).toFixed(1) : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Tasa de Mortalidad</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{estadisticasVentas?.cantidadVendida || 0}</Text>
            <Text style={styles.summaryLabel}>Pollos Vendidos</Text>
          </View>
        </View>
      </Card>

      {/* Información del lote */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>Información del Lote</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre del lote:</Text>
          <Text style={styles.infoValue}>{lote.nombre}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha de inicio:</Text>
          <Text style={styles.infoValue}>
            {formatDate(lote.fechaInicio)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Raza:</Text>
          <Text style={styles.infoValue}>{lote.raza}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Estado:</Text>
          <View style={[
            styles.statusBadge,
            lote.estado === EstadoLote.ACTIVO ? styles.activeBadge : styles.inactiveBadge
          ]}>
            <Text style={[
              styles.statusText,
              lote.estado === EstadoLote.ACTIVO ? styles.activeText : styles.inactiveText
            ]}>
              {lote.estado === EstadoLote.ACTIVO ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo de ave:</Text>
          <Text style={styles.infoValue}>Pollo de Levante</Text>
        </View>
        {lote.galponId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Galpón asignado</Text>
            <View style={styles.infoValueRow}>
              <Ionicons name="business" size={16} color={colors.secondary} />
              <Text style={styles.infoValue}>
                {galpones.find((g) => g.id === lote.galponId)?.nombre ?? 'Galpón desconocido'}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Estadísticas adicionales */}
      {estadisticas && (
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas del Lote</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticasVentas?.ingresosTotales ? `RD$${estadisticasVentas.ingresosTotales.toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Ingresos por Ventas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticas.gastoTotal ? `RD$${estadisticas.gastoTotal.toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Gastos Totales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticasVentas?.ingresosTotales && estadisticas.gastoTotal ? 
                  `RD$${(estadisticasVentas.ingresosTotales - estadisticas.gastoTotal).toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Ganancia Neta</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticasVentas?.totalVentas || 0}
              </Text>
              <Text style={styles.statLabel}>Transacciones</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Panel de maduración personalizado */}
      {lote.diasMaduracion && (
        <MaturationProgressCard
          fechaNacimiento={lote.fechaNacimiento}
          diasMaduracion={lote.diasMaduracion}
          pesoPromedio={pesoPromedio}
          cantidadActual={pollosActuales}
        />
      )}

      {/* Alerta de maduración por defecto */}
      <MaturationAlert
        tipoAve={TipoAve.POLLO_LEVANTE}
        fechaNacimiento={lote.fechaNacimiento}
        pesoPromedio={registrosPeso.length > 0 ? (registrosPeso[0] as any)?.pesoPromedio || 0 : 0}
        style={styles.maturationAlert}
      />

      {/* Comparación de Desempeño vs Benchmarks */}
      <PerformanceComparison
        comparaciones={comparaciones}
        lote={lote}
        isLoading={loadingPerformance}
      />

      {/* Acciones rápidas */}
      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <Button
            title="Registrar Peso"
            onPress={onRegistrarPeso}
            style={styles.actionButton}
          />
          <Button
            title="Registrar Muerte"
            onPress={onRegistrarMuerte}
            variant="danger"
            style={styles.actionButton}
          />
          <Button
            title="Registrar Gasto"
            onPress={onRegistrarGasto}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </Card>
    </View>
  );
}

// Componente Tab Peso
function TabPeso({ 
  registros, 
  onRegistrarPeso 
}: {
  registros: PesoRegistro[];
  onRegistrarPeso: () => void;
}) {
  // Calcular estadísticas generales
  const estadisticasPeso = registros.length > 0 ? {
    ultimoPeso: registros[0]?.pesoPromedio || 0,
    pesoMaximo: Math.max(...registros.map(r => r.pesoPromedio)),
    pesoMinimo: Math.min(...registros.map(r => r.pesoPromedio)),
    crecimientoPromedio: registros.length > 1 ? 
      (registros[0]?.pesoPromedio - registros[registros.length - 1]?.pesoPromedio) / (registros.length - 1) : 0
  } : null;

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Registro de Peso y Crecimiento</Text>
        <Button
          title="Nuevo Registro"
          onPress={onRegistrarPeso}
          size="small"
        />
      </View>

      {/* Estadísticas de peso */}
      {estadisticasPeso && (
        <Card style={styles.pesoStatsCard}>
          <Text style={styles.cardTitle}>Estadísticas de Peso</Text>
          <View style={styles.pesoStatsGrid}>
            <View style={styles.pesoStatItem}>
              <Text style={styles.pesoStatValue}>{formatWeight(estadisticasPeso.ultimoPeso, WeightUnit.POUNDS)}</Text>
              <Text style={styles.pesoStatLabel}>Último Peso</Text>
            </View>
            <View style={styles.pesoStatItem}>
              <Text style={styles.pesoStatValue}>{formatWeight(estadisticasPeso.pesoMaximo, WeightUnit.POUNDS)}</Text>
              <Text style={styles.pesoStatLabel}>Peso Máximo</Text>
            </View>
            <View style={styles.pesoStatItem}>
              <Text style={styles.pesoStatValue}>{formatWeight(estadisticasPeso.crecimientoPromedio, WeightUnit.POUNDS, 3)}</Text>
              <Text style={styles.pesoStatLabel}>Crecimiento/Registro</Text>
            </View>
            <View style={styles.pesoStatItem}>
              <Text style={styles.pesoStatValue}>{registros.length}</Text>
              <Text style={styles.pesoStatLabel}>Total Registros</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Gráfico de crecimiento */}
      {registros.length >= 2 && (
        <GrowthChart 
          registros={registros} 
          title="Evolución del Peso" 
          color={colors.israelies}
        />
      )}

      {registros.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="scale-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay registros de peso</Text>
          <Text style={styles.emptyText}>
            Comience registrando el peso de los pollos para hacer seguimiento del crecimiento
          </Text>
        </Card>
      ) : (
        <View style={styles.registrosList}>
          {registros.map((registro) => (
            <Card key={registro.id} style={styles.pesoRegistroCard}>
              <View style={styles.registroHeader}>
                <Text style={styles.registroFecha}>
                  {formatDate(registro.fecha)}
                </Text>
                <Text style={styles.registroTotal}>
                  {formatWeight(registro.pesoPromedio, WeightUnit.POUNDS)}
                </Text>
              </View>
              
              <View style={styles.pesoRegistroDetalle}>
                <View style={styles.pesoRegistroRow}>
                  <View style={styles.pesoRegistroItem}>
                    <Text style={styles.pesoRegistroLabel}>Edad</Text>
                    <Text style={styles.pesoRegistroValue}>
                      {(registro as any).edadEnSemanas || 0} sem ({(registro as any).edadEnDias || 0}d)
                    </Text>
                  </View>
                  <View style={styles.pesoRegistroItem}>
                    <Text style={styles.pesoRegistroLabel}>Pollos pesados</Text>
                    <Text style={styles.pesoRegistroValue}>{(registro as any).cantidadPollosPesados || 0}</Text>
                  </View>
                </View>
                
                <View style={styles.pesoRegistroRow}>
                  <View style={styles.pesoRegistroItem}>
                    <Text style={styles.pesoRegistroLabel}>Peso total</Text>
                    <Text style={styles.pesoRegistroValue}>{formatWeight((registro as any).pesoTotal || 0, WeightUnit.POUNDS)}</Text>
                  </View>
                  <View style={styles.pesoRegistroItem}>
                    <Text style={styles.pesoRegistroLabel}>Promedio</Text>
                    <Text style={styles.pesoRegistroValue}>{formatWeight(registro.pesoPromedio, WeightUnit.POUNDS)}</Text>
                  </View>
                </View>
              </View>

              {(registro as any).observaciones && (
                <View style={styles.pesoObservaciones}>
                  <Text style={styles.pesoObservacionesText}>{(registro as any).observaciones}</Text>
                </View>
              )}
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

// Componente Tab Gastos
function TabGastos({ lote, loteId, onRegistrarGasto }: { lote: LoteLevante; loteId: string; onRegistrarGasto: () => void }) {
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { cargarGastos: cargarGastosStore } = useGastosStore();

  useEffect(() => {
    const cargarGastos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Cargando gastos para lote levantes:', loteId);
        await cargarGastosStore(loteId, TipoAve.POLLO_LEVANTE);
        // Los gastos se obtienen del store
        const gastosData = useGastosStore.getState().gastos;
        console.log('📦 Gastos cargados:', gastosData.length);
        setGastos(gastosData);
      } catch (error) {
        console.error('Error cargando gastos:', error);
        setGastos([]);
      } finally {
        setLoading(false);
      }
    };

    if (loteId) {
      cargarGastos();
    }
  }, [loteId]);

  if (loading) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.loadingText}>Cargando gastos...</Text>
      </View>
    );
  }

  // Verificar si hay costo inicial del lote
  const costoInicialLote = lote.costo || 0;
  
  // Filtrar gastos para excluir el costo inicial del lote si está incluido
  // Los gastos adicionales NO deben incluir el costo inicial del lote
  const gastosAdicionalesFiltrados = gastos.filter(gasto => {
    // Excluir gastos que sean el costo inicial del lote
    // (por ejemplo, gastos con descripción "Costo inicial del lote" o similar)
    return !(gasto.descripcion?.toLowerCase().includes('costo inicial') || 
             gasto.articuloNombre?.toLowerCase().includes('costo inicial'));
  });
  
  // Calcular el total de gastos adicionales (sin incluir costo inicial)
  const gastosAdicionales = gastosAdicionalesFiltrados.reduce((total, gasto) => total + gasto.total, 0);
  
  // Calcular el total general (costo inicial + gastos adicionales)
  const totalGeneral = costoInicialLote + gastosAdicionales;

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Gastos del Lote</Text>
        <Button
          title="Nuevo Gasto"
          onPress={onRegistrarGasto}
          size="small"
        />
      </View>

      {/* Resumen Total de Gastos */}
      <Card style={styles.resumenTotalCard}>
        <View style={styles.resumenTotalHeader}>
          <Ionicons name="calculator" size={24} color={colors.secondary} />
          <Text style={styles.resumenTotalTitle}>Resumen Total de Gastos</Text>
        </View>
        
        <View style={styles.resumenTotalContent}>
          {costoInicialLote > 0 && (
            <View style={styles.resumenRow}>
              <View style={styles.resumenLabelContainer}>
                <Ionicons name="pricetag" size={16} color={colors.secondary} />
                <Text style={styles.resumenLabel}>Costo inicial del lote</Text>
              </View>
              <Text style={styles.resumenValue}>RD${costoInicialLote.toFixed(2)}</Text>
            </View>
          )}
          
          <View style={styles.resumenRow}>
            <View style={styles.resumenLabelContainer}>
              <Ionicons name="receipt" size={16} color={colors.textMedium} />
              <Text style={styles.resumenLabel}>Gastos adicionales ({gastosAdicionalesFiltrados.length})</Text>
            </View>
            <Text style={styles.resumenValue}>RD${gastosAdicionales.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.resumenRow, styles.resumenTotalRow]}>
            <Text style={styles.resumenTotalLabel}>TOTAL GASTOS</Text>
            <Text style={styles.resumenTotalValue}>RD${totalGeneral.toFixed(2)}</Text>
          </View>
        </View>
      </Card>

      {/* Detalle del Costo Inicial */}
      {costoInicialLote > 0 && (
        <Card style={styles.costoInicialCard}>
          <View style={styles.costoInicialHeader}>
            <Text style={styles.costoInicialTitle}>💰 Detalle del Costo Inicial</Text>
          </View>
          <View style={styles.costoInicialContent}>
            <View style={styles.costoInicialRow}>
              <Text style={styles.costoInicialLabel}>Cantidad de pollos:</Text>
              <Text style={styles.costoInicialValue}>{lote.cantidadInicial}</Text>
            </View>
            <View style={styles.costoInicialRow}>
              <Text style={styles.costoInicialLabel}>Costo unitario:</Text>
              <Text style={styles.costoInicialValue}>
                RD${lote.costoUnitario ? lote.costoUnitario.toFixed(2) : (costoInicialLote / lote.cantidadInicial).toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {gastosAdicionalesFiltrados.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay gastos adicionales registrados</Text>
          <Text style={styles.emptyText}>
            Los gastos adicionales se mostrarán aquí cuando se registren
          </Text>
        </Card>
      ) : (
        <View>
          {/* Lista de gastos */}
          <View style={styles.gastosListHeader}>
            <Text style={styles.gastosListTitle}>📋 Gastos Adicionales</Text>
          </View>

          {/* Lista de gastos */}
          <View style={styles.gastosList}>
            {gastosAdicionalesFiltrados.map((gasto) => (
              <Card key={gasto.id} style={styles.gastoCard}>
                <View style={styles.gastoHeader}>
                  <Text style={styles.gastoConcepto}>{gasto.articuloNombre}</Text>
                  <Text style={styles.gastoMonto}>RD${gasto.total.toFixed(2)}</Text>
                </View>
                <Text style={styles.gastoFecha}>
                  {formatDate(gasto.fecha)}
                </Text>
                {gasto.descripcion && (
                  <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                )}
              </Card>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Componente Tab Ventas
function TabVentas({ 
  lote, 
  ventas,
  estadisticasVentas 
}: { 
  lote: LoteLevante; 
  ventas: VentaLote[];
  estadisticasVentas: EstadisticasVentasLote | null;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Registro de Ventas</Text>
        <Button
          title="Nueva Factura"
          onPress={() => router.push('/(tabs)/facturacion/nueva-factura')}
          size="small"
        />
      </View>

      {/* Resumen de ventas */}
      {estadisticasVentas && (
        <Card style={styles.ventasStatsCard}>
          <Text style={styles.cardTitle}>Resumen de Ventas</Text>
          <View style={styles.ventasStatsGrid}>
            <View style={styles.ventasStatItem}>
              <Text style={styles.ventasStatValue}>{estadisticasVentas.totalVentas}</Text>
              <Text style={styles.ventasStatLabel}>Total Ventas</Text>
            </View>
            <View style={styles.ventasStatItem}>
              <Text style={styles.ventasStatValue}>{estadisticasVentas.cantidadVendida}</Text>
              <Text style={styles.ventasStatLabel}>Pollos Vendidos</Text>
            </View>
            <View style={styles.ventasStatItem}>
              <Text style={styles.ventasStatValue}>
                RD${estadisticasVentas.ingresosTotales.toFixed(2)}
              </Text>
              <Text style={styles.ventasStatLabel}>Ingresos Totales</Text>
            </View>
            <View style={styles.ventasStatItem}>
              <Text style={styles.ventasStatValue}>
                RD${estadisticasVentas.precioPromedio.toFixed(2)}
              </Text>
              <Text style={styles.ventasStatLabel}>Precio Promedio</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Estado del lote */}
      <Card style={styles.estadoLoteCard}>
        <Text style={styles.cardTitle}>Estado del Lote</Text>
        <View style={styles.estadoLoteGrid}>
          <View style={styles.estadoLoteItem}>
            <Text style={styles.estadoLoteValue}>{lote.cantidadInicial}</Text>
            <Text style={styles.estadoLoteLabel}>Pollos Iniciales</Text>
          </View>
          <View style={styles.estadoLoteItem}>
            <Text style={styles.estadoLoteValue}>{estadisticasVentas?.cantidadVendida || 0}</Text>
            <Text style={styles.estadoLoteLabel}>Pollos Vendidos</Text>
          </View>
          <View style={styles.estadoLoteItem}>
            <Text style={styles.estadoLoteValue}>{lote.cantidadActual}</Text>
            <Text style={styles.estadoLoteLabel}>Pollos Actuales</Text>
          </View>
          <View style={styles.estadoLoteItem}>
            <Text style={styles.estadoLoteValue}>
              {lote.cantidadInicial > 0 ? 
                (((estadisticasVentas?.cantidadVendida || 0) / lote.cantidadInicial) * 100).toFixed(1) : 0}%
            </Text>
            <Text style={styles.estadoLoteLabel}>% Vendido</Text>
          </View>
        </View>
      </Card>

      {ventas.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="cash-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay ventas registradas</Text>
          <Text style={styles.emptyText}>
            Las ventas se mostrarán aquí cuando se facturen productos de este lote
          </Text>
        </Card>
      ) : (
        <View style={styles.ventasList}>
          {ventas.map((venta) => (
            <Card key={venta.id} style={styles.ventaCard}>
              <View style={styles.ventaHeader}>
                <Text style={styles.ventaFecha}>
                  {formatDate(venta.fecha)}
                </Text>
                <Text style={styles.ventaTotal}>
                  RD${venta.total.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.ventaDetalle}>
                <View style={styles.ventaRow}>
                  <View style={styles.ventaItem}>
                    <Text style={styles.ventaLabel}>Cliente</Text>
                    <Text style={styles.ventaValue}>{venta.cliente.nombre}</Text>
                  </View>
                  <View style={styles.ventaItem}>
                    <Text style={styles.ventaLabel}>Cantidad</Text>
                    <Text style={styles.ventaValue}>{venta.cantidad} pollos</Text>
                  </View>
                </View>
                
                <View style={styles.ventaRow}>
                  <View style={styles.ventaItem}>
                    <Text style={styles.ventaLabel}>Precio unitario</Text>
                    <Text style={styles.ventaValue}>RD${venta.precioUnitario.toFixed(2)}</Text>
                  </View>
                  <View style={styles.ventaItem}>
                    <Text style={styles.ventaLabel}>Producto</Text>
                    <Text style={styles.ventaValue}>{venta.producto.nombre}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ventaFactura}>
                <Text style={styles.ventaFacturaText}>
                  Factura: {venta.facturaId}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

// Componente Tab Mortalidad
function TabMortalidad({ 
  lote, 
  registros,
  onRegistrarMuerte 
}: { 
  lote: LoteLevante; 
  registros: any[];
  onRegistrarMuerte: () => void; 
}) {
  const totalMuertes = registros
    .filter(registro => registro.loteId === lote.id)
    .reduce((sum, registro) => sum + registro.cantidad, 0);
  const pollosActuales = lote.cantidadActual; // Ya está actualizado

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Registro de Mortalidad</Text>
        <Button
          title="Registrar Muerte"
          onPress={onRegistrarMuerte}
          size="small"
          variant="danger"
        />
      </View>

      <Card style={styles.mortalidadCard}>
        <Text style={styles.cardTitle}>Resumen de Mortalidad</Text>
        <View style={styles.mortalidadStats}>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadValue}>{lote.cantidadInicial}</Text>
            <Text style={styles.mortalidadLabel}>Pollos Iniciales</Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadValue}>{totalMuertes}</Text>
            <Text style={styles.mortalidadLabel}>Muertes Registradas</Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadValue}>{pollosActuales}</Text>
            <Text style={styles.mortalidadLabel}>Pollos Actuales</Text>
          </View>
        </View>
      </Card>

      {registros.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="warning-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay registros de mortalidad</Text>
          <Text style={styles.emptyText}>
            Los registros de muerte se mostrarán aquí cuando se registren
          </Text>
        </Card>
      ) : (
        <View style={styles.registrosList}>
          {registros
            .filter(registro => registro.loteId === lote.id)
            .map((registro) => (
            <Card key={registro.id} style={styles.registroCard}>
              <View style={styles.registroHeader}>
                <Text style={styles.registroFecha}>
                  {formatDate(registro.fecha)}
                </Text>
                <Text style={styles.registroTotal}>
                  {registro.cantidad} {registro.cantidad === 1 ? 'muerte' : 'muertes'}
                </Text>
              </View>
              {registro.causa && (
                <Text style={styles.registroCausa}>
                  <Text style={styles.registroCausaLabel}>Causa:</Text> {registro.causa}
                </Text>
              )}
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

// Componente Tab Rendimiento
function TabRendimiento({ 
  lote, 
  registrosPeso,
  registrosMortalidad,
  estadisticas
}: { 
  lote: LoteLevante; 
  registrosPeso: PesoRegistro[];
  registrosMortalidad: any[];
  estadisticas: any;
}) {
  const totalMuertes = registrosMortalidad
    .filter(registro => registro.loteId === lote.id)
    .reduce((sum, registro) => sum + registro.cantidad, 0);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Análisis de Rendimiento</Text>
      
      <PerformanceReport
        loteId={lote.id}
        tipoAve={TipoAve.POLLO_LEVANTE}
        fechaNacimiento={lote.fechaNacimiento}
        cantidadInicial={lote.cantidadInicial}
        cantidadActual={lote.cantidadActual}
        registrosPeso={registrosPeso}
        gastoTotal={estadisticas?.gastoTotal || 0}
        ingresoTotal={estadisticas?.ingresoTotal || 0}
        style={styles.performanceReport}
      />

      {/* Recomendaciones */}
      <Card style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Recomendaciones</Text>
        <View style={styles.recommendationsList}>
          {generateRecommendations(lote, registrosPeso, totalMuertes, estadisticas).map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name={rec.icon as any} size={16} color={rec.color} />
              <Text style={[styles.recommendationText, { color: rec.color }]}>
                {rec.text}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

// Función auxiliar para generar recomendaciones
function generateRecommendations(
  lote: LoteLevante, 
  registrosPeso: PesoRegistro[], 
  totalMuertes: number,
  estadisticas: any
) {
  const recommendations = [];
  const tasaMortalidad = lote.cantidadInicial > 0 ? (totalMuertes / lote.cantidadInicial) * 100 : 0;
  const pesoActual = registrosPeso.length > 0 ? registrosPeso[0]?.pesoPromedio || 0 : 0;

  // Recomendación por mortalidad
  if (tasaMortalidad > 10) {
    recommendations.push({
      icon: 'warning',
      color: colors.danger,
      text: 'Alta mortalidad. Revisar condiciones sanitarias y manejo.'
    });
  } else if (tasaMortalidad < 3) {
    recommendations.push({
      icon: 'checkmark-circle',
      color: colors.success,
      text: 'Excelente control de mortalidad. Mantener prácticas actuales.'
    });
  }

  // Recomendación por peso
  if (registrosPeso.length > 1) {
    const crecimientoDiario = (registrosPeso[0]?.pesoPromedio - registrosPeso[1]?.pesoPromedio) || 0;
    if (crecimientoDiario < 0.03) {
      recommendations.push({
        icon: 'nutrition',
        color: colors.warning,
        text: 'Crecimiento lento. Evaluar calidad y cantidad del alimento.'
      });
    }
  }

  // Recomendación financiera
  const margen = estadisticas?.ingresoTotal > 0 ? 
    ((estadisticas.ingresoTotal - estadisticas.gastoTotal) / estadisticas.ingresoTotal) * 100 : 0;
  
  if (margen < 10 && estadisticas?.ingresoTotal > 0) {
    recommendations.push({
      icon: 'trending-down',
      color: colors.danger,
      text: 'Bajo margen de ganancia. Revisar costos y precios de venta.'
    });
  }

  // Recomendación por edad
  const edadEnDias = Math.floor((Date.now() - new Date(lote.fechaNacimiento).getTime()) / (1000 * 60 * 60 * 24));
  if (edadEnDias > 45 && pesoActual > 2.0) {
    recommendations.push({
      icon: 'time',
      color: colors.primary,
      text: 'Pollos en edad óptima para venta. Considerar comercialización.'
    });
  }

  return recommendations.length > 0 ? recommendations : [{
    icon: 'checkmark-circle',
    color: colors.success,
    text: 'Lote con buen rendimiento general. Continuar con el manejo actual.'
  }];
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
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: colors.textDark,
  },
  tabContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  summaryCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    flex: 1,
    textAlign: 'right',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: colors.success + '20',
  },
  inactiveBadge: {
    backgroundColor: colors.lightGray + '40',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: colors.success,
  },
  inactiveText: {
    color: colors.textMedium,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsCard: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
  },
  registrosList: {
    gap: 12,
  },
  registroCard: {
    padding: 16,
  },
  registroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  registroFecha: {
    fontSize: 14,
    color: colors.textMedium,
  },
  registroTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  registroDetalle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  registroItem: {
    fontSize: 12,
    color: colors.textMedium,
    width: '48%',
    marginBottom: 4,
  },
  gastosList: {
    gap: 12,
  },
  gastosSummaryCard: {
    marginBottom: 16,
    backgroundColor: colors.primary + '05',
    borderColor: colors.primary + '20',
    borderWidth: 1,
  },
  gastosSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gastosSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  gastosSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  gastosSummaryLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  gastoCard: {
    padding: 16,
  },
  gastoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gastoConcepto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  gastoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  gastoFecha: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 4,
  },
  gastoDescripcion: {
    fontSize: 14,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  mortalidadCard: {
    marginBottom: 16,
  },
  mortalidadStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mortalidadItem: {
    alignItems: 'center',
    flex: 1,
  },
  mortalidadValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  mortalidadLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  registroCausa: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 4,
  },
  registroCausaLabel: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  // Estilos para registros de peso
  pesoStatsCard: {
    marginBottom: 16,
    backgroundColor: colors.israelies + '05',
    borderColor: colors.israelies + '20',
    borderWidth: 1,
  },
  pesoStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pesoStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  pesoStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.israelies,
  },
  pesoStatLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  pesoRegistroCard: {
    padding: 16,
    marginBottom: 12,
  },
  pesoRegistroDetalle: {
    marginTop: 12,
  },
  pesoRegistroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pesoRegistroItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  pesoRegistroLabel: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  pesoRegistroValue: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
    marginTop: 2,
  },
  pesoObservaciones: {
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.veryLightGray,
    borderRadius: 6,
  },
  pesoObservacionesText: {
    fontSize: 13,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  // Estilo para alerta de maduración
  maturationAlert: {
    marginBottom: 16,
  },
  // Estilos para tab de rendimiento
  performanceReport: {
    marginBottom: 16,
  },
  recommendationsCard: {
    marginBottom: 16,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Estilo para panel de predicciones
  predictionsPanel: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  // Estilos para el card de maduración
  maturationCard: {
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  maturationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  maturationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  maturationProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  maturationProgressBar: {
    flex: 1,
    height: 12,
    backgroundColor: colors.veryLightGray,
    borderRadius: 6,
    overflow: 'hidden',
  },
  maturationProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  maturationProgressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    minWidth: 45,
    textAlign: 'right',
  },
  maturationStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  maturationStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  maturationStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  maturationStatLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  maturationAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.veryLightGray,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  maturationAlertText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  // Estilos para costo inicial del lote
  // Estilos para resumen total
  resumenTotalCard: {
    marginBottom: 16,
    backgroundColor: colors.secondary + '15',
    borderColor: colors.secondary,
    borderWidth: 2,
  },
  resumenTotalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  resumenTotalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  resumenTotalContent: {
    gap: 12,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resumenLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resumenLabel: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  resumenValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  resumenTotalRow: {
    borderTopWidth: 2,
    borderTopColor: colors.secondary,
    paddingTop: 12,
    marginTop: 8,
  },
  resumenTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    letterSpacing: 0.5,
  },
  resumenTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  // Estilos para detalle de costo inicial
  costoInicialCard: {
    marginBottom: 16,
    backgroundColor: colors.white,
    borderColor: colors.veryLightGray,
    borderWidth: 1,
  },
  costoInicialHeader: {
    marginBottom: 12,
  },
  costoInicialTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  costoInicialContent: {
    gap: 8,
  },
  costoInicialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  costoInicialLabel: {
    fontSize: 13,
    color: colors.textMedium,
  },
  costoInicialValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  // Estilos para lista de gastos
  gastosListHeader: {
    marginBottom: 12,
  },
  gastosListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  // Estilos para TabVentas
  ventasStatsCard: {
    marginBottom: 16,
    backgroundColor: colors.success + '05',
    borderColor: colors.success + '20',
    borderWidth: 1,
  },
  ventasStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ventasStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  ventasStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  ventasStatLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  estadoLoteCard: {
    marginBottom: 16,
  },
  estadoLoteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  estadoLoteItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  estadoLoteValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  estadoLoteLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  ventasList: {
    gap: 12,
  },
  ventaCard: {
    padding: 16,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ventaFecha: {
    fontSize: 14,
    color: colors.textMedium,
  },
  ventaTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  ventaDetalle: {
    marginBottom: 12,
  },
  ventaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ventaItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  ventaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  ventaValue: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '600',
    marginTop: 2,
  },
  ventaFactura: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  ventaFacturaText: {
    fontSize: 12,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
});
