/**
 * Pantalla para crear una nueva factura con experiencia moderna y modular
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useFacturacionMejorado } from '../../../src/hooks/useFacturacionMejorado';
import { TipoAve } from '../../../src/types/enums';
import {
    Cliente,
    CrearCliente,
    CrearFactura,
    EstadoFactura,
    ItemFactura,
    MetodoPago,
    Producto,
    TipoProducto,
} from '../../../src/types/facturacion';

const METODO_PAGO_MAP: Record<MetodoPago, { label: string; helper: string }> = {
  [MetodoPago.EFECTIVO]: {
    label: 'Efectivo',
    helper: 'La factura se marca como pagada inmediatamente',
  },
  [MetodoPago.TRANSFERENCIA]: {
    label: 'Transferencia bancaria',
    helper: 'Verifica que el pago se haga al número de cuenta registrado',
  },
  [MetodoPago.CHEQUE]: {
    label: 'Cheque',
    helper: 'Recuerda registrar el cheque en contabilidad',
  },
  [MetodoPago.CREDITO]: {
    label: 'Crédito',
    helper: 'El cliente quedará con saldo pendiente',
  },
};

const formatearMoneda = (valor: number): string =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(valor);

export default function NuevaFacturaScreen() {
  const router = useRouter();
  const {
    clientes,
    productos,
    crearFactura,
    crearCliente,
    actualizarProductos,
    refrescarDatos,
    calcularItemFactura,
  } = useFacturacionMejorado();

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [items, setItems] = useState<ItemFactura[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(MetodoPago.EFECTIVO);
  const [modalClienteVisible, setModalClienteVisible] = useState(false);
  const [modalProductoVisible, setModalProductoVisible] = useState(false);
  const [modalMetodoPagoVisible, setModalMetodoPagoVisible] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para crear cliente directamente desde el modal
  const [nuevoCliente, setNuevoCliente] = useState<CrearCliente>({
    nombre: '',
    documento: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    departamento: '',
  });

  const [tabActivo, setTabActivo] = useState<'LOTES' | 'AVES' | 'HISTORICO'>('LOTES');
  const [busquedaInventario, setBusquedaInventario] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState('1');

  useEffect(() => {
    // Sincronizar inventario al entrar
    actualizarProductos();
  }, [actualizarProductos]);

  useEffect(() => {
    if (modalProductoVisible) {
      setTabActivo('LOTES');
      setBusquedaInventario('');
      setProductoSeleccionado(null);
      setCantidadSeleccionada('1');
    }
  }, [modalProductoVisible]);

  const clientesFiltrados = useMemo(() => {
    const termino = busquedaCliente.toLowerCase();
    return clientes.filter((cliente) =>
      [cliente.nombre, cliente.documento, cliente.ciudad]
        .filter(Boolean)
        .some((valor) => valor!.toLowerCase().includes(termino))
    );
  }, [clientes, busquedaCliente]);

  const resumenTotales = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = items.reduce((sum, item) => sum + (item.descuento || 0), 0);
    const impuestosTotal = items.reduce((sum, item) => sum + (item.impuestos || 0), 0);
    const total = items.reduce((sum, item) => sum + item.total, 0);
    
    return { subtotal, descuentoTotal, impuestosTotal, total };
  }, [items]);

  const agregarProducto = (producto: Producto, cantidad: number) => {
    if (cantidad > producto.disponible) {
      Alert.alert('Inventario insuficiente', 'Reduce la cantidad o selecciona otro producto.');
      return;
    }

    // Verificar si ya existe este producto en la factura
    const itemExistente = items.find(item => item.producto.id === producto.id);
    if (itemExistente) {
      Alert.alert(
        'Producto ya agregado',
        'Este producto ya está en la factura. ¿Deseas actualizar la cantidad?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Actualizar', 
            onPress: () => {
              const nuevaCantidadTotal = itemExistente.cantidad + cantidad;
              if (nuevaCantidadTotal > producto.disponible) {
                Alert.alert('Inventario insuficiente', 'La cantidad total excede el inventario disponible.');
                return;
              }
              actualizarCantidad(itemExistente.id, nuevaCantidadTotal);
              setModalProductoVisible(false);
            }
          }
        ]
      );
      return;
    }

    const itemCalculado = calcularItemFactura(producto, cantidad);
    const nuevoItem: ItemFactura = {
      ...itemCalculado,
      id: `${producto.id}-${Date.now()}`,
    };

    setItems((prev) => [...prev, nuevoItem]);
    setModalProductoVisible(false);
  };

  const actualizarCantidad = (itemId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(itemId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        
        // Verificar que no exceda el inventario disponible
        if (nuevaCantidad > item.producto.disponible) {
          Alert.alert('Inventario insuficiente', 'La cantidad excede el inventario disponible.');
          return item;
        }
        
        const calculado = calcularItemFactura(item.producto, nuevaCantidad);
        return { ...item, ...calculado, id: item.id };
      })
    );
  };

  const eliminarItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const limpiarFormulario = () => {
    setClienteSeleccionado(null);
    setItems([]);
    setObservaciones('');
    setMetodoPago(MetodoPago.EFECTIVO);
  };

  const guardarFactura = async () => {
    try {
      console.log('🚀 Iniciando creación de factura...');
      
      if (!clienteSeleccionado) {
        Alert.alert('Selecciona un cliente', 'Debes elegir un cliente para facturar.');
        return;
      }

      if (items.length === 0) {
        Alert.alert('Agrega productos', 'Incluye al menos un producto o lote en la factura.');
        return;
      }

      console.log('📋 Datos de la factura:', {
        cliente: clienteSeleccionado.nombre,
        items: items.length,
        metodoPago,
        observaciones: observaciones.length
      });

      setLoading(true);

      const datosFactura: CrearFactura = {
        fecha: new Date(),
        cliente: clienteSeleccionado,
        items,
        observaciones,
        metodoPago,
        estado: EstadoFactura.EMITIDA,
      };

      console.log('💾 Enviando datos al servicio de facturación...');
      const facturaCreada = await crearFactura(datosFactura);
      
      console.log('✅ Factura creada:', facturaCreada?.id);
      
      if (facturaCreada) {
        limpiarFormulario();
        router.replace(`/facturacion/detalle/${facturaCreada.id}`);
      } else {
        console.error('❌ No se pudo crear la factura - respuesta nula');
        Alert.alert('Error', 'No se pudo crear la factura. Verifica los datos e inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('❌ Error al crear factura:', error);
      Alert.alert('Error', `Ocurrió un problema al crear la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      console.log('🔄 Finalizando proceso de creación de factura');
      setLoading(false);
    }
  };

  const crearClienteDesdeModal = async () => {
    try {
      if (!nuevoCliente.nombre.trim()) {
        Alert.alert('Nombre requerido', 'El nombre del cliente no puede estar vacío.');
        return;
      }

      const clienteCreado = await crearCliente(nuevoCliente);
      if (!clienteCreado) return;

      setClienteSeleccionado(clienteCreado);
      setNuevoCliente({
        nombre: '',
        documento: '',
        telefono: '',
        email: '',
        direccion: '',
        ciudad: '',
        departamento: '',
      });
      setModalClienteVisible(false);
    } catch (error) {
      console.error('Error al crear cliente:', error);
    }
  };

  const renderClienteSeleccionado = () => {
    if (!clienteSeleccionado) {
      return (
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => setModalClienteVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={18} color={colors.white} />
          <Text style={styles.selectionButtonText}>Agregar o seleccionar cliente</Text>
        </TouchableOpacity>
      );
    }

  return (
      <View style={styles.selectedCard}>
        <View style={styles.selectedHeader}>
          <View style={styles.selectedAvatar}>
            <Text style={styles.selectedAvatarText}>
              {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{clienteSeleccionado.nombre}</Text>
            {clienteSeleccionado.documento ? (
              <Text style={styles.selectedMeta}>{clienteSeleccionado.documento}</Text>
            ) : null}
            {clienteSeleccionado.ciudad ? (
              <Text style={styles.selectedMeta}>{clienteSeleccionado.ciudad}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.selectedAction}
            onPress={() => setClienteSeleccionado(null)}
          >
            <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
            <Text style={styles.selectedActionText}>Cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
    );
  };

  const renderItemsFactura = () => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyItems}>
          <Ionicons name="cube-outline" size={40} color={colors.lightGray} />
          <Text style={styles.emptyItemsTitle}>No hay productos agregados</Text>
          <Text style={styles.emptyItemsSubtitle}>
            Selecciona un lote completo o unidades individuales para facturar.
                  </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setModalProductoVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Agregar producto</Text>
          </TouchableOpacity>
                </View>
      );
    }

    return items.map((item) => (
      <View key={item.id} style={styles.itemRow}>
        <View style={styles.itemRowHeader}>
          <View style={styles.itemRowBadge}>
            <Text style={styles.itemRowBadgeText}>
              {item.producto.tipo === TipoProducto.LOTE_COMPLETO ? 'Lote completo' : 'Unidades'}
                  </Text>
          </View>
                  <TouchableOpacity onPress={() => eliminarItem(item.id)}>
            <Ionicons name="trash" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
        <Text style={styles.itemRowName}>{item.producto.nombre}</Text>
        <Text style={styles.itemRowMeta}>{getTipoProductoLabel(item.producto.tipo)}</Text>
        <View style={styles.itemRowFooter}>
          <View style={styles.itemQuantityContainer}>
            <TouchableOpacity
              onPress={() => actualizarCantidad(item.id, item.cantidad - 1)}
              disabled={item.cantidad <= 1}
              style={[styles.quantityButton, item.cantidad <= 1 && styles.quantityButtonDisabled]}
            >
              <Ionicons 
                name="remove-circle" 
                size={20} 
                color={item.cantidad <= 1 ? colors.lightGray : colors.primary} 
              />
            </TouchableOpacity>
            <Text style={styles.itemQuantity}>{item.cantidad}</Text>
            <TouchableOpacity
              onPress={() => actualizarCantidad(item.id, item.cantidad + 1)}
              disabled={item.cantidad >= item.producto.disponible}
              style={[styles.quantityButton, item.cantidad >= item.producto.disponible && styles.quantityButtonDisabled]}
            >
              <Ionicons 
                name="add-circle" 
                size={20} 
                color={item.cantidad >= item.producto.disponible ? colors.lightGray : colors.primary} 
              />
            </TouchableOpacity>
          </View>
          <View style={styles.itemRowRight}>
            <Text style={styles.itemRowTotal}>{formatearMoneda(item.total)}</Text>
            <Text style={styles.itemRowSubtotal}>
              {formatearMoneda(item.precioUnitario)} × {item.cantidad}
            </Text>
          </View>
        </View>
      </View>
    ));
  };

  const productosPorTipo = useMemo(() => {
    return productos.reduce(
      (acumulado, producto) => {
        if (producto.tipo === TipoProducto.LOTE_COMPLETO) {
          acumulado.lotes.push(producto);
        } else {
          acumulado.unidades.push(producto);
        }
        return acumulado;
      },
      { lotes: [] as Producto[], unidades: [] as Producto[] }
    );
  }, [productos]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={[styles.sectionCard, styles.heroCard]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Registro de venta</Text>
              <Text style={styles.heroTitle}>Nueva factura</Text>
            </View>
          <TouchableOpacity 
              style={styles.heroAction}
              onPress={limpiarFormulario}
              activeOpacity={0.8}
          >
              <Ionicons name="refresh" size={16} color={colors.white} />
              <Text style={styles.heroActionText}>Limpiar</Text>
          </TouchableOpacity>
          </View>
          <View style={styles.heroSummary}>
            <View style={styles.heroSummaryItem}>
              <Text style={styles.heroSummaryLabel}>Cliente</Text>
              <Text style={styles.heroSummaryValue}>
                {clienteSeleccionado ? clienteSeleccionado.nombre.split(' ')[0] : 'Sin asignar'}
              </Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroSummaryItem}>
              <Text style={styles.heroSummaryLabel}>Items</Text>
              <Text style={styles.heroSummaryValue}>{items.length}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroSummaryItem}>
              <Text style={styles.heroSummaryLabel}>Total estimado</Text>
              <Text style={styles.heroSummaryValue}>{formatearMoneda(resumenTotales.total)}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <TouchableOpacity onPress={() => setModalClienteVisible(true)}>
              <Text style={styles.sectionAction}>Gestionar clientes</Text>
            </TouchableOpacity>
          </View>
          {renderClienteSeleccionado()}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lotes y aves</Text>
            <TouchableOpacity onPress={() => setModalProductoVisible(true)}>
              <Text style={styles.sectionAction}>Ver inventario</Text>
            </TouchableOpacity>
          </View>
          {renderItemsFactura()}
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Método de pago</Text>
            <TouchableOpacity onPress={() => setModalMetodoPagoVisible(true)}>
              <Text style={styles.sectionAction}>Cambiar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metodoPagoCard}>
            <Text style={styles.metodoPagoName}>{METODO_PAGO_MAP[metodoPago].label}</Text>
            <Text style={styles.metodoPagoHelper}>{METODO_PAGO_MAP[metodoPago].helper}</Text>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Observaciones</Text>
          <TextInput
            style={styles.observacionesInput}
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Notas internas, condiciones de entrega o aclaraciones para el cliente"
            multiline
            numberOfLines={4}
          />
        </Card>

        {items.length > 0 && (
          <Card style={[styles.sectionCard, styles.resumenCard]}>
            <Text style={styles.sectionTitle}>Resumen de totales</Text>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Subtotal</Text>
              <Text style={styles.resumenValue}>{formatearMoneda(resumenTotales.subtotal)}</Text>
              </View>
            {resumenTotales.descuentoTotal > 0 ? (
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Descuento</Text>
                <Text style={styles.resumenValue}>-{formatearMoneda(resumenTotales.descuentoTotal)}</Text>
                </View>
            ) : null}
            <View style={styles.resumenDivider} />
            <View style={styles.resumenRow}>
              <Text style={styles.resumenTotalLabel}>Total a facturar</Text>
              <Text style={styles.resumenTotalValue}>{formatearMoneda(resumenTotales.total)}</Text>
            </View>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={loading ? 'Guardando...' : 'Crear factura'}
          onPress={guardarFactura}
          disabled={loading || !clienteSeleccionado || items.length === 0}
          style={styles.footerButton}
        />
      </View>

      <GestionClientesModal
        visible={modalClienteVisible}
        clientes={clientesFiltrados}
        busqueda={busquedaCliente}
        setBusqueda={setBusquedaCliente}
        nuevoCliente={nuevoCliente}
        setNuevoCliente={setNuevoCliente}
        onClose={() => setModalClienteVisible(false)}
        onCreate={crearClienteDesdeModal}
        onSelect={(cliente) => {
          setClienteSeleccionado(cliente);
          setModalClienteVisible(false);
        }}
      />

      <GestionInventarioSheet
        visible={modalProductoVisible}
        onClose={() => setModalProductoVisible(false)}
        productosLotes={productosPorTipo.lotes}
        productosUnidades={productosPorTipo.unidades}
        tabActivo={tabActivo}
        onChangeTab={setTabActivo}
        busqueda={busquedaInventario}
        onBuscar={setBusquedaInventario}
        productoSeleccionado={productoSeleccionado}
        onSeleccionarProducto={setProductoSeleccionado}
        cantidad={cantidadSeleccionada}
        onCambiarCantidad={setCantidadSeleccionada}
        onConfirmar={agregarProducto}
        onRefresh={actualizarProductos}
      />

      <Modal visible={modalMetodoPagoVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.metodoModalCard}>
            <View style={styles.metodoModalHeader}>
              <Text style={styles.metodoModalTitle}>Selecciona método de pago</Text>
              <TouchableOpacity onPress={() => setModalMetodoPagoVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            {Object.values(MetodoPago).map((metodo) => (
              <TouchableOpacity
                key={metodo}
                style={[styles.metodoOption, metodoPago === metodo && styles.metodoOptionActive]}
                onPress={() => {
                  setMetodoPago(metodo);
                  setModalMetodoPagoVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.metodoOptionText,
                    metodoPago === metodo && styles.metodoOptionTextActive,
                  ]}
                >
                  {METODO_PAGO_MAP[metodo].label}
                </Text>
                <Ionicons
                  name={metodoPago === metodo ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={metodoPago === metodo ? colors.primary : colors.lightGray}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface GestionClientesModalProps {
  visible: boolean;
  clientes: Cliente[];
  busqueda: string;
  setBusqueda: (value: string) => void;
  nuevoCliente: CrearCliente;
  setNuevoCliente: React.Dispatch<React.SetStateAction<CrearCliente>>;
  onClose: () => void;
  onCreate: () => void;
  onSelect: (cliente: Cliente) => void;
}

function GestionClientesModal({
  visible,
  clientes,
  busqueda,
  setBusqueda,
  nuevoCliente,
  setNuevoCliente,
  onClose,
  onCreate,
  onSelect,
}: GestionClientesModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 60}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gestionar clientes</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Sección de búsqueda - siempre visible */}
            <Card style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Buscar existente</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={colors.lightGray} />
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar por nombre, documento o ciudad"
                  placeholderTextColor={colors.lightGray}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {busqueda ? (
                  <TouchableOpacity onPress={() => setBusqueda('')}>
                    <Ionicons name="close-circle" size={16} color={colors.lightGray} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {clientes.length === 0 ? (
                <Text style={styles.emptyStateText}>No se encontraron clientes con ese filtro.</Text>
              ) : (
                <ScrollView
                  style={[styles.listContainer, { maxHeight: 200 }]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {clientes.map((cliente) => (
                    <TouchableOpacity
                      key={cliente.id}
                      style={styles.listItem}
                      onPress={() => onSelect(cliente)}
                    >
                      <View style={styles.listAvatar}>
                        <Text style={styles.listAvatarText}>{cliente.nombre.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle}>{cliente.nombre}</Text>
                        <Text style={styles.listSubtitle}>
                          {cliente.documento || 'Sin documento'} · {cliente.ciudad || 'Sin ciudad'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.lightGray} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </Card>

            {/* Sección de formulario - con scroll independiente */}
            <ScrollView
              style={styles.formScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Card style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Crear nuevo cliente</Text>

                <Input
                  label="Nombre *"
                  value={nuevoCliente.nombre}
                  onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, nombre: text }))}
                  placeholder="Nombre completo"
                  returnKeyType="next"
                />

                <View style={styles.rowInputs}>
                  <Input
                    label="Documento"
                    value={nuevoCliente.documento}
                    onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, documento: text }))}
                    placeholder="Cédula o NIT"
                    containerStyle={styles.rowInput}
                    returnKeyType="next"
                  />
                  <Input
                    label="Teléfono"
                    value={nuevoCliente.telefono}
                    onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, telefono: text }))}
                    placeholder="Teléfono"
                    containerStyle={styles.rowInput}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                  />
                </View>

                <Input
                  label="Email"
                  value={nuevoCliente.email}
                  onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, email: text }))}
                  placeholder="Correo electrónico"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <Input
                  label="Dirección"
                  value={nuevoCliente.direccion}
                  onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, direccion: text }))}
                  placeholder="Dirección"
                  returnKeyType="next"
                />

                <View style={styles.rowInputs}>
                  <Input
                    label="Ciudad"
                    value={nuevoCliente.ciudad}
                    onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, ciudad: text }))}
                    placeholder="Ciudad"
                    containerStyle={styles.rowInput}
                    returnKeyType="next"
                  />
                  <Input
                    label="Departamento"
                    value={nuevoCliente.departamento}
                    onChangeText={(text) => setNuevoCliente((prev) => ({ ...prev, departamento: text }))}
                    placeholder="Departamento"
                    containerStyle={styles.rowInput}
                    returnKeyType="done"
                  />
                </View>
              </Card>
            </ScrollView>
          </View>

          {/* Botón flotante - siempre visible */}
          <View style={styles.floatingButton}>
            <Button
              title="Crear Cliente"
              onPress={onCreate}
              style={styles.createButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface GestionInventarioSheetProps {
  visible: boolean;
  onClose: () => void;
  productosLotes: Producto[];
  productosUnidades: Producto[];
  tabActivo: 'LOTES' | 'AVES' | 'HISTORICO';
  onChangeTab: (tab: 'LOTES' | 'AVES' | 'HISTORICO') => void;
  busqueda: string;
  onBuscar: (valor: string) => void;
  productoSeleccionado: Producto | null;
  onSeleccionarProducto: (producto: Producto | null) => void;
  cantidad: string;
  onCambiarCantidad: (valor: string) => void;
  onConfirmar: (producto: Producto, cantidad: number) => void;
  onRefresh: () => void;
}

function GestionInventarioSheet({
  visible,
  onClose,
  productosLotes,
  productosUnidades,
  tabActivo,
  onChangeTab,
  busqueda,
  onBuscar,
  productoSeleccionado,
  onSeleccionarProducto,
  cantidad,
  onCambiarCantidad,
  onConfirmar,
  onRefresh,
}: GestionInventarioSheetProps) {
  const filtrarProductos = (lista: Producto[]) => {
    const termino = busqueda.toLowerCase();
    return lista.filter((producto) =>
      [producto.nombre, producto.descripcion]
        .filter(Boolean)
        .some((valor) => valor!.toLowerCase().includes(termino))
    );
  };

  const lotesDisponibles = productosLotes.length;
  const avesDisponibles = productosUnidades.reduce(
    (acumulado, producto) => acumulado + producto.disponible,
    0
  );

  const confirmarSeleccion = () => {
    if (!productoSeleccionado) return;
    
    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Cantidad inválida', 'Introduce una cantidad mayor a cero.');
      return;
    }
    
    if (cantidadNum > productoSeleccionado.disponible) {
      Alert.alert(
        'Cantidad excede inventario', 
        `Solo hay ${productoSeleccionado.disponible} ${productoSeleccionado.unidadMedida} disponibles.`
      );
      return;
    }
    
    console.log('✅ Confirmando selección:', {
      producto: productoSeleccionado.nombre,
      cantidad: cantidadNum,
      disponible: productoSeleccionado.disponible
    });
    
    onConfirmar(productoSeleccionado, cantidadNum);
    onSeleccionarProducto(null);
    onCambiarCantidad('1');
    onClose();
  };

  const handleSeleccionProducto = (producto: Producto) => {
    onSeleccionarProducto(producto);
    onCambiarCantidad(producto.tipo === TipoProducto.LOTE_COMPLETO ? '1' : '1');
  };

  const aveMeta: Record<string, { label: string; color: string }> = {
    [TipoAve.PONEDORA]: { label: 'Gallinas ponedoras', color: colors.ponedoras },
    [TipoAve.POLLO_LEVANTE]: { label: 'Pollos levante', color: colors.secondary },
    [TipoAve.POLLO_ENGORDE]: { label: 'Pollos engorde', color: colors.engorde },
  };

  const renderLista = (productos: Producto[], emptyMessage: string) => {
    const productosFiltrados = filtrarProductos(productos);

    if (productosFiltrados.length === 0) {
      return <Text style={styles.emptyStateText}>{emptyMessage}</Text>;
    }

  return (
      <View style={styles.sheetGrid}>
        {productosFiltrados.map((producto) => {
          const meta = producto.tipoAve ? aveMeta[producto.tipoAve] : undefined;
          const seleccionado = productoSeleccionado?.id === producto.id;

          return (
            <TouchableOpacity
              key={producto.id}
              style={[styles.sheetCard, seleccionado && styles.sheetCardSelected]}
              onPress={() => handleSeleccionProducto(producto)}
              activeOpacity={0.9}
            >
              <View style={styles.sheetCardHeader}>
                <View
              style={[
                    styles.sheetBadge,
                    meta && { backgroundColor: `${meta.color}22` },
                  ]}
                >
                  <Ionicons
                    name={producto.tipo === TipoProducto.LOTE_COMPLETO ? 'cube-outline' : 'paw-outline'}
                    size={14}
                    color={meta ? meta.color : colors.primary}
                  />
                  <Text
                    style={[
                      styles.sheetBadgeText,
                      meta && { color: meta.color },
                    ]}
                  >
                    {producto.tipo === TipoProducto.LOTE_COMPLETO ? 'Lote completo' : 'Aves'}
                </Text>
                </View>
                <Ionicons
                  name={seleccionado ? 'checkmark-circle' : 'chevron-forward'}
                  size={18}
                  color={seleccionado ? colors.success : colors.lightGray}
                />
              </View>

              <Text style={styles.sheetCardTitle}>{producto.nombre}</Text>

              <Text style={styles.sheetCardMeta}>
                {meta ? meta.label : 'Tipo de ave no registrado'}
              </Text>

              <View style={styles.sheetCardFooter}>
                <View style={styles.sheetCounter}>
                  <Text style={styles.sheetCounterLabel}>Disponible</Text>
                  <Text style={styles.sheetCounterValue}>
                    {producto.disponible} {producto.unidadMedida}
                  </Text>
                </View>
                <View style={styles.sheetPrice}>
                  <Text style={styles.sheetPriceLabel}>
                    {producto.tipo === TipoProducto.LOTE_COMPLETO ? 'Precio total' : 'Precio unitario'}
                  </Text>
                  <Text style={styles.sheetPriceValue}>
                    {formatearMoneda(producto.precioUnitario)}
                  </Text>
                  {producto.tipo === TipoProducto.LOTE_COMPLETO && 'cantidadTotal' in producto && (
                    <Text style={styles.sheetPriceSubtext}>
                      {formatearMoneda(Math.round(producto.precioUnitario / producto.cantidadTotal))} por unidad
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Inventario disponible</Text>
              <Text style={styles.sheetSubtitle}>
                {tabActivo === 'LOTES'
                  ? 'Selecciona un lote completo para facturarlo'
                  : tabActivo === 'AVES'
                  ? 'Vende aves por unidad según disponibilidad'
                  : 'Tus selecciones frecuentes aparecerán aquí'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabBar}>
            {(
              [
                { id: 'LOTES', label: 'Lotes completos' },
                { id: 'AVES', label: 'Aves por unidad' },
                { id: 'HISTORICO', label: 'Últimas selecciones' },
              ] as const
            ).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tabButton, tabActivo === item.id && styles.tabButtonActive]}
                onPress={() => {
                  onChangeTab(item.id);
                  onBuscar('');
                  onSeleccionarProducto(null);
                }}
              >
                <Text
                  style={[styles.tabButtonText, tabActivo === item.id && styles.tabButtonTextActive]}
                >
                  {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          </View>

          <View style={styles.sheetStatsRow}>
            <View style={styles.sheetStatCard}>
              <Text style={styles.sheetStatLabel}>Lotes activos</Text>
              <Text style={styles.sheetStatValue}>{lotesDisponibles}</Text>
            </View>
            <View style={styles.sheetStatCard}>
              <Text style={styles.sheetStatLabel}>Aves disponibles</Text>
              <Text style={styles.sheetStatValue}>{avesDisponibles}</Text>
            </View>
          </View>

          <View style={styles.sheetSearchBar}>
            <Ionicons name="search" size={16} color={colors.lightGray} />
            <TextInput
              value={busqueda}
              onChangeText={onBuscar}
              placeholder="Buscar por nombre o descripción"
              placeholderTextColor={colors.lightGray}
              style={styles.sheetSearchInput}
            />
            {busqueda ? (
              <TouchableOpacity onPress={() => onBuscar('')}>
                <Ionicons name="close-circle" size={16} color={colors.lightGray} />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <Card style={styles.modalSection}>
              {tabActivo === 'LOTES' &&
                renderLista(productosLotes, 'No hay lotes disponibles con el filtro actual.')}
              {tabActivo === 'AVES' &&
                renderLista(
                  productosUnidades,
                  'No hay aves disponibles con el filtro actual.'
                )}
              {tabActivo === 'HISTORICO' && (
                <View style={styles.sheetEmptyHistoric}>
                  <Ionicons name="time-outline" size={28} color={colors.lightGray} />
                  <Text style={styles.emptyStateText}>
                    Próximamente podrás ver tus selecciones recientes aquí.
                  </Text>
                </View>
              )}
            </Card>

            {productoSeleccionado && (
              <Card style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Agregar a factura</Text>
                <Text style={styles.selectedProductName}>{productoSeleccionado.nombre}</Text>
                <Text style={styles.selectedProductMeta}>
                  Disponible: {productoSeleccionado.disponible} {productoSeleccionado.unidadMedida}
                </Text>
                <View style={styles.quantityPicker}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const valorActual = parseInt(cantidad, 10) || 1;
                      const valor = Math.max(1, valorActual - 1);
                      onCambiarCantidad(String(valor));
                    }}
                  >
                    <Ionicons name="remove" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  
                  <View style={styles.quantityInputContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={cantidad}
                      onChangeText={(text) => {
                        // Solo permitir números
                        const numericValue = text.replace(/[^0-9]/g, '');
                        if (numericValue === '' || parseInt(numericValue, 10) > 0) {
                          onCambiarCantidad(numericValue);
                        }
                      }}
                      keyboardType="numeric"
                      selectTextOnFocus
                      placeholder="1"
                      placeholderTextColor={colors.lightGray}
                      maxLength={6} // Máximo 999,999 unidades
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => {
                      const valorActual = parseInt(cantidad, 10) || 1;
                      const valor = Math.min(productoSeleccionado.disponible, valorActual + 1);
                      onCambiarCantidad(String(valor));
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                <Button title="Agregar" onPress={confirmarSeleccion} fullWidth />
              </Card>
            )}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Button title="Actualizar inventario" onPress={onRefresh} variant="outline" fullWidth />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getTipoProductoLabel = (tipo: TipoProducto): string => {
  switch (tipo) {
    case TipoProducto.LOTE_COMPLETO:
      return 'Lote Completo';
    case TipoProducto.UNIDADES_GALLINAS_PONEDORAS:
      return 'Gallinas Ponedoras';
    case TipoProducto.UNIDADES_POLLOS_LEVANTE:
      return 'Pollos Levante';
    case TipoProducto.UNIDADES_POLLOS_ENGORDE:
      return 'Pollos Engorde';
    case TipoProducto.HUEVOS:
      return 'Huevos';
    default:
      return tipo;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  heroCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
  },
  heroLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  heroActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  heroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: colors.veryLightGray,
  },
  heroSummaryItem: {
    alignItems: 'center',
  },
  heroSummaryLabel: {
    fontSize: 12,
    color: colors.lightGray,
  },
  heroSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionAction: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  selectedCard: {
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedAvatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedMeta: {
    fontSize: 14,
    color: colors.lightGray,
    marginTop: 2,
  },
  selectedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  selectedActionText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyItemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
  },
  emptyItemsSubtitle: {
    fontSize: 14,
    color: colors.lightGray,
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  itemRow: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemRowBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRowBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  itemRowName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  itemRowMeta: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 8,
  },
  itemRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  quantityButton: {
    padding: 4,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 10,
  },
  itemRowRight: {
    alignItems: 'flex-end',
  },
  itemRowTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  itemRowSubtotal: {
    fontSize: 12,
    color: colors.lightGray,
    marginTop: 2,
  },
  metodoPagoCard: {
    padding: 16,
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
  },
  metodoPagoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  metodoPagoHelper: {
    fontSize: 12,
    color: colors.lightGray,
  },
  observacionesInput: {
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  resumenCard: {
    marginTop: 16,
    marginBottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  resumenLabel: {
    fontSize: 16,
    color: colors.text,
  },
  resumenValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  resumenDivider: {
    height: 1,
    backgroundColor: colors.veryLightGray,
    marginVertical: 12,
  },
  resumenTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  resumenTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  footerButton: {
    backgroundColor: colors.success,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  emptyStateText: {
    textAlign: 'center',
    color: colors.lightGray,
    fontStyle: 'italic',
    padding: 20,
  },
  listContainer: {
    marginTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listAvatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  listSubtitle: {
    fontSize: 14,
    color: colors.lightGray,
    marginTop: 2,
  },
  inlineInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inlineInput: {
    flex: 1,
    marginRight: 10,
  },
  metodoModalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  metodoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metodoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  metodoOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  metodoOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  metodoOptionActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  metodoOptionTextActive: {
    color: colors.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 6,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  tabButtonTextActive: {
    color: colors.primary,
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.veryLightGray,
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMedium,
  },
  sheetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  sheetStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sheetStatLabel: {
    fontSize: 12,
    color: colors.lightGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetStatValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  sheetSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  sheetSearchInput: {
    flex: 1,
    marginHorizontal: 8,
    color: colors.text,
  },
  sheetScroll: {
    maxHeight: '60%',
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  sheetCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  sheetCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  sheetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  sheetBadgeText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  sheetCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 6,
  },
  sheetCardMeta: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 12,
  },
  sheetCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sheetCounter: {
    alignItems: 'flex-start',
  },
  sheetCounterLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  sheetCounterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  sheetPrice: {
    alignItems: 'flex-end',
  },
  sheetPriceLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  sheetPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sheetPriceSubtext: {
    fontSize: 11,
    color: colors.textMedium,
    marginTop: 2,
  },
  sheetEmptyHistoric: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  quantityInputContainer: {
    minWidth: 80,
    alignItems: 'center',
  },
  quantityInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    minWidth: 60,
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  sheetFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    backgroundColor: colors.background,
  },

  // Nuevos estilos para el modal mejorado de clientes
  modalContent: {
    flex: 1,
    flexDirection: 'column',
  },
  formScroll: {
    flex: 1,
    paddingBottom: 140, // Más espacio para el botón flotante cuando teclado está abierto
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rowInput: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  createButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});








