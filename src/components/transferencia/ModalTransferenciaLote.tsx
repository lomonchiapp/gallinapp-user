/**
 * Modal para transferir un lote de levante a ponedoras
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../constants/colors';
import { useTransferenciaLotes } from '../../hooks/useTransferenciaLotes';
import { LoteLevante } from '../../types/levantes/loteLevante';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ModalTransferenciaLoteProps {
  visible: boolean;
  lote: LoteLevante | null;
  galpones: Array<{ id: string; nombre: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModalTransferenciaLote: React.FC<ModalTransferenciaLoteProps> = ({
  visible,
  lote,
  galpones,
  onClose,
  onSuccess,
}) => {
  const { loading, transferir, verificarListo } = useTransferenciaLotes();

  const [cantidadTransferir, setCantidadTransferir] = useState('');
  const [galponSeleccionado, setGalponSeleccionado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mostrarGalpones, setMostrarGalpones] = useState(false);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (visible && lote) {
      setCantidadTransferir(lote.cantidadActual.toString());
      setGalponSeleccionado('');
      setObservaciones('');
    }
  }, [visible, lote]);

  if (!lote) return null;

  const estadoLote = verificarListo(lote);
  const galponNombre = galpones.find((g) => g.id === galponSeleccionado)?.nombre || 'Seleccionar galpón';

  const handleTransferir = async () => {
    const cantidad = parseInt(cantidadTransferir, 10);

    // Validaciones
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida');
      return;
    }

    if (cantidad > lote.cantidadActual) {
      Alert.alert('Error', `La cantidad no puede ser mayor a ${lote.cantidadActual}`);
      return;
    }

    if (!galponSeleccionado) {
      Alert.alert('Error', 'Selecciona un galpón de destino');
      return;
    }

    // Confirmar transferencia
    Alert.alert(
      'Confirmar Transferencia',
      `¿Transferir ${cantidad} pollitas a producción?\n\n` +
      `Esta acción creará un nuevo lote de ponedoras y marcará el lote de levante como transferido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          style: 'default',
          onPress: async () => {
            const resultado = await transferir({
              loteLevanteId: lote.id!,
              cantidadTransferir: cantidad,
              galponDestinoId: galponSeleccionado,
              observaciones,
              fechaInicioProduccion: new Date(),
            });

            if (resultado) {
              onSuccess();
              onClose();
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Transferir a Ponedoras</Text>
            <Text style={styles.headerSubtitle}>{lote.nombre}</Text>
          </View>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Ionicons name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Estado del lote */}
          <Card style={styles.card}>
            <View style={styles.estadoHeader}>
              <Ionicons
                name={estadoLote.listo ? 'checkmark-circle' : 'alert-circle'}
                size={24}
                color={estadoLote.listo ? colors.success : colors.warning}
              />
              <Text style={styles.estadoTexto}>{estadoLote.mensaje}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Edad actual:</Text>
              <Text style={styles.infoValue}>{estadoLote.edadEnSemanas} semanas</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cantidad disponible:</Text>
              <Text style={styles.infoValue}>{lote.cantidadActual} pollitas</Text>
            </View>
          </Card>

          {/* Cantidad a transferir */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Cantidad a Transferir</Text>
            <View style={styles.cantidadContainer}>
              <TouchableOpacity
                style={styles.cantidadButton}
                onPress={() => {
                  const actual = parseInt(cantidadTransferir, 10) || 0;
                  if (actual > 1) setCantidadTransferir((actual - 1).toString());
                }}
                disabled={loading}
              >
                <Ionicons name="remove-circle" size={32} color={colors.primary} />
              </TouchableOpacity>

              <TextInput
                style={styles.cantidadInput}
                value={cantidadTransferir}
                onChangeText={setCantidadTransferir}
                keyboardType="number-pad"
                editable={!loading}
              />

              <TouchableOpacity
                style={styles.cantidadButton}
                onPress={() => {
                  const actual = parseInt(cantidadTransferir, 10) || 0;
                  if (actual < lote.cantidadActual) setCantidadTransferir((actual + 1).toString());
                }}
                disabled={loading}
              >
                <Ionicons name="add-circle" size={32} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => setCantidadTransferir(lote.cantidadActual.toString())}
              disabled={loading}
            >
              <Text style={styles.maxButtonText}>Transferir todas ({lote.cantidadActual})</Text>
            </TouchableOpacity>
          </Card>

          {/* Galpón de destino */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Galpón de Destino</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setMostrarGalpones(!mostrarGalpones)}
              disabled={loading}
            >
              <Text style={[styles.selectorText, !galponSeleccionado && styles.selectorPlaceholder]}>
                {galponNombre}
              </Text>
              <Ionicons
                name={mostrarGalpones ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMedium}
              />
            </TouchableOpacity>

            {mostrarGalpones && (
              <View style={styles.galponesLista}>
                {galpones.map((galpon) => (
                  <TouchableOpacity
                    key={galpon.id}
                    style={[
                      styles.galponItem,
                      galponSeleccionado === galpon.id && styles.galponItemSelected,
                    ]}
                    onPress={() => {
                      setGalponSeleccionado(galpon.id);
                      setMostrarGalpones(false);
                    }}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.galponItemText,
                        galponSeleccionado === galpon.id && styles.galponItemTextSelected,
                      ]}
                    >
                      {galpon.nombre}
                    </Text>
                    {galponSeleccionado === galpon.id && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          {/* Observaciones */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Observaciones (Opcional)</Text>
            <TextInput
              style={styles.observacionesInput}
              value={observaciones}
              onChangeText={setObservaciones}
              placeholder="Notas sobre la transferencia..."
              placeholderTextColor={colors.lightGray}
              multiline
              numberOfLines={4}
              editable={!loading}
            />
          </Card>

          {/* Información adicional */}
          <Card style={[styles.card, styles.infoCard]}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={20} color={colors.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>¿Qué sucederá?</Text>
              <Text style={styles.infoText}>
                • Se creará un nuevo lote de ponedoras{'\n'}
                • Los costos de levante se heredarán{'\n'}
                • El lote de levante se marcará como transferido{'\n'}
                • Podrás comenzar a registrar producción de huevos
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* Footer con botones */}
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            onPress={onClose}
            variant="outline"
            disabled={loading}
            style={styles.footerButton}
          />
          <Button
            title={loading ? 'Transfiriendo...' : 'Transferir'}
            onPress={handleTransferir}
            disabled={loading || !estadoLote.listo}
            style={[styles.footerButton, styles.footerButtonPrimary]}
          />
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Transfiriendo lote...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  estadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.veryLightGray,
    borderRadius: 8,
  },
  estadoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 12,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  cantidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  cantidadButton: {
    padding: 8,
  },
  cantidadInput: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    minWidth: 100,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  maxButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  maxButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  selectorText: {
    fontSize: 16,
    color: colors.textDark,
  },
  selectorPlaceholder: {
    color: colors.lightGray,
  },
  galponesLista: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galponItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  galponItemSelected: {
    backgroundColor: colors.primaryLight,
  },
  galponItemText: {
    fontSize: 16,
    color: colors.textDark,
  },
  galponItemTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  observacionesInput: {
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.textDark,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMedium,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonPrimary: {
    backgroundColor: colors.success,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
});







