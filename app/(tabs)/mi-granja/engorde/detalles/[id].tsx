/**
 * Página de detalles del lote de engorde
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
import Button from '../../../../../src/components/ui/Button';
import Card from '../../../../../src/components/ui/Card';
import GrowthChart from '../../../../../src/components/ui/GrowthChart';
import MaturationAlert from '../../../../../src/components/ui/MaturationAlert';
import PerformanceReport from '../../../../../src/components/ui/PerformanceReport';
import PredictionsPanel from '../../../../../src/components/ui/PredictionsPanel';
import { colors } from '../../../../../src/constants/colors';
import { useGalpones } from '../../../../../src/hooks/useGalpones';
import { exportarYCompartir } from '../../../../../src/services/pdf-export.service';
import { obtenerRegistrosPeso } from '../../../../../src/services/peso.service';
import { useEngordeStore } from '../../../../../src/stores/engordeStore';
import { useGastosStore } from '../../../../../src/stores/gastosStore';
import { useMortalityStore } from '../../../../../src/stores/mortalityStore';
import { EstadoLote, LoteEngorde, PesoRegistro, TipoAve } from '../../../../../src/types';
import { Galpon } from '../../../../../src/types/galpon';
import { calculateAgeInDays, formatDate } from '../../../../../src/utils/dateUtils';
import { convertFromKg, formatWeight, WeightUnit } from '../../../../../src/utils/weightUtils';

export default function DetallesLoteEngorde() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tabActivo, setTabActivo] = useState('peso'); // Iniciar en peso para engorde
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [registrosPeso, setRegistrosPeso] = useState<PesoRegistro[]>([]);
  const [exportingPDF, setExportingPDF] = useState(false);

  const {
    loteActual,
    cargarLote,
    isLoading,
    error
  } = useEngordeStore();

  const { 
    loadRegistrosPorTipo, 
    registros: registrosMortalidad 
  } = useMortalityStore();
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
        cargarLote(id),
        loadRegistrosPorTipo(TipoAve.POLLO_ENGORDE),
        cargarRegistrosPeso(),
        cargarGalpones(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos del lote:', error);
    }
  };

  const cargarRegistrosPeso = async () => {
    try {
      const registros = await obtenerRegistrosPeso(id, TipoAve.POLLO_ENGORDE);
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
      pathname: '/(tabs)/engorde/registrar-peso',
      params: { loteId: id }
    });
  };

  const handleRegistrarMuerte = () => {
    router.push({
      pathname: '/(tabs)/engorde/registrar-muerte',
      params: { loteId: id }
    });
  };

  const handleRegistrarGasto = () => {
    router.push({
      pathname: '/(tabs)/gastos',
      params: { 
        registrarGasto: id,
        tipo: TipoAve.POLLO_ENGORDE,
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
      
      const edadActual = calculateAgeInDays(loteActual.fechaNacimiento);
      const tasaMortalidad = loteActual.cantidadInicial > 0 ? (totalMuertes / loteActual.cantidadInicial) * 100 : 0;

      const pdfData = {
        lote: {
          id: loteActual.id,
          nombre: loteActual.nombre,
          tipoAve: TipoAve.POLLO_ENGORDE,
          fechaInicio: loteActual.fechaInicio,
          fechaNacimiento: loteActual.fechaNacimiento,
          cantidadInicial: loteActual.cantidadInicial,
          cantidadActual: loteActual.cantidadActual,
          estado: loteActual.estado || 'ACTIVO'
        },
        estadisticas: {
          gastoTotal: 0, // TODO: Implementar carga de gastos
          ingresoTotal: 0, // TODO: Implementar carga de ingresos
          edadActual,
          mortalidadTotal: totalMuertes,
          tasaMortalidad
        },
        registrosPeso: registrosPeso.slice(0, 10), // Últimos 10 registros
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
              const { eliminarLote } = useEngordeStore.getState();
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

  if (isLoading && !loteActual) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="time-outline" size={48} color={colors.engorde} />
        <Text style={styles.loadingText}>Cargando detalles del lote...</Text>
        <Text style={styles.loadingSubtext}>
          Obteniendo información de peso, mortalidad y rendimiento
        </Text>
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
    { id: 'peso', label: 'Peso', icon: 'scale-outline' }, // Peso primero para engorde
    { id: 'general', label: 'General', icon: 'information-circle-outline' },
    { id: 'rendimiento', label: 'Rendimiento', icon: 'analytics-outline' },
    { id: 'gastos', label: 'Gastos', icon: 'receipt-outline' },
    { id: 'ventas', label: 'Ventas', icon: 'cash-outline' },
    { id: 'mortalidad', label: 'Mortalidad', icon: 'warning-outline' }
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
              <Ionicons name="location" size={16} color={colors.engorde} />
              <Text style={styles.locationText}>
                {galpones.find((g) => g.id === loteActual.galponId)?.nombre ?? 'Galpón desconocido'}
              </Text>
            </View>
          )}
          {registrosPeso.length > 0 ? (
            <Text style={styles.weightInfo}>
              Último peso: {formatWeight(convertFromKg(registrosPeso[0].pesoPromedio, WeightUnit.POUNDS), WeightUnit.POUNDS)}
            </Text>
          ) : (
            <Text style={styles.noWeightInfo}>
              Sin registros de peso • {calculateAgeInDays(loteActual.fechaNacimiento)} días
            </Text>
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
                color={tabActivo === tab.id ? colors.engorde : colors.textMedium}
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
            registrosMortalidad={registrosMortalidad}
            registrosPeso={registrosPeso}
            onRegistrarPeso={handleRegistrarPeso}
            onRegistrarMuerte={handleRegistrarMuerte}
            onRegistrarGasto={handleRegistrarGasto}
            galpones={galpones}
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

        {tabActivo === 'ventas' && loteActual && (
          <TabVentas
            lote={loteActual}
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
          />
        )}

        {/* Panel de predicciones - visible en todas las pestañas */}
        {loteActual && (
          <PredictionsPanel
            data={{
              loteId: loteActual.id,
              tipoAve: TipoAve.POLLO_ENGORDE,
              fechaNacimiento: loteActual.fechaNacimiento,
              cantidadInicial: loteActual.cantidadInicial,
              cantidadActual: loteActual.cantidadActual,
              registrosPeso: registrosPeso,
              registrosMortalidad: registrosMortalidad,
              gastoTotal: 0 // TODO: Implementar carga de gastos
            }}
            style={styles.predictionsPanel}
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
                router.push(`/(tabs)/engorde/editar-lote?loteId=${loteActual?.id}`);
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.engorde} />
              <Text style={styles.menuItemText}>Editar Lote</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleExportarPDF();
              }}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.engorde} />
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

