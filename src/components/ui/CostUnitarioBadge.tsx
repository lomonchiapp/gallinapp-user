/**
 * Componente Badge para mostrar el costo de producción unitario (CPU) en pesos dominicanos (RD$)
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import CostUnitarioModal from './CostUnitarioModal';

interface CostUnitarioBadgeProps {
  costoTotal: number;
  cantidadInicial: number; // Cambiado de cantidadActual a cantidadInicial
  loteId: string;
  tipoLote: string;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  cantidadActual?: number; // Opcional para mostrar en el modal
}

export default function CostUnitarioBadge({
  costoTotal,
  cantidadInicial,
  loteId,
  tipoLote,
  showIcon = true,
  size = 'medium',
  style,
  cantidadActual
}: CostUnitarioBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Calcular costo unitario usando cantidadInicial (no debe cambiar al vender aves)
  const costoUnitario = cantidadInicial > 0 ? costoTotal / cantidadInicial : 0;

  // Formatear el precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          text: { fontSize: 12 },
          icon: 12
        };
      case 'large':
        return {
          container: { paddingHorizontal: 16, paddingVertical: 8 },
          text: { fontSize: 16 },
          icon: 16
        };
      default: // medium
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6 },
          text: { fontSize: 14 },
          icon: 14
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <>
      <TouchableOpacity
        style={[styles.container, sizeStyles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.gpuLabel, sizeStyles.text]}>
          CPU
        </Text>
        <Text style={[styles.text, sizeStyles.text, { color: colors.primary }]}>
          {formatPrice(costoUnitario)}
        </Text>
        {showIcon && (
          <Ionicons
            name="information-circle-outline"
            size={sizeStyles.icon}
            color={colors.primary}
            style={styles.icon}
          />
        )}
      </TouchableOpacity>

      <CostUnitarioModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loteId={loteId}
        tipoLote={tipoLote}
        costoTotal={costoTotal}
        cantidadInicial={cantidadInicial}
        cantidadActual={cantidadActual}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15', // Fondo con opacidad
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    alignSelf: 'flex-start',
  },
  gpuLabel: {
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  icon: {
    marginLeft: 4,
  },
  text: {
    fontWeight: '600',
    color: colors.primary,
  },
});
