import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../../src/components/ui/Button';
import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useFacturacion } from '../../../src/hooks/useFacturacion';
import { useGalpones } from '../../../src/hooks/useGalpones';
import { Galpon } from '../../../src/types/galpon';

export default function GalponesScreen() {
  const { galpones, loading, error, cargarGalpones, crearGalpon, actualizarGalpon, eliminarGalpon } = useGalpones();
  const { lotes } = useFacturacion();

  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [galponSeleccionado, setGalponSeleccionado] = useState<Galpon | null>(null);
  const [nombreGalpon, setNombreGalpon] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarGalpones();
    setRefreshing(false);
  };

  const galponesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return galpones;
    return galpones.filter((galpon) => galpon.nombre.toLowerCase().includes(termino));
  }, [galpones, busqueda]);

  const obtenerLotesPorGalpon = (galponId: string) => {
    return [
      ...lotes.ponedoras.filter((lote) => lote.galponId === galponId),
      ...lotes.levantes.filter((lote) => lote.galponId === galponId),
      ...lotes.engordes.filter((lote) => lote.galponId === galponId),
    ];
  };

  const abrirModalCrear = () => {
    setGalponSeleccionado(null);
    setNombreGalpon('');
    setModalVisible(true);
  };

  const abrirModalEditar = (galpon: Galpon) => {
    setGalponSeleccionado(galpon);
    setNombreGalpon(galpon.nombre);
    setModalVisible(true);
  };

  const manejarGuardar = async () => {
    if (!nombreGalpon.trim()) {
      Alert.alert('Nombre requerido', 'El galpón debe tener un nombre.');
      return;
    }

    if (galponSeleccionado) {
      await actualizarGalpon(galponSeleccionado.id, nombreGalpon.trim());
      Alert.alert('Actualizado', 'Galpón actualizado correctamente.');
    } else {
      const creado = await crearGalpon(nombreGalpon.trim());
      if (creado) {
        Alert.alert('Creado', 'Galpón creado correctamente.');
      }
    }

    setModalVisible(false);
    setNombreGalpon('');
  };

  const manejarEliminar = (galpon: Galpon) => {
    const lotesAsociados = obtenerLotesPorGalpon(galpon.id);
    if (lotesAsociados.length > 0) {
      Alert.alert(
        'Galpón con lotes',
        'Este galpón tiene lotes asociados y no puede eliminarse hasta reasignarlos.'
      );
      return;
    }

    Alert.alert(
      'Eliminar galpón',
      `¿Seguro que deseas eliminar el galpón ${galpon.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await eliminarGalpon(galpon.id);
            Alert.alert('Eliminado', 'Galpón eliminado correctamente.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroLabel}>Ubicación de lotes</Text>
              <Text style={styles.heroTitle}>Gestión de galpones</Text>
            </View>
            <Button title="Nuevo galpón" onPress={abrirModalCrear} size="small" />
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{galpones.length}</Text>
              <Text style={styles.heroStatLabel}>Galpones registrados</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {lotes.ponedoras.length + lotes.levantes.length + lotes.engordes.length}
              </Text>
              <Text style={styles.heroStatLabel}>Lotes asignados</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Buscar galpón</Text>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.lightGray} />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Filtra por nombre"
              placeholderTextColor={colors.lightGray}
              style={styles.searchInput}
            />
            {busqueda ? (
              <TouchableOpacity onPress={() => setBusqueda('')}>
                <Ionicons name="close-circle" size={18} color={colors.lightGray} />
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>

        {galponesFiltrados.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="business-outline" size={48} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No hay galpones registrados</Text>
            <Text style={styles.emptySubtitle}>
              Crea un galpón para organizar tus lotes por ubicación.
            </Text>
            <Button title="Crear galpón" onPress={abrirModalCrear} />
          </Card>
        ) : (
          galponesFiltrados.map((galpon) => {
            const lotesAsociados = obtenerLotesPorGalpon(galpon.id);
            return (
              <Card key={galpon.id} style={styles.galponCard}>
                <View style={styles.galponHeader}>
                  <View>
                    <Text style={styles.galponNombre}>{galpon.nombre}</Text>
                    <Text style={styles.galponMeta}>
                      {lotesAsociados.length} lote{lotesAsociados.length !== 1 ? 's' : ''} asignado{lotesAsociados.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.galponActions}>
                    <TouchableOpacity onPress={() => abrirModalEditar(galpon)} style={styles.actionButton}>
                      <Ionicons name="pencil" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => manejarEliminar(galpon)} style={styles.actionButton}>
                      <Ionicons name="trash" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {lotesAsociados.length > 0 ? (
                  <View style={styles.loteList}>
                    {lotesAsociados.map((lote) => (
                      <View key={lote.id} style={styles.loteItem}>
                        <Ionicons name="archive-outline" size={18} color={colors.primary} />
                        <View style={styles.loteInfo}>
                          <Text style={styles.loteNombre}>{lote.nombre}</Text>
                          <Text style={styles.loteMeta}>
                            {lote.raza} · {lote.cantidadActual} aves · {lote.tipo.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyLoteText}>No hay lotes asignados a este galpón.</Text>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {galponSeleccionado ? 'Editar galpón' : 'Nuevo galpón'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color={colors.textDark} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Nombre del galpón</Text>
              <TextInput
                value={nombreGalpon}
                onChangeText={setNombreGalpon}
                placeholder="Ej: Galpón 1"
                placeholderTextColor={colors.lightGray}
                style={styles.modalInput}
              />

              <Button
                title={galponSeleccionado ? 'Guardar cambios' : 'Crear galpón'}
                onPress={manejarGuardar}
                loading={loading}
                fullWidth
              />
            </Card>
          </KeyboardAvoidingView>
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
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  galponCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  galponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galponNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
  },
  galponMeta: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  galponActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.veryLightGray,
  },
  loteList: {
    marginTop: 16,
    gap: 12,
  },
  loteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  loteInfo: {
    flex: 1,
  },
  loteNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  loteMeta: {
    fontSize: 12,
    color: colors.textMedium,
  },
  emptyLoteText: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    width: '100%',
    paddingHorizontal: 16,
  },
  modalCard: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textDark,
  },
});
