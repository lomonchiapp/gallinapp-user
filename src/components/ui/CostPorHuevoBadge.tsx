/**
 * Componente Badge para mostrar el costo de producción por huevo (CPH) en pesos dominicanos (RD$)
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import CostPorHuevoModal from './CostPorHuevoModal';

interface CostPorHuevoBadgeProps {
  costoTotal: number;
  cantidadHuevos: number;
  loteId: string;
  tipoLote: string;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
  cantidadInicial?: number; // Opcional para mostrar en el modal
  cantidadActual?: number; // Opcional para mostrar en el modal
  fechaInicio?: Date; // Para calcular historial
  registrosHuevos?: { fecha: Date; cantidad: number }[]; // Para calcular historial
  gastos?: { fecha: Date; total: number }[]; // Gastos del lote para calcular CPH real por día
}

export default function CostPorHuevoBadge({
  costoTotal,
  cantidadHuevos,
  loteId,
  tipoLote,
  showIcon = true,
  size = 'medium',
  style,
  cantidadInicial,
  cantidadActual,
  fechaInicio,
  registrosHuevos,
  gastos
}: CostPorHuevoBadgeProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Calcular costo por huevo: costo total / cantidad de huevos producidos
  const costoPorHuevo = cantidadHuevos > 0 ? costoTotal / cantidadHuevos : 0;

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
        <Text style={[styles.cphLabel, sizeStyles.text]}>
          CPH
        </Text>
        <Text style={[styles.text, sizeStyles.text, { color: colors.ponedoras }]}>
          {formatPrice(costoPorHuevo)}
        </Text>
        {showIcon && (
          <Ionicons
            name="information-circle-outline"
            size={sizeStyles.icon}
            color={colors.ponedoras}
            style={styles.icon}
          />
        )}
      </TouchableOpacity>

      <CostPorHuevoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loteId={loteId}
        tipoLote={tipoLote}
        costoTotal={costoTotal}
        cantidadHuevos={cantidadHuevos}
        cantidadInicial={cantidadInicial}
        cantidadActual={cantidadActual}
        fechaInicio={fechaInicio}
        registrosHuevos={registrosHuevos}
        gastos={gastos}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ponedoras + '15', // Fondo con opacidad
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ponedoras + '40',
    alignSelf: 'flex-start',
  },
  cphLabel: {
    fontWeight: '700',
    color: colors.ponedoras,
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
    color: colors.ponedoras,
  },
});
