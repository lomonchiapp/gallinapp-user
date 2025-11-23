/**
 * Página de detalles del lote de ponedoras
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
import CostoProduccionHuevos from '../../../../src/components/ui/CostoProduccionHuevos';
import GastoSheet from '../../../../src/components/ui/GastoSheet';
import { colors } from '../../../../src/constants/colors';
import { useGalpones } from '../../../../src/hooks/useGalpones';
import { exportarYCompartir } from '../../../../src/services/pdf-export.service';
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
            } catch (error) {
              console.error('Error al eliminar lote:', error);
              Alert.alert('Error', 'No se pudo eliminar el lote');
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
              />
            )}

            {tabActivo === 'gastos' && loteActual && (
              <TabGastos
                lote={loteActual}
                gastos={gastosLote}
                onRegistrarGasto={handleRegistrarGasto}
              />
            )}

            {tabActivo === 'mortalidad' && loteActual && (
              <TabMortalidad
                lote={loteActual}
                registros={registrosMortalidad}
                onRegistrarMuerte={handleRegistrarMuerte}
              />
            )}

            {tabActivo === 'dashboard' && (
              <TabDashboard />
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
}: {
  lote: LotePonedora;
  estadisticas: any;
  registrosHuevos: any[];
  registrosMortalidad: any[];
  onRegistrarProduccion: () => void;
  onRegistrarMuerte: () => void;
  onRegistrarGasto: () => void;
  galpones: Galpon[];
}) {
  // Calcular huevos totales desde los registros reales
  const huevosTotales = registrosHuevos.reduce((total, registro) => total + registro.cantidad, 0);
  
  // Calcular muertes totales desde los registros reales
  const muertesTotales = registrosMortalidad.reduce((total, registro) => total + registro.cantidad, 0);
  
  // Gallinas actuales ya están actualizadas en cantidadActual
  const gallinasActuales = lote.cantidadActual;
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
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{huevosTotales}</Text>
            <Text style={styles.summaryLabel}>Huevos Totales</Text>
          </View>
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
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {estadisticas.gastoTotal ? `RD$${estadisticas.gastoTotal.toFixed(2)}` : 'RD$0.00'}
              </Text>
              <Text style={styles.statLabel}>Gastos Totales</Text>
            </View>
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
      <Card style={styles.resumenTotalCard}>
        <View style={styles.resumenTotalHeader}>
          <Ionicons name="calculator" size={24} color={colors.ponedoras} />
          <Text style={styles.resumenTotalTitle}>Resumen Total de Gastos</Text>
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
function TabCostosProduccion({ lote }: { lote: LotePonedora }) {
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
function TabDashboard() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Dashboard Comparativo</Text>
        <Button
          title="Ver Dashboard Completo"
          onPress={() => router.push('/(tabs)/ponedoras/dashboard-comparativo')}
          size="small"
        />
      </View>

      <Card style={styles.dashboardCard}>
        <View style={styles.dashboardHeader}>
          <Ionicons name="analytics-outline" size={32} color={colors.primary} />
          <Text style={styles.dashboardTitle}>Análisis Comparativo</Text>
        </View>
        <Text style={styles.dashboardDescription}>
          Compara el rendimiento de este lote con otros lotes de ponedoras para obtener insights sobre:
        </Text>
        <View style={styles.dashboardFeatures}>
          <View style={styles.dashboardFeature}>
            <Ionicons name="egg-outline" size={20} color={colors.primary} />
            <Text style={styles.dashboardFeatureText}>Producción de huevos</Text>
          </View>
          <View style={styles.dashboardFeature}>
            <Ionicons name="trending-up-outline" size={20} color={colors.success} />
            <Text style={styles.dashboardFeatureText}>Tasa de postura</Text>
          </View>
          <View style={styles.dashboardFeature}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.dashboardFeatureText}>Mortalidad comparativa</Text>
          </View>
          <View style={styles.dashboardFeature}>
            <Ionicons name="cash-outline" size={20} color={colors.engorde} />
            <Text style={styles.dashboardFeatureText}>Rentabilidad</Text>
          </View>
        </View>
        <Button
          title="Abrir Dashboard Comparativo"
          onPress={() => router.push('/(tabs)/ponedoras/dashboard-comparativo')}
          style={styles.dashboardButton}
        />
      </Card>

      <Card style={styles.quickStatsCard}>
        <Text style={styles.cardTitle}>Estadísticas Rápidas</Text>
        <Text style={styles.quickStatsText}>
          💡 Próximamente: Métricas en tiempo real, comparaciones automáticas y recomendaciones basadas en IA.
        </Text>
      </Card>
    </View>
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
});