// Componente Tab General
function TabGeneral({ 
  lote, 
  registrosMortalidad,
  registrosPeso,
  onRegistrarPeso, 
  onRegistrarMuerte, 
  onRegistrarGasto,
  galpones,
}: {
  lote: LoteEngorde;
  registrosMortalidad: any[];
  registrosPeso: PesoRegistro[];
  onRegistrarPeso: () => void;
  onRegistrarMuerte: () => void;
  onRegistrarGasto: () => void;
  galpones: Galpon[];
}) {
  // Calcular muertes totales desde los registros reales (para mostrar estadísticas)
  const muertesTotales = registrosMortalidad
    .filter(registro => registro.loteId === lote.id)
    .reduce((total, registro) => total + registro.cantidad, 0);
  
  // Pollos actuales ya están actualizados en cantidadActual
  const pollosActuales = lote.cantidadActual;
  
  // Calcular peso promedio actual desde registros de peso (convertir de kg a libras)
  const pesoPromedioKg = registrosPeso.length > 0 
    ? registrosPeso[0]?.pesoPromedio || 0 
    : 0;
  const pesoPromedio = pesoPromedioKg > 0 ? convertFromKg(pesoPromedioKg, WeightUnit.POUNDS) : 0;

  return (
    <View style={styles.tabContent}>
      {/* Resumen del lote - Enfoque en peso para engorde */}
      <Card style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Resumen del Lote - Engorde</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {pesoPromedio > 0 ? 
                formatWeight(pesoPromedio, WeightUnit.POUNDS) : 
                'Sin datos'
              }
            </Text>
            <Text style={styles.summaryLabel}>Peso Promedio Actual</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(() => {
                if (registrosPeso.length === 0) return 'Sin datos';
                const pesoTotalKg = (registrosPeso[0] as any)?.pesoTotal || 0;
                const cantidadPesados = (registrosPeso[0] as any)?.cantidadPollosPesados || 0;
                if (pesoTotalKg <= 0 || cantidadPesados <= 0) return 'Sin datos';
                return formatWeight(convertFromKg(pesoTotalKg, WeightUnit.POUNDS), WeightUnit.POUNDS);
              })()}
            </Text>
            <Text style={styles.summaryLabel}>Peso Total Último</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pollosActuales}</Text>
            <Text style={styles.summaryLabel}>Pollos Vivos</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {(() => {
                if (registrosPeso.length < 2) return 'Sin datos';
                const pesoActualKg = registrosPeso[0]?.pesoPromedio || 0;
                const pesoAnteriorKg = registrosPeso[1]?.pesoPromedio || 0;
                const pesoActual = convertFromKg(pesoActualKg, WeightUnit.POUNDS);
                const pesoAnterior = convertFromKg(pesoAnteriorKg, WeightUnit.POUNDS);
                const ganancia = pesoActual - pesoAnterior;
                return ganancia > 0 ? 
                  `+${formatWeight(ganancia, WeightUnit.POUNDS)}` : 
                  formatWeight(ganancia, WeightUnit.POUNDS);
              })()}
            </Text>
            <Text style={styles.summaryLabel}>Ganancia Peso</Text>
          </View>
        </View>
      </Card>

      {/* Métricas de peso detalladas */}
      {registrosPeso.length > 0 ? (
        <Card style={styles.weightMetricsCard}>
          <Text style={styles.cardTitle}>Métricas de Peso</Text>
          <View style={styles.weightMetricsGrid}>
            <View style={styles.weightMetricItem}>
              <Text style={styles.weightMetricValue}>
                {calculateAgeInDays(lote.fechaNacimiento)}
              </Text>
              <Text style={styles.weightMetricLabel}>Días de Edad</Text>
            </View>
            <View style={styles.weightMetricItem}>
              <Text style={styles.weightMetricValue}>
                {registrosPeso.length > 0 ? 
                  ((registrosPeso[0] as any)?.cantidadPollosPesados || 0) : 
                  0
                }
              </Text>
              <Text style={styles.weightMetricLabel}>Pollos Pesados</Text>
            </View>
            <View style={styles.weightMetricItem}>
              <Text style={styles.weightMetricValue}>
                {registrosPeso.length}
              </Text>
              <Text style={styles.weightMetricLabel}>Registros Peso</Text>
            </View>
            <View style={styles.weightMetricItem}>
              <Text style={styles.weightMetricValue}>
                {(() => {
                  const edadDias = calculateAgeInDays(lote.fechaNacimiento);
                  if (pesoPromedio <= 0) return '⏳';
                  if (pesoPromedio >= 4.5 && edadDias >= 35) return '✅';
                  if (pesoPromedio >= 3.5 && edadDias >= 28) return '⚠️';
                  if (edadDias < 21) return '🐣';
                  return '❌';
                })()}
              </Text>
              <Text style={styles.weightMetricLabel}>Estado Comercial</Text>
            </View>
          </View>
          <Text style={styles.weightMetricNote}>
            ✅ Listo (4.5+ lb, 35+ días) • ⚠️ Casi listo (3.5+ lb, 28+ días) • 🐣 Creciendo • ❌ En desarrollo • ⏳ Sin datos
          </Text>
        </Card>
      ) : (
        <Card style={styles.emptyWeightCard}>
          <Ionicons name="scale-outline" size={48} color={colors.lightGray} />
          <Text style={styles.emptyWeightTitle}>Sin registros de peso</Text>
          <Text style={styles.emptyWeightText}>
            Edad actual: {calculateAgeInDays(lote.fechaNacimiento)} días
          </Text>
          <Text style={styles.emptyWeightSubtext}>
            Registra el peso de los pollos para hacer seguimiento del crecimiento
          </Text>
          <Button
            title="Registrar Primer Peso"
            onPress={onRegistrarPeso}
            style={styles.emptyWeightButton}
            size="small"
          />
        </Card>
      )}

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
          <Text style={styles.infoLabel}>Fecha de nacimiento:</Text>
          <Text style={styles.infoValue}>
            {formatDate(lote.fechaNacimiento)}
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
          <Text style={styles.infoValue}>Pollo de Engorde</Text>
        </View>
        {lote.galponId && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Galpón asignado:</Text>
            <View style={styles.infoValueRow}>
              <Ionicons name="business" size={16} color={colors.engorde} />
              <Text style={styles.infoValue}>
                {galpones.find((g) => g.id === lote.galponId)?.nombre ?? 'Galpón desconocido'}
              </Text>
            </View>
          </View>
        )}
        {lote.observaciones && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Observaciones:</Text>
            <Text style={styles.infoValue}>{lote.observaciones}</Text>
          </View>
        )}
      </Card>

      {/* Estadísticas adicionales */}
      <Card style={styles.statsCard}>
        <Text style={styles.cardTitle}>Estadísticas del Lote</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>RD$0.00</Text>
            <Text style={styles.statLabel}>Ganancia Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>RD$0.00</Text>
            <Text style={styles.statLabel}>Ingresos Totales</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>RD$0.00</Text>
            <Text style={styles.statLabel}>Gastos Totales</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Ventas Registradas</Text>
          </View>
        </View>
        <Text style={styles.comingSoonText}>
          💡 Próximamente: Integración completa de gastos y ventas
        </Text>
      </Card>

      {/* Alerta de maduración */}
      <MaturationAlert
        tipoAve={TipoAve.POLLO_ENGORDE}
        fechaNacimiento={lote.fechaNacimiento}
        pesoPromedio={registrosPeso.length > 0 ? (registrosPeso[0] as any)?.pesoPromedio || 0 : 0}
        style={styles.maturationAlert}
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
  // Calcular estadísticas generales (en kg, luego convertir a libras para mostrar)
  const estadisticasPesoKg = registros.length > 0 ? {
    ultimoPeso: registros[0]?.pesoPromedio || 0,
    pesoMaximo: registros.length > 0 ? Math.max(...registros.map(r => r.pesoPromedio || 0)) : 0,
    pesoMinimo: registros.length > 0 ? Math.min(...registros.map(r => r.pesoPromedio || 0)) : 0,
    crecimientoPromedio: registros.length > 1 ? 
      ((registros[0]?.pesoPromedio || 0) - (registros[registros.length - 1]?.pesoPromedio || 0)) / (registros.length - 1) : 0
  } : {
    ultimoPeso: 0,
    pesoMaximo: 0,
    pesoMinimo: 0,
    crecimientoPromedio: 0
  };
  
  // Convertir estadísticas de kg a libras
  const estadisticasPeso = {
    ultimoPeso: convertFromKg(estadisticasPesoKg.ultimoPeso, WeightUnit.POUNDS),
    pesoMaximo: convertFromKg(estadisticasPesoKg.pesoMaximo, WeightUnit.POUNDS),
    pesoMinimo: convertFromKg(estadisticasPesoKg.pesoMinimo, WeightUnit.POUNDS),
    crecimientoPromedio: convertFromKg(estadisticasPesoKg.crecimientoPromedio, WeightUnit.POUNDS)
  };

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
      <Card style={styles.pesoStatsCard}>
        <Text style={styles.cardTitle}>Estadísticas de Peso</Text>
        <View style={styles.pesoStatsGrid}>
          <View style={styles.pesoStatItem}>
            <Text style={styles.pesoStatValue}>
              {registros.length > 0 ? 
                formatWeight(estadisticasPeso.ultimoPeso, WeightUnit.POUNDS) : 
                'Sin datos'
              }
            </Text>
            <Text style={styles.pesoStatLabel}>Último Peso</Text>
          </View>
          <View style={styles.pesoStatItem}>
            <Text style={styles.pesoStatValue}>
              {registros.length > 0 ? 
                formatWeight(estadisticasPeso.pesoMaximo, WeightUnit.POUNDS) : 
                'Sin datos'
              }
            </Text>
            <Text style={styles.pesoStatLabel}>Peso Máximo</Text>
          </View>
          <View style={styles.pesoStatItem}>
            <Text style={styles.pesoStatValue}>
              {registros.length > 1 ? 
                formatWeight(estadisticasPeso.crecimientoPromedio, WeightUnit.POUNDS, 3) : 
                'Sin datos'
              }
            </Text>
            <Text style={styles.pesoStatLabel}>Crecimiento/Registro</Text>
          </View>
          <View style={styles.pesoStatItem}>
            <Text style={styles.pesoStatValue}>{registros.length}</Text>
            <Text style={styles.pesoStatLabel}>Total Registros</Text>
          </View>
        </View>
      </Card>

      {/* Gráfico de crecimiento */}
      {registros.length >= 2 && (
        <GrowthChart 
          registros={registros} 
          title="Evolución del Peso" 
          color={colors.engorde}
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
                  {formatWeight(convertFromKg(registro.pesoPromedio, WeightUnit.POUNDS), WeightUnit.POUNDS)}
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
                    <Text style={styles.pesoRegistroValue}>{formatWeight(convertFromKg((registro as any).pesoTotal || 0, WeightUnit.POUNDS), WeightUnit.POUNDS)}</Text>
                  </View>
                  <View style={styles.pesoRegistroItem}>
                    <Text style={styles.pesoRegistroLabel}>Promedio</Text>
                    <Text style={styles.pesoRegistroValue}>{formatWeight(convertFromKg(registro.pesoPromedio, WeightUnit.POUNDS), WeightUnit.POUNDS)}</Text>
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
function TabGastos({ lote, loteId, onRegistrarGasto }: { lote: LoteEngorde; loteId: string; onRegistrarGasto: () => void }) {
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { cargarGastos: cargarGastosStore } = useGastosStore();

  useEffect(() => {
    const cargarGastos = async () => {
      setLoading(true);
      try {
        console.log('🔄 Cargando gastos para lote engorde:', loteId);
        await cargarGastosStore(loteId, TipoAve.POLLO_ENGORDE);
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
          <Ionicons name="calculator" size={24} color={colors.engorde} />
          <Text style={styles.resumenTotalTitle}>Resumen Total de Gastos</Text>
        </View>
        
        <View style={styles.resumenTotalContent}>
          {costoInicialLote > 0 && (
            <View style={styles.resumenRow}>
              <View style={styles.resumenLabelContainer}>
                <Ionicons name="pricetag" size={16} color={colors.engorde} />
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
  lote: LoteEngorde; 
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
  registrosMortalidad
}: { 
  lote: LoteEngorde; 
  registrosPeso: PesoRegistro[];
  registrosMortalidad: any[];
}) {
  const totalMuertes = registrosMortalidad
    .filter(registro => registro.loteId === lote.id)
    .reduce((sum, registro) => sum + registro.cantidad, 0);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Análisis de Rendimiento</Text>
      
      <PerformanceReport
        loteId={lote.id}
        tipoAve={TipoAve.POLLO_ENGORDE}
        fechaNacimiento={lote.fechaNacimiento}
        cantidadInicial={lote.cantidadInicial}
        cantidadActual={lote.cantidadActual}
        registrosPeso={registrosPeso}
        gastoTotal={0} // TODO: Implementar carga de gastos
        ingresoTotal={0} // TODO: Implementar carga de ingresos
        style={styles.performanceReport}
      />

      {/* Recomendaciones */}
      <Card style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Recomendaciones</Text>
        <View style={styles.recommendationsList}>
          {generateRecommendations(lote, registrosPeso, totalMuertes).map((rec, index) => (
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

// Función auxiliar para generar recomendaciones específicas para engorde
function generateRecommendations(
  lote: LoteEngorde, 
  registrosPeso: PesoRegistro[], 
  totalMuertes: number
) {
  const recommendations = [];
  const tasaMortalidad = lote.cantidadInicial > 0 ? (totalMuertes / lote.cantidadInicial) * 100 : 0;
  const pesoActual = registrosPeso.length > 0 ? registrosPeso[0]?.pesoPromedio || 0 : 0;

  // Recomendación por mortalidad
  if (tasaMortalidad > 8) { // Más estricto para engorde
    recommendations.push({
      icon: 'warning',
      color: colors.danger,
      text: 'Alta mortalidad para engorde. Revisar condiciones sanitarias y ventilación.'
    });
  } else if (tasaMortalidad < 2) {
    recommendations.push({
      icon: 'checkmark-circle',
      color: colors.success,
      text: 'Excelente control de mortalidad. Mantener prácticas actuales.'
    });
  }

  // Recomendación por peso (específico para engorde)
  if (registrosPeso.length > 1) {
    const crecimientoDiario = (registrosPeso[0]?.pesoPromedio - registrosPeso[1]?.pesoPromedio) || 0;
    if (crecimientoDiario < 0.05) { // Engorde requiere mayor crecimiento
      recommendations.push({
        icon: 'nutrition',
        color: colors.warning,
        text: 'Crecimiento lento para engorde. Evaluar alimento concentrado y suplementos.'
      });
    }
  }

  // Recomendación financiera (simplificada mientras se implementa)
  if (registrosPeso.length > 0) {
    recommendations.push({
      icon: 'calculator',
      color: colors.engorde,
      text: 'Monitorea los costos de alimentación para optimizar el margen de ganancia.'
    });
  }

  // Recomendación por edad y peso para comercialización
  const edadEnDias = calculateAgeInDays(lote.fechaNacimiento);
  if (edadEnDias > 35 && pesoActual > 4.5) { // Peso óptimo para engorde
    recommendations.push({
      icon: 'time',
      color: colors.engorde,
      text: 'Pollos en peso óptimo para venta (4.5+ lb). Considerar comercialización inmediata.'
    });
  } else if (edadEnDias > 42 && pesoActual < 4.0) {
    recommendations.push({
      icon: 'alert-circle',
      color: colors.warning,
      text: 'Pollos con más de 6 semanas pero bajo peso. Evaluar programa nutricional.'
    });
  }

  // Recomendación específica de densidad para engorde
  const densidadActual = lote.cantidadActual - totalMuertes;
  if (densidadActual > 100 && edadEnDias > 28) {
    recommendations.push({
      icon: 'people',
      color: colors.warning,
      text: 'Alta densidad para pollos de engorde. Considerar ventilación adicional.'
    });
  }

  return recommendations.length > 0 ? recommendations : [{
    icon: 'checkmark-circle',
    color: colors.success,
    text: 'Lote de engorde con buen rendimiento general. Continuar con el manejo actual.'
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
    marginTop: 12,
    fontWeight: '500',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  weightInfo: {
    fontSize: 12,
    color: colors.engorde,
    fontWeight: '600',
    marginTop: 4,
  },
  noWeightInfo: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '500',
    marginTop: 4,
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
    borderBottomColor: colors.engorde,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
    marginLeft: 6,
  },
  activeTabText: {
    color: colors.engorde,
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
    color: colors.engorde,
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
    color: colors.engorde,
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
    color: colors.engorde,
  },
  gastosList: {
    gap: 12,
  },
  gastosSummaryCard: {
    marginBottom: 16,
    backgroundColor: colors.engorde + '05',
    borderColor: colors.engorde + '20',
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
    color: colors.engorde,
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
  // Estilos para registros de peso (tema engorde)
  pesoStatsCard: {
    marginBottom: 16,
    backgroundColor: colors.engorde + '05',
    borderColor: colors.engorde + '20',
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
    color: colors.engorde,
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
  // Estilos para métricas de peso específicas de engorde
  weightMetricsCard: {
    marginBottom: 16,
    backgroundColor: colors.engorde + '05',
    borderColor: colors.engorde + '20',
    borderWidth: 1,
  },
  weightMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weightMetricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  weightMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.engorde,
  },
  weightMetricLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  weightMetricNote: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  comingSoonText: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyWeightCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  emptyWeightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyWeightText: {
    fontSize: 14,
    color: colors.engorde,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyWeightSubtext: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyWeightButton: {
    minWidth: 160,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.engorde + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.engorde,
  },
  // Estilos para resumen total
  resumenTotalCard: {
    marginBottom: 16,
    backgroundColor: colors.engorde + '15',
    borderColor: colors.engorde,
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
    color: colors.engorde,
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
    borderTopColor: colors.engorde,
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
    color: colors.engorde,
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
  ventaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.textMedium,
  },
  ventaTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
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
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.veryLightGray,
  },
  estadoConfirmada: {
    backgroundColor: colors.success + '20',
  },
  estadoCancelada: {
    backgroundColor: colors.error + '20',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMedium,
    textTransform: 'uppercase',
  },
  estadoTextConfirmada: {
    color: colors.success,
  },
  estadoTextCancelada: {
    color: colors.error,
  },
});
