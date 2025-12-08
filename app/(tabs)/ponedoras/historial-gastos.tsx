/**
 * Pantalla para ver, editar y eliminar historial de gastos
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import DatePicker from '../../../src/components/ui/DatePicker';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { actualizarGasto, eliminarGasto, obtenerGastos } from '../../../src/services/gastos.service';
import { Gasto } from '../../../src/types';
import { TipoAve } from '../../../src/types/enums';
import { formatDate } from '../../../src/utils/dateUtils';

export default function HistorialGastosScreen() {
  const { loteId, tipoLote } = useLocalSearchParams<{ loteId: string; tipoLote?: string }>();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
  const [articuloNombreEditando, setArticuloNombreEditando] = useState('');
  const [cantidadEditando, setCantidadEditando] = useState('');
  const [precioUnitarioEditando, setPrecioUnitarioEditando] = useState('');
  const [fechaEditando, setFechaEditando] = useState('');
  const [descripcionEditando, setDescripcionEditando] = useState('');
  const [guardando, setGuardando] = useState(false);

  const tipoLoteEnum = tipoLote ? (tipoLote as TipoAve) : TipoAve.PONEDORA;

  useEffect(() => {
    if (loteId) {
      cargarGastos();
    }
  }, [loteId, tipoLoteEnum]);

  const cargarGastos = async () => {
    if (!loteId) return;
    
    try {
      setLoading(true);
      const datos = await obtenerGastos(loteId, tipoLoteEnum);
      setGastos(datos);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cargar gastos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    cargarGastos();
  };

  const abrirModalEditar = (gasto: Gasto) => {
    setGastoEditando(gasto);
    setArticuloNombreEditando(gasto.articuloNombre || '');
    setCantidadEditando(gasto.cantidad.toString());
    setPrecioUnitarioEditando(gasto.precioUnitario?.toString() || '');
    setFechaEditando(gasto.fecha instanceof Date 
      ? gasto.fecha.toISOString().split('T')[0]
      : new Date(gasto.fecha).toISOString().split('T')[0]
    );
    setDescripcionEditando(gasto.descripcion || '');
    setModalEditarVisible(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setGastoEditando(null);
    setArticuloNombreEditando('');
    setCantidadEditando('');
    setPrecioUnitarioEditando('');
    setFechaEditando('');
    setDescripcionEditando('');
  };

  const handleGuardarEdicion = async () => {
    if (!gastoEditando) return;

    // Validar cantidad
    const cantidadNum = parseFloat(cantidadEditando);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida');
      return;
    }

    // Validar precio unitario
    const precioUnitarioNum = parseFloat(precioUnitarioEditando);
    if (isNaN(precioUnitarioNum) || precioUnitarioNum < 0) {
      Alert.alert('Error', 'Por favor ingrese un precio unitario válido');
      return;
    }

    // Validar fecha
    if (!fechaEditando) {
      Alert.alert('Error', 'Por favor seleccione una fecha');
      return;
    }

    // Validar artículo
    if (!articuloNombreEditando.trim()) {
      Alert.alert('Error', 'Por favor ingrese el nombre del artículo');
      return;
    }

    const total = cantidadNum * precioUnitarioNum;

    try {
      setGuardando(true);
      await actualizarGasto(gastoEditando.id, {
        articuloNombre: articuloNombreEditando.trim(),
        cantidad: cantidadNum,
        precioUnitario: precioUnitarioNum,
        total: total,
        fecha: new Date(fechaEditando),
        descripcion: descripcionEditando.trim() || undefined
      });

      Alert.alert('Éxito', 'Gasto actualizado correctamente', [
        { text: 'OK', onPress: () => {
          cerrarModalEditar();
          cargarGastos();
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar gasto');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (gasto: Gasto) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro de eliminar el gasto de "${gasto.articuloNombre}" del ${formatDate(gasto.fecha)} por ${formatPrice(gasto.total)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarGasto(gasto.id);
              Alert.alert('Éxito', 'Gasto eliminado correctamente', [
                { text: 'OK', onPress: () => cargarGastos() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al eliminar gasto');
            }
          }
        }
      ]
    );
  };

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.total, 0);
  const gastosAdicionales = gastos.filter(gasto => 
    !(gasto.descripcion?.toLowerCase().includes('costo inicial') || 
      gasto.articuloNombre?.toLowerCase().includes('costo inicial'))
  );
  const totalGastosAdicionales = gastosAdicionales.reduce((sum, gasto) => sum + gasto.total, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (loading && gastos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando gastos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Historial de Gastos</Text>
        </View>

        {/* Resumen */}
        <Card style={styles.resumenCard}>
          <View style={styles.resumenContent}>
            <Ionicons name="receipt" size={32} color={colors.danger} />
            <View style={styles.resumenText}>
              <Text style={styles.resumenLabel}>Total de Gastos</Text>
              <Text style={styles.resumenValue}>{formatPrice(totalGastos)}</Text>
            </View>
            <View style={styles.resumenText}>
              <Text style={styles.resumenLabel}>Gastos Adicionales</Text>
              <Text style={styles.resumenValue}>{formatPrice(totalGastosAdicionales)}</Text>
            </View>
            <View style={styles.resumenText}>
              <Text style={styles.resumenLabel}>Total de Registros</Text>
              <Text style={styles.resumenValue}>{gastos.length}</Text>
            </View>
          </View>
        </Card>

        {/* Lista de gastos */}
        {gastos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={64} color={colors.textMedium} />
            <Text style={styles.emptyText}>No hay gastos registrados</Text>
          </Card>
        ) : (
          gastos.map((gasto) => {
            const fechaGasto = gasto.fecha instanceof Date 
              ? gasto.fecha 
              : new Date(gasto.fecha);
            const diasAtras = Math.floor(
              (new Date().getTime() - fechaGasto.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={gasto.id} style={styles.gastoCard}>
                <View style={styles.gastoHeader}>
                  <View style={styles.gastoInfo}>
                    <View style={styles.gastoConceptoContainer}>
                      <Ionicons name="cube" size={20} color={colors.danger} />
                      <Text style={styles.gastoConcepto}>{gasto.articuloNombre}</Text>
                    </View>
                    <View style={styles.gastoFechaContainer}>
                      <Ionicons name="calendar" size={16} color={colors.textMedium} />
                      <Text style={styles.gastoFecha}>
                        {diasAtras === 0 
                          ? 'Hoy' 
                          : diasAtras === 1 
                          ? 'Ayer' 
                          : `Hace ${diasAtras} días`} - {formatDate(fechaGasto)}
                      </Text>
                    </View>
                    <View style={styles.gastoDetallesContainer}>
                      <Text style={styles.gastoDetalle}>
                        {gasto.cantidad} × {formatPrice(gasto.precioUnitario || 0)} = {formatPrice(gasto.total)}
                      </Text>
                    </View>
                    {gasto.descripcion && (
                      <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.gastoActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => abrirModalEditar(gasto)}
                  >
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleEliminar(gasto)}
                  >
                    <Ionicons name="trash" size={18} color={colors.danger} />
                    <Text style={[styles.actionButtonText, { color: colors.danger }]}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal de edición */}
      <Modal
        visible={modalEditarVisible}
        transparent
        animationType="slide"
        onRequestClose={cerrarModalEditar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Gasto</Text>
              <TouchableOpacity onPress={cerrarModalEditar}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Input
                  label="Artículo"
                  value={articuloNombreEditando}
                  onChangeText={setArticuloNombreEditando}
                  placeholder="Nombre del artículo"
                  required
                />
              </View>

              <View style={styles.formGroup}>
                <DatePicker
                  label="Fecha"
                  value={fechaEditando}
                  onDateChange={setFechaEditando}
                  placeholder="Seleccionar fecha"
                  maximumDate={new Date()}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Input
                    label="Cantidad"
                    value={cantidadEditando}
                    onChangeText={setCantidadEditando}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    required
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Input
                    label="Precio Unitario"
                    value={precioUnitarioEditando}
                    onChangeText={setPrecioUnitarioEditando}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    required
                  />
                </View>
              </View>

              {cantidadEditando && precioUnitarioEditando && 
               !isNaN(parseFloat(cantidadEditando)) && 
               !isNaN(parseFloat(precioUnitarioEditando)) && (
                <View style={styles.totalPreview}>
                  <Text style={styles.totalPreviewLabel}>Total:</Text>
                  <Text style={styles.totalPreviewValue}>
                    {formatPrice(parseFloat(cantidadEditando) * parseFloat(precioUnitarioEditando))}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Input
                  label="Descripción (Opcional)"
                  value={descripcionEditando}
                  onChangeText={setDescripcionEditando}
                  placeholder="Notas adicionales"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={cerrarModalEditar}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Guardar"
                onPress={handleGuardarEdicion}
                loading={guardando}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  resumenCard: {
    marginBottom: 16,
    backgroundColor: colors.danger + '10',
    borderColor: colors.danger,
    borderWidth: 2,
  },
  resumenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  resumenText: {
    alignItems: 'center',
  },
  resumenLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 4,
  },
  resumenValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 16,
  },
  gastoCard: {
    marginBottom: 12,
  },
  gastoHeader: {
    marginBottom: 12,
  },
  gastoInfo: {
    gap: 8,
  },
  gastoConceptoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gastoConcepto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  gastoFechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gastoFecha: {
    fontSize: 14,
    color: colors.textMedium,
  },
  gastoDetallesContainer: {
    marginTop: 4,
  },
  gastoDetalle: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  gastoDescripcion: {
    fontSize: 14,
    color: colors.textMedium,
    fontStyle: 'italic',
    marginTop: 4,
  },
  gastoActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  deleteButton: {
    backgroundColor: colors.danger + '10',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 0,
  },
  totalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalPreviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  totalPreviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  modalButton: {
    flex: 1,
  },
});




