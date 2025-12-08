/**
 * Modal para mostrar detalles del costo de producción por huevo (CPH)
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../constants/colors';
import { formatDate } from '../../utils/dateUtils';

interface CostPorHuevoModalProps {
  visible: boolean;
  onClose: () => void;
  loteId: string;
  tipoLote: string;
  costoTotal: number;
  cantidadHuevos: number;
  cantidadInicial?: number;
  cantidadActual?: number;
  fechaInicio?: Date;
  registrosHuevos?: { fecha: Date; cantidad: number }[];
  gastos?: { fecha: Date; total: number }[]; // Gastos del lote para calcular CPH real por día
}

export default function CostPorHuevoModal({
  visible,
  onClose,
  loteId,
  tipoLote,
  costoTotal,
  cantidadHuevos,
  cantidadInicial,
  cantidadActual,
  fechaInicio,
  registrosHuevos,
  gastos
}: CostPorHuevoModalProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'historial'>('resumen');

  // Formatear el precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // CPH se calcula dividiendo el costo total entre la cantidad de huevos producidos
  const costoPorHuevo = cantidadHuevos > 0 ? costoTotal / cantidadHuevos : 0;

  // Calcular CPU también para referencia
  const costoUnitario = cantidadInicial && cantidadInicial > 0 ? costoTotal / cantidadInicial : 0;

  // Calcular historial diario de CPH usando gastos reales por día
  const historialCPH = useMemo(() => {
    if (!fechaInicio || !registrosHuevos || registrosHuevos.length === 0) return [];

    // Crear un mapa de gastos por fecha (normalizar fechas a medianoche para comparar)
    const gastosPorFecha = new Map<string, number>();
    if (gastos && gastos.length > 0) {
      gastos.forEach(gasto => {
        const fechaKey = new Date(gasto.fecha).toISOString().split('T')[0];
        const totalActual = gastosPorFecha.get(fechaKey) || 0;
        gastosPorFecha.set(fechaKey, totalActual + gasto.total);
      });
    }

    // Calcular CPH para cada día con producción
    return registrosHuevos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()) // Más recientes primero
      .map(registro => {
        const fechaKey = new Date(registro.fecha).toISOString().split('T')[0];
        const gastosDelDia = gastosPorFecha.get(fechaKey) || 0;
        
        // CPH del día = Gastos del día / Huevos producidos ese día
        const cphDia = registro.cantidad > 0 ? gastosDelDia / registro.cantidad : 0;
        
        return {
          fecha: registro.fecha,
          produccion: registro.cantidad,
          gastosDelDia: gastosDelDia,
          cph: cphDia
        };
      });
  }, [fechaInicio, registrosHuevos, gastos]);

  const renderItem = ({ item }: { item: any }) => {
    // Formatear fecha para mostrar de forma más clara (ej: "Hace 3 días" o fecha completa)
    const fechaItem = new Date(item.fecha);
    const ahora = new Date();
    const diasDiferencia = Math.floor((ahora.getTime() - fechaItem.getTime()) / (1000 * 60 * 60 * 24));
    
    let fechaTexto = formatDate(item.fecha);
    if (diasDiferencia === 0) {
      fechaTexto = 'Hoy';
    } else if (diasDiferencia === 1) {
      fechaTexto = 'Ayer';
    } else if (diasDiferencia <= 7) {
      fechaTexto = `Hace ${diasDiferencia} días`;
    }
    
    return (
      <View style={styles.historyRow}>
        <View style={{ flex: 2.5 }}>
          <Text style={styles.historyDate}>{fechaTexto}</Text>
          <Text style={styles.historyDateSmall}>{formatDate(item.fecha)}</Text>
        </View>
        <Text style={[styles.historyProd, { flex: 1, textAlign: 'center' }]}>{item.produccion}</Text>
        <Text style={[styles.historyGastos, { flex: 1.5, textAlign: 'right' }]}>
          {formatPrice(item.gastosDelDia)}
        </Text>
        <Text style={[styles.historyCph, { flex: 2, textAlign: 'right', color: colors.ponedoras }]}>
          {formatPrice(item.cph)}
        </Text>
      </View>
    );
  };

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
            <Text style={styles.title}>Costo de Producción por Huevo</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          {registrosHuevos && registrosHuevos.length > 0 && (
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'resumen' && styles.activeTab]}
                onPress={() => setActiveTab('resumen')}
              >
                <Text style={[styles.tabText, activeTab === 'resumen' && styles.activeTabText]}>Resumen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'historial' && styles.activeTab]}
                onPress={() => setActiveTab('historial')}
              >
                <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>Historial Diario</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.content}>
            {activeTab === 'resumen' ? (
              <View style={styles.summarySection}>
                <Text style={styles.sectionTitle}>Resumen General</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Gasto Total:</Text>
                    <Text style={styles.summaryValue}>{formatPrice(costoTotal)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Huevos Producidos:</Text>
                    <Text style={styles.summaryValue}>{cantidadHuevos.toLocaleString()} huevos</Text>
                  </View>
                  {cantidadInicial !== undefined && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Cantidad Inicial:</Text>
                      <Text style={styles.summaryValue}>{cantidadInicial} aves</Text>
                    </View>
                  )}
                  {cantidadActual !== undefined && cantidadActual !== cantidadInicial && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Cantidad Actual:</Text>
                      <Text style={styles.summaryValue}>{cantidadActual} aves</Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, styles.cphRow]}>
                    <Text style={styles.summaryLabel}>Costo por Huevo (CPH) Promedio:</Text>
                    <Text style={[styles.summaryValue, styles.cphValue]}>
                      {formatPrice(costoPorHuevo)}
                    </Text>
                  </View>
                  {cantidadInicial && cantidadInicial > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Costo Unitario (CPU):</Text>
                      <Text style={styles.summaryValue}>
                        {formatPrice(costoUnitario)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { fontSize: 12, fontStyle: 'italic', color: colors.textMedium }]}>
                      * CPH = Costo Total ÷ Huevos Producidos
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyHeaderLabel, { flex: 2.5 }]}>Fecha</Text>
                  <Text style={[styles.historyHeaderLabel, { flex: 1, textAlign: 'center' }]}>Huevos</Text>
                  <Text style={[styles.historyHeaderLabel, { flex: 1.5, textAlign: 'right' }]}>Gastos</Text>
                  <Text style={[styles.historyHeaderLabel, { flex: 2, textAlign: 'right' }]}>CPH</Text>
                </View>
                {historialCPH.length > 0 ? (
                  <FlatList
                    data={historialCPH}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.fecha.toString()}
                    contentContainerStyle={styles.historyList}
                  />
                ) : (
                  <View style={styles.emptyHistory}>
                    <Text style={styles.emptyHistoryText}>No hay registros de producción disponibles</Text>
                  </View>
                )}
                <View style={styles.footerNote}>
                   <Text style={styles.footerNoteText}>
                    * CPH Diario = Gastos del día ÷ Huevos producidos ese día
                  </Text>
                </View>
              </View>
            )}
          </View>
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
    height: '80%', // Altura fija para mejor scroll
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ponedoras,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  activeTabText: {
    color: colors.ponedoras,
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
  cphRow: {
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    marginTop: 8,
    paddingTop: 12,
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
  cphValue: {
    color: colors.ponedoras,
    fontSize: 16,
    fontWeight: '700',
  },
  // Estilos Historial
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    marginBottom: 8,
  },
  historyHeaderLabel: {
    fontWeight: '600',
    color: colors.textMedium,
    fontSize: 12,
  },
  historyList: {
    paddingBottom: 20,
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray + '50',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  historyDateSmall: {
    fontSize: 11,
    color: colors.textMedium,
    marginTop: 2,
  },
  historyProd: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  historyGastos: {
    fontSize: 13,
    color: colors.textMedium,
  },
  historyCph: {
    flex: 2,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyHistory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  footerNote: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  footerNoteText: {
    fontSize: 10,
    color: colors.textMedium,
    fontStyle: 'italic',
    textAlign: 'center',
  }
});
