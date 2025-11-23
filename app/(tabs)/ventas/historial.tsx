/**
 * Historial de Ventas - Lista de ventas realizadas
 * 
 * Características:
 * - Lista paginada de ventas
 * - Búsqueda y filtros
 * - Navegación a detalles
 * - Estadísticas rápidas
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useVentas } from '../../../src/hooks/useVentas';
import { Venta, EstadoVenta } from '../../../src/services/ventas.service';

export default function HistorialVentasScreen() {
  const router = useRouter();
  const { ventas, isLoading, getVentas } = useVentas();
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
    router.push(`/ventas/detalle/${venta.id}`);
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
              {venta.fecha.toLocaleDateString('es-DO')}
            </Text>
          </View>
          
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
      <Text style={styles.estadisticasTitle}>Resumen</Text>
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
          onPress={() => router.replace('/ventas/nueva')}
        >
          <Text style={styles.nuevaVentaText}>Registrar primera venta</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  estadisticasCard: {
    margin: 16,
    marginBottom: 8,
    padding: 16,
  },
  estadisticasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  estadisticasGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaValor: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginBottom: 16,
    gap: 8,
  },
  filtroButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtroButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  filtroTextActive: {
    color: colors.white,
  },
  ventaCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    padding: 16,
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
  ventaNumero: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  ventaFecha: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMedium,
  },
  estadoTextConfirmada: {
    color: colors.success,
  },
  estadoTextCancelada: {
    color: colors.error,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
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
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  nuevaVentaButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  nuevaVentaText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});




