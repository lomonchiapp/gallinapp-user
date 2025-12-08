/**
 * Página de detalles del lote de ponedoras
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import {
    Alert,
    Dimensions,
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
import CostoProduccionHuevos from '../../../../src/components/ui/CostoProduccionHuevos';
import CostPorHuevoBadge from '../../../../src/components/ui/CostPorHuevoBadge';
import DatePicker from '../../../../src/components/ui/DatePicker';
import GastoSheet from '../../../../src/components/ui/GastoSheet';
import { colors } from '../../../../src/constants/colors';
import { useGalpones } from '../../../../src/hooks/useGalpones';
import { exportarYCompartir } from '../../../../src/services/pdf-export.service';
import { calcularDesgloseCostos } from '../../../../src/services/costos-produccion-huevos.service';
import { getVentasPorLote } from '../../../../src/services/ventas.service';
import { useArticulosStore } from '../../../../src/stores/articulosStore';
import { useMortalityStore } from '../../../../src/stores/mortalityStore';
import { usePonedorasStore } from '../../../../src/stores/ponedorasStore';
import { EstadoLote, LotePonedora, TipoAve } from '../../../../src/types';
import { Galpon } from '../../../../src/types/galpon';
import { calculateAgeInDays, formatDate } from '../../../../src/utils/dateUtils';

const moduleColors = {
  badgeBg: colors.ponedoras + '15',
  badgeText: colors.ponedoras,
};

export default function DetallesLotePonedora() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabActivo, setTabActivo] = useState('general');
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [gastoSheetVisible, setGastoSheetVisible] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const {
    loteActual,
    estadisticasLote,
    registrosDiarios,
    registrosHuevos,
    gastosLote,
    ventasHuevos,
    registrosMortalidad,
    cargarLotePonedora,
    cargarEstadisticasLote,
    cargarRegistrosDiarios,
    cargarRegistrosHuevos,
    cargarRegistrosMortalidad,
    eliminarLote,
    isLoading,
    error
  } = usePonedorasStore();

  const { 
    loadRegistrosPorTipo, 
    registros: registrosMortalidadGlobal 
  } = useMortalityStore();

  const { articulos, loadArticulos } = useArticulosStore();
  const { galpones, cargarGalpones } = useGalpones();

  // Cargar datos del lote al montar el componente
  useEffect(() => {
    if (id) {
      cargarDatosLote();
    }
  }, [id]);

  const cargarDatosLote = async () => {
    try {
      await Promise.all([
        cargarLotePonedora(id),
        cargarEstadisticasLote(id),
        cargarRegistrosDiarios(id),
        cargarRegistrosHuevos(id),
        cargarRegistrosMortalidad(id),
        loadRegistrosPorTipo(TipoAve.PONEDORA),
        loadArticulos(),
        cargarGalpones(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos del lote:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosLote();
    setRefreshing(false);
  };

  const handleRegistrarProduccion = () => {
    router.push({
      pathname: '/(tabs)/ponedoras/registrar-produccion',
      params: { loteId: id }
    });
  };

  const handleRegistrarMuerte = () => {
    router.push({
      pathname: '/(tabs)/ponedoras/registrar-muerte',
      params: { loteId: id }
    });
  };

  const handleRegistrarGasto = () => {
    setGastoSheetVisible(true);
  };

  const handleExportarPDF = async () => {
    if (!loteActual) return;
    
    try {
      setExportingPDF(true);
      
      // Calcular estadísticas para el PDF
      const totalMuertes = registrosMortalidadGlobal
        .filter(registro => registro.loteId === loteActual.id)
        .reduce((sum, registro) => sum + registro.cantidad, 0);
      
      const edadActual = calculateAgeInDays(loteActual.fechaInicio);
      const tasaMortalidad = loteActual.cantidadInicial > 0 ? (totalMuertes / loteActual.cantidadInicial) * 100 : 0;
      const huevosTotales = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);

      const pdfData = {
        lote: {
          id: loteActual.id,
          nombre: loteActual.nombre,
          tipoAve: TipoAve.PONEDORA,
          fechaInicio: loteActual.fechaInicio,
          cantidadInicial: loteActual.cantidadInicial,
          cantidadActual: loteActual.cantidadActual,
          estado: EstadoLote[loteActual.estado] || 'ACTIVO'
        },
        estadisticas: {
          gastoTotal: estadisticasLote?.gastoTotal || 0,
          ingresoTotal: estadisticasLote?.ingresoTotal || 0,
          edadActual,
          mortalidadTotal: totalMuertes,
          tasaMortalidad,
          huevosTotales
        },
        registrosPeso: [], // No hay registros de peso para ponedoras
        registrosProduccion: registrosHuevos.slice(0, 10) // Últimos 10 registros
      };

      await exportarYCompartir(pdfData);
      
    } catch (error) {
      console.error('Error exportando PDF:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleEliminarLote = () => {
    // Validar que el lote no esté activo
    if (loteActual?.estado === EstadoLote.ACTIVO) {
      Alert.alert(
        'No se puede eliminar',
        'No se puede eliminar un lote activo. Debe finalizarlo primero.',
        [{ text: 'Entendido' }]
      );
      return;
    }

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
              await eliminarLote(id);
              Alert.alert('Éxito', 'Lote eliminado correctamente');
              router.back();
            } catch (error: any) {
              console.error('Error al eliminar lote:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el lote');
            }
          }
        }
      ]
    );
  };


  const tabs = [
    { id: 'general', label: 'General', icon: 'information-circle-outline' },
    { id: 'produccion', label: 'Producción', icon: 'egg-outline' },
    { id: 'costos', label: 'Costos', icon: 'calculator-outline' },
    { id: 'gastos', label: 'Gastos', icon: 'receipt-outline' },
    { id: 'ventas', label: 'Ventas', icon: 'cash-outline' },
    { id: 'mortalidad', label: 'Mortalidad', icon: 'warning-outline' },
    { id: 'dashboard', label: 'Dashboard', icon: 'analytics-outline' }
  ];

  // Renderizado condicional estable
  if (isLoading && !loteActual) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando detalles del lote...</Text>
        </View>
      </View>
    );
  }

  if (error || !loteActual) {
    return (
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{loteActual?.nombre}</Text>
              <Text style={styles.subtitle}>
                {loteActual?.cantidadActual} gallinas • {loteActual?.raza}
              </Text>
              <Text style={styles.ageInfo}>
                {loteActual?.fechaInicio ? `${calculateAgeInDays(loteActual.fechaInicio)} días de edad` : ''}
              </Text>
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
            {tabActivo === 'general' && loteActual && (
              <TabGeneral
                lote={loteActual}
                estadisticas={estadisticasLote}
                registrosHuevos={registrosHuevos}
                registrosMortalidad={registrosMortalidad}
                onRegistrarProduccion={handleRegistrarProduccion}
                onRegistrarMuerte={handleRegistrarMuerte}
                onRegistrarGasto={handleRegistrarGasto}
                galpones={galpones}
                gastosLote={gastosLote}
              />
            )}

            {tabActivo === 'produccion' && (
              <TabProduccion
                registros={registrosHuevos}
                ventas={ventasHuevos}
                onRegistrarProduccion={handleRegistrarProduccion}
              />
            )}

            {tabActivo === 'costos' && loteActual && (
              <TabCostosProduccion
                lote={loteActual}
                gastosLote={gastosLote}
                registrosHuevos={registrosHuevos}
              />
            )}

            {tabActivo === 'gastos' && loteActual && (
              <TabGastos
                lote={loteActual}
                gastos={gastosLote}
                onRegistrarGasto={handleRegistrarGasto}
              />
            )}

            {tabActivo === 'ventas' && loteActual && (
              <TabVentas
                lote={loteActual}
              />
            )}

            {tabActivo === 'mortalidad' && loteActual && (
              <TabMortalidad
                lote={loteActual}
                registros={registrosMortalidad}
                onRegistrarMuerte={handleRegistrarMuerte}
              />
            )}

            {tabActivo === 'dashboard' && loteActual && (
              <TabDashboard
                lote={loteActual}
                gastosLote={gastosLote}
                registrosHuevos={registrosHuevos}
                registrosMortalidad={registrosMortalidad}
                estadisticas={estadisticasLote}
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
                    router.push(`/(tabs)/ponedoras/editar-lote?loteId=${loteActual?.id}`);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <Text style={styles.menuItemText}>Editar Lote</Text>
                </TouchableOpacity>

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

          {/* GastoSheet */}
          {loteActual && (
            <GastoSheet
              visible={gastoSheetVisible}
              onClose={() => setGastoSheetVisible(false)}
              loteId={loteActual.id}
              tipoLote={TipoAve.PONEDORA}
              loteNombre={loteActual.nombre}
              articulos={articulos.map(a => ({
                id: a.id,
                nombre: a.nombre,
                costoFijo: a.costoFijo,
                precio: a.precio
              }))}
            />
          )}
    </View>
  );
}

