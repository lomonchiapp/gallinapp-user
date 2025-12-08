/**
 * Pantalla para ver todos los registros de producción de huevos de todos los lotes
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { actualizarRegistroHuevos, eliminarRegistroHuevos, obtenerRegistrosHuevos } from '../../../src/services/ponedoras.service';
import { usePonedorasStore } from '../../../src/stores/ponedorasStore';
import { HuevoRegistro } from '../../../src/types/ponedoras/HuevoRegistro';
import { formatDate } from '../../../src/utils/dateUtils';

export default function HistorialRegistrosHuevosScreen() {
  const { lotes } = usePonedorasStore();
  const [registros, setRegistros] = useState<Array<HuevoRegistro & { loteNombre: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalEditarVisible, setModalEditarVisible] = useState(false);
  const [registroEditando, setRegistroEditando] = useState<(HuevoRegistro & { loteNombre: string }) | null>(null);
  const [cantidadEditando, setCantidadEditando] = useState('');
  const [fechaEditando, setFechaEditando] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [filtroLote, setFiltroLote] = useState<string>('');

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const todosLosRegistros: Array<HuevoRegistro & { loteNombre: string }> = [];

      // Cargar registros de todos los lotes
      for (const lote of lotes) {
        try {
          const registrosLote = await obtenerRegistrosHuevos(lote.id);
          const registrosConLote = registrosLote.map(registro => ({
            ...registro,
            loteNombre: lote.nombre
          }));
          todosLosRegistros.push(...registrosConLote);
        } catch (error) {
          console.error(`Error cargando registros del lote ${lote.id}:`, error);
        }
      }

      // Ordenar por fecha descendente (más recientes primero)
      todosLosRegistros.sort((a, b) => {
        const fechaA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
        const fechaB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
        return fechaB.getTime() - fechaA.getTime();
      });

      setRegistros(todosLosRegistros);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cargar registros');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    cargarRegistros();
  };

  const abrirModalEditar = (registro: HuevoRegistro & { loteNombre: string }) => {
    setRegistroEditando(registro);
    setCantidadEditando(registro.cantidad.toString());
    setFechaEditando(registro.fecha instanceof Date 
      ? registro.fecha.toISOString().split('T')[0]
      : new Date(registro.fecha).toISOString().split('T')[0]
    );
    setModalEditarVisible(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarVisible(false);
    setRegistroEditando(null);
    setCantidadEditando('');
    setFechaEditando('');
  };

  const handleGuardarEdicion = async () => {
    if (!registroEditando) return;

    const cantidadNum = parseInt(cantidadEditando);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida');
      return;
    }

    if (!fechaEditando) {
      Alert.alert('Error', 'Por favor seleccione una fecha');
      return;
    }

    try {
      setGuardando(true);
      await actualizarRegistroHuevos(registroEditando.id, {
        cantidadHuevos: cantidadNum,
        fecha: new Date(fechaEditando)
      });

      Alert.alert('Éxito', 'Registro actualizado correctamente', [
        { text: 'OK', onPress: () => {
          cerrarModalEditar();
          cargarRegistros();
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar registro');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (registro: HuevoRegistro & { loteNombre: string }) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Está seguro de eliminar el registro del ${formatDate(registro.fecha)} con ${registro.cantidad} huevos del lote "${registro.loteNombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarRegistroHuevos(registro.id);
              Alert.alert('Éxito', 'Registro eliminado correctamente', [
                { text: 'OK', onPress: () => cargarRegistros() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al eliminar registro');
            }
          }
        }
      ]
    );
  };

  const registrosFiltrados = filtroLote
    ? registros.filter(r => r.loteNombre.toLowerCase().includes(filtroLote.toLowerCase()))
    : registros;

  const totalHuevos = registrosFiltrados.reduce((sum, registro) => sum + registro.cantidad, 0);

  if (loading && registros.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando registros...</Text>
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
          <Text style={styles.title}>Historial de Registros de Huevos</Text>
        </View>

        {/* Resumen */}
        <Card style={styles.resumenCard}>
          <View style={styles.resumenContent}>
            <Ionicons name="egg" size={32} color={colors.ponedoras} />
            <View style={styles.resumenText}>
              <Text style={styles.resumenLabel}>Total de Huevos</Text>
              <Text style={styles.resumenValue}>{totalHuevos.toLocaleString()}</Text>
            </View>
            <View style={styles.resumenText}>
              <Text style={styles.resumenLabel}>Total de Registros</Text>
              <Text style={styles.resumenValue}>{registrosFiltrados.length}</Text>
            </View>
          </View>
        </Card>

        {/* Filtro por lote */}
        {lotes.length > 1 && (
          <Card style={styles.filtroCard}>
            <View style={styles.filtroContainer}>
              <Ionicons name="filter" size={20} color={colors.textMedium} />
              <Text style={styles.filtroLabel}>Filtrar por lote:</Text>
              <View style={styles.filtroButtons}>
                <TouchableOpacity
                  style={[styles.filtroButton, !filtroLote && styles.filtroButtonActive]}
                  onPress={() => setFiltroLote('')}
                >
                  <Text style={[styles.filtroButtonText, !filtroLote && styles.filtroButtonTextActive]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {lotes.slice(0, 5).map((lote) => (
                  <TouchableOpacity
                    key={lote.id}
                    style={[styles.filtroButton, filtroLote === lote.nombre && styles.filtroButtonActive]}
                    onPress={() => setFiltroLote(filtroLote === lote.nombre ? '' : lote.nombre)}
                  >
                    <Text style={[styles.filtroButtonText, filtroLote === lote.nombre && styles.filtroButtonTextActive]}>
                      {lote.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
        )}

        {/* Lista de registros */}
        {registrosFiltrados.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="egg-outline" size={64} color={colors.textMedium} />
            <Text style={styles.emptyText}>
              {filtroLote ? 'No hay registros para este lote' : 'No hay registros de producción'}
            </Text>
          </Card>
        ) : (
          registrosFiltrados.map((registro) => {
            const fechaRegistro = registro.fecha instanceof Date 
              ? registro.fecha 
              : new Date(registro.fecha);
            const diasAtras = Math.floor(
              (new Date().getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <Card key={registro.id} style={styles.registroCard}>
                <View style={styles.registroHeader}>
                  <View style={styles.registroInfo}>
                    <View style={styles.registroLoteContainer}>
                      <Ionicons name="layers" size={16} color={colors.ponedoras} />
                      <Text style={styles.registroLote}>{registro.loteNombre}</Text>
                    </View>
                    <View style={styles.registroFechaContainer}>
                      <Ionicons name="calendar" size={20} color={colors.ponedoras} />
                      <View style={styles.registroFechaText}>
                        <Text style={styles.registroFecha}>
                          {diasAtras === 0 
                            ? 'Hoy' 
                            : diasAtras === 1 
                            ? 'Ayer' 
                            : `Hace ${diasAtras} días`}
                        </Text>
                        <Text style={styles.registroFechaCompleta}>
                          {formatDate(fechaRegistro)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.registroCantidadContainer}>
                      <Ionicons name="egg" size={24} color={colors.ponedoras} />
                      <Text style={styles.registroCantidad}>
                        {registro.cantidad.toLocaleString()} huevos
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.registroActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => abrirModalEditar(registro)}
                  >
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                    <Text style={styles.actionButtonText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleEliminar(registro)}
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
              <Text style={styles.modalTitle}>Editar Registro</Text>
              <TouchableOpacity onPress={cerrarModalEditar}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {registroEditando && (
              <View style={styles.modalLoteInfo}>
                <Text style={styles.modalLoteText}>Lote: {registroEditando.loteNombre}</Text>
              </View>
            )}

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <DatePicker
                  label="Fecha"
                  value={fechaEditando}
                  onDateChange={setFechaEditando}
                  placeholder="Seleccionar fecha"
                  maximumDate={new Date()}
                />
              </View>

              <View style={styles.formGroup}>
                <Input
                  label="Cantidad de Huevos"
                  value={cantidadEditando}
                  onChangeText={setCantidadEditando}
                  keyboardType="numeric"
                  placeholder="Ingrese la cantidad"
                  required
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
    backgroundColor: colors.ponedoras + '10',
    borderColor: colors.ponedoras,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.ponedoras,
  },
  filtroCard: {
    marginBottom: 16,
  },
  filtroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  filtroLabel: {
    fontSize: 14,
    color: colors.textDark,
    fontWeight: '500',
  },
  filtroButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtroButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  filtroButtonActive: {
    backgroundColor: colors.ponedoras + '20',
    borderColor: colors.ponedoras,
  },
  filtroButtonText: {
    fontSize: 12,
    color: colors.textMedium,
  },
  filtroButtonTextActive: {
    color: colors.ponedoras,
    fontWeight: '600',
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
  registroCard: {
    marginBottom: 12,
  },
  registroHeader: {
    marginBottom: 12,
  },
  registroInfo: {
    gap: 12,
  },
  registroLoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registroLote: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ponedoras,
  },
  registroFechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  registroFechaText: {
    flex: 1,
  },
  registroFecha: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  registroFechaCompleta: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 2,
  },
  registroCantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registroCantidad: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.ponedoras,
  },
  registroActions: {
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
  modalLoteInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.ponedoras + '10',
  },
  modalLoteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ponedoras,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
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




