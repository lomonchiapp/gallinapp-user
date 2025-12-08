/**
 * ResumenVenta - Vista previa antes de confirmar venta
 * 
 * Características:
 * - Resumen completo de la venta
 * - Validación final
 * - Confirmación con detalles
 * - Manejo de errores específicos
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Cliente, MetodoPago, TipoProducto } from '../../types/facturacion';
import { ItemVenta } from '../../services/ventas.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ResumenVentaProps {
  visible: boolean;
  cliente: Cliente;
  items: ItemVenta[];
  metodoPago: MetodoPago;
  observaciones?: string;
  totales: {
    subtotal: number;
    descuentoTotal: number;
    total: number;
  };
  isLoading: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ResumenVenta: React.FC<ResumenVentaProps> = ({
  visible,
  cliente,
  items,
  metodoPago,
  observaciones,
  totales,
  isLoading,
  onConfirmar,
  onCancelar,
}) => {
  const getMetodoPagoLabel = (metodo: MetodoPago) => {
    switch (metodo) {
      case MetodoPago.EFECTIVO: return 'Efectivo';
      case MetodoPago.TRANSFERENCIA: return 'Transferencia';
      case MetodoPago.CHEQUE: return 'Cheque';
      case MetodoPago.CREDITO: return 'Crédito';
      default: return metodo;
    }
  };

  const getTipoProductoIcon = (tipo: TipoProducto) => {
    switch (tipo) {
      case TipoProducto.LOTE_COMPLETO: return 'cube-outline';
      case TipoProducto.HUEVOS: return 'egg-outline';
      default: return 'paw-outline';
    }
  };

  const renderItemResumen = (item: ItemVenta, index: number) => (
    <View key={item.id} style={styles.itemResumen}>
      <View style={styles.itemHeader}>
        <Ionicons
          name={getTipoProductoIcon(item.producto.tipo)}
          size={16}
          color={colors.primary}
        />
        <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
      </View>
      
      <View style={styles.itemDetalle}>
        <View style={styles.itemCantidadContainer}>
          <Text style={styles.itemCantidad}>
            {item.cantidad} {item.producto.unidadMedida} × RD${item.precioUnitario.toFixed(2)}
          </Text>
          {item.cantidadPollos && item.cantidadPollos > 0 && (
            <Text style={styles.itemPollosInfo}>
              ({item.cantidadPollos} pollo{item.cantidadPollos > 1 ? 's' : ''})
            </Text>
          )}
        </View>
        <Text style={styles.itemTotal}>RD${item.total.toFixed(2)}</Text>
      </View>
      
      {item.descuento && item.descuento > 0 && (
        <Text style={styles.itemDescuento}>
          Descuento: -RD${item.descuento.toFixed(2)}
        </Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancelar}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancelar}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Confirmar Venta</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Cliente */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Cliente</Text>
            </View>
            <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
            {cliente.documento && (
              <Text style={styles.clienteDetalle}>Documento: {cliente.documento}</Text>
            )}
            {cliente.telefono && (
              <Text style={styles.clienteDetalle}>Teléfono: {cliente.telefono}</Text>
            )}
            {cliente.email && (
              <Text style={styles.clienteDetalle}>Email: {cliente.email}</Text>
            )}
          </Card>

          {/* Productos */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Productos ({items.length})</Text>
            </View>
            {items.map(renderItemResumen)}
          </Card>

          {/* Método de pago */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Método de Pago</Text>
            </View>
            <Text style={styles.metodoPagoValue}>{getMetodoPagoLabel(metodoPago)}</Text>
          </Card>

          {/* Observaciones */}
          {observaciones && (
            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Observaciones</Text>
              </View>
              <Text style={styles.observacionesValue}>{observaciones}</Text>
            </Card>
          )}

          {/* Totales */}
          <Card style={styles.totalesCard}>
            <Text style={styles.totalesTitle}>Resumen Financiero</Text>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>RD${totales.subtotal.toFixed(2)}</Text>
            </View>
            
            {totales.descuentoTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Descuentos:</Text>
                <Text style={[styles.totalValue, { color: colors.error }]}>
                  -RD${totales.descuentoTotal.toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={[styles.totalRow, styles.totalFinal]}>
              <Text style={styles.totalFinalLabel}>Total a Pagar:</Text>
              <Text style={styles.totalFinalValue}>RD${totales.total.toFixed(2)}</Text>
            </View>
          </Card>
        </ScrollView>

        {/* Botones de acción */}
        <View style={styles.actions}>
          <Button
            title="Cancelar"
            onPress={onCancelar}
            style={styles.cancelButton}
            titleStyle={styles.cancelButtonText}
            disabled={isLoading}
          />
          <Button
            title={isLoading ? 'Procesando...' : 'Confirmar Venta'}
            onPress={onConfirmar}
            style={styles.confirmButton}
            loading={isLoading}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 10,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  clienteDetalle: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 6,
    lineHeight: 20,
  },
  itemResumen: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  itemDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCantidadContainer: {
    flex: 1,
  },
  itemCantidad: {
    fontSize: 14,
    color: colors.textMedium,
  },
  itemPollosInfo: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemDescuento: {
    fontSize: 12,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: 2,
  },
  metodoPagoValue: {
    fontSize: 16,
    color: colors.text,
  },
  observacionesValue: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  totalesCard: {
    marginTop: 8,
    marginBottom: 0,
    padding: 20,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 12,
  },
  totalesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalFinal: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: 12,
    marginTop: 8,
  },
  totalFinalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalFinalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
});
