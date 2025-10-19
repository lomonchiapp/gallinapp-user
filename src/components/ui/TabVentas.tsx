/**
 * Componente reutilizable para mostrar ventas de lotes
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { EstadisticasVentasLote, VentaLote } from '../../services/ventas.service';
import { LoteBase } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import Button from './Button';
import Card from './Card';

interface TabVentasProps<T extends LoteBase> {
  lote: T;
  ventas: VentaLote[];
  estadisticasVentas: EstadisticasVentasLote | null;
  isLoading?: boolean;
  error?: string | null;
}

export function TabVentas<T extends LoteBase>({
  lote,
  ventas,
  estadisticasVentas,
  isLoading = false,
  error = null,
}: TabVentasProps<T>) {
  const handleNuevaFactura = () => {
    router.push('/(tabs)/facturacion/nueva-factura');
  };

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando ventas...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.tabContent}>
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Error al cargar ventas</Text>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Registro de Ventas</Text>
        <Button
          title="Nueva Factura"
          onPress={handleNuevaFactura}
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
              <Text style={styles.ventasStatLabel}>Aves Vendidas</Text>
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
            <Text style={styles.estadoLoteLabel}>Aves Iniciales</Text>
          </View>
          <View style={styles.estadoLoteItem}>
            <Text style={styles.estadoLoteValue}>{estadisticasVentas?.cantidadVendida || 0}</Text>
            <Text style={styles.estadoLoteLabel}>Aves Vendidas</Text>
          </View>
          <View style={styles.estadoLoteItem}>
            <Text style={styles.estadoLoteValue}>{lote.cantidadActual}</Text>
            <Text style={styles.estadoLoteLabel}>Aves Actuales</Text>
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
                    <Text style={styles.ventaValue}>{venta.cantidad} aves</Text>
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

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    padding: 16,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.lightGray,
  },
  errorCard: {
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
  },
  ventasStatsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  ventasStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ventasStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  ventasStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  ventasStatLabel: {
    fontSize: 12,
    color: colors.lightGray,
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
    marginBottom: 16,
  },
  estadoLoteValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.success,
  },
  estadoLoteLabel: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.lightGray,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
  },
  ventasList: {
    flex: 1,
  },
  ventaCard: {
    marginBottom: 12,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ventaFecha: {
    fontSize: 14,
    color: colors.lightGray,
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
  },
  ventaLabel: {
    fontSize: 12,
    color: colors.lightGray,
    marginBottom: 2,
  },
  ventaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  ventaFactura: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8,
  },
  ventaFacturaText: {
    fontSize: 12,
    color: colors.lightGray,
    textAlign: 'center',
  },
});












