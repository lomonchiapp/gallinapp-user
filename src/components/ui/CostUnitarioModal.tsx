/**
 * Modal para mostrar detalles del costo de producción unitario
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../constants/colors';

interface CostUnitarioModalProps {
  visible: boolean;
  onClose: () => void;
  loteId: string;
  tipoLote: string;
  costoTotal: number;
  cantidadInicial: number;
  cantidadActual?: number;
}

export default function CostUnitarioModal({
  visible,
  onClose,
  loteId,
  tipoLote,
  costoTotal,
  cantidadInicial,
  cantidadActual
}: CostUnitarioModalProps) {
  // Formatear el precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // CPU se calcula con cantidadInicial (no debe cambiar al vender aves)
  const costoUnitario = cantidadInicial > 0 ? costoTotal / cantidadInicial : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Costo de Producción Unitario</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Resumen General */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Resumen General</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Gasto Total:</Text>
                  <Text style={styles.summaryValue}>{formatPrice(costoTotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Cantidad Inicial:</Text>
                  <Text style={styles.summaryValue}>{cantidadInicial} aves</Text>
                </View>
                {cantidadActual !== undefined && cantidadActual !== cantidadInicial && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cantidad Actual:</Text>
                    <Text style={styles.summaryValue}>{cantidadActual} aves</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Costo Unitario (CPU):</Text>
                  <Text style={[styles.summaryValue, styles.costUnitario]}>
                    {formatPrice(costoUnitario)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontSize: 12, fontStyle: 'italic', color: colors.textMedium }]}>
                    * CPU se calcula con cantidad inicial y no cambia al vender aves
                  </Text>
                </View>
              </View>
            </View>


          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  costUnitario: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
