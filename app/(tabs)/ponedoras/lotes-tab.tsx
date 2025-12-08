/**
 * Tab de Lotes de Gallinas Ponedoras
 */

import { EstadoLote, TipoAve } from '@/src/types/enums';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AccionesLoteMenu, { AccionLote } from '../../../src/components/ui/AccionesLoteMenu';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import CostPorHuevoBadge from '../../../src/components/ui/CostPorHuevoBadge';
import GastoSheet from '../../../src/components/ui/GastoSheet';
import { colors } from '../../../src/constants/colors';
import { useGalpones } from '../../../src/hooks/useGalpones';
import { EggTrackingInfo, getEggTrackingInfoFromStore } from '../../../src/services/tracking-optimized.service';
import { useArticulosStore } from '../../../src/stores/articulosStore';
import { useHuevosStore } from '../../../src/stores/huevosStore';
import { useMortalityStore } from '../../../src/stores/mortalityStore';
import { usePonedorasStore } from '../../../src/stores/ponedorasStore';
import { showConfirmationAlert, showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';
import { formatDate } from '../../../src/utils/dateUtils';

const LOCATION_COLORS = {
  badgeBg: colors.ponedoras + '15',
  badgeText: colors.ponedoras,
};
const LOCATION_COLORS_EMPTY = {
  badgeBg: colors.lightGray + '25',
  badgeText: colors.textMedium,
};

export default function LotesTab() {
  console.log('🐔 LotesTab: Componente renderizado');
  
  // Estados para búsqueda y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('fechaInicio');
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [mostrarOpcionesOrden, setMostrarOpcionesOrden] = useState(false);
  const [mostrarFinalizados, setMostrarFinalizados] = useState(false);
  const [gastoSheetVisible, setGastoSheetVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [loteExpandido, setLoteExpandido] = useState<string | null>(null);
  const [menuAccionesVisible, setMenuAccionesVisible] = useState(false);
  const [loteParaAcciones, setLoteParaAcciones] = useState<any>(null);
  const [modalCambioEstadoVisible, setModalCambioEstadoVisible] = useState(false);
  const [loteParaCambiarEstado, setLoteParaCambiarEstado] = useState<any>(null);
  
  // Estado para tracking de recolección de huevos
  const [eggTracking, setEggTracking] = useState<EggTrackingInfo[]>([]);

  // Estado para costos por huevo (CPH) y costos unitarios (CPU)
  const [costosPorHuevo, setCostosPorHuevo] = useState<{[loteId: string]: {costoTotal: number, costoPorHuevo: number, costoUnitario: number, isLoading: boolean}}>({});
  // Estado para almacenar gastos por lote (para historial CPH)
  const [gastosPorLote, setGastosPorLote] = useState<{[loteId: string]: {fecha: Date, total: number}[]}>({});
  
  const { lotes, isLoading, estadisticasLotes, cargarLotes, cargarEstadisticasLotes, suscribirseAPonedoras } = usePonedorasStore();
  const { articulos, loadArticulos } = useArticulosStore();
  const { registrosHuevos, loadAllRegistros } = useHuevosStore();
  const { suscribirseAMortalidadPorTipo, getRegistrosPorTipo } = useMortalityStore();
  const registrosMortalidad = getRegistrosPorTipo(TipoAve.PONEDORA);
  // const { gastos, estadisticasGastos } = useGastosSubscription(TipoAve.PONEDORA);
  const { galpones, cargarGalpones } = useGalpones();

  // Estado para pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  
  // Calcular costos por huevo (CPH) y costos unitarios (CPU) cuando cambien los lotes
  useEffect(() => {
    if (lotes && lotes.length > 0) {
      const calcularCostos = async () => {
        const costos: {[loteId: string]: {costoTotal: number, costoPorHuevo: number, costoUnitario: number, isLoading: boolean}} = {};

        // NO inicializar como cargando - mantener valores previos o mostrar 0
        // Si ya existe un costo, mantenerlo mientras recalculamos
        lotes.forEach(lote => {
          const costoExistente = costosPorHuevo[lote.id];
          costos[lote.id] = costoExistente || { costoTotal: 0, costoPorHuevo: 0, costoUnitario: 0, isLoading: false };
        });
        setCostosPorHuevo(costos);

        // Calcular costo para cada lote en segundo plano
        for (const lote of lotes) {
          try {
            // Importar el servicio directamente
            const { obtenerGastos } = await import('../../../src/services/gastos.service');
            const { obtenerTotalMortalidad } = await import('../../../src/services/mortality.service');
            
            const [gastosLote, muertes] = await Promise.all([
              obtenerGastos(lote.id, TipoAve.PONEDORA),
              obtenerTotalMortalidad(lote.id, TipoAve.PONEDORA)
            ]);
            
            // Filtrar gastos para excluir el costo inicial del lote si está incluido
            const gastosAdicionalesFiltrados = gastosLote.filter(gasto => {
              // Excluir gastos que sean el costo inicial del lote
              return !(gasto.descripcion?.toLowerCase().includes('costo inicial') || 
                       gasto.articuloNombre?.toLowerCase().includes('costo inicial'));
            });
            
            // Calcular gastos adicionales (sin incluir costo inicial)
            const gastosAdicionales = gastosAdicionalesFiltrados.reduce((total, gasto) => total + gasto.total, 0);
            
            // Sumar el costo inicial del lote + gastos adicionales
            const costoInicial = lote.costo || 0;
            const costoTotal = costoInicial + gastosAdicionales;
            
            // Obtener cantidad de huevos producidos del lote
            const huevosProducidos = estadisticasLotes[lote.id]?.huevos || 0;
            
            // Calcular CPH (Costo de Producción por Huevo): costo total / huevos producidos
            const costoPorHuevo = huevosProducidos > 0 ? costoTotal / huevosProducidos : 0;
            
            // Calcular CPU (Costo Unitario por Ave): costo total / cantidad de aves vivas
            // Usar (Cantidad Inicial - Muertes) como divisor
            const cantidadParaCalculo = Math.max(1, lote.cantidadInicial - muertes);
            const costoUnitario = costoTotal / cantidadParaCalculo;
            
            console.log(`💰 Lote ${lote.id} (${lote.nombre}):`, {
              costoInicial,
              gastosAdicionales,
              costoTotal,
              cantidadInicial: lote.cantidadInicial,
              muertes,
              cantidadParaCalculo,
              huevosProducidos,
              costoPorHuevo: costoPorHuevo.toFixed(4),
              costoUnitario: costoUnitario.toFixed(4)
            });
            
            // Almacenar gastos del lote para el historial CPH
            const gastosParaHistorial = gastosLote.map(g => ({
              fecha: g.fecha instanceof Date ? g.fecha : new Date(g.fecha),
              total: g.total
            }));
            setGastosPorLote(prev => ({
              ...prev,
              [lote.id]: gastosParaHistorial
            }));
            
            // Actualizar solo este lote específico
            setCostosPorHuevo(prev => ({
              ...prev,
              [lote.id]: {
                costoTotal,
                costoPorHuevo,
                costoUnitario,
                isLoading: false
              }
            }));
          } catch (error) {
            console.error(`Error calculando costo para lote ${lote.id}:`, error);
            setCostosPorHuevo(prev => ({
              ...prev,
              [lote.id]: { costoTotal: 0, costoPorHuevo: 0, costoUnitario: 0, isLoading: false }
            }));
          }
        }
      };

      calcularCostos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes, registrosMortalidad, estadisticasLotes]);
  
  // Debug: Log del estado inicial
  console.log('🔍 Estado inicial:', { busqueda, ordenamiento, ordenDescendente, lotesCount: lotes.length });
  
  // Cargar lotes, artículos y suscribirse a cambios en tiempo real
  useEffect(() => {
    console.log('🐔 Ponedoras: Suscribiéndose a lotes, mortalidad, artículos y registros de huevos...');
    const unsubscribeLotes = suscribirseAPonedoras();
    const unsubscribeMortalidad = suscribirseAMortalidadPorTipo(TipoAve.PONEDORA);
    loadArticulos();
    loadAllRegistros();
    cargarGalpones();

    return () => {
      unsubscribeLotes();
      unsubscribeMortalidad();
    };
  }, [suscribirseAPonedoras, suscribirseAMortalidadPorTipo, loadArticulos, loadAllRegistros, cargarGalpones]);

  // Cargar estadísticas cuando los lotes estén disponibles
  useEffect(() => {
    if (lotes.length > 0) {
      cargarEstadisticasLotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotes]);

  // Cargar información de tracking de recolección de huevos usando datos del store
  useEffect(() => {
    if (lotes && lotes.length > 0 && registrosHuevos && registrosHuevos.length >= 0) {
      console.log('🥚 Calculando egg tracking desde store...');
      console.log('🥚 Lotes disponibles:', lotes.length);
      console.log('🥚 Registros de huevos disponibles:', registrosHuevos.length);
      
      const tracking = getEggTrackingInfoFromStore(lotes, registrosHuevos);
      setEggTracking(tracking);
      console.log('🥚 Egg tracking calculado:', tracking.length, 'lotes procesados');
    }
  }, [lotes, registrosHuevos]);

  // Opciones de ordenamiento
  const opcionesOrdenamiento = [
    { key: 'fechaInicio', label: 'Fecha de Inicio', icon: 'calendar' },
    { key: 'nombre', label: 'Nombre del Lote', icon: 'text' },
    { key: 'numeroAves', label: 'Cantidad de Gallinas', icon: 'people' },
    { key: 'huevos', label: 'Huevos Producidos', icon: 'egg' },
    { key: 'muertes', label: 'Muertes Registradas', icon: 'warning' },
    { key: 'gastos', label: 'Gastos Totales', icon: 'receipt' },
    { key: 'rentabilidad', label: 'Rentabilidad', icon: 'trending-up' },
  ];

  // Lógica de filtrado y ordenamiento
  const lotesFiltradosYOrdenados = useMemo(() => {
    console.log('🔍 Aplicando filtros:', { busqueda, ordenamiento, ordenDescendente });
    
    // Crear una copia del array para no modificar el original
    let lotesFiltrados = [...lotes];

    // Filtrar por estado: por defecto solo mostrar activos
    if (!mostrarFinalizados) {
      lotesFiltrados = lotesFiltrados.filter(lote => lote.estado === EstadoLote.ACTIVO);
      console.log('🔍 Lotes filtrados por estado (solo activos):', lotesFiltrados.length);
    }

    // Filtrar por búsqueda de texto
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase();
      lotesFiltrados = lotesFiltrados.filter(lote => 
        lote.nombre.toLowerCase().includes(terminoBusqueda) ||
        lote.raza.toLowerCase().includes(terminoBusqueda) ||
        lote.observaciones?.toLowerCase().includes(terminoBusqueda)
      );
      console.log('🔍 Lotes filtrados por búsqueda:', lotesFiltrados.length);
    }

    // Ordenar los lotes
    lotesFiltrados.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (ordenamiento) {
        case 'fechaInicio':
          valorA = new Date(a.fechaInicio).getTime();
          valorB = new Date(b.fechaInicio).getTime();
          break;
        case 'nombre':
          valorA = a.nombre.toLowerCase();
          valorB = b.nombre.toLowerCase();
          break;
        case 'numeroAves':
          valorA = a.cantidadActual;
          valorB = b.cantidadActual;
          break;
        case 'huevos':
          valorA = estadisticasLotes[a.id]?.huevos || 0;
          valorB = estadisticasLotes[b.id]?.huevos || 0;
          break;
        case 'muertes':
          valorA = estadisticasLotes[a.id]?.muertes || 0;
          valorB = estadisticasLotes[b.id]?.muertes || 0;
          break;
        case 'gastos':
          // TODO: Implementar cuando tengamos gastos por lote
          valorA = 0;
          valorB = 0;
          break;
        case 'rentabilidad':
          // Calcular rentabilidad basada en huevos producidos vs gallinas
          // cantidadActual ya tiene las muertes restadas por el servicio de mortalidad
          const huevosA = estadisticasLotes[a.id]?.huevos || 0;
          const gallinasA = a.cantidadActual;
          valorA = gallinasA > 0 ? huevosA / gallinasA : 0;
          
          const huevosB = estadisticasLotes[b.id]?.huevos || 0;
          const gallinasB = b.cantidadActual;
          valorB = gallinasB > 0 ? huevosB / gallinasB : 0;
          break;
        default:
          valorA = new Date(a.fechaInicio).getTime();
          valorB = new Date(b.fechaInicio).getTime();
      }

      // Aplicar orden ascendente o descendente
      if (valorA < valorB) return ordenDescendente ? 1 : -1;
      if (valorA > valorB) return ordenDescendente ? -1 : 1;
      return 0;
    });

    console.log('🔍 Lotes finales ordenados:', lotesFiltrados.length);
    return lotesFiltrados;
  }, [lotes, busqueda, ordenamiento, ordenDescendente, estadisticasLotes, mostrarFinalizados]);

  const handleNuevoLote = () => {
    router.push('/ponedoras/nuevo-lote');
  };

  const handleRegistrarGasto = (lote: any) => {
    setLoteSeleccionado({
      id: lote.id,
      nombre: lote.nombre
    });
    setGastoSheetVisible(true);
  };

  const handleVerLote = (loteId: string) => {
    router.push(`/ponedoras/detalles/${loteId}` as any);
  };

  const toggleLoteExpandido = (loteId: string) => {
    setLoteExpandido(loteId === loteExpandido ? null : loteId);
  };

  const handleAbrirMenuAcciones = (lote: any) => {
    setLoteParaAcciones(lote);
    setMenuAccionesVisible(true);
  };

  const handleLongPressLote = (lote: any) => {
    setLoteParaCambiarEstado(lote);
    setModalCambioEstadoVisible(true);
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoLote) => {
    if (!loteParaCambiarEstado) return;

    try {
      const { actualizarLote } = usePonedorasStore.getState();
      await actualizarLote(loteParaCambiarEstado.id, { estado: nuevoEstado });
      showSuccessAlert('Éxito', `Estado del lote cambiado a ${nuevoEstado}`);
      setModalCambioEstadoVisible(false);
      setLoteParaCambiarEstado(null);
    } catch (error: any) {
      console.error('Error al cambiar estado del lote:', error);
      showErrorAlert('Error', error.message || 'No se pudo cambiar el estado del lote');
    }
  };

  const handleEliminarLote = async (lote: any) => {
    if (lote.estado === EstadoLote.ACTIVO) {
      showErrorAlert('No se puede eliminar', 'No se puede eliminar un lote activo. Debe finalizarlo primero.');
      return;
    }

    showConfirmationAlert(
      'Eliminar Lote',
      `¿Estás seguro de que deseas eliminar el lote "${lote.nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await usePonedorasStore.getState().eliminarLote(lote.id);
          showSuccessAlert('Éxito', 'Lote eliminado correctamente');
        } catch (error: any) {
          console.error('Error al eliminar lote:', error);
          showErrorAlert('Error', error.message || 'No se pudo eliminar el lote');
        }
      },
      undefined,
      'Eliminar',
      'Cancelar'
    );
  };

  const getAccionesParaLote = (lote: any): AccionLote[] => {
    const acciones: AccionLote[] = [
      {
        id: 'registrar-muerte',
        label: 'Registrar Muerte',
        icon: 'skull-outline',
        onPress: () => router.push(`/ponedoras/registrar-muerte?loteId=${lote.id}`),
        variant: 'default',
      },
      {
        id: 'registrar-produccion',
        label: 'Registrar Producción',
        icon: 'egg-outline',
        onPress: () => router.push(`/ponedoras/registrar-produccion?loteId=${lote.id}`),
        variant: 'primary',
      },
      {
        id: 'registrar-gasto',
        label: 'Registrar Gasto',
        icon: 'receipt-outline',
        onPress: () => handleRegistrarGasto(lote),
        variant: 'default',
      },
      {
        id: 'ver-detalles',
        label: 'Ver Detalles',
        icon: 'information-circle-outline',
        onPress: () => handleVerLote(lote.id),
        variant: 'primary',
      },
    ];

    // Agregar opción de eliminar solo si el lote está finalizado
    if (lote.estado !== EstadoLote.ACTIVO) {
      acciones.push({
        id: 'eliminar-lote',
        label: 'Eliminar Lote',
        icon: 'trash-outline',
        onPress: () => handleEliminarLote(lote),
        variant: 'danger',
      });
    }

    return acciones;
  };

  // Obtener información de recolección para un lote específico
  const getEggInfoForLote = (loteId: string) => {
    return eggTracking.find(e => e.loteId === loteId);
  };

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refrescando datos de ponedoras...');
      await cargarLotes();
      await cargarEstadisticasLotes();
      await loadArticulos();
      await loadAllRegistros();
      await cargarGalpones();
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Estado de carga inicial
  const isInitialLoading = isLoading || lotes.length === 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.ponedoras}
          colors={[colors.ponedoras]}
        />
      }
    >
      {isInitialLoading ? (
        /* Loading Skeleton */
        <View style={styles.loadingContainer}>
          <View style={styles.loadingHeader}>
            <View style={[styles.skeleton, styles.skeletonButton]} />
            <View style={[styles.skeleton, styles.skeletonButton]} />
          </View>
          <View style={[styles.skeleton, styles.skeletonSearch]} />
          <View style={[styles.skeleton, styles.skeletonSort]} />
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.skeletonCard}>
              <View style={styles.skeletonCardHeader}>
                <View style={styles.skeletonCardInfo}>
                  <View style={[styles.skeleton, styles.skeletonTitle]} />
                  <View style={[styles.skeleton, styles.skeletonSubtitle]} />
                  <View style={[styles.skeleton, styles.skeletonBadge]} />
                </View>
                <View style={[styles.skeleton, styles.skeletonStatus]} />
              </View>
              <View style={styles.skeletonCardStats}>
                {[1, 2, 3].map((stat) => (
                  <View key={stat} style={styles.skeletonStat}>
                    <View style={[styles.skeleton, styles.skeletonStatValue]} />
                    <View style={[styles.skeleton, styles.skeletonStatLabel]} />
                  </View>
                ))}
              </View>
              <View style={styles.skeletonCardActions}>
                {[1, 2, 3, 4].map((action) => (
                  <View key={action} style={[styles.skeleton, styles.skeletonActionButton]} />
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <>
      <View style={styles.header}>
        <Button
          title="Dashboard"
          onPress={() => router.push('/(tabs)/ponedoras/dashboard-comparativo')}
          variant="outline"
          size="small"
          style={styles.dashboardButton}
        />
        <View style={styles.headerActions}>
          <Button 
            title="Historial RH" 
            onPress={() => router.push('/(tabs)/ponedoras/historial-registros-huevos')} 
            size="small"
            variant="outline"
            style={styles.historialButton}
          />
          <TouchableOpacity
            style={styles.addButtonIcon}
            onPress={handleNuevoLote}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMedium} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, raza o estado de salud..."
            placeholderTextColor={colors.textLight}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.textMedium} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selector de Ordenamiento y Filtros */}
      <View style={styles.sortContainer}>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setMostrarOpcionesOrden(true)}
        >
          <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          <Text style={styles.sortButtonText}>
            Ordenar por: {opcionesOrdenamiento.find(opt => opt.key === ordenamiento)?.label}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMedium} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.orderToggle}
          onPress={() => {
            console.log('🔄 Cambiando orden de', ordenDescendente ? 'descendente' : 'ascendente', 'a', !ordenDescendente ? 'descendente' : 'ascendente');
            setOrdenDescendente(!ordenDescendente);
          }}
        >
          <Ionicons 
            name={ordenDescendente ? "arrow-down" : "arrow-up"} 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Toggle para mostrar/ocultar finalizados */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => {
            console.log('🔄 Cambiando mostrar finalizados de', mostrarFinalizados, 'a', !mostrarFinalizados);
            setMostrarFinalizados(!mostrarFinalizados);
          }}
        >
          <Ionicons 
            name={mostrarFinalizados ? "eye" : "eye-off"} 
            size={18} 
            color={mostrarFinalizados ? colors.primary : colors.textMedium} 
          />
          <Text style={[styles.filterToggleText, mostrarFinalizados && styles.filterToggleTextActive]}>
            {mostrarFinalizados ? 'Mostrando todos' : 'Solo activos'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Opciones de Ordenamiento */}
      <Modal
        visible={mostrarOpcionesOrden}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarOpcionesOrden(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ordenar por</Text>
              <TouchableOpacity onPress={() => setMostrarOpcionesOrden(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            
            {opcionesOrdenamiento.map((opcion) => (
              <TouchableOpacity
                key={opcion.key}
                style={[
                  styles.ordenOption,
                  ordenamiento === opcion.key && styles.ordenOptionSelected
                ]}
                onPress={() => {
                  console.log('📊 Cambiando ordenamiento a:', opcion.key);
                  setOrdenamiento(opcion.key);
                  setMostrarOpcionesOrden(false);
                }}
              >
                <Ionicons 
                  name={opcion.icon as any} 
                  size={20} 
                  color={ordenamiento === opcion.key ? colors.primary : colors.textMedium} 
                />
                <Text style={[
                  styles.ordenOptionText,
                  ordenamiento === opcion.key && styles.ordenOptionTextSelected
                ]}>
                  {opcion.label}
                </Text>
                {ordenamiento === opcion.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Cargando lotes...</Text>
        </View>
      ) : lotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="egg-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyStateTitle}>No hay lotes registrados</Text>
          <Text style={styles.emptyStateText}>
            Comience creando un nuevo lote de gallinas ponedoras
          </Text>
          <Button 
            title="Crear Lote" 
            onPress={handleNuevoLote} 
            style={styles.createButton}
          />
        </View>
      ) : lotesFiltradosYOrdenados.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={colors.lightGray} />
          <Text style={styles.emptyStateTitle}>No se encontraron lotes</Text>
          <Text style={styles.emptyStateText}>
            Intenta con otros términos de búsqueda
          </Text>
          <Button 
            title="Limpiar Búsqueda" 
            onPress={() => setBusqueda('')} 
            variant="outline"
            style={styles.createButton}
          />
        </View>
      ) : (
        <View>
          {/* Contador de resultados */}
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {lotesFiltradosYOrdenados.length} de {lotes.length} lotes
              {busqueda && ` • Buscando: "${busqueda}"`}
            </Text>
            <Text style={styles.sortInfo}>
              Ordenado por: {opcionesOrdenamiento.find(opt => opt.key === ordenamiento)?.label} 
              {ordenDescendente ? ' (↓)' : ' (↑)'}
            </Text>
          </View>
          
          {lotesFiltradosYOrdenados.map((lote, index) => {
            const eggInfo = getEggInfoForLote(lote.id);
            const { costoTotal } = costosPorHuevo[lote.id] || { costoTotal: 0, costoPorHuevo: 0, costoUnitario: 0, isLoading: false };
            const huevosProducidos = estadisticasLotes[lote.id]?.huevos || 0;
            
            // Filtrar registros de huevos para este lote (para historial CPH)
            const registrosLote = registrosHuevos 
              ? registrosHuevos.filter(r => r.loteId === lote.id)
              : [];
            
            // Obtener gastos del lote para historial CPH
            const gastosLoteHistorial = gastosPorLote[lote.id] || [];

            const galpon = galpones.find((g) => g.id === lote.galponId);
            const badgeColors = galpon ? LOCATION_COLORS : LOCATION_COLORS_EMPTY;
            const badgeLabel = galpon ? galpon.nombre : 'Sin galpón';
            const estaExpandido = loteExpandido === lote.id;

            return (
              <Card key={lote.id} style={StyleSheet.flatten([
                styles.loteCard,
                eggInfo?.estadoRecoleccion === 'emergencia' && styles.emergencyCard,
                eggInfo?.estadoRecoleccion === 'advertencia' && styles.warningCard
              ])}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleLoteExpandido(lote.id)}
                  onLongPress={() => handleLongPressLote(lote)}
                  style={styles.loteHeaderTouchable}
                >
                  <View style={styles.loteHeader}>
                    <View style={styles.loteInfoContainer}>
                      <Text style={styles.loteName}>{lote.nombre}</Text>
                      <Text style={styles.loteDate}>
                        Inicio: {formatDate(lote.fechaInicio)}
                      </Text>
                      {galpon && (
                        <View style={StyleSheet.flatten([styles.locationBadge, { backgroundColor: badgeColors.badgeBg }])}>
                          <Ionicons name={galpon ? 'location' : 'home-outline'} size={14} color={badgeColors.badgeText} />
                          <Text style={StyleSheet.flatten([styles.locationText, { color: badgeColors.badgeText }])}>{badgeLabel}</Text>
                        </View>
                      )}
                      {/* Indicador de recolección de huevos */}
                      {eggInfo && (
                        <View style={styles.eggIndicatorContainer}>
                          <Ionicons 
                            name={
                              eggInfo.estadoRecoleccion === 'emergencia' ? 'warning' :
                              eggInfo.estadoRecoleccion === 'advertencia' ? 'time' :
                              'checkmark-circle'
                            }
                            size={14}
                            color={
                              eggInfo.estadoRecoleccion === 'emergencia' ? colors.danger :
                              eggInfo.estadoRecoleccion === 'advertencia' ? colors.warning :
                              colors.success
                            }
                          />
                          <Text style={[
                            styles.eggIndicatorText,
                            {
                              color: 
                                eggInfo.estadoRecoleccion === 'emergencia' ? colors.danger :
                                eggInfo.estadoRecoleccion === 'advertencia' ? colors.warning :
                                colors.success
                            }
                          ]}>
                            {eggInfo.nuncaRecolectado ? 
                              `Sin recolección (${eggInfo.diasSinRecoleccion}d)` :
                              `Última recolección: ${eggInfo.diasSinRecoleccion}d`
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.loteHeaderRight}>
                      <View style={[
                        styles.statusBadge, 
                        lote.estado === EstadoLote.ACTIVO ? styles.activeStatus : 
                        lote.estado === EstadoLote.VENDIDO ? styles.soldStatus :
                        styles.inactiveStatus
                      ]}>
                        <Text style={[
                          styles.statusText, 
                          { 
                            color: lote.estado === EstadoLote.ACTIVO ? colors.success : 
                                   lote.estado === EstadoLote.VENDIDO ? colors.warning :
                                   colors.textMedium 
                          }
                        ]}>
                          {lote.estado === EstadoLote.ACTIVO ? 'Activo' : 
                           lote.estado === EstadoLote.VENDIDO ? 'Vendido' :
                           'Finalizado'}
                        </Text>
                      </View>
                      <CostPorHuevoBadge
                        costoTotal={costoTotal}
                        cantidadHuevos={huevosProducidos}
                        cantidadInicial={lote.cantidadInicial}
                        cantidadActual={lote.cantidadActual}
                        loteId={lote.id}
                        tipoLote="PONEDORA"
                        size="small"
                        style={styles.costBadge}
                        fechaInicio={lote.fechaInicio}
                        registrosHuevos={registrosLote.map(r => ({ fecha: r.fecha, cantidad: r.cantidad }))}
                        gastos={gastosLoteHistorial}
                      />
                    </View>
                  </View>
                  <Ionicons
                    name={estaExpandido ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMedium}
                    style={styles.expandIcon}
                  />
                </TouchableOpacity>

                {estaExpandido && (
                  <View style={styles.loteExpandedContent}>
                    <View style={styles.loteStats}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {lote.cantidadActual}
                        </Text>
                        <Text style={styles.statLabel}>Gallinas Actuales</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.statItem}
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
                        <Text style={styles.statValue}>
                          {estadisticasLotes[lote.id]?.huevos || 0}
                        </Text>
                        <Text style={styles.statLabel}>Huevos Totales</Text>
                        <Text style={styles.statHint}>Toca para ver registros</Text>
                      </TouchableOpacity>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                          {estadisticasLotes[lote.id]?.muertes || 0}
                        </Text>
                        <Text style={styles.statLabel}>Muertes</Text>
                      </View>
                    </View>
                    
                    <View style={styles.loteActions}>
                      <Button 
                        title="Editar" 
                        onPress={() => router.push(`/ponedoras/editar-lote?loteId=${lote.id}` as any)} 
                        variant="outline"
                        size="small"
                        style={styles.editButtonExpanded}
                      />
                      <Button 
                        title="Acciones" 
                        onPress={() => handleAbrirMenuAcciones(lote)} 
                        variant="primary"
                        size="small"
                        style={styles.accionesButton}
                      />
                    </View>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}
      
      {/* Sheet para registrar gastos */}
      {loteSeleccionado && (
        <GastoSheet
          visible={gastoSheetVisible}
          onClose={() => setGastoSheetVisible(false)}
          loteId={loteSeleccionado.id}
          tipoLote={TipoAve.PONEDORA}
          loteNombre={loteSeleccionado.nombre}
          articulos={articulos.map(a => ({ 
            id: a.id, 
            nombre: a.nombre, 
            costoFijo: a.costoFijo, 
            precio: a.precio 
          }))}
        />
      )}

      {/* Menú de acciones */}
      {loteParaAcciones && (
        <AccionesLoteMenu
          visible={menuAccionesVisible}
          onClose={() => {
            setMenuAccionesVisible(false);
            setLoteParaAcciones(null);
          }}
          acciones={getAccionesParaLote(loteParaAcciones)}
          titulo={`Acciones - ${loteParaAcciones.nombre}`}
        />
      )}

      {/* Modal de cambio de estado */}
      <Modal
        visible={modalCambioEstadoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalCambioEstadoVisible(false);
          setLoteParaCambiarEstado(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentEstado}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Estado del Lote</Text>
              <TouchableOpacity onPress={() => {
                setModalCambioEstadoVisible(false);
                setLoteParaCambiarEstado(null);
              }}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            
            {loteParaCambiarEstado && (
              <>
                <Text style={styles.modalSubtitle}>
                  Lote: <Text style={styles.modalLoteNombre}>{loteParaCambiarEstado.nombre}</Text>
                </Text>
                <Text style={styles.modalEstadoActual}>
                  Estado actual: <Text style={styles.modalEstadoTexto}>{loteParaCambiarEstado.estado}</Text>
                </Text>
                
                <View style={styles.estadosContainer}>
                  {Object.values(EstadoLote).map((estado) => (
                    <TouchableOpacity
                      key={estado}
                      style={[
                        styles.estadoOption,
                        loteParaCambiarEstado.estado === estado && styles.estadoOptionSelected
                      ]}
                      onPress={() => handleCambiarEstado(estado)}
                      disabled={loteParaCambiarEstado.estado === estado}
                    >
                      <Ionicons 
                        name={
                          estado === EstadoLote.ACTIVO ? 'play-circle' :
                          estado === EstadoLote.FINALIZADO ? 'checkmark-circle' :
                          estado === EstadoLote.VENDIDO ? 'cash' :
                          estado === EstadoLote.CANCELADO ? 'close-circle' :
                          'swap-horizontal'
                        }
                        size={24} 
                        color={loteParaCambiarEstado.estado === estado ? colors.ponedoras : colors.textMedium} 
                      />
                      <Text style={[
                        styles.estadoOptionText,
                        loteParaCambiarEstado.estado === estado && styles.estadoOptionTextSelected
                      ]}>
                        {estado}
                      </Text>
                      {loteParaCambiarEstado.estado === estado && (
                        <Ionicons name="checkmark" size={20} color={colors.ponedoras} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      </>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dashboardButton: {
    minWidth: 100,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ponedoras,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historialButton: {
    minWidth: 100,
  },
  // Buscador
  searchContainer: {
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  
  // Selector de Ordenamiento
  sortContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  sortButtonText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: 8,
  },
  orderToggle: {
    padding: 10,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  
  // Filtro de estado
  filterContainer: {
    marginBottom: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  filterToggleText: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 6,
    fontWeight: '500',
  },
  filterToggleTextActive: {
    color: colors.primary,
  },
  
  // Modal de Ordenamiento
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  ordenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  ordenOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  ordenOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
    marginLeft: 12,
  },
  ordenOptionTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  modalContentEstado: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    maxHeight: '80%',
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 8,
  },
  modalLoteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalEstadoActual: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 20,
  },
  modalEstadoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ponedoras,
  },
  estadosContainer: {
    gap: 12,
  },
  estadoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    backgroundColor: colors.white,
  },
  estadoOptionSelected: {
    backgroundColor: colors.ponedoras + '10',
    borderColor: colors.ponedoras + '50',
  },
  estadoOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
    marginLeft: 12,
    fontWeight: '500',
  },
  estadoOptionTextSelected: {
    color: colors.ponedoras,
    fontWeight: '600',
  },
  
  // Información de resultados
  resultsInfo: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultsText: {
    fontSize: 14,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  sortInfo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    minWidth: 150,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  loteCard: {
    marginBottom: 16,
    padding: 16,
    position: 'relative',
    overflow: 'visible',
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    backgroundColor: colors.danger + '05',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    backgroundColor: colors.warning + '05',
  },
  loteHeaderTouchable: {
    width: '100%',
  },
  loteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loteInfoContainer: {
    flex: 1,
    paddingRight: 12,
  },
  loteHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 100,
  },
  expandIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  loteExpandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  costBadge: {
    // El badge ahora está en loteHeaderRight, no necesita posición absoluta
  },
  loteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  loteDate: {
    fontSize: 14,
    color: colors.textMedium,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  editButton: {
    minWidth: 60,
  },
  activeStatus: {
    backgroundColor: colors.success + '20', // Transparencia
  },
  inactiveStatus: {
    backgroundColor: colors.lightGray + '20', // Transparencia
  },
  soldStatus: {
    backgroundColor: colors.warning + '20', // Transparencia
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.success,
  },
  loteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.ponedoras,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  statHint: {
    fontSize: 10,
    color: colors.ponedoras,
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  loteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    marginLeft: 8,
    marginBottom: 8,
  },
  editButtonExpanded: {
    minWidth: 100,
  },
  accionesButton: {
    minWidth: 120,
  },
  eggIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eggIndicatorText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Loading Skeleton Styles
  loadingContainer: {
    flex: 1,
  },
  loadingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeleton: {
    backgroundColor: colors.veryLightGray,
    borderRadius: 8,
  },
  skeletonButton: {
    width: 120,
    height: 36,
  },
  skeletonSearch: {
    width: '100%',
    height: 48,
    marginBottom: 12,
  },
  skeletonSort: {
    width: '100%',
    height: 44,
    marginBottom: 16,
  },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonCardInfo: {
    flex: 1,
  },
  skeletonTitle: {
    width: '60%',
    height: 20,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '40%',
    height: 16,
    marginBottom: 8,
  },
  skeletonBadge: {
    width: 100,
    height: 24,
  },
  skeletonStatus: {
    width: 80,
    height: 32,
  },
  skeletonCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonStat: {
    alignItems: 'center',
  },
  skeletonStatValue: {
    width: 60,
    height: 20,
    marginBottom: 4,
  },
  skeletonStatLabel: {
    width: 80,
    height: 14,
  },
  skeletonCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonActionButton: {
    width: 80,
    height: 32,
  },
});





