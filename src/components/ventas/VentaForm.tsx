/**
 * VentaForm - Formulario principal de venta con validación en tiempo real
 * 
 * Características:
 * - Gestión completa del carrito de compras
 * - Validación en tiempo real
 * - Cálculo automático de totales
 * - Manejo de diferentes métodos de pago
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Cliente, MetodoPago, TipoProducto } from '../../types/facturacion';
import { ItemVenta } from '../../services/ventas.service';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface VentaFormProps {
  cliente: Cliente | null;
  items: ItemVenta[];
  metodoPago: MetodoPago;
  observaciones: string;
  isLoading: boolean;
  
  // Callbacks
  onClienteChange: (cliente: Cliente | null) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItemCantidad: (index: number, cantidad: number) => void;
  onMetodoPagoChange: (metodo: MetodoPago) => void;
  onObservacionesChange: (text: string) => void;
  onSubmit: () => void;
  onSelectCliente: () => void;
}

const METODO_PAGO_OPTIONS = [
  { value: MetodoPago.EFECTIVO, label: 'Efectivo', icon: 'cash-outline' },
  { value: MetodoPago.TRANSFERENCIA, label: 'Transferencia', icon: 'card-outline' },
  { value: MetodoPago.CHEQUE, label: 'Cheque', icon: 'document-outline' },
  { value: MetodoPago.CREDITO, label: 'Crédito', icon: 'time-outline' },
];

export const VentaForm: React.FC<VentaFormProps> = ({
  cliente,
  items,
  metodoPago,
  observaciones,
  isLoading,
  onClienteChange,
  onAddItem,
  onRemoveItem,
  onUpdateItemCantidad,
  onMetodoPagoChange,
  onObservacionesChange,
  onSubmit,
  onSelectCliente,
}) => {
  const [editingItem, setEditingItem] = useState<number | null>(null);

  // Cálculos de totales
  const totales = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = items.reduce((sum, item) => sum + (item.descuento || 0), 0);
    const total = subtotal - descuentoTotal;
    
    return { subtotal, descuentoTotal, total };
  }, [items]);

  const canSubmit = cliente && items.length > 0 && !isLoading;

  const handleUpdateCantidad = (index: number, nuevaCantidad: string) => {
    const cantidad = parseInt(nuevaCantidad, 10);
    if (!isNaN(cantidad) && cantidad > 0) {
      onUpdateItemCantidad(index, cantidad);
    }
    setEditingItem(null);
  };

  const getTipoProductoIcon = (tipo: TipoProducto) => {
    switch (tipo) {
      case TipoProducto.LOTE_COMPLETO: return 'cube-outline';
      case TipoProducto.HUEVOS: return 'egg-outline';
      default: return 'paw-outline';
    }
  };

  const getTipoProductoLabel = (tipo: TipoProducto) => {
    switch (tipo) {
      case TipoProducto.LOTE_COMPLETO: return 'Lote Completo';
      case TipoProducto.HUEVOS: return 'Huevos';
      case TipoProducto.UNIDADES_GALLINAS_PONEDORAS: return 'Gallinas';
      case TipoProducto.UNIDADES_POLLOS_LEVANTE: return 'Pollos Levante';
      case TipoProducto.UNIDADES_POLLOS_ENGORDE: return 'Pollos Engorde';
      default: return 'Producto';
    }
  };

  const renderItemCard = (item: ItemVenta, index: number) => (
    <Card key={item.id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemTipo}>
          <Ionicons
            name={getTipoProductoIcon(item.producto.tipo)}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.itemTipoText}>
            {getTipoProductoLabel(item.producto.tipo)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onRemoveItem(index)}
          style={styles.removeButton}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
      {item.producto.descripcion && (
        <Text style={styles.itemDescripcion}>{item.producto.descripcion}</Text>
      )}
      
      <View style={styles.itemDetails}>
        <View style={styles.itemCantidad}>
          <Text style={styles.itemLabel}>Cantidad:</Text>
          {editingItem === index ? (
            <TextInput
              style={styles.cantidadInput}
              value={item.cantidad.toString()}
              onChangeText={(text) => handleUpdateCantidad(index, text)}
              onBlur={() => setEditingItem(null)}
              keyboardType="numeric"
              autoFocus
            />
          ) : (
            <TouchableOpacity
              onPress={() => setEditingItem(index)}
              style={styles.cantidadButton}
            >
              <Text style={styles.cantidadText}>
                {item.cantidad} {item.producto.unidadMedida}
              </Text>
              <Ionicons name="pencil" size={14} color={colors.textMedium} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.itemPrecio}>
          <Text style={styles.itemLabel}>Precio:</Text>
          <Text style={styles.precioText}>
            RD${item.precioUnitario.toFixed(2)}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemTotal}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalText}>RD${item.total.toFixed(2)}</Text>
      </View>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cliente */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <TouchableOpacity style={styles.clienteButton} onPress={onSelectCliente}>
          {cliente ? (
            <View style={styles.clienteInfo}>
              <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
              {cliente.telefono && (
                <Text style={styles.clienteTelefono}>{cliente.telefono}</Text>
              )}
            </View>
          ) : (
            <View style={styles.clientePlaceholder}>
              <Ionicons name="person-add-outline" size={20} color={colors.textMedium} />
              <Text style={styles.clientePlaceholderText}>Seleccionar cliente</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.textMedium} />
        </TouchableOpacity>
      </Card>

      {/* Items */}
      <Card style={styles.section}>
        <View style={styles.itemsHeader}>
          <Text style={styles.sectionTitle}>Productos ({items.length})</Text>
          <TouchableOpacity onPress={onAddItem} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Ionicons name="cube-outline" size={32} color={colors.textMedium} />
            <Text style={styles.emptyItemsText}>No hay productos agregados</Text>
            <TouchableOpacity onPress={onAddItem}>
              <Text style={styles.addFirstText}>Agregar primer producto</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {items.map(renderItemCard)}
          </ScrollView>
        )}
      </Card>

      {/* Método de pago */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Método de Pago</Text>
        <View style={styles.metodoPagoContainer}>
          {METODO_PAGO_OPTIONS.map((opcion) => (
            <TouchableOpacity
              key={opcion.value}
              style={[
                styles.metodoPagoButton,
                metodoPago === opcion.value && styles.metodoPagoButtonActive
              ]}
              onPress={() => onMetodoPagoChange(opcion.value)}
            >
              <Ionicons
                name={opcion.icon as any}
                size={20}
                color={metodoPago === opcion.value ? colors.white : colors.textMedium}
              />
              <Text style={[
                styles.metodoPagoText,
                metodoPago === opcion.value && styles.metodoPagoTextActive
              ]}>
                {opcion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Observaciones */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Observaciones</Text>
        <TextInput
          style={styles.observacionesInput}
          value={observaciones}
          onChangeText={onObservacionesChange}
          placeholder="Notas adicionales (opcional)"
          placeholderTextColor={colors.textMedium}
          multiline
          numberOfLines={3}
        />
      </Card>

      {/* Resumen */}
      {items.length > 0 && (
        <Card style={styles.resumenCard}>
          <Text style={styles.resumenTitle}>Resumen de Venta</Text>
          
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Subtotal:</Text>
            <Text style={styles.resumenValue}>RD${totales.subtotal.toFixed(2)}</Text>
          </View>
          
          {totales.descuentoTotal > 0 && (
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Descuento:</Text>
              <Text style={[styles.resumenValue, { color: colors.error }]}>
                -RD${totales.descuentoTotal.toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={[styles.resumenRow, styles.resumenTotal]}>
            <Text style={styles.resumenTotalLabel}>Total:</Text>
            <Text style={styles.resumenTotalValue}>RD${totales.total.toFixed(2)}</Text>
          </View>
          
          <Button
            title={isLoading ? 'Procesando...' : 'Registrar Venta'}
            onPress={onSubmit}
            disabled={!canSubmit}
            style={styles.submitButton}
            loading={isLoading}
          />
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  clienteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clienteTelefono: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  clientePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientePlaceholderText: {
    fontSize: 16,
    color: colors.textMedium,
    marginLeft: 8,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    padding: 4,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyItemsText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 8,
  },
  addFirstText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  itemsList: {
    maxHeight: 300,
    marginTop: 8,
  },
  itemCard: {
    marginBottom: 12,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTipo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTipoText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  removeButton: {
    padding: 4,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemDescripcion: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemCantidad: {
    flex: 1,
  },
  itemPrecio: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
  },
  cantidadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cantidadText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 4,
  },
  cantidadInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.white,
    width: 80,
  },
  precioText: {
    fontSize: 14,
    color: colors.text,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  metodoPagoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metodoPagoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '48%',
  },
  metodoPagoButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  metodoPagoText: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 8,
  },
  metodoPagoTextActive: {
    color: colors.white,
  },
  observacionesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  resumenCard: {
    marginTop: 8,
    marginBottom: 0,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  resumenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumenLabel: {
    fontSize: 16,
    color: colors.text,
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  resumenTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.primary + '30',
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  resumenTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resumenTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
});
