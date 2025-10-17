/**
 * Tab de Lotes de Pollos de Engorde
 */

import { EstadoLote } from '@/src/types/enums';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import CostUnitarioBadge from '../../../src/components/ui/CostUnitarioBadge';
import GastoSheet from '../../../src/components/ui/GastoSheet';
import { colors } from '../../../src/constants/colors';
import { useGalpones } from '../../../src/hooks/useGalpones';
import { useGastosSubscription } from '../../../src/hooks/useGastosSubscription';
import { getWeightTrackingInfoFromStore, WeightTrackingInfo } from '../../../src/services/tracking-optimized.service';
import { useArticulosStore } from '../../../src/stores/articulosStore';
import { useEngordeStore } from '../../../src/stores/engordeStore';
import { useMortalityStore } from '../../../src/stores/mortalityStore';
import { usePesoStore } from '../../../src/stores/pesoStore';
import { TipoAve } from '../../../src/types';

export default function LotesTab() {
  console.log('🐔 LotesTab Engorde: Componente renderizado');
  
  // Estados para búsqueda y ordenamiento
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('fechaInicio');
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [mostrarOpcionesOrden, setMostrarOpcionesOrden] = useState(false);
  const [gastoSheetVisible, setGastoSheetVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  
  const { lotes, cargarLotes, suscribirseAEngorde } = useEngordeStore();
  const { articulos, loadArticulos } = useArticulosStore();
  const { suscribirseAMortalidadPorTipo, getRegistrosPorTipo } = useMortalityStore();
  const registrosMortalidad = getRegistrosPorTipo(TipoAve.POLLO_ENGORDE);
  const { registrosPeso, subscribeToPesosByTipo } = usePesoStore();
  const { gastos, estadisticasGastos } = useGastosSubscription(TipoAve.POLLO_ENGORDE);
  const { galpones, cargarGalpones } = useGalpones();

  // Estado para pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para estadísticas de mortalidad por lote
  const [estadisticasMortalidad, setEstadisticasMortalidad] = useState<{[loteId: string]: number}>({});
  
  // Estado para tracking de pesaje
  const [weightTracking, setWeightTracking] = useState<WeightTrackingInfo[]>([]);

  // Estado para costos unitarios
  const [costosUnitarios, setCostosUnitarios] = useState<{[loteId: string]: {costoUnitario: number, isLoading: boolean}}>({});

  // Colores temáticos para el módulo de engorde
  const LOCATION_COLORS = {
    badgeBg: colors.engorde + '15',
    badgeText: colors.engorde,
  };
  const LOCATION_COLORS_EMPTY = {
    badgeBg: colors.lightGray + '25',
    badgeText: colors.textMedium,
  };

  // Calcular costos unitarios cuando cambien los lotes
  useEffect(() => {
    if (lotes && lotes.length > 0) {
      const calcularCostos = async () => {
        const costos: {[loteId: string]: {costoUnitario: number, isLoading: boolean}} = {};

        // NO inicializar como cargando - mantener valores previos o mostrar 0
        // Si ya existe un costo, mantenerlo mientras recalculamos
        lotes.forEach(lote => {
          const costoExistente = costosUnitarios[lote.id];
          costos[lote.id] = costoExistente || { costoUnitario: 0, isLoading: false };
        });
        setCostosUnitarios(costos);

        // Calcular costo para cada lote en segundo plano
        for (const lote of lotes) {
          try {
            // Importar el servicio directamente
            const { obtenerGastos } = await import('../../../src/services/gastos.service');
            const gastosLote = await obtenerGastos(lote.id, TipoAve.POLLO_ENGORDE);
            
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
            const costoUnitario = lote.cantidadActual > 0 ? costoTotal / lote.cantidadActual : 0;
            
            console.log(`💰 Lote ${lote.id} (${lote.nombre}):`, {
              costoInicial,
              gastosAdicionales,
              costoTotal,
              cantidadActual: lote.cantidadActual,
              costoUnitario
            });
            
            // Actualizar solo este lote específico
            setCostosUnitarios(prev => ({
              ...prev,
              [lote.id]: {
                costoUnitario,
                isLoading: false
              }
            }));
          } catch (error) {
            console.error(`Error calculando costo para lote ${lote.id}:`, error);
            setCostosUnitarios(prev => ({
              ...prev,
              [lote.id]: { costoUnitario: 0, isLoading: false }
            }));
          }
        }
      };

      calcularCostos();
    }
  }, [lotes]);
  
  // Debug: Log del estado inicial
  console.log('🔍 Estado inicial:', { busqueda, ordenamiento, ordenDescendente, lotesCount: lotes?.length || 0 });
  
  // Cargar lotes, artículos y suscribirse a cambios en tiempo real
  useEffect(() => {
    console.log('🐔 Engorde: Suscribiéndose a lotes, mortalidad, artículos y registros de peso...');
    const unsubscribeLotes = suscribirseAEngorde();
    const unsubscribeMortalidad = suscribirseAMortalidadPorTipo(TipoAve.POLLO_ENGORDE);
    const unsubscribePesos = subscribeToPesosByTipo(TipoAve.POLLO_ENGORDE);
    loadArticulos();
    cargarGalpones();

    return () => {
      unsubscribeLotes();
      unsubscribeMortalidad();
      unsubscribePesos();
    };
  }, [suscribirseAEngorde, suscribirseAMortalidadPorTipo, loadArticulos, subscribeToPesosByTipo, cargarGalpones]);

  // Calcular estadísticas de mortalidad cuando cambien los registros o lotes
  useEffect(() => {
    if (lotes && lotes.length > 0 && registrosMortalidad) {
      const estadisticas: {[loteId: string]: number} = {};
      
      console.log('🔍 Calculando estadísticas de mortalidad...');
      console.log('📊 Registros de mortalidad disponibles:', registrosMortalidad.length);
      
      // Inicializar todos los lotes con 0 muertes
      lotes.forEach(lote => {
        estadisticas[lote.id] = 0;
      });
      
      // Sumar muertes por lote
      registrosMortalidad.forEach(registro => {
        if (estadisticas.hasOwnProperty(registro.loteId)) {
          estadisticas[registro.loteId] += registro.cantidad;
          console.log(`💀 Lote ${registro.loteId}: +${registro.cantidad} muertes`);
        }
      });
      
      console.log('📈 Estadísticas finales:', estadisticas);
      setEstadisticasMortalidad(estadisticas);
    }
  }, [lotes, registrosMortalidad]);

  // Cargar información de tracking de pesaje usando datos del store
  useEffect(() => {
    if (lotes && lotes.length > 0 && registrosPeso && registrosPeso.length >= 0) {
      console.log('⚖️ Calculando weight tracking desde store...');
      console.log('⚖️ Lotes disponibles:', lotes.length);
      console.log('⚖️ Registros de peso disponibles:', registrosPeso.length);
      
      const tracking = getWeightTrackingInfoFromStore(lotes, TipoAve.POLLO_ENGORDE, registrosPeso);
      setWeightTracking(tracking);
      console.log('⚖️ Weight tracking calculado:', tracking.length, 'lotes procesados');
    }
  }, [lotes, registrosPeso]);

  // Opciones de ordenamiento
  const opcionesOrdenamiento = [
    { key: 'fechaInicio', label: 'Fecha de Inicio', icon: 'calendar' },
    { key: 'nombre', label: 'Nombre del Lote', icon: 'text' },
    { key: 'cantidadActual', label: 'Cantidad de Pollos', icon: 'people' },
    { key: 'peso', label: 'Peso Promedio', icon: 'scale' },
    { key: 'muertes', label: 'Muertes Registradas', icon: 'warning' },
    { key: 'gastos', label: 'Gastos Totales', icon: 'receipt' },
    { key: 'rentabilidad', label: 'Rentabilidad', icon: 'trending-up' },
  ];

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

  // Función para formatear fecha de forma segura
  const formatearFecha = (fecha: any) => {
    try {
      let fechaObj: Date;
      
      // Manejar diferentes tipos de fecha (timestamp de Firebase, string, Date)
      if (fecha && typeof fecha === 'object' && fecha.seconds) {
        // Timestamp de Firebase
        fechaObj = new Date(fecha.seconds * 1000);
      } else if (typeof fecha === 'string') {
        // String de fecha
        fechaObj = new Date(fecha);
      } else if (fecha instanceof Date) {
        // Objeto Date
        fechaObj = fecha;
      } else {
        console.warn('Tipo de fecha no reconocido para formatear:', typeof fecha, fecha);
        return 'Fecha inválida';
      }
      
      if (isNaN(fechaObj.getTime())) {
        console.warn('Fecha inválida para formatear:', fecha);
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-ES');
    } catch (error) {
      console.error('Error formateando fecha:', error, fecha);
      return 'Fecha inválida';
    }
  };

  // Lógica de filtrado y ordenamiento
  const lotesFiltradosYOrdenados = useMemo(() => {
    if (!lotes || lotes.length === 0) return [];
    
    console.log('🔍 Aplicando filtros:', { busqueda, ordenamiento, ordenDescendente });
    
    // Crear una copia del array para no modificar el original
    let lotesFiltrados = [...lotes];

    // Filtrar por búsqueda de texto
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase();
      lotesFiltrados = lotesFiltrados.filter(lote => 
        lote.nombre.toLowerCase().includes(terminoBusqueda) ||
        lote.raza.toLowerCase().includes(terminoBusqueda)
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
        case 'cantidadActual':
          valorA = a.cantidadActual; // Ahora cantidadActual ya tiene las muertes restadas
          valorB = b.cantidadActual;
          break;
        case 'peso':
          // TODO: Implementar cuando tengamos registros de peso
          valorA = 0;
          valorB = 0;
          break;
        case 'muertes':
          valorA = estadisticasMortalidad[a.id] || 0;
          valorB = estadisticasMortalidad[b.id] || 0;
          break;
        case 'gastos':
          // TODO: Implementar cuando tengamos gastos por lote
          valorA = 0;
          valorB = 0;
          break;
        case 'rentabilidad':
          // TODO: Implementar cálculo de rentabilidad
          valorA = 0;
          valorB = 0;
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
  }, [lotes, busqueda, ordenamiento, ordenDescendente, estadisticasMortalidad]);

  const handleNuevoLote = () => {
    router.push('/engorde/nuevo-lote');
  };

  const handleRegistrarGasto = (lote: any) => {
    setLoteSeleccionado({
      id: lote.id,
      nombre: lote.nombre
    });
    setGastoSheetVisible(true);
  };

  const handleVerLote = (loteId: string) => {
    console.log('Ver detalles del lote:', loteId);
    router.push(`/(tabs)/engorde/detalles/${loteId}` as any);
  };

  // Obtener información de pesaje para un lote específico
  const getWeightInfoForLote = (loteId: string) => {
    return weightTracking.find(w => w.loteId === loteId);
  };

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Refrescando datos de engorde...');
      await cargarLotes();
      await loadArticulos();
      await cargarGalpones();
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Estado de carga inicial
  const isInitialLoading = !lotes || lotes.length === 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.engorde}
          colors={[colors.engorde]}
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
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() => router.push('/(tabs)/engorde/dashboard-comparativo')}
        >
          <Ionicons name="analytics" size={20} color={colors.engorde} />
          <Text style={styles.dashboardButtonText}>Panel Comparativo</Text>
        </TouchableOpacity>
        <Button 
          title="Nuevo Lote" 
          onPress={handleNuevoLote} 
          size="small"
          style={styles.addButton}
        />
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textMedium} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, raza o observaciones..."
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

      {/* Selector de Ordenamiento */}
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

      {!lotes || lotes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="fast-food-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyStateTitle}>No hay lotes registrados</Text>
          <Text style={styles.emptyStateText}>
            Comience creando un nuevo lote de pollos de engorde
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
            const galpon = galpones.find((g) => g.id === lote.galponId);
            const weightInfo = getWeightInfoForLote(lote.id);
            const { costoUnitario, isLoading: loadingCosto } = costosUnitarios[lote.id] || { costoUnitario: 0, isLoading: false };

            const badgeColors = galpon ? LOCATION_COLORS : LOCATION_COLORS_EMPTY;
            const badgeLabel = galpon ? galpon.nombre : 'Sin galpón';

            return (
              <Card key={`${lote.id}-${index}`} style={StyleSheet.flatten([
                styles.loteCard,
                weightInfo?.estadoPesaje === 'emergencia' && styles.emergencyCard,
                weightInfo?.estadoPesaje === 'advertencia' && styles.warningCard
              ])}>
                <View style={styles.loteHeader}>
                  <View style={styles.loteInfoContainer}>
                    <Text style={styles.loteName}>{lote.nombre}</Text>
                    <Text style={styles.loteDate}>
                      Inicio: {formatearFecha(lote.fechaInicio)}
                    </Text>
                    <View style={[styles.locationBadge, { backgroundColor: badgeColors.badgeBg }]}>
                      <Ionicons name={galpon ? 'location' : 'home-outline'} size={14} color={badgeColors.badgeText} />
                      <Text style={[styles.locationText, { color: badgeColors.badgeText }]}>{badgeLabel}</Text>
                    </View>
                    {/* Siempre mostrar el CPU, nunca ocultarlo */}
                    <CostUnitarioBadge
                      costoTotal={costoUnitario * lote.cantidadActual}
                      cantidadActual={lote.cantidadActual}
                      loteId={lote.id}
                      tipoLote="POLLO_ENGORDE"
                      size="small"
                      style={styles.costBadge}
                    />
                    {/* Indicador de pesaje */}
                    {weightInfo && (
                      <View style={styles.weightIndicatorContainer}>
                        <Ionicons 
                          name={
                            weightInfo.estadoPesaje === 'emergencia' ? 'warning' :
                            weightInfo.estadoPesaje === 'advertencia' ? 'time' :
                            'checkmark-circle'
                          }
                          size={14}
                          color={
                            weightInfo.estadoPesaje === 'emergencia' ? colors.danger :
                            weightInfo.estadoPesaje === 'advertencia' ? colors.warning :
                            colors.success
                          }
                        />
                        <Text style={[
                          styles.weightIndicatorText,
                          {
                            color: 
                              weightInfo.estadoPesaje === 'emergencia' ? colors.danger :
                              weightInfo.estadoPesaje === 'advertencia' ? colors.warning :
                              colors.success
                          }
                        ]}>
                          {weightInfo.nuncanPesado ? 
                            `Sin pesar (${weightInfo.diasSinPesar} días)` :
                            weightInfo.diasSinPesar === 0 ? 
                              'Pesado hoy' :
                              weightInfo.diasSinPesar === 1 ?
                                'Pesado ayer' :
                                `Pesado hace ${weightInfo.diasSinPesar} días`
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, lote.estado === EstadoLote.ACTIVO ? styles.activeStatus : styles.inactiveStatus]}>
                    <Text style={[styles.statusText, { color: lote.estado === EstadoLote.ACTIVO ? colors.success : colors.textMedium }]}>
                      {lote.estado === EstadoLote.ACTIVO ? 'Activo' : 'Finalizado'}
                    </Text>
                  </View>
                  <Button 
                    title="Editar" 
                    onPress={() => router.push(`/engorde/editar-lote?loteId=${lote.id}` as any)} 
                    variant="outline"
                    size="small"
                    style={styles.editButton}
                  />
                </View>
              </View>
              
              <View style={styles.loteStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {lote.cantidadActual}
                  </Text>
                  <Text style={styles.statLabel}>Pollos Actuales</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {estadisticasMortalidad[lote.id] || 0}
                  </Text>
                  <Text style={styles.statLabel}>Muertes</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {calcularEdadEnSemanas(lote.fechaNacimiento)} ({calcularEdadEnDias(lote.fechaNacimiento)}d)
                  </Text>
                  <Text style={styles.statLabel}>Semanas de Edad</Text>
                </View>
              </View>
              
              <View style={styles.loteActions}>
                <Button 
                  title="Registrar Muerte" 
                  onPress={() => router.push(`/engorde/registrar-muerte?loteId=${lote.id}`)} 
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
                <Button 
                  title="Registrar Peso" 
                  onPress={() => router.push(`/(tabs)/engorde/registrar-peso?loteId=${lote.id}`)} 
                  size="small"
                  style={styles.actionButton}
                />
                <Button 
                  title="Registrar Gasto" 
                  onPress={() => handleRegistrarGasto(lote)} 
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
                <Button 
                  title="Detalles" 
                  onPress={() => handleVerLote(lote.id)} 
                  variant="primary"
                  size="small"
                  style={styles.actionButton}
                />
              </View>
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
          tipoLote={TipoAve.POLLO_ENGORDE}
          loteNombre={loteSeleccionado.nombre}
          articulos={articulos.map(a => ({ 
            id: a.id, 
            nombre: a.nombre, 
            costoFijo: a.costoFijo, 
            precio: a.precio 
          }))}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.engorde + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.engorde + '30',
  },
  dashboardButtonText: {
    fontSize: 14,
    color: colors.engorde,
    fontWeight: '600',
    marginLeft: 6,
  },
  addButton: {
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
  loteCard: {
    marginBottom: 16,
    padding: 16,
    position: 'relative',
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
  loteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loteInfoContainer: {
    flex: 1,
  },
  costBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
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
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 8,
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
    color: colors.engorde,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  loteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    marginLeft: 8,
    marginBottom: 8,
  },
  weightIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  weightIndicatorText: {
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



