/**
 * Componente de tarjeta para mostrar facturas
 * Diseño elegante y funcional para el historial de facturas
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import { EstadoFactura, Factura } from '../../types/facturacion';

interface FacturaCardProps {
  factura: Factura;
  onPress: () => void;
}

export const FacturaCard: React.FC<FacturaCardProps> = ({
  factura,
  onPress,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  const getEstadoConfig = (estado: EstadoFactura) => {
    switch (estado) {
      case EstadoFactura.PAGADA:
        return {
          label: 'Pagada',
          color: colors.success,
          backgroundColor: colors.success + '15',
          icon: 'checkmark-circle' as const,
        };
      case EstadoFactura.EMITIDA:
        return {
          label: 'Emitida',
          color: colors.warning,
          backgroundColor: colors.warning + '15',
          icon: 'receipt' as const,
        };
      case EstadoFactura.CANCELADA:
        return {
          label: 'Cancelada',
          color: colors.error,
          backgroundColor: colors.error + '15',
          icon: 'close-circle' as const,
        };
      default:
        return {
          label: 'Borrador',
          color: colors.mediumGray,
          backgroundColor: colors.mediumGray + '15',
          icon: 'document-text' as const,
        };
    }
  };

  const estadoConfig = getEstadoConfig(factura.estado);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <Text style={styles.numero}>{factura.numero}</Text>
          <Text style={styles.cliente}>{factura.cliente.nombre}</Text>
        </View>
        <View style={styles.rightHeader}>
          <Text style={styles.total}>{formatPrice(factura.total)}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: estadoConfig.backgroundColor }]}>
            <Ionicons name={estadoConfig.icon} size={12} color={estadoConfig.color} />
            <Text style={[styles.estadoText, { color: estadoConfig.color }]}>
              {estadoConfig.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.metaInfo}>
          <Ionicons name="calendar-outline" size={14} color={colors.lightGray} />
          <Text style={styles.metaText}>{formatDate(factura.fecha)}</Text>
        </View>
        
        <View style={styles.metaInfo}>
          <Ionicons name="cube-outline" size={14} color={colors.lightGray} />
          <Text style={styles.metaText}>{factura.items.length} producto{factura.items.length !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.metaInfo}>
          <Ionicons name="card-outline" size={14} color={colors.lightGray} />
          <Text style={styles.metaText}>{factura.metodoPago}</Text>
        </View>
      </View>

      {factura.observaciones && (
        <View style={styles.observaciones}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.mediumGray} />
          <Text style={styles.observacionesText} numberOfLines={2}>
            {factura.observaciones}
          </Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftHeader: {
    flex: 1,
    gap: 4,
  },
  numero: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  cliente: {
    fontSize: 14,
    color: colors.mediumGray,
    fontWeight: '500',
  },
  rightHeader: {
    alignItems: 'flex-end',
    gap: 8,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.lightGray,
  },
  observaciones: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  observacionesText: {
    flex: 1,
    fontSize: 12,
    color: colors.mediumGray,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});