// Componente Tab General
function TabGeneral({ 
  lote, 
  estadisticas, 
  registrosHuevos,
  registrosMortalidad,
  onRegistrarProduccion, 
  onRegistrarMuerte, 
  onRegistrarGasto,
  galpones,
  gastosLote,
}: {
  lote: LotePonedora;
  estadisticas: any;
  registrosHuevos: any[];
  registrosMortalidad: any[];
  onRegistrarProduccion: () => void;
  onRegistrarMuerte: () => void;
  onRegistrarGasto: () => void;
  galpones: Galpon[];
  gastosLote: any[];
}) {
  // Calcular huevos totales desde los registros reales
  const huevosTotales = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);
  
  // Calcular muertes totales desde los registros reales
  const muertesTotales = registrosMortalidad.reduce((total, registro) => total + registro.cantidad, 0);
  
  // Gallinas actuales ya están actualizadas en cantidadActual
  const gallinasActuales = lote.cantidadActual;
  
  // Calcular costo total del lote (costo inicial + gastos adicionales)
  const costoInicial = lote.costo || 0;
  const gastosAdicionales = gastosLote
    .filter(gasto => !(gasto.descripcion?.toLowerCase().includes('costo inicial') || 
                      gasto.articuloNombre?.toLowerCase().includes('costo inicial')))
    .reduce((total, gasto) => total + gasto.total, 0);
  const costoTotal = costoInicial + gastosAdicionales;
  
  // Preparar datos para el badge CPH
  const registrosHuevosParaBadge = registrosHuevos.map(r => ({
    fecha: r.fecha instanceof Date ? r.fecha : new Date(r.fecha),
    cantidad: r.cantidad
  }));
  
  const gastosParaBadge = gastosLote.map(g => ({
    fecha: g.fecha instanceof Date ? g.fecha : new Date(g.fecha),
    total: g.total
  }));
  
  // Estado para el costo unitario del ave (CPU)
  const [costoUnitarioAve, setCostoUnitarioAve] = useState<number | null>(null);
  const [isLoadingCPU, setIsLoadingCPU] = useState(false);

  // Calcular costo unitario del ave (CPU)
  useEffect(() => {
    const calcularCPU = async () => {
      try {
        setIsLoadingCPU(true);
        const desglose = await calcularDesgloseCostos(lote);
        setCostoUnitarioAve(desglose.costoTotalPorAve);
      } catch (error) {
        console.error('Error al calcular CPU:', error);
        setCostoUnitarioAve(null);
      } finally {
        setIsLoadingCPU(false);
      }
    };

    calcularCPU();
  }, [lote.id]);

  return (
    <View style={styles.tabContent}>
      {/* Resumen del lote */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen del Lote</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{gallinasActuales}</Text>
            <Text style={styles.summaryLabel}>Gallinas Actuales</Text>
          </View>
          <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => {
              if (!lote.id) {
                Alert.alert('Error', 'No se pudo identificar el lote');
                return;
              }
              console.log('Navegando a registros-huevos con loteId:', lote.id);
              router.push({
                pathname: '/(tabs)/ponedoras/registros-huevos',
                params: { loteId: lote.id }
              } as any);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryValue}>{huevosTotales}</Text>
            <Text style={styles.summaryLabel}>Huevos Totales</Text>
            <Text style={styles.summaryHint}>Toca para ver registros</Text>
          </TouchableOpacity>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {gallinasActuales > 0 ? ((huevosTotales / gallinasActuales) * 100 / (registrosHuevos.length || 1)).toFixed(1) : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Tasa de Postura</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{muertesTotales}</Text>
            <Text style={styles.summaryLabel}>Muertes Totales</Text>
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
          <Text style={styles.infoValue}>Ponedora</Text>
        </View>
        {lote.galponId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Galpón asignado</Text>
            <View style={styles.infoValueRow}>
              <Ionicons name="location-outline" size={16} color={moduleColors.badgeText} style={styles.infoIcon} />
              <Text style={styles.infoValue}>
                {galpones.find((g) => g.id === lote.galponId)?.nombre ?? 'Galpón desconocido'}
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Costo Unitario del Ave (CPU) y Costo por Huevo (CPH) */}
      <Card style={styles.cpuCard}>
        <View style={styles.cpuHeader}>
          <Ionicons name="cash-outline" size={24} color={moduleColors.badgeText} />
          <Text style={styles.cardTitle}>Costos de Producción</Text>
        </View>
        <View style={styles.costosContainer}>
          {isLoadingCPU ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Calculando...</Text>
            </View>
          ) : costoUnitarioAve !== null ? (
            <View style={styles.cpuContent}>
              <View style={styles.costoRow}>
                <View style={styles.costoItem}>
                  <Text style={styles.costoLabel}>CPU (por gallina):</Text>
                  <Text style={styles.cpuValue}>RD${costoUnitarioAve.toFixed(2)}</Text>
                </View>
                <CostPorHuevoBadge
                  costoTotal={costoTotal}
                  cantidadHuevos={huevosTotales}
                  cantidadInicial={lote.cantidadInicial}
                  cantidadActual={lote.cantidadActual}
                  loteId={lote.id!}
                  tipoLote="PONEDORA"
                  size="medium"
                  fechaInicio={lote.fechaInicio}
                  registrosHuevos={registrosHuevosParaBadge}
                  gastos={gastosParaBadge}
                />
              </View>
              <Text style={styles.cpuDescription}>
                CPU: Costo total acumulado dividido entre la cantidad inicial de gallinas{'\n'}
                CPH: Costo de producción por huevo (toca el badge para ver historial diario)
              </Text>
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No se pudo calcular el costo unitario</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Costos de producción de huevos */}
      <CostoProduccionHuevos
        loteId={lote.id}
        nombreLote={lote.nombre}
        showDetailed={false}
        onNavigateToDetails={() => router.push(`/(tabs)/ponedoras/dashboard-costos-huevos?loteId=${lote.id}`)}
      />

      {/* Estadísticas adicionales */}
      {estadisticas && (
        <Card style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas del Lote</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticas.gananciaTotal ? `RD$${estadisticas.gananciaTotal.toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Ganancia Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticas.ingresoTotal ? `RD$${estadisticas.ingresoTotal.toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Ingresos Totales</Text>
            </View>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push(`/(tabs)/ponedoras/historial-gastos?loteId=${lote.id}&tipoLote=${TipoAve.PONEDORA}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>
                {estadisticas.gastoTotal ? `RD$${estadisticas.gastoTotal.toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Gastos Totales</Text>
              <Text style={styles.statHint}>Toca para ver historial</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticas.ventasHuevos || 0}
              </Text>
              <Text style={styles.statLabel}>Ventas Registradas</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Acciones rápidas */}
      <Card style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          <Button
            title="Registrar Producción"
            onPress={onRegistrarProduccion}
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

// Componente Tab Producción
function TabProduccion({ 
  registros, 
  ventas, 
  onRegistrarProduccion 
}: {
  registros: any[];
  ventas: any[];
  onRegistrarProduccion: () => void;
}) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Registro de Producción de Huevos</Text>
        <Button
          title="Nuevo Registro"
          onPress={onRegistrarProduccion}
          size="small"
        />
      </View>

      {registros.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="egg-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay registros de producción</Text>
          <Text style={styles.emptyText}>
            Comience registrando la producción diaria de huevos
          </Text>
        </Card>
      ) : (
        <View style={styles.registrosList}>
          {registros.map((registro) => (
            <Card key={registro.id} style={styles.registroCard}>
              <View style={styles.registroHeader}>
                <Text style={styles.registroFecha}>
                  {formatDate(registro.fecha)}
                </Text>
                <Text style={styles.registroTotal}>
                  {registro.cantidad} huevos
                </Text>
              </View>
              <View style={styles.registroDetalle}>
                <Text style={styles.registroItem}>
                  Cantidad total: {registro.cantidad} huevos
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

// Componente Tab Gastos
function TabGastos({ lote, gastos, onRegistrarGasto }: { lote: LotePonedora; gastos: any[]; onRegistrarGasto: () => void }) {
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
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/ponedoras/historial-gastos?loteId=${lote.id}&tipoLote=${TipoAve.PONEDORA}`)}
        activeOpacity={0.7}
      >
        <Card style={styles.resumenTotalCard}>
          <View style={styles.resumenTotalHeader}>
            <Ionicons name="calculator" size={24} color={colors.ponedoras} />
            <Text style={styles.resumenTotalTitle}>Resumen Total de Gastos</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.ponedoras} />
          </View>
        
        <View style={styles.resumenTotalContent}>
          {costoInicialLote > 0 && (
            <View style={styles.resumenRow}>
              <View style={styles.resumenLabelContainer}>
                <Ionicons name="pricetag" size={16} color={colors.ponedoras} />
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
      </TouchableOpacity>

      {/* Detalle del Costo Inicial */}
      {costoInicialLote > 0 && (
        <Card style={styles.costoInicialCard}>
          <View style={styles.costoInicialHeader}>
            <Text style={styles.costoInicialTitle}>💰 Detalle del Costo Inicial</Text>
          </View>
          <View style={styles.costoInicialContent}>
            <View style={styles.costoInicialRow}>
              <Text style={styles.costoInicialLabel}>Cantidad de gallinas:</Text>
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
                  <View style={styles.gastoInfo}>
                    <Text style={styles.gastoConcepto}>{gasto.articuloNombre}</Text>
                    <Text style={styles.gastoFecha}>
                      {formatDate(gasto.fecha)}
                    </Text>
                    {/* Mostrar cantidad y precio unitario */}
                    <Text style={styles.gastoCantidadPrecio}>
                      {gasto.cantidad} × RD${gasto.precioUnitario?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                  <Text style={styles.gastoMonto}>RD${gasto.total.toFixed(2)}</Text>
                </View>
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
  lote 
}: { 
  lote: LotePonedora; 
}) {
  const [ventas, setVentas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarVentas = async () => {
      if (!lote.id) return;
      
      try {
        setIsLoading(true);
        const ventasData = await getVentasPorLote(lote.id!, TipoAve.PONEDORA);
        setVentas(ventasData);
      } catch (error) {
        console.error('Error al cargar ventas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarVentas();
  }, [lote.id]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const ventasConfirmadas = ventas.filter(v => v.estado === 'CONFIRMADA');
    const montoTotal = ventasConfirmadas.reduce((sum, v) => sum + v.total, 0);
    const cantidadHuevosVendidos = ventasConfirmadas.reduce((sum, venta) => {
      return sum + venta.items.reduce((itemSum: number, item: any) => {
        if (item.producto.tipo === 'HUEVOS') {
          const productoHuevos = item.producto;
          if (productoHuevos.unidadVenta === 'CAJAS') {
            return itemSum + (item.cantidad * (productoHuevos.cantidadPorCaja || 30));
          }
          return itemSum + item.cantidad;
        }
        return itemSum;
      }, 0);
    }, 0);

    return {
      totalVentas: ventas.length,
      ventasConfirmadas: ventasConfirmadas.length,
      montoTotal,
      cantidadHuevosVendidos
    };
  }, [ventas]);

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.loadingText}>Cargando ventas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Ventas del Lote</Text>
        <Button
          title="Nueva Venta"
          onPress={() => router.push('/(tabs)/ventas/nueva')}
          size="small"
        />
      </View>

      {/* Estadísticas */}
      <Card style={styles.ventasStatsCard}>
        <Text style={styles.cardTitle}>Resumen de Ventas</Text>
        <View style={styles.ventasStatsGrid}>
          <View style={styles.ventasStatItem}>
            <Text style={styles.ventasStatValue}>{estadisticas.totalVentas}</Text>
            <Text style={styles.ventasStatLabel}>Total Ventas</Text>
          </View>
          <View style={styles.ventasStatItem}>
            <Text style={styles.ventasStatValue}>{estadisticas.ventasConfirmadas}</Text>
            <Text style={styles.ventasStatLabel}>Confirmadas</Text>
          </View>
          <View style={styles.ventasStatItem}>
            <Text style={[styles.ventasStatValue, { color: colors.success }]}>
              RD${estadisticas.montoTotal.toFixed(2)}
            </Text>
            <Text style={styles.ventasStatLabel}>Monto Total</Text>
          </View>
          <View style={styles.ventasStatItem}>
            <Text style={[styles.ventasStatValue, { color: colors.ponedoras }]}>
              {estadisticas.cantidadHuevosVendidos.toLocaleString()}
            </Text>
            <Text style={styles.ventasStatLabel}>Huevos Vendidos</Text>
          </View>
        </View>
      </Card>

      {ventas.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="cash-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No hay ventas registradas</Text>
          <Text style={styles.emptyText}>
            Las ventas de este lote se mostrarán aquí cuando se registren
          </Text>
        </Card>
      ) : (
        <View style={styles.ventasList}>
          {ventas.map((venta) => (
            <Card key={venta.id} style={styles.ventaCard}>
              <View style={styles.ventaHeader}>
                <View style={styles.ventaInfo}>
                  <Text style={styles.ventaNumero}>{venta.numero}</Text>
                  <Text style={styles.ventaFecha}>
                    {formatDate(venta.fecha)}
                  </Text>
                </View>
                <View style={[
                  styles.estadoBadge,
                  venta.estado === 'CONFIRMADA' && styles.estadoConfirmada,
                  venta.estado === 'CANCELADA' && styles.estadoCancelada,
                ]}>
                  <Text style={[
                    styles.estadoText,
                    venta.estado === 'CONFIRMADA' && styles.estadoTextConfirmada,
                    venta.estado === 'CANCELADA' && styles.estadoTextCancelada,
                  ]}>
                    {venta.estado}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.clienteNombre}>{venta.cliente.nombre}</Text>
              
              <View style={styles.ventaDetalle}>
                <Text style={styles.itemsCount}>
                  {venta.items.length} producto{venta.items.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.ventaTotal}>RD${venta.total.toFixed(2)}</Text>
              </View>

              {/* Items de la venta */}
              <View style={styles.ventaItemsContainer}>
                {venta.items.map((item: any, index: number) => (
                  <View key={index} style={styles.ventaItemRow}>
                    <View style={styles.ventaItemInfo}>
                      <Ionicons 
                        name={item.producto.tipo === 'HUEVOS' ? 'egg' : 'restaurant'} 
                        size={16} 
                        color={item.producto.tipo === 'HUEVOS' ? colors.ponedoras : colors.primary} 
                      />
                      <Text style={styles.ventaItemNombre}>{item.producto.nombre}</Text>
                    </View>
                    <View style={styles.ventaItemCantidad}>
                      <Text style={styles.ventaItemCantidadText}>
                        {item.cantidad} {item.producto.unidadMedida}
                      </Text>
                      <Text style={styles.ventaItemPrecio}>
                        RD${item.total.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
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
  lote: LotePonedora; 
  registros: any[];
  onRegistrarMuerte: () => void; 
}) {
  const totalMuertes = registros.reduce((sum, registro) => sum + registro.cantidad, 0);
  const gallinasActuales = lote.cantidadActual;

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
            <Text style={styles.mortalidadLabel}>Gallinas Iniciales</Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadValue}>{totalMuertes}</Text>
            <Text style={styles.mortalidadLabel}>Muertes Registradas</Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadValue}>{gallinasActuales}</Text>
            <Text style={styles.mortalidadLabel}>Gallinas Actuales</Text>
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
          {registros.map((registro) => (
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

// Componente Tab Costos de Producción
function TabCostosProduccion({ 
  lote, 
  gastosLote, 
  registrosHuevos 
}: { 
  lote: LotePonedora; 
  gastosLote: any[];
  registrosHuevos: any[];
}) {
  const [fechaBusqueda, setFechaBusqueda] = useState<string>('');
  
  // Calcular CPH para la fecha seleccionada
  const calcularCPHPorFecha = (fecha: string) => {
    if (!fecha) return null;
    
    const fechaBusquedaDate = new Date(fecha);
    fechaBusquedaDate.setHours(0, 0, 0, 0);
    const fechaFin = new Date(fechaBusquedaDate);
    fechaFin.setHours(23, 59, 59, 999);
    
    // Obtener gastos del día
    const gastosDelDia = gastosLote.filter(gasto => {
      const gastoFecha = gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha);
      return gastoFecha >= fechaBusquedaDate && gastoFecha <= fechaFin;
    });
    
    const totalGastosDia = gastosDelDia.reduce((sum, gasto) => sum + gasto.total, 0);
    
    // Obtener producción del día
    const registroDelDia = registrosHuevos.find(registro => {
      const registroFecha = registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha);
      return registroFecha >= fechaBusquedaDate && registroFecha <= fechaFin;
    });
    
    const huevosDelDia = registroDelDia?.cantidad || 0;
    
    // Calcular CPH
    const cphDia = huevosDelDia > 0 ? totalGastosDia / huevosDelDia : 0;
    
    return {
      fecha: fechaBusquedaDate,
      gastosDelDia,
      totalGastosDia,
      huevosDelDia,
      cphDia,
      tieneDatos: gastosDelDia.length > 0 || huevosDelDia > 0
    };
  };
  
  const resultadoFecha = fechaBusqueda ? calcularCPHPorFecha(fechaBusqueda) : null;
  
  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };
  
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Análisis de Costos de Producción</Text>
        <Button
          title="Dashboard Completo"
          onPress={() => router.push(`/(tabs)/ponedoras/dashboard-costos-huevos?loteId=${lote.id}`)}
          size="small"
        />
      </View>

      {/* Buscador de fecha */}
      <Card style={styles.buscadorFechaCard}>
        <View style={styles.buscadorFechaHeader}>
          <Ionicons name="search-outline" size={24} color={colors.ponedoras} />
          <Text style={styles.buscadorFechaTitle}>Buscar Costo por Fecha</Text>
        </View>
        <DatePicker
          label="Selecciona una fecha"
          value={fechaBusqueda}
          onDateChange={setFechaBusqueda}
          placeholder="Buscar costo de una fecha específica"
          maximumDate={new Date()}
          minimumDate={lote.fechaInicio}
        />
        
        {resultadoFecha && (
          <View style={styles.resultadoFechaContainer}>
            {resultadoFecha.tieneDatos ? (
              <>
                <View style={styles.resultadoFechaHeader}>
                  <Ionicons name="calendar" size={20} color={colors.ponedoras} />
                  <Text style={styles.resultadoFechaTitle}>
                    Resultado para {formatDate(resultadoFecha.fecha)}
                  </Text>
                </View>
                
                <View style={styles.resultadoFechaGrid}>
                  <View style={styles.resultadoFechaItem}>
                    <Text style={styles.resultadoFechaLabel}>Huevos Producidos</Text>
                    <Text style={styles.resultadoFechaValue}>
                      {resultadoFecha.huevosDelDia.toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.resultadoFechaItem}>
                    <Text style={styles.resultadoFechaLabel}>Gastos del Día</Text>
                    <Text style={styles.resultadoFechaValue}>
                      {formatPrice(resultadoFecha.totalGastosDia)}
                    </Text>
                  </View>
                  
                  <View style={[styles.resultadoFechaItem, styles.resultadoFechaItemCPH]}>
                    <Text style={styles.resultadoFechaLabelCPH}>Costo por Huevo (CPH)</Text>
                    <Text style={styles.resultadoFechaValueCPH}>
                      {formatPrice(resultadoFecha.cphDia)}
                    </Text>
                  </View>
                </View>
                
                {resultadoFecha.gastosDelDia.length > 0 && (
                  <View style={styles.gastosDetalleContainer}>
                    <Text style={styles.gastosDetalleTitle}>Detalle de Gastos:</Text>
                    {resultadoFecha.gastosDelDia.map((gasto, index) => (
                      <View key={index} style={styles.gastoDetalleRow}>
                        <Text style={styles.gastoDetalleNombre}>{gasto.articuloNombre}</Text>
                        <Text style={styles.gastoDetalleMonto}>{formatPrice(gasto.total)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.sinDatosContainer}>
                <Ionicons name="information-circle-outline" size={48} color={colors.textMedium} />
                <Text style={styles.sinDatosText}>
                  No hay registros de producción o gastos para esta fecha
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>

      {/* Componente principal de costos detallado */}
      <CostoProduccionHuevos
        loteId={lote.id}
        nombreLote={lote.nombre}
        showDetailed={true}
        onNavigateToDetails={() => router.push(`/(tabs)/ponedoras/dashboard-costos-huevos?loteId=${lote.id}`)}
      />

      {/* Información sobre el análisis */}
      <Card style={styles.costoInfoCard}>
        <View style={styles.costoInfoHeader}>
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
          <Text style={styles.costoInfoTitle}>Análisis de Dos Fases</Text>
        </View>
        <Text style={styles.costoInfoDescription}>
          El cálculo de costos se divide en dos fases principales:
        </Text>
        <View style={styles.costoInfoList}>
          <View style={styles.costoInfoItem}>
            <Ionicons name="heart-outline" size={16} color="#e74c3c" />
            <Text style={styles.costoInfoItemText}>
              <Text style={styles.costoInfoItemTitle}>Fase Inicial:</Text> Desde nacimiento hasta inicio de postura
            </Text>
          </View>
          <View style={styles.costoInfoItem}>
            <Ionicons name="egg-outline" size={16} color="#f39c12" />
            <Text style={styles.costoInfoItemText}>
              <Text style={styles.costoInfoItemTitle}>Fase Productiva:</Text> Gastos diarios ÷ huevos producidos
            </Text>
          </View>
        </View>
        <View style={styles.costoFormulaContainer}>
          <Text style={styles.costoFormulaTitle}>Fórmula del día:</Text>
          <Text style={styles.costoFormula}>
            Costo por huevo = Gastos del día ÷ Huevos producidos
          </Text>
          <Text style={styles.costoExample}>
            Ejemplo: $12,000 (alimento) ÷ 4,500 huevos = $2.67 por huevo
          </Text>
        </View>
      </Card>

      {/* Botón para acceder al dashboard completo */}
      <Card style={styles.dashboardAccessCard}>
        <View style={styles.dashboardAccessHeader}>
          <Ionicons name="analytics-outline" size={32} color={colors.primary} />
          <View style={styles.dashboardAccessText}>
            <Text style={styles.dashboardAccessTitle}>Dashboard Avanzado</Text>
            <Text style={styles.dashboardAccessDescription}>
              Accede al análisis completo con gráficos, tendencias y alertas personalizadas
            </Text>
          </View>
        </View>
        <Button
          title="Abrir Dashboard de Costos"
          onPress={() => router.push(`/(tabs)/ponedoras/dashboard-costos-huevos?loteId=${lote.id}`)}
          style={styles.dashboardAccessButton}
        />
      </Card>
    </View>
  );
}

// Componente Tab Dashboard
function TabDashboard({ 
  lote, 
  gastosLote, 
  registrosHuevos, 
  registrosMortalidad,
  estadisticas 
}: { 
  lote: LotePonedora; 
  gastosLote: any[];
  registrosHuevos: any[];
  registrosMortalidad: any[];
  estadisticas: any;
}) {
  // Calcular métricas del lote
  const huevosTotales = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);
  const muertesTotales = registrosMortalidad.reduce((total, registro) => total + registro.cantidad, 0);
  const diasActivo = Math.floor((new Date().getTime() - new Date(lote.fechaInicio).getTime()) / (1000 * 60 * 60 * 24));
  
  // Calcular costo total
  const costoInicial = lote.costo || 0;
  const gastosAdicionales = gastosLote
    .filter(gasto => !(gasto.descripcion?.toLowerCase().includes('costo inicial') || 
                      gasto.articuloNombre?.toLowerCase().includes('costo inicial')))
    .reduce((total, gasto) => total + gasto.total, 0);
  const costoTotal = costoInicial + gastosAdicionales;
  
  // Calcular CPH promedio
  const cphPromedio = huevosTotales > 0 ? costoTotal / huevosTotales : 0;
  
  // Calcular producción promedio diaria
  const produccionPromedioDiaria = diasActivo > 0 ? huevosTotales / diasActivo : 0;
  
  // Calcular tasa de postura
  const tasaPostura = lote.cantidadActual > 0 && diasActivo > 0 
    ? (huevosTotales / (lote.cantidadActual * diasActivo)) * 100 
    : 0;
  
  // Calcular tasa de mortalidad
  const tasaMortalidad = lote.cantidadInicial > 0 
    ? (muertesTotales / lote.cantidadInicial) * 100 
    : 0;
  
  // Calcular tendencias (últimos 7 días vs anteriores)
  const ultimos7Dias = registrosHuevos
    .filter(r => {
      const fechaRegistro = r.fecha instanceof Date ? r.fecha : new Date(r.fecha);
      const diasAtras = Math.floor((new Date().getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtras <= 7;
    })
    .reduce((total, registro) => total + registro.cantidad, 0);
  
  const diasAnteriores = Math.max(1, diasActivo - 7);
  const produccionAnterior = huevosTotales - ultimos7Dias;
  const promedioAnterior = diasAnteriores > 0 ? produccionAnterior / diasAnteriores : 0;
  const promedioUltimos7 = 7 > 0 ? ultimos7Dias / 7 : 0;
  
  const tendenciaProduccion = promedioAnterior > 0 
    ? ((promedioUltimos7 - promedioAnterior) / promedioAnterior) * 100 
    : 0;
  
  // Calcular CPH de últimos 7 días
  const gastosUltimos7Dias = gastosLote
    .filter(gasto => {
      const fechaGasto = gasto.fecha instanceof Date ? gasto.fecha : new Date(gasto.fecha);
      const diasAtras = Math.floor((new Date().getTime() - fechaGasto.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtras <= 7;
    })
    .reduce((total, gasto) => total + gasto.total, 0);
  
  const cphUltimos7Dias = ultimos7Dias > 0 ? gastosUltimos7Dias / ultimos7Dias : 0;
  const tendenciaCPH = cphPromedio > 0 
    ? ((cphUltimos7Dias - cphPromedio) / cphPromedio) * 100 
    : 0;
  
  // Generar recomendaciones
  const recomendaciones: string[] = [];
  
  if (tasaPostura < 60) {
    recomendaciones.push('⚠️ La tasa de postura está por debajo del 60%. Revisa las condiciones del lote.');
  }
  
  if (tasaMortalidad > 5) {
    recomendaciones.push('⚠️ La tasa de mortalidad está por encima del 5%. Revisa la salud del lote.');
  }
  
  if (tendenciaCPH > 10) {
    recomendaciones.push('📈 El CPH ha aumentado más del 10% en los últimos 7 días. Revisa los gastos recientes.');
  }
  
  if (tendenciaProduccion < -10) {
    recomendaciones.push('📉 La producción ha disminuido más del 10% en los últimos 7 días. Revisa las condiciones.');
  }
  
  if (cphPromedio > 5) {
    recomendaciones.push('💰 El costo por huevo está por encima de RD$5.00. Considera optimizar los gastos.');
  }
  
  if (recomendaciones.length === 0) {
    recomendaciones.push('✅ El lote está funcionando dentro de parámetros normales.');
  }
  
  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };
  
  // Obtener últimos 30 días de producción para gráfico
  const ultimos30Dias = registrosHuevos
    .filter(r => {
      const fechaRegistro = r.fecha instanceof Date ? r.fecha : new Date(r.fecha);
      const diasAtras = Math.floor((new Date().getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
      return diasAtras <= 30;
    })
    .sort((a, b) => {
      const fechaA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
      const fechaB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
      return fechaA.getTime() - fechaB.getTime();
    });
  
  // Calcular mejor y peor día
  const mejorDia = ultimos30Dias.length > 0 
    ? ultimos30Dias.reduce((mejor, actual) => actual.cantidad > mejor.cantidad ? actual : mejor)
    : null;
  
  const peorDia = ultimos30Dias.length > 0 
    ? ultimos30Dias.reduce((peor, actual) => actual.cantidad < peor.cantidad ? actual : peor)
    : null;
  
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Dashboard Detallado</Text>
        <Button
          title="Comparar Lotes"
          onPress={() => router.push('/(tabs)/ponedoras/dashboard-comparativo')}
          size="small"
          variant="outline"
        />
      </View>

      {/* Métricas Principales */}
      <Card style={styles.metricasCard}>
        <Text style={styles.cardTitle}>Métricas Principales</Text>
        <View style={styles.metricasGrid}>
          <TouchableOpacity 
            style={styles.metricaItem}
            onPress={() => {
              if (!lote.id) {
                Alert.alert('Error', 'No se pudo identificar el lote');
                return;
              }
              console.log('Navegando a registros-huevos con loteId:', lote.id);
              router.push({
                pathname: '/(tabs)/ponedoras/registros-huevos',
                params: { loteId: lote.id }
              } as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="egg" size={24} color={colors.ponedoras} />
            <Text style={styles.metricaValue}>{huevosTotales.toLocaleString()}</Text>
            <Text style={styles.metricaLabel}>Huevos Totales</Text>
            <Text style={styles.metricaHint}>Toca para ver registros</Text>
          </TouchableOpacity>
          <View style={styles.metricaItem}>
            <Ionicons name="trending-up" size={24} color={colors.success} />
            <Text style={styles.metricaValue}>{produccionPromedioDiaria.toFixed(1)}</Text>
            <Text style={styles.metricaLabel}>Promedio Diario</Text>
          </View>
          <View style={styles.metricaItem}>
            <Ionicons name="percent" size={24} color={colors.primary} />
            <Text style={styles.metricaValue}>{tasaPostura.toFixed(1)}%</Text>
            <Text style={styles.metricaLabel}>Tasa Postura</Text>
          </View>
          <View style={styles.metricaItem}>
            <Ionicons name="cash" size={24} color={colors.warning} />
            <Text style={styles.metricaValue}>{formatPrice(cphPromedio)}</Text>
            <Text style={styles.metricaLabel}>CPH Promedio</Text>
          </View>
        </View>
      </Card>

      {/* Análisis de Tendencias */}
      <Card style={styles.tendenciasCard}>
        <Text style={styles.cardTitle}>Análisis de Tendencias (Últimos 7 días)</Text>
        <View style={styles.tendenciasGrid}>
          <View style={styles.tendenciaItem}>
            <View style={styles.tendenciaHeader}>
              <Ionicons 
                name={tendenciaProduccion >= 0 ? "trending-up" : "trending-down"} 
                size={20} 
                color={tendenciaProduccion >= 0 ? colors.success : colors.danger} 
              />
              <Text style={styles.tendenciaLabel}>Producción</Text>
            </View>
            <Text style={[
              styles.tendenciaValue,
              { color: tendenciaProduccion >= 0 ? colors.success : colors.danger }
            ]}>
              {tendenciaProduccion >= 0 ? '+' : ''}{tendenciaProduccion.toFixed(1)}%
            </Text>
            <Text style={styles.tendenciaSubtext}>
              {promedioUltimos7.toFixed(0)} huevos/día vs {promedioAnterior.toFixed(0)} huevos/día
            </Text>
          </View>
          
          <View style={styles.tendenciaItem}>
            <View style={styles.tendenciaHeader}>
              <Ionicons 
                name={tendenciaCPH <= 0 ? "trending-down" : "trending-up"} 
                size={20} 
                color={tendenciaCPH <= 0 ? colors.success : colors.danger} 
              />
              <Text style={styles.tendenciaLabel}>Costo por Huevo</Text>
            </View>
            <Text style={[
              styles.tendenciaValue,
              { color: tendenciaCPH <= 0 ? colors.success : colors.danger }
            ]}>
              {tendenciaCPH >= 0 ? '+' : ''}{tendenciaCPH.toFixed(1)}%
            </Text>
            <Text style={styles.tendenciaSubtext}>
              {formatPrice(cphUltimos7Dias)} vs {formatPrice(cphPromedio)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Mejor y Peor Día */}
      {(mejorDia || peorDia) && (
        <Card style={styles.diasCard}>
          <Text style={styles.cardTitle}>Récords de Producción</Text>
          <View style={styles.diasGrid}>
            {mejorDia && (
              <View style={[styles.diaItem, styles.mejorDia]}>
                <Ionicons name="trophy" size={24} color={colors.success} />
                <Text style={styles.diaLabel}>Mejor Día</Text>
                <Text style={styles.diaFecha}>{formatDate(mejorDia.fecha)}</Text>
                <Text style={styles.diaCantidad}>{mejorDia.cantidad} huevos</Text>
              </View>
            )}
            {peorDia && (
              <View style={[styles.diaItem, styles.peorDia]}>
                <Ionicons name="alert-circle" size={24} color={colors.warning} />
                <Text style={styles.diaLabel}>Peor Día</Text>
                <Text style={styles.diaFecha}>{formatDate(peorDia.fecha)}</Text>
                <Text style={styles.diaCantidad}>{peorDia.cantidad} huevos</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* Estadísticas de Costos */}
      <Card style={styles.costosCard}>
        <Text style={styles.cardTitle}>Análisis de Costos</Text>
        <View style={styles.costosGrid}>
          <View style={styles.costoItem}>
            <Text style={styles.costoLabel}>Costo Total</Text>
            <Text style={styles.costoValue}>{formatPrice(costoTotal)}</Text>
          </View>
          <View style={styles.costoItem}>
            <Text style={styles.costoLabel}>Costo Inicial</Text>
            <Text style={styles.costoValue}>{formatPrice(costoInicial)}</Text>
          </View>
          <View style={styles.costoItem}>
            <Text style={styles.costoLabel}>Gastos Adicionales</Text>
            <Text style={styles.costoValue}>{formatPrice(gastosAdicionales)}</Text>
          </View>
          <View style={styles.costoItem}>
            <Text style={styles.costoLabel}>CPH Promedio</Text>
            <Text style={[styles.costoValue, { color: colors.ponedoras }]}>
              {formatPrice(cphPromedio)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Estadísticas de Mortalidad */}
      <Card style={styles.mortalidadCard}>
        <Text style={styles.cardTitle}>Análisis de Mortalidad</Text>
        <View style={styles.mortalidadGrid}>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadLabel}>Muertes Totales</Text>
            <Text style={styles.mortalidadValue}>{muertesTotales}</Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadLabel}>Tasa de Mortalidad</Text>
            <Text style={[
              styles.mortalidadValue,
              { color: tasaMortalidad > 5 ? colors.danger : colors.textDark }
            ]}>
              {tasaMortalidad.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadLabel}>Gallinas Actuales</Text>
            <Text style={styles.mortalidadValue}>{lote.cantidadActual}</Text>
          </View>
          <View style={styles.mortalidadItem}>
            <Text style={styles.mortalidadLabel}>Gallinas Iniciales</Text>
            <Text style={styles.mortalidadValue}>{lote.cantidadInicial}</Text>
          </View>
        </View>
      </Card>

      {/* Recomendaciones */}
      <Card style={styles.recomendacionesCard}>
        <View style={styles.recomendacionesHeader}>
          <Ionicons name="bulb-outline" size={24} color={colors.warning} />
          <Text style={styles.cardTitle}>Recomendaciones</Text>
        </View>
        <View style={styles.recomendacionesList}>
          {recomendaciones.map((recomendacion, index) => (
            <View key={index} style={styles.recomendacionItem}>
              <Text style={styles.recomendacionText}>{recomendacion}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Resumen de Últimos 30 Días */}
      {ultimos30Dias.length > 0 && (
        <Card style={styles.historialCard}>
          <Text style={styles.cardTitle}>Producción Últimos 30 Días</Text>
          <View style={styles.historialList}>
            {ultimos30Dias.slice(-10).reverse().map((registro, index) => {
              const fechaRegistro = registro.fecha instanceof Date ? registro.fecha : new Date(registro.fecha);
              const diasAtras = Math.floor((new Date().getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <View key={index} style={styles.historialItem}>
                  <View style={styles.historialFecha}>
                    <Text style={styles.historialFechaText}>
                      {diasAtras === 0 ? 'Hoy' : diasAtras === 1 ? 'Ayer' : `Hace ${diasAtras} días`}
                    </Text>
                    <Text style={styles.historialFechaCompleta}>{formatDate(fechaRegistro)}</Text>
                  </View>
                  <Text style={styles.historialCantidad}>{registro.cantidad} huevos</Text>
                </View>
              );
            })}
          </View>
          {ultimos30Dias.length > 10 && (
            <Text style={styles.historialNota}>
              Mostrando últimos 10 registros de {ultimos30Dias.length} días
            </Text>
          )}
        </Card>
      )}

      {/* Botón para dashboard comparativo */}
      <Card style={styles.comparativoCard}>
        <View style={styles.comparativoHeader}>
          <Ionicons name="analytics-outline" size={32} color={colors.primary} />
          <View style={styles.comparativoText}>
            <Text style={styles.comparativoTitle}>Comparar con Otros Lotes</Text>
            <Text style={styles.comparativoDescription}>
              Analiza el rendimiento de este lote comparándolo con otros lotes de ponedoras
            </Text>
          </View>
        </View>
        <Button
          title="Abrir Dashboard Comparativo"
          onPress={() => router.push('/(tabs)/ponedoras/dashboard-comparativo')}
          style={styles.comparativoButton}
        />
      </Card>
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
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
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
  summaryHint: {
    fontSize: 10,
    color: colors.ponedoras,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
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
  cpuCard: {
    marginBottom: 16,
  },
  cpuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  costosContainer: {
    padding: 8,
  },
  costoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costoItem: {
    flex: 1,
  },
  costoLabel: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 4,
  },
  cpuContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cpuValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: moduleColors.badgeText,
    marginBottom: 4,
  },
  cpuLabel: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 8,
  },
  cpuDescription: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
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
  statHint: {
    fontSize: 10,
    color: colors.ponedoras,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  gastoInfo: {
    flex: 1,
  },
  gastoConcepto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  gastoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  gastoFecha: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  gastoCantidadPrecio: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
    fontStyle: 'italic',
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
  // Estilos para edad en header
  ageInfo: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  // Estilos para dashboard
  dashboardCard: {
    marginBottom: 16,
    padding: 20,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 12,
  },
  dashboardDescription: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 16,
    lineHeight: 20,
  },
  dashboardFeatures: {
    marginBottom: 20,
  },
  dashboardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardFeatureText: {
    fontSize: 14,
    color: colors.textDark,
    marginLeft: 8,
  },
  dashboardButton: {
    marginTop: 8,
  },
  quickStatsCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.primary + '05',
    borderColor: colors.primary + '20',
    borderWidth: 1,
  },
  quickStatsText: {
    fontSize: 14,
    color: colors.textMedium,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: moduleColors.badgeBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: moduleColors.badgeText,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    marginTop: 2,
  },
  // Estilos para resumen total
  resumenTotalCard: {
    marginBottom: 16,
    backgroundColor: colors.ponedoras + '15',
    borderColor: colors.ponedoras,
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
    color: colors.ponedoras,
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
    borderTopColor: colors.ponedoras,
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
    color: colors.ponedoras,
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
  // Estilos para el tab de costos de producción
  costoInfoCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  costoInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  costoInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 8,
  },
  costoInfoDescription: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 16,
    lineHeight: 20,
  },
  costoInfoList: {
    marginBottom: 16,
  },
  costoInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  costoInfoItemText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  costoInfoItemTitle: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  costoFormulaContainer: {
    backgroundColor: colors.veryLightGray + '80',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  costoFormulaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 6,
  },
  costoFormula: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  costoExample: {
    fontSize: 13,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  dashboardAccessCard: {
    marginTop: 16,
  },
  dashboardAccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardAccessText: {
    flex: 1,
    marginLeft: 12,
  },
  dashboardAccessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  dashboardAccessDescription: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  dashboardAccessButton: {
    marginTop: 4,
  },
  // Estilos para buscador de fecha
  buscadorFechaCard: {
    marginBottom: 16,
  },
  buscadorFechaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  buscadorFechaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  resultadoFechaContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  resultadoFechaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  resultadoFechaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  resultadoFechaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultadoFechaItem: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  resultadoFechaItemCPH: {
    width: '100%',
    backgroundColor: colors.ponedoras + '10',
    borderColor: colors.ponedoras + '40',
    borderWidth: 2,
  },
  resultadoFechaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
  },
  resultadoFechaLabelCPH: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ponedoras,
    marginBottom: 4,
  },
  resultadoFechaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  resultadoFechaValueCPH: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.ponedoras,
  },
  gastosDetalleContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  gastosDetalleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  gastoDetalleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray + '50',
  },
  gastoDetalleNombre: {
    fontSize: 14,
    color: colors.textDark,
    flex: 1,
  },
  gastoDetalleMonto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
  sinDatosContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sinDatosText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 8,
  },
  // Estilos para dashboard detallado
  metricasCard: {
    marginBottom: 16,
  },
  metricasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricaItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  metricaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 8,
  },
  metricaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  metricaHint: {
    fontSize: 10,
    color: colors.ponedoras,
    marginTop: 4,
    fontStyle: 'italic',
  },
  tendenciasCard: {
    marginBottom: 16,
  },
  tendenciasGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  tendenciaItem: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  tendenciaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tendenciaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  tendenciaValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tendenciaSubtext: {
    fontSize: 12,
    color: colors.textMedium,
  },
  diasCard: {
    marginBottom: 16,
  },
  diasGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  diaItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  mejorDia: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '40',
  },
  peorDia: {
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning + '40',
  },
  diaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 8,
  },
  diaFecha: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 4,
  },
  diaCantidad: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 4,
  },
  costosCard: {
    marginBottom: 16,
  },
  costosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  costoItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  costoLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
  },
  costoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  mortalidadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mortalidadItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  mortalidadLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
  },
  mortalidadValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  recomendacionesCard: {
    marginBottom: 16,
    backgroundColor: colors.warning + '05',
    borderColor: colors.warning + '20',
    borderWidth: 1,
  },
  recomendacionesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recomendacionesList: {
    gap: 8,
  },
  recomendacionItem: {
    paddingVertical: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  recomendacionText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  historialCard: {
    marginBottom: 16,
  },
  historialList: {
    gap: 8,
  },
  historialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  historialFecha: {
    flex: 1,
  },
  historialFechaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  historialFechaCompleta: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  historialCantidad: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.ponedoras,
  },
  historialNota: {
    fontSize: 12,
    color: colors.textMedium,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  comparativoCard: {
    marginBottom: 16,
  },
  comparativoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  comparativoText: {
    flex: 1,
  },
  comparativoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  comparativoDescription: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  comparativoButton: {
    marginTop: 8,
  },
  // Estilos para Tab Ventas
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
    color: colors.textDark,
  },
  ventasStatLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  ventasList: {
    gap: 12,
  },
  ventaCard: {
    padding: 16,
  },
  ventaInfo: {
    flex: 1,
  },
  ventaNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  ventaFecha: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  clienteNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 8,
    marginBottom: 8,
  },
  ventaItemsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  ventaItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  ventaItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  ventaItemNombre: {
    fontSize: 14,
    color: colors.textDark,
    flex: 1,
  },
  ventaItemCantidad: {
    alignItems: 'flex-end',
  },
  ventaItemCantidadText: {
    fontSize: 13,
    color: colors.textMedium,
  },
  ventaItemPrecio: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
});
