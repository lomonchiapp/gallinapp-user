/**
 * Ventas - Pantalla principal que muestra el historial de ventas
 * 
 * Características:
 * - Lista paginada de ventas
 * - Búsqueda y filtros
 * - Navegación a detalles
 * - Estadísticas rápidas
 * - Botón flotante para nueva venta
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../../../src/components/layouts/AppHeader';
import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useVentas } from '../../../src/hooks/useVentas';
import { EstadoVenta, Venta } from '../../../src/services/ventas.service';

export default function VentasScreen() {
  const router = useRouter();
  const { ventas, isLoading, getVentas, error } = useVentas();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoVenta | 'TODAS'>('TODAS');

  // Filtrar ventas
  const ventasFiltradas = useMemo(() => {
    let filtered = ventas;

    // Filtrar por búsqueda
    if (busqueda) {
      const terminoLower = busqueda.toLowerCase();
      filtered = filtered.filter(venta =>
        venta.numero.toLowerCase().includes(terminoLower) ||
        venta.cliente.nombre.toLowerCase().includes(terminoLower) ||
        venta.items.some(item => item.producto.nombre.toLowerCase().includes(terminoLower))
      );
    }

    // Filtrar por estado
    if (filtroEstado !== 'TODAS') {
      filtered = filtered.filter(venta => venta.estado === filtroEstado);
    }

    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [ventas, busqueda, filtroEstado]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const totalVentas = ventas.length;
    const ventasConfirmadas = ventas.filter(v => v.estado === EstadoVenta.CONFIRMADA).length;
    const montoTotal = ventas
      .filter(v => v.estado === EstadoVenta.CONFIRMADA)
      .reduce((sum, v) => sum + v.total, 0);

    return { totalVentas, ventasConfirmadas, montoTotal };
  }, [ventas]);

  const handleRefresh = async () => {
    await getVentas();
  };

  const handleVerDetalle = (venta: Venta) => {
    router.push(`/(tabs)/ventas/${venta.id}`);
  };

  const handleNuevaVenta = () => {
    router.push('/(tabs)/ventas/nueva');
  };

  const renderVentaCard = ({ item: venta }: { item: Venta }) => (
    <TouchableOpacity
      onPress={() => handleVerDetalle(venta)}
      style={styles.ventaCard}
    >
      <Card style={styles.card}>
        <View style={styles.ventaHeader}>
          <View style={styles.ventaInfo}>
            <Text style={styles.ventaNumero}>{venta.numero}</Text>
            <Text style={styles.ventaFecha}>
              {venta.fecha.toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          
          <View style={styles.ventaHeaderActions}>
            <View style={[
              styles.estadoBadge,
              venta.estado === EstadoVenta.CONFIRMADA && styles.estadoConfirmada,
              venta.estado === EstadoVenta.CANCELADA && styles.estadoCancelada,
            ]}>
              <Text style={[
                styles.estadoText,
                venta.estado === EstadoVenta.CONFIRMADA && styles.estadoTextConfirmada,
                venta.estado === EstadoVenta.CANCELADA && styles.estadoTextCancelada,
              ]}>
                {venta.estado}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.verFacturaIconButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/(tabs)/ventas/${venta.id}`);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.clienteNombre}>{venta.cliente.nombre}</Text>
        
        <View style={styles.ventaDetalle}>
          <Text style={styles.itemsCount}>
            {venta.items.length} producto{venta.items.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.ventaTotal}>RD${venta.total.toFixed(2)}</Text>
        </View>

        <View style={styles.metodoPago}>
          <Ionicons
            name={venta.metodoPago === 'EFECTIVO' ? 'cash-outline' : 'card-outline'}
            size={14}
            color={colors.textMedium}
          />
          <Text style={styles.metodoPagoText}>{venta.metodoPago}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEstadisticas = () => (
    <Card style={styles.estadisticasCard}>
      <View style={styles.estadisticasHeader}>
        <Text style={styles.estadisticasTitle}>Resumen</Text>
        <TouchableOpacity onPress={handleNuevaVenta} style={styles.nuevaVentaHeaderButton}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.estadisticasGrid}>
        <View style={styles.estadisticaItem}>
          <Text style={styles.estadisticaValor}>{estadisticas.totalVentas}</Text>
          <Text style={styles.estadisticaLabel}>Total Ventas</Text>
        </View>
        <View style={styles.estadisticaItem}>
          <Text style={styles.estadisticaValor}>{estadisticas.ventasConfirmadas}</Text>
          <Text style={styles.estadisticaLabel}>Confirmadas</Text>
        </View>
        <View style={styles.estadisticaItem}>
          <Text style={[styles.estadisticaValor, { color: colors.primary }]}>
            RD${estadisticas.montoTotal.toFixed(0)}
          </Text>
          <Text style={styles.estadisticaLabel}>Monto Total</Text>
        </View>
      </View>
    </Card>
  );

  const renderHeader = () => (
    <View>
      {renderEstadisticas()}
      
      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textMedium} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ventas..."
          value={busqueda}
          onChangeText={setBusqueda}
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
        {(['TODAS', EstadoVenta.CONFIRMADA, EstadoVenta.PENDIENTE, EstadoVenta.CANCELADA] as const).map((estado) => (
          <TouchableOpacity
            key={estado}
            style={[
              styles.filtroButton,
              filtroEstado === estado && styles.filtroButtonActive
            ]}
            onPress={() => setFiltroEstado(estado)}
          >
            <Text style={[
              styles.filtroText,
              filtroEstado === estado && styles.filtroTextActive
            ]}>
              {estado}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={colors.textMedium} />
      <Text style={styles.emptyTitle}>No hay ventas</Text>
      <Text style={styles.emptySubtitle}>
        {busqueda || filtroEstado !== 'TODAS' 
          ? 'No se encontraron ventas con los filtros aplicados'
          : 'Aún no has registrado ninguna venta'
        }
      </Text>
      {!busqueda && filtroEstado === 'TODAS' && (
        <TouchableOpacity
          style={styles.nuevaVentaButton}
          onPress={handleNuevaVenta}
        >
          <Ionicons name="add-circle" size={24} color={colors.white} />
          <Text style={styles.nuevaVentaText}>Registrar primera venta</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Ventas"
        showBack={false}
        showProfile={false}
        showNotifications={true}
        statusBarStyle="dark"
        backgroundColor="transparent"
      />

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && ventas.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={colors.textMedium} />
          <Text style={styles.loadingText}>Cargando ventas...</Text>
        </View>
      ) : (
        <FlatList
          data={ventasFiltradas}
          renderItem={renderVentaCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Botón flotante para nueva venta */}
      {!isLoading && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleNuevaVenta}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: -100,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 100, // Espacio para el FAB
  },
  estadisticasCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  estadisticasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  estadisticasTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  nuevaVentaHeaderButton: {
    padding: 4,
  },
  estadisticasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaValor: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  filtrosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
    flexWrap: 'wrap',
  },
  filtroButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  filtroButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroText: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: '600',
  },
  filtroTextActive: {
    color: colors.white,
  },
  ventaCard: {
    marginHorizontal: 16,
    marginBottom: 14,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ventaInfo: {
    flex: 1,
  },
  ventaHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verFacturaIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ventaNumero: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  ventaFecha: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.border,
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
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  metodoPago: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metodoPagoText: {
    fontSize: 12,
    color: colors.textMedium,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  nuevaVentaButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
  },
  nuevaVentaText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + '30',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.error,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

