/**
 * Pantalla de inventario para facturación (lotes completos y aves por unidad)
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
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
import { LoteEngorde } from '../../../src/types/engorde/loteEngorde';
import { LoteLevante } from '../../../src/types/levantes/loteLevante';
import { LotePonedora } from '../../../src/types/ponedoras/lotePonedora';

const formatearNumero = (valor: number): string =>
  new Intl.NumberFormat('es-DO').format(valor);

type VistaInventario = 'PONEDORAS' | 'LEVANTES' | 'ENGORDES';

type LoteGenerico = LotePonedora | LoteLevante | LoteEngorde;

export default function ProductosScreen() {
  const { lotes, loading, refrescarDatos } = useFacturacion();
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [vistaActiva, setVistaActiva] = useState<VistaInventario>('PONEDORAS');
  const [modalVisible, setModalVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteGenerico | null>(null);
  const [cantidadUnidades, setCantidadUnidades] = useState('1');

  const onRefresh = async () => {
    setRefreshing(true);
    await refrescarDatos();
    setRefreshing(false);
  };

  const lotesPorVista = useMemo(() => {
    switch (vistaActiva) {
      case 'PONEDORAS':
        return lotes.ponedoras;
      case 'LEVANTES':
        return lotes.levantes;
      case 'ENGORDES':
        return lotes.engordes;
      default:
        return [];
    }
  }, [lotes, vistaActiva]);

  const lotesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return lotesPorVista;

    return lotesPorVista.filter((lote) =>
      [lote.nombre, lote.raza]
        .filter(Boolean)
        .some((valor) => valor!.toLowerCase().includes(termino))
    );
  }, [lotesPorVista, busqueda]);

  const totalLotes = lotes.ponedoras.length + lotes.levantes.length + lotes.engordes.length;
  const totalAves = [...lotes.ponedoras, ...lotes.levantes, ...lotes.engordes].reduce(
    (acum, lote) => acum + (lote.cantidadActual ?? 0),
    0
  );

  const abrirModalUnidades = (lote: LoteGenerico) => {
    setLoteSeleccionado(lote);
    setCantidadUnidades('1');
    setModalVisible(true);
  };

  const confirmarUnidades = () => {
    if (!loteSeleccionado) return;
    const cantidad = parseInt(cantidadUnidades, 10);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Cantidad inválida', 'Introduce un número mayor a cero.');
      return;
    }
    if (cantidad > (loteSeleccionado.cantidadActual ?? 0)) {
      Alert.alert(
        'Cantidad excedida',
        `Solo hay ${formatearNumero(loteSeleccionado.cantidadActual ?? 0)} aves disponibles.`
      );
      return;
    }

    Alert.alert(
      'Unidades seleccionadas',
      `Reservaste ${cantidad} aves del lote ${loteSeleccionado.nombre}. Puedes continuar la factura desde "Nueva factura".`
    );
    setModalVisible(false);
  };

  const confirmarLoteCompleto = (lote: LoteGenerico) => {
    Alert.alert(
      'Lote completo seleccionado',
      `Reservaste el lote ${lote.nombre} con ${formatearNumero(lote.cantidadActual ?? 0)} aves.`
    );
  };

  const renderLoteCard = (lote: LoteGenerico) => (
    <View key={lote.id} style={styles.loteCard}>
      <View style={styles.loteHeader}>
        <Text style={styles.loteNombre}>{lote.nombre}</Text>
        <View style={styles.loteBadge}>
          <Ionicons name="archive-outline" size={14} color={colors.primary} />
          <Text style={styles.loteBadgeText}>
            {vistaActiva === 'PONEDORAS'
              ? 'Ponedoras'
              : vistaActiva === 'LEVANTES'
              ? 'Levante'
              : 'Engorde'}
          </Text>
        </View>
      </View>

      <Text style={styles.loteCantidad}>
        {formatearNumero(lote.cantidadActual ?? 0)} aves disponibles
      </Text>

      <View style={styles.loteActions}>
        <Button
          title="Vender lote completo"
          onPress={() => confirmarLoteCompleto(lote)}
          size="small"
        />
        <Button
          title="Vender por unidades"
          onPress={() => abrirModalUnidades(lote)}
          variant="outline"
          size="small"
        />
      </View>
    </View>
  );

  if (loading && totalLotes === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Card style={[styles.sectionCard, styles.heroCard]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Inventario en vivo</Text>
            <Text style={styles.heroTitle}>Lotes registrados</Text>
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{totalLotes}</Text>
            <Text style={styles.heroStatLabel}>Lotes activos</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatearNumero(totalAves)}</Text>
            <Text style={styles.heroStatLabel}>Aves disponibles</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Filtrar inventario</Text>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.lightGray} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Busca por nombre o raza"
            placeholderTextColor={colors.lightGray}
            style={styles.searchInput}
          />
          {busqueda ? (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color={colors.lightGray} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.segmentedControl}>
          {(
            [
              { id: 'PONEDORAS', label: 'Ponedoras' },
              { id: 'LEVANTES', label: 'Levante' },
              { id: 'ENGORDES', label: 'Engorde' },
            ] as const
          ).map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.segmentedButton, vistaActiva === option.id && styles.segmentedButtonActive]}
              onPress={() => setVistaActiva(option.id)}
            >
              <Text style={[styles.segmentedText, vistaActiva === option.id && styles.segmentedTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {lotesFiltrados.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={colors.lightGray} />
            <Text style={styles.emptyTitle}>No se encontraron lotes</Text>
            <Text style={styles.emptySubtitle}>
              Verifica el filtro o crea un nuevo lote desde el módulo correspondiente.
            </Text>
            <Button title="Actualizar" onPress={onRefresh} variant="outline" fullWidth />
          </View>
        </Card>
      ) : (
        <Card style={styles.sectionCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {vistaActiva === 'PONEDORAS'
                ? 'Lotes de ponedoras'
                : vistaActiva === 'LEVANTES'
                ? 'Lotes de levante'
                : 'Lotes de engorde'}
            </Text>
            <Text style={styles.listSubtitle}>
              {lotesFiltrados.length} lote{lotesFiltrados.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.grid}>{lotesFiltrados.map(renderLoteCard)}</View>
        </Card>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar unidades</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {loteSeleccionado ? (
              <>
                <Text style={styles.modalSubtitle}>{loteSeleccionado.nombre}</Text>
                <Text style={styles.modalCaption}>
                  Disponible: {formatearNumero(loteSeleccionado.cantidadActual ?? 0)} aves
                </Text>
                <View style={styles.modalInputRow}>
                  <TextInput
                    value={cantidadUnidades}
                    onChangeText={setCantidadUnidades}
                    keyboardType="numeric"
                    style={styles.modalInput}
                    placeholder="Cantidad"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>
                <Button title="Confirmar" onPress={confirmarUnidades} fullWidth />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textDark,
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
  heroCard: {
    backgroundColor: colors.primary,
    padding: 22,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.veryLightGray,
    borderRadius: 14,
    marginTop: 16,
    padding: 6,
    gap: 6,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  segmentedTextActive: {
    color: colors.primary,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  listSubtitle: {
    fontSize: 13,
    color: colors.textMedium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  loteCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  loteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loteNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  loteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
  },
  loteBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  loteCantidad: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 12,
  },
  loteActions: {
    gap: 10,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyState: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 16,
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
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalCaption: {
    fontSize: 13,
    color: colors.textMedium,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textDark,
  },
});








