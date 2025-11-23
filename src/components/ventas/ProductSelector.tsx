/**
 * ProductSelector - Selector de productos inteligente
 * 
 * Características:
 * - Búsqueda en tiempo real
 * - Filtrado por categorías
 * - Vista optimizada por tipo de producto
 * - Selección con validación automática
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
  Modal,
  Alert,
} from 'react-native';
import { colors } from '../../constants/colors';
import { Producto, TipoProducto, ProductoHuevos } from '../../types/facturacion';
import { TipoAve } from '../../types/enums';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ProductSelectorProps {
  productos: Producto[];
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (producto: Producto, cantidad: number) => void;
  isLoading?: boolean;
}

type TabType = 'LOTES' | 'AVES' | 'HUEVOS';

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  productos,
  visible,
  onClose,
  onSelectProduct,
  isLoading = false,
}) => {
  const [tabActivo, setTabActivo] = useState<TabType>('LOTES');
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('1');

  // Agrupar productos por tipo
  const productosPorTipo = useMemo(() => {
    const filtered = busqueda 
      ? productos.filter(p => 
          p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
        )
      : productos;

    return {
      lotes: filtered.filter(p => p.tipo === TipoProducto.LOTE_COMPLETO),
      aves: filtered.filter(p => 
        p.tipo !== TipoProducto.LOTE_COMPLETO && p.tipo !== TipoProducto.HUEVOS
      ),
      huevos: filtered.filter(p => p.tipo === TipoProducto.HUEVOS),
    };
  }, [productos, busqueda]);

  const productosActivos = useMemo(() => {
    switch (tabActivo) {
      case 'LOTES': return productosPorTipo.lotes;
      case 'AVES': return productosPorTipo.aves;
      case 'HUEVOS': return productosPorTipo.huevos;
      default: return [];
    }
  }, [productosPorTipo, tabActivo]);

  const handleConfirmarSeleccion = () => {
    if (!productoSeleccionado) {
      Alert.alert('Error', 'Selecciona un producto');
      return;
    }

    const cantidadNum = parseInt(cantidad, 10);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    if (cantidadNum > productoSeleccionado.disponible) {
      Alert.alert(
        'Stock Insuficiente',
        `Solo hay ${productoSeleccionado.disponible} unidades disponibles`
      );
      return;
    }

    onSelectProduct(productoSeleccionado, cantidadNum);
    handleClose();
  };

  const handleClose = () => {
    setProductoSeleccionado(null);
    setCantidad('1');
    setBusqueda('');
    onClose();
  };

  const getTipoAveIcon = (tipoAve: TipoAve) => {
    switch (tipoAve) {
      case TipoAve.PONEDORA: return 'egg-outline';
      case TipoAve.POLLO_LEVANTE: return 'arrow-up-outline';
      case TipoAve.POLLO_ENGORDE: return 'fitness-outline';
      default: return 'paw-outline';
    }
  };

  const getTipoAveColor = (tipoAve: TipoAve) => {
    switch (tipoAve) {
      case TipoAve.PONEDORA: return colors.warning;
      case TipoAve.POLLO_LEVANTE: return colors.info;
      case TipoAve.POLLO_ENGORDE: return colors.success;
      default: return colors.primary;
    }
  };

  const renderProductoCard = (producto: Producto) => {
    const isSelected = productoSeleccionado?.id === producto.id;
    const tipoColor = getTipoAveColor(producto.tipoAve);
    
    return (
      <TouchableOpacity
        key={producto.id}
        style={[
          styles.productoCard,
          isSelected && { borderColor: colors.primary, borderWidth: 2 }
        ]}
        onPress={() => setProductoSeleccionado(producto)}
      >
        <View style={styles.productoHeader}>
          <View style={styles.productoTipo}>
            <Ionicons
              name={producto.tipo === TipoProducto.HUEVOS ? 'egg-outline' : getTipoAveIcon(producto.tipoAve)}
              size={16}
              color={tipoColor}
            />
            <Text style={[styles.productoTipoText, { color: tipoColor }]}>
              {producto.tipo === TipoProducto.LOTE_COMPLETO ? 'Lote Completo' :
               producto.tipo === TipoProducto.HUEVOS ? 'Huevos' : 'Unidades'}
            </Text>
          </View>
          <Text style={styles.productoDisponible}>
            {producto.disponible} {producto.unidadMedida}
          </Text>
        </View>
        
        <Text style={styles.productoNombre}>{producto.nombre}</Text>
        {producto.descripcion && (
          <Text style={styles.productoDescripcion}>{producto.descripcion}</Text>
        )}
        
        <View style={styles.productoPrecio}>
          <Text style={styles.precioText}>
            RD${producto.precioUnitario.toFixed(2)} / {producto.unidadMedida}
          </Text>
          {producto.tipo === TipoProducto.HUEVOS && (
            <Text style={styles.unidadVentaText}>
              {(producto as ProductoHuevos).unidadVenta}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabButton = (tab: TabType, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        tabActivo === tab && styles.tabButtonActive
      ]}
      onPress={() => setTabActivo(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        tabActivo === tab && styles.tabButtonTextActive
      ]}>
        {label}
      </Text>
      <View style={[
        styles.tabBadge,
        tabActivo === tab && styles.tabBadgeActive
      ]}>
        <Text style={[
          styles.tabBadgeText,
          tabActivo === tab && styles.tabBadgeTextActive
        ]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Seleccionar Producto</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMedium} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={busqueda}
            onChangeText={setBusqueda}
            placeholderTextColor={colors.textMedium}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {renderTabButton('LOTES', 'Lotes', productosPorTipo.lotes.length)}
          {renderTabButton('AVES', 'Aves', productosPorTipo.aves.length)}
          {renderTabButton('HUEVOS', 'Huevos', productosPorTipo.huevos.length)}
        </View>

        {/* Lista de productos */}
        <ScrollView style={styles.productsList} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
          ) : productosActivos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={colors.textMedium} />
              <Text style={styles.emptyText}>
                No hay productos disponibles{busqueda ? ' para tu búsqueda' : ''}
              </Text>
              {busqueda && (
                <TouchableOpacity onPress={() => setBusqueda('')}>
                  <Text style={styles.clearSearchText}>Limpiar búsqueda</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            productosActivos.map(renderProductoCard)
          )}
        </ScrollView>

        {/* Selección y cantidad */}
        {productoSeleccionado && (
          <View style={styles.selectionContainer}>
            <Card style={styles.selectionCard}>
              <Text style={styles.selectionTitle}>Producto Seleccionado</Text>
              <Text style={styles.selectionProduct}>{productoSeleccionado.nombre}</Text>
              
              <View style={styles.cantidadContainer}>
                <Text style={styles.cantidadLabel}>Cantidad:</Text>
                <TextInput
                  style={styles.cantidadInput}
                  value={cantidad}
                  onChangeText={setCantidad}
                  keyboardType="numeric"
                  placeholder="1"
                />
                <Text style={styles.cantidadUnidad}>
                  / {productoSeleccionado.disponible} {productoSeleccionado.unidadMedida}
                </Text>
              </View>
              
              <View style={styles.precioContainer}>
                <Text style={styles.precioLabel}>Total:</Text>
                <Text style={styles.precioTotal}>
                  RD${(productoSeleccionado.precioUnitario * (parseInt(cantidad) || 0)).toFixed(2)}
                </Text>
              </View>
              
              <Button
                title="Agregar al Carrito"
                onPress={handleConfirmarSeleccion}
                style={styles.confirmarButton}
              />
            </Card>
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
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
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
    marginRight: 6,
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tabBadgeActive: {
    backgroundColor: colors.white,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMedium,
  },
  tabBadgeTextActive: {
    color: colors.primary,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  productoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productoTipo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productoTipoText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  productoDisponible: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productoDescripcion: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 8,
  },
  productoPrecio: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precioText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  unidadVentaText: {
    fontSize: 12,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 12,
  },
  clearSearchText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
  },
  selectionContainer: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectionCard: {
    padding: 16,
  },
  selectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
    marginBottom: 4,
  },
  selectionProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  cantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cantidadLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  cantidadInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.white,
    minWidth: 80,
    textAlign: 'center',
  },
  cantidadUnidad: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 8,
  },
  precioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  precioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  precioTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  confirmarButton: {
    backgroundColor: colors.primary,
  },
});




