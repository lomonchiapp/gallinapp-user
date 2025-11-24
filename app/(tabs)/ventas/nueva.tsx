/**
 * Nueva Venta - Pantalla principal de ventas rediseñada
 * 
 * Características:
 * - UI moderna y modular
 * - Validación en tiempo real
 * - Manejo de errores específicos
 * - Flujo optimizado de venta
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View
} from 'react-native';

import { ClienteSelector } from '../../../src/components/ventas/ClienteSelector';
import { ProductSelector } from '../../../src/components/ventas/ProductSelector';
import { ResumenVenta } from '../../../src/components/ventas/ResumenVenta';
import { VentaForm } from '../../../src/components/ventas/VentaForm';
import { colors } from '../../../src/constants/colors';
import { useClientes } from '../../../src/hooks/useClientes';
import { useInventario } from '../../../src/hooks/useInventario';
import { useVentas } from '../../../src/hooks/useVentas';
import { CrearVenta, ItemVenta } from '../../../src/services/ventas.service';
import { Cliente, MetodoPago, Producto } from '../../../src/types/facturacion';

export default function NuevaVentaScreen() {
  const router = useRouter();
  
  // Hooks
  const { crearVenta, calcularItemVenta, isLoading: ventasLoading, error: ventasError } = useVentas();
  const { productos, isLoading: inventarioLoading, actualizarProductos } = useInventario();
  const { clientes, crearCliente, isLoading: clientesLoading } = useClientes();

  // Estado del formulario
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [items, setItems] = useState<ItemVenta[]>([]);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [observaciones, setObservaciones] = useState('');

  // Estado de UI
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [showResumenVenta, setShowResumenVenta] = useState(false);

  // Cálculos
  const totales = {
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0),
    descuentoTotal: items.reduce((sum, item) => sum + (item.descuento || 0), 0),
    total: items.reduce((sum, item) => sum + item.total, 0),
  };

  const isLoading = ventasLoading || inventarioLoading || clientesLoading;

  // Handlers

  const handleSelectProduct = (producto: Producto, cantidad: number) => {
    const nuevoItem = calcularItemVenta(producto, cantidad);
    setItems(prev => [...prev, nuevoItem]);
    setShowProductSelector(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemCantidad = (index: number, cantidad: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const nuevoItem = calcularItemVenta(item.producto, cantidad, item.descuento);
        return { ...nuevoItem, id: item.id }; // Mantener el ID original
      }
      return item;
    }));
  };

  const handleSelectCliente = (clienteSeleccionado: Cliente) => {
    setCliente(clienteSeleccionado);
    setShowClienteSelector(false);
  };

  const handleCreateCliente = async (datos: { nombre: string; telefono?: string; email?: string }) => {
    return await crearCliente(datos);
  };

  const handlePrepararVenta = () => {
    if (!cliente) {
      Alert.alert('Error', 'Selecciona un cliente');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto');
      return;
    }

    setShowResumenVenta(true);
  };

  const handleConfirmarVenta = async () => {
    if (!cliente) return;

    try {
      const datosVenta: CrearVenta = {
        cliente,
        items,
        metodoPago,
        observaciones: observaciones.trim() || undefined,
      };

      const venta = await crearVenta(datosVenta);
      
      if (venta) {
        setShowResumenVenta(false);
        
        Alert.alert(
          'Venta Registrada',
          `Venta ${venta.numero} registrada exitosamente por RD$${venta.total.toFixed(2)}`,
          [
            {
              text: 'Nueva Venta',
              onPress: limpiarFormulario,
            },
            {
              text: 'Ver Historial',
              onPress: () => {
                limpiarFormulario();
                router.replace('/(tabs)/ventas');
              },
            }
          ]
        );
        
        // Actualizar inventario después de la venta
        await actualizarProductos(true);
      }
    } catch (error) {
      console.error('❌ Error al confirmar venta:', error);
      Alert.alert(
        'Error',
        'No se pudo registrar la venta. Verifica los datos e inténtalo de nuevo.'
      );
    }
  };

  const limpiarFormulario = () => {
    setCliente(null);
    setItems([]);
    setMetodoPago(MetodoPago.EFECTIVO);
    setObservaciones('');
    setShowResumenVenta(false);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <VentaForm
          cliente={cliente}
          items={items}
          metodoPago={metodoPago}
          observaciones={observaciones}
          isLoading={isLoading}
          onClienteChange={setCliente}
          onAddItem={() => setShowProductSelector(true)}
          onRemoveItem={handleRemoveItem}
          onUpdateItemCantidad={handleUpdateItemCantidad}
          onMetodoPagoChange={setMetodoPago}
          onObservacionesChange={setObservaciones}
          onSubmit={handlePrepararVenta}
          onSelectCliente={() => setShowClienteSelector(true)}
        />

        {/* Modales */}
        <ProductSelector
          productos={productos}
          visible={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onSelectProduct={handleSelectProduct}
          isLoading={inventarioLoading}
        />

        <ClienteSelector
          clientes={clientes}
          visible={showClienteSelector}
          onClose={() => setShowClienteSelector(false)}
          onSelectCliente={handleSelectCliente}
          onCreateCliente={handleCreateCliente}
          isLoading={clientesLoading}
        />

        {cliente && (
          <ResumenVenta
            visible={showResumenVenta}
            cliente={cliente}
            items={items}
            metodoPago={metodoPago}
            observaciones={observaciones}
            totales={totales}
            isLoading={ventasLoading}
            onConfirmar={handleConfirmarVenta}
            onCancelar={() => setShowResumenVenta(false)}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
});
