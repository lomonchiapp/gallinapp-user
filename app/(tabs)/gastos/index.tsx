/**
 * Pantalla principal del módulo de Gastos
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, RefreshControl, Platform } from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import GastoSheet from '../../../src/components/ui/GastoSheet';
import { colors } from '../../../src/constants/colors';
import { useArticulosStore } from '../../../src/stores/articulosStore';
import { useEngordeStore } from '../../../src/stores/engordeStore';
import { useGastosStore } from '../../../src/stores/gastosStore';
import { useLevantesStore } from '../../../src/stores/levantesStore';
import { usePonedorasStore } from '../../../src/stores/ponedorasStore';
import { TipoAve } from '../../../src/types/enums';

export default function GastosScreen() {
  const { registrarGasto, tipo, nombre } = useLocalSearchParams<{
    registrarGasto?: string;
    tipo?: string;
    nombre?: string;
  }>();
  
  const [seccionActiva, setSeccionActiva] = useState('articulos');
  const [gastoSheetVisible, setGastoSheetVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<{
    id: string;
    tipo: TipoAve;
    nombre: string;
  } | null>(null);
  
  // Estados para filtros y paginación
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoAve | 'TODOS'>('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 20;
  
  const { articulos, loadArticulos, isLoading: articulosLoading, error: articulosError } = useArticulosStore();
  const { gastos, estadisticas, cargarGastos, cargarEstadisticas, isLoading: gastosLoading } = useGastosStore();
  const { lotes: lotesLevantes } = useLevantesStore();
  const { lotes: lotesEngorde } = useEngordeStore();
  const { lotes: lotesPonedoras } = usePonedorasStore();

  // Función auxiliar para obtener el nombre del lote
  const obtenerNombreLote = (loteId: string, tipoLote: TipoAve): string => {
    switch (tipoLote) {
      case TipoAve.POLLO_LEVANTE:
        const loteLevante = lotesLevantes.find(lote => lote.id === loteId);
        return loteLevante?.nombre || 'Lote no encontrado';
      case TipoAve.POLLO_ENGORDE:
        const loteEngorde = lotesEngorde.find(lote => lote.id === loteId);
        return loteEngorde?.nombre || 'Lote no encontrado';
      case TipoAve.PONEDORA:
        const lotePonedora = lotesPonedoras.find(lote => lote.id === loteId);
        return lotePonedora?.nombre || 'Lote no encontrado';
      default:
        return 'Tipo de lote desconocido';
    }
  };

  // Cargar artículos y gastos al montar el componente
  React.useEffect(() => {
    console.log('🔄 Cargando artículos y gastos...');
    loadArticulos();
    // Cargar todos los gastos sin filtros
    cargarGastos(undefined, undefined);
    cargarEstadisticas();
  }, []);

  // Debug: mostrar artículos cargados
  React.useEffect(() => {
    console.log('📦 Artículos cargados:', articulos.length, articulos);
    if (articulosError) {
      console.error('❌ Error en artículos:', articulosError);
    }
  }, [articulos, articulosError]);
  
  // Manejar parámetros de URL para abrir el sheet
  React.useEffect(() => {
    if (registrarGasto && tipo && nombre) {
      setLoteSeleccionado({
        id: registrarGasto,
        tipo: tipo as TipoAve,
        nombre: decodeURIComponent(nombre)
      });
      setGastoSheetVisible(true);
    }
  }, [registrarGasto, tipo, nombre]);

  const handleNuevoArticulo = () => {
    router.push('/gastos/agregar-articulo');
  };

  const handleVerArticulo = (articuloId: string) => {
    router.push({
      pathname: '/(tabs)/gastos/articulo/[id]',
      params: { id: articuloId }
    });
  };

  const handleRegistrarGasto = (loteId: string, tipo: TipoAve, nombre: string) => {
    setLoteSeleccionado({ id: loteId, tipo, nombre });
    setGastoSheetVisible(true);
  };

  // Filtrar gastos
  const gastosFiltrados = useMemo(() => {
    let filtered = [...gastos];

    // Filtrar por tipo
    if (filtroTipo !== 'TODOS') {
      filtered = filtered.filter(gasto => gasto.tipoLote === filtroTipo);
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const terminoLower = busqueda.toLowerCase();
      filtered = filtered.filter(gasto =>
        gasto.articuloNombre?.toLowerCase().includes(terminoLower) ||
        gasto.descripcion?.toLowerCase().includes(terminoLower) ||
        obtenerNombreLote(gasto.loteId || '', gasto.tipoLote).toLowerCase().includes(terminoLower)
      );
    }

    return filtered.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [gastos, filtroTipo, busqueda]);

  // Paginación
  const totalPaginas = Math.ceil(gastosFiltrados.length / itemsPorPagina);
  const gastosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return gastosFiltrados.slice(inicio, fin);
  }, [gastosFiltrados, paginaActual]);

  const handleRefresh = async () => {
    await cargarGastos(undefined, undefined);
    await cargarEstadisticas();
    setPaginaActual(1); // Resetear a primera página al refrescar
  };

  const handleSiguientePagina = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const handlePaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const handleIrAPrimeraPagina = () => {
    setPaginaActual(1);
  };

  const handleIrAUltimaPagina = () => {
    setPaginaActual(totalPaginas);
  };

  const handleCambiarFiltro = (tipo: TipoAve | 'TODOS') => {
    setFiltroTipo(tipo);
    setPaginaActual(1); // Resetear a primera página al cambiar filtro
  };

  // Helper para obtener el label del tipo
  const getTipoLabel = (tipo: TipoAve): string => {
    switch (tipo) {
      case TipoAve.PONEDORA:
        return 'Ponedoras';
      case TipoAve.POLLO_LEVANTE:
        return 'Levantes';
      case TipoAve.POLLO_ENGORDE:
        return 'Engorde';
      default:
        return 'Otro';
    }
  };

  // Helper para obtener el estilo del badge según el tipo
  const getTipoBadgeStyle = (tipo: TipoAve) => {
    switch (tipo) {
      case TipoAve.PONEDORA:
        return { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' };
      case TipoAve.POLLO_LEVANTE:
        return { backgroundColor: colors.secondary + '15', borderColor: colors.secondary + '30' };
      case TipoAve.POLLO_ENGORDE:
        return { backgroundColor: colors.engorde + '15', borderColor: colors.engorde + '30' };
      default:
        return { backgroundColor: colors.lightGray + '15', borderColor: colors.lightGray + '30' };
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={gastosLoading}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Gastos y Artículos</Text>
        <Button 
          title="Nuevo Artículo" 
          onPress={handleNuevoArticulo} 
          size="small"
          style={styles.addButton}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, seccionActiva === 'articulos' && styles.activeTab]}
          onPress={() => setSeccionActiva('articulos')}
        >
          <Text style={seccionActiva === 'articulos' ? styles.activeTabText : styles.tabText}>
            Artículos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, seccionActiva === 'historial' && styles.activeTab]}
          onPress={() => setSeccionActiva('historial')}
        >
          <Text style={seccionActiva === 'historial' ? styles.activeTabText : styles.tabText}>
            Historial de Gastos
          </Text>
        </TouchableOpacity>
      </View>

      {seccionActiva === 'articulos' ? (
        articulosLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Cargando artículos...</Text>
          </View>
        ) : articulosError ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
            <Text style={styles.emptyStateTitle}>Error al cargar artículos</Text>
            <Text style={styles.emptyStateText}>{articulosError}</Text>
            <Button 
              title="Reintentar" 
              onPress={() => loadArticulos()} 
              style={styles.createButton}
            />
          </View>
        ) : articulos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyStateTitle}>No hay artículos registrados</Text>
            <Text style={styles.emptyStateText}>
              Comience registrando los artículos que utiliza en sus lotes
            </Text>
            <Button 
              title="Agregar Artículo" 
              onPress={handleNuevoArticulo} 
              style={styles.createButton}
            />
          </View>
        ) : (
          // Listado real de artículos
          <View>
            {articulos.map((articulo) => (
              <Card key={articulo.id} style={styles.articuloCard}>
                <View style={styles.articuloHeader}>
                  <View>
                    <Text style={styles.articuloName}>{articulo.nombre}</Text>
                    <Text style={styles.articuloMedida}>
                      Estado: {articulo.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                  <View style={styles.articuloStatus}>
                    <View style={[
                      styles.statusBadge, 
                      articulo.activo ? styles.activeBadge : styles.inactiveBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        articulo.activo ? styles.activeText : styles.inactiveText
                      ]}>
                        {articulo.activo ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.articuloActions}>
                  <Button 
                    title="Editar" 
                    onPress={() => handleVerArticulo(articulo.id)} 
                    variant="outline"
                    size="small"
                    style={styles.actionButton}
                  />
                  <Button 
                    title={articulo.activo ? 'Desactivar' : 'Activar'}
                    onPress={() => {
                      // TODO: Implementar toggle de estado
                      Alert.alert('Info', 'Función por implementar');
                    }} 
                    variant={articulo.activo ? 'danger' : 'primary'}
                    size="small"
                    style={styles.actionButton}
                  />
                </View>
              </Card>
            ))}
          </View>
        )
      ) : (
        // Sección de historial de gastos modernizada
        <View style={styles.historialContainer}>
          {/* Resumen en cards individuales */}
          <View style={styles.resumenCardsContainer}>
            <Card style={styles.resumenCard}>
              <View style={styles.resumenCardHeader}>
                <Ionicons name="egg" size={24} color={colors.primary} />
                <Text style={styles.resumenCardTitle}>Ponedoras</Text>
              </View>
              <Text style={styles.resumenCardValue}>
                RD${estadisticas?.ponedoras?.toFixed(2) || '0.00'}
              </Text>
            </Card>
            
            <Card style={styles.resumenCard}>
              <View style={styles.resumenCardHeader}>
                <Ionicons name="trending-up" size={24} color={colors.secondary} />
                <Text style={styles.resumenCardTitle}>Levantes</Text>
              </View>
              <Text style={[styles.resumenCardValue, { color: colors.secondary }]}>
                RD${estadisticas?.israelies?.toFixed(2) || '0.00'}
              </Text>
            </Card>
            
            <Card style={styles.resumenCard}>
              <View style={styles.resumenCardHeader}>
                <Ionicons name="fast-food" size={24} color={colors.engorde} />
                <Text style={styles.resumenCardTitle}>Engorde</Text>
              </View>
              <Text style={[styles.resumenCardValue, { color: colors.engorde }]}>
                RD${estadisticas?.engorde?.toFixed(2) || '0.00'}
              </Text>
            </Card>
            
            <Card style={[styles.resumenCard, styles.resumenCardTotal]}>
              <View style={styles.resumenCardHeader}>
                <Ionicons name="cash" size={28} color={colors.danger} />
                <Text style={styles.resumenCardTitle}>Total</Text>
              </View>
              <Text style={styles.resumenCardTotalValue}>
                RD${estadisticas?.total?.toFixed(2) || '0.00'}
              </Text>
            </Card>
          </View>

          {/* Búsqueda */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textMedium} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar gastos..."
              value={busqueda}
              onChangeText={(text) => {
                setBusqueda(text);
                setPaginaActual(1);
              }}
              placeholderTextColor={colors.textMedium}
            />
            {busqueda.length > 0 && (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMedium} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtros */}
          <View style={styles.filtrosContainer}>
            <TouchableOpacity
              style={[styles.filtroButton, filtroTipo === 'TODOS' && styles.filtroButtonActive]}
              onPress={() => handleCambiarFiltro('TODOS')}
            >
              <Text style={[styles.filtroButtonText, filtroTipo === 'TODOS' && styles.filtroButtonTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroButton, filtroTipo === TipoAve.PONEDORA && styles.filtroButtonActive]}
              onPress={() => handleCambiarFiltro(TipoAve.PONEDORA)}
            >
              <Text style={[styles.filtroButtonText, filtroTipo === TipoAve.PONEDORA && styles.filtroButtonTextActive]}>
                Ponedoras
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroButton, filtroTipo === TipoAve.POLLO_LEVANTE && styles.filtroButtonActive]}
              onPress={() => handleCambiarFiltro(TipoAve.POLLO_LEVANTE)}
            >
              <Text style={[styles.filtroButtonText, filtroTipo === TipoAve.POLLO_LEVANTE && styles.filtroButtonTextActive]}>
                Levantes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filtroButton, filtroTipo === TipoAve.POLLO_ENGORDE && styles.filtroButtonActive]}
              onPress={() => handleCambiarFiltro(TipoAve.POLLO_ENGORDE)}
            >
              <Text style={[styles.filtroButtonText, filtroTipo === TipoAve.POLLO_ENGORDE && styles.filtroButtonTextActive]}>
                Engorde
              </Text>
            </TouchableOpacity>
          </View>

          {/* Lista de gastos */}
          {gastosLoading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Cargando gastos...</Text>
            </View>
          ) : gastosFiltrados.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.lightGray} />
              <Text style={styles.emptyStateTitle}>No hay gastos</Text>
              <Text style={styles.emptyStateText}>
                {busqueda || filtroTipo !== 'TODOS' 
                  ? 'No se encontraron gastos con los filtros aplicados'
                  : 'Los gastos se registrarán automáticamente al agregarlos a los lotes'}
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={gastosPaginados}
                keyExtractor={(item) => item.id}
                renderItem={({ item: gasto }) => (
                  <Card key={gasto.id} style={styles.gastoCard}>
                    <View style={styles.gastoCardHeader}>
                      <View style={styles.gastoCardMain}>
                        <View style={styles.gastoCardTitleRow}>
                          <Text style={styles.gastoConcepto}>{gasto.articuloNombre}</Text>
                          <Text style={styles.gastoMonto}>RD${gasto.total.toFixed(2)}</Text>
                        </View>
                        <View style={styles.gastoCardMeta}>
                          <View style={styles.gastoCardMetaItem}>
                            <Ionicons name="calendar-outline" size={14} color={colors.textMedium} />
                            <Text style={styles.gastoFecha}>
                              {gasto.fecha.toLocaleDateString('es-DO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>
                          <View style={styles.gastoCardMetaItem}>
                            <Ionicons name="cube-outline" size={14} color={colors.textMedium} />
                            <Text style={styles.gastoCantidadPrecio}>
                              {gasto.cantidad} × RD${gasto.precioUnitario?.toFixed(2) || '0.00'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {gasto.loteId && (
                      <View style={styles.gastoLoteInfo}>
                        <View style={styles.gastoLoteInfoItem}>
                          <Ionicons name="location-outline" size={14} color={colors.primary} />
                          <Text style={styles.gastoLoteText}>
                            {obtenerNombreLote(gasto.loteId, gasto.tipoLote)}
                          </Text>
                        </View>
                        <View style={[styles.gastoTipoBadge, getTipoBadgeStyle(gasto.tipoLote)]}>
                          <Text style={styles.gastoTipoText}>
                            {getTipoLabel(gasto.tipoLote)}
                          </Text>
                        </View>
                      </View>
                    )}
                    
                    {gasto.descripcion && (
                      <View style={styles.gastoDescripcionContainer}>
                        <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                      </View>
                    )}
                  </Card>
                )}
                contentContainerStyle={styles.gastosListContent}
                scrollEnabled={false}
                ListEmptyComponent={() => null}
              />

              {/* Paginación */}
              {totalPaginas > 1 && (
                <View style={styles.paginacionContainer}>
                  <View style={styles.paginacionControls}>
                    <TouchableOpacity
                      style={[styles.paginacionButton, paginaActual === 1 && styles.paginacionButtonDisabled]}
                      onPress={handleIrAPrimeraPagina}
                      disabled={paginaActual === 1}
                    >
                      <Ionicons 
                        name="chevrons-back" 
                        size={18} 
                        color={paginaActual === 1 ? colors.textLight : colors.primary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.paginacionButton, paginaActual === 1 && styles.paginacionButtonDisabled]}
                      onPress={handlePaginaAnterior}
                      disabled={paginaActual === 1}
                    >
                      <Ionicons 
                        name="chevron-back" 
                        size={20} 
                        color={paginaActual === 1 ? colors.textLight : colors.primary} 
                      />
                    </TouchableOpacity>
                    
                    <View style={styles.paginacionInfo}>
                      <Text style={styles.paginacionText}>
                        {paginaActual} / {totalPaginas}
                      </Text>
                      <Text style={styles.paginacionSubtext}>
                        {gastosPaginados.length} de {gastosFiltrados.length} gastos
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={[styles.paginacionButton, paginaActual === totalPaginas && styles.paginacionButtonDisabled]}
                      onPress={handleSiguientePagina}
                      disabled={paginaActual === totalPaginas}
                    >
                      <Ionicons 
                        name="chevron-forward" 
                        size={20} 
                        color={paginaActual === totalPaginas ? colors.textLight : colors.primary} 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.paginacionButton, paginaActual === totalPaginas && styles.paginacionButtonDisabled]}
                      onPress={handleIrAUltimaPagina}
                      disabled={paginaActual === totalPaginas}
                    >
                      <Ionicons 
                        name="chevrons-forward" 
                        size={18} 
                        color={paginaActual === totalPaginas ? colors.textLight : colors.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Info de resultados */}
              <View style={styles.resultsInfo}>
                <Text style={styles.resultsText}>
                  Mostrando {gastosPaginados.length} de {gastosFiltrados.length} gastos
                  {busqueda && ` • Buscando: "${busqueda}"`}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
      
      {/* Sheet para registrar gastos */}
      {loteSeleccionado && (
        <GastoSheet
          visible={gastoSheetVisible}
          onClose={() => setGastoSheetVisible(false)}
          loteId={loteSeleccionado.id}
          tipoLote={loteSeleccionado.tipo}
          loteNombre={loteSeleccionado.nombre}
          articulos={articulos.map(a => ({
            id: a.id,
            nombre: a.nombre,
            costoFijo: a.costoFijo,
            precio: a.precio
          }))}
        />
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  addButton: {
    minWidth: 130,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.danger,
  },
  tabText: {
    color: colors.textMedium,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.danger,
    fontWeight: 'bold',
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
  articuloCard: {
    marginBottom: 16,
    padding: 16,
  },
  articuloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  articuloName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  articuloMedida: {
    fontSize: 14,
    color: colors.textMedium,
  },
  articuloPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  articuloActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  historialContainer: {
    flex: 1,
  },
  // Resumen cards
  resumenCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  resumenCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  resumenCardTotal: {
    minWidth: '100%',
    backgroundColor: colors.danger + '08',
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  resumenCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  resumenCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  resumenCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  resumenCardTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.danger,
  },
  // Búsqueda
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textDark,
    padding: 0,
  },
  // Filtros
  filtrosContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  filtroButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
  },
  filtroButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
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
  // Lista de gastos
  gastosListContent: {
    paddingBottom: 16,
  },
  gastoCard: {
    marginBottom: 14,
    padding: 18,
    borderRadius: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gastoCardHeader: {
    marginBottom: 12,
  },
  gastoCardMain: {
    flex: 1,
  },
  gastoCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gastoConcepto: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    flex: 1,
    marginRight: 12,
  },
  gastoMonto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
  },
  gastoCardMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  gastoCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gastoFecha: {
    fontSize: 13,
    color: colors.textMedium,
  },
  gastoCantidadPrecio: {
    fontSize: 13,
    color: colors.textMedium,
  },
  gastoLoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  gastoLoteInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  gastoLoteText: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  gastoTipoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gastoTipoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
  },
  gastoDescripcionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  gastoDescripcion: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  // Paginación
  paginacionContainer: {
    marginTop: 20,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  paginacionControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  paginacionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginacionButtonDisabled: {
    opacity: 0.4,
    backgroundColor: colors.veryLightGray,
  },
  paginacionInfo: {
    alignItems: 'center',
    minWidth: 100,
    paddingHorizontal: 16,
  },
  paginacionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  paginacionSubtext: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  // Info de resultados
  resultsInfo: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'center',
  },
  articuloStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
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
});

