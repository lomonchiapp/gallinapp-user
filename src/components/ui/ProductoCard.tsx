/**
 * Componente de tarjeta para mostrar productos disponibles
 * Diseño moderno y profesional para la experiencia de facturación
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { Producto, TipoProducto } from '../../types/facturacion';

interface ProductoCardProps {
  producto: Producto;
  onPress: () => void;
  disabled?: boolean;
}

export const ProductoCard: React.FC<ProductoCardProps> = ({
  producto,
  onPress,
  disabled = false,
}) => {
  const getIcon = () => {
    switch (producto.tipoAve) {
      case 'PONEDORA':
        return 'egg-outline';
      case 'POLLO_LEVANTE':
        return 'trending-up-outline';
      case 'POLLO_ENGORDE':
        return 'fast-food-outline';
      default:
        return 'cube-outline';
    }
  };

  const getColor = () => {
    switch (producto.tipoAve) {
      case 'PONEDORA':
        return colors.ponedoras;
      case 'POLLO_LEVANTE':
        return colors.secondary;
      case 'POLLO_ENGORDE':
        return colors.engorde;
      default:
        return colors.primary;
    }
  };

  const getTipoLabel = () => {
    if (producto.tipo === TipoProducto.LOTE_COMPLETO) {
      return 'Lote completo';
    }
    return 'Por unidad';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const color = getColor();
  const icon = getIcon();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        disabled && styles.cardDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color }]}>{getTipoLabel()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {producto.nombre}
        </Text>
        
        {producto.descripcion && (
          <Text style={styles.description} numberOfLines={2}>
            {producto.descripcion}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color={colors.mediumGray} />
            <Text style={styles.detailText}>{formatPrice(producto.precioUnitario)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="layers-outline" size={14} color={colors.mediumGray} />
            <Text style={styles.detailText}>{producto.disponible} {producto.unidadMedida}</Text>
          </View>
        </View>

        {producto.disponible === 0 && (
          <View style={styles.outOfStock}>
            <Ionicons name="close-circle" size={16} color={colors.error} />
            <Text style={styles.outOfStockText}>Agotado</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: colors.veryLightGray,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.veryLightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: colors.mediumGray,
    lineHeight: 18,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.mediumGray,
    fontWeight: '500',
  },
  outOfStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  outOfStockText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
});







