/**
 * Sheet modal para transferir lotes de levante a ponedoras
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../constants/colors';
import { useGalpones } from '../../hooks/useGalpones';
import { transferirLevantePonedoras, validarTransferencia, verificarLoteListoParaTransferir } from '../../services/transferencia-lotes.service';
import { LoteLevante } from '../../types/levantes/loteLevante';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface TransferenciaSheetProps {
  visible: boolean;
  onClose: () => void;
  lote: LoteLevante;
  onTransferenciaExitosa?: () => void;
}

export default function TransferenciaSheet({ 
  visible, 
  onClose, 
  lote,
  onTransferenciaExitosa
}: TransferenciaSheetProps) {
  const { galpones, cargarGalpones } = useGalpones();
  const [galponDestinoId, setGalponDestinoId] = useState<string>('');
  const [cantidadTransferir, setCantidadTransferir] = useState<string>(lote.cantidadActual.toString());
  const [observaciones, setObservaciones] = useState<string>('');
  const [fechaInicioProduccion, setFechaInicioProduccion] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [validacion, setValidacion] = useState<{ valido: boolean; mensaje?: string } | null>(null);
  const [estadoLote, setEstadoLote] = useState<{ listo: boolean; mensaje: string; edadEnSemanas: number } | null>(null);

  useEffect(() => {
    if (visible) {
      cargarGalpones();
      setCantidadTransferir(lote.cantidadActual.toString());
      setGalponDestinoId(lote.galponId || '');
      setObservaciones('');
      setFechaInicioProduccion('');
      
      // Verificar estado del lote
      const estado = verificarLoteListoParaTransferir(lote);
      setEstadoLote(estado);
      
      // Validar transferencia (pasar el tipo del lote)
      validarTransferencia(lote.id, lote.cantidadActual, lote.tipo).then(setValidacion);
    }
  }, [visible, lote]);

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleTransferir = async () => {
    if (isLoading) return;

    const cantidad = parseInt(cantidadTransferir);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }

    if (cantidad > lote.cantidadActual) {
      Alert.alert('Error', `No puedes transferir más aves de las disponibles (${lote.cantidadActual})`);
      return;
    }

    if (!galponDestinoId) {
      Alert.alert('Error', 'Debes seleccionar un galpón destino');
      return;
    }

    // Validar nuevamente antes de transferir
    const validacionActual = await validarTransferencia(lote.id, cantidad, lote.tipo);
    if (!validacionActual.valido) {
      Alert.alert('Error de validación', validacionActual.mensaje || 'No se puede realizar la transferencia');
      return;
    }

    setIsLoading(true);
    try {
      const fechaProduccion = fechaInicioProduccion 
        ? new Date(fechaInicioProduccion) 
        : new Date();

      const resultado = await transferirLevantePonedoras({
        loteLevanteId: lote.id,
        cantidadTransferir: cantidad,
        galponDestinoId,
        observaciones: observaciones || undefined,
        fechaInicioProduccion: fechaProduccion,
      });

      Alert.alert(
        'Transferencia Exitosa',
        `Se transfirieron ${cantidad} aves al lote de ponedoras "${resultado.lotePonedoras.nombre}".\n\nCostos heredados: RD$${resultado.costosHeredados.total.toFixed(2)}`,
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              if (onTransferenciaExitosa) {
                onTransferenciaExitosa();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error al transferir lote:', error);
      Alert.alert('Error', error.message || 'No se pudo completar la transferencia');
    } finally {
      setIsLoading(false);
    }
  };

  const galponDestino = galpones.find(g => g.id === galponDestinoId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
              <Text style={styles.title}>Transferir a Ponedoras</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textMedium} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.loteInfo}>
            <Text style={styles.loteInfoText}>
              <Text style={styles.loteInfoLabel}>Lote:</Text> {lote.nombre}
            </Text>
            <Text style={styles.loteInfoText}>
              <Text style={styles.loteInfoLabel}>Aves disponibles:</Text> {lote.cantidadActual}
            </Text>
            {estadoLote && (
              <View style={[
                styles.estadoBadge,
                estadoLote.listo ? styles.estadoListo : styles.estadoNoListo
              ]}>
                <Ionicons 
                  name={estadoLote.listo ? "checkmark-circle" : "warning"} 
                  size={16} 
                  color={estadoLote.listo ? colors.success : colors.warning} 
                />
                <Text style={[
                  styles.estadoText,
                  estadoLote.listo ? styles.estadoTextListo : styles.estadoTextNoListo
                ]}>
                  {estadoLote.mensaje} ({estadoLote.edadEnSemanas} semanas)
                </Text>
              </View>
            )}
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cantidad a transferir *</Text>
                <Input
                  value={cantidadTransferir}
                  onChangeText={(text) => {
                    setCantidadTransferir(text);
                    // Validar en tiempo real
                    const cantidad = parseInt(text);
                    if (!isNaN(cantidad) && cantidad > 0) {
                      validarTransferencia(lote.id, cantidad, lote.tipo).then(setValidacion);
                    }
                  }}
                  placeholder="Cantidad de aves"
                  keyboardType="numeric"
                  editable={!isLoading}
                />
                {validacion && !validacion.valido && (
                  <Text style={styles.errorText}>{validacion.mensaje}</Text>
                )}
                {validacion && validacion.valido && validacion.mensaje && (
                  <Text style={styles.warningText}>{validacion.mensaje}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Galpón destino *</Text>
                <View style={styles.galponSelector}>
                  {galpones.map((galpon) => (
                    <TouchableOpacity
                      key={galpon.id}
                      style={[
                        styles.galponOption,
                        galponDestinoId === galpon.id && styles.galponOptionSelected
                      ]}
                      onPress={() => setGalponDestinoId(galpon.id)}
                      disabled={isLoading}
                    >
                      <Ionicons 
                        name={galponDestinoId === galpon.id ? "radio-button-on" : "radio-button-off"} 
                        size={20} 
                        color={galponDestinoId === galpon.id ? colors.primary : colors.textMedium} 
                      />
                      <Text style={[
                        styles.galponOptionText,
                        galponDestinoId === galpon.id && styles.galponOptionTextSelected
                      ]}>
                        {galpon.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {galpones.length === 0 && (
                  <Text style={styles.hintText}>No hay galpones disponibles. Crea uno primero.</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha inicio de producción (opcional)</Text>
                <Input
                  value={fechaInicioProduccion}
                  onChangeText={setFechaInicioProduccion}
                  placeholder="YYYY-MM-DD"
                  editable={!isLoading}
                />
                <Text style={styles.hintText}>
                  Fecha estimada en que comenzarán a poner huevos
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Observaciones (opcional)</Text>
                <Input
                  value={observaciones}
                  onChangeText={setObservaciones}
                  placeholder="Notas sobre la transferencia"
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Cancelar"
              onPress={handleClose}
              variant="outline"
              disabled={isLoading}
              style={styles.cancelButton}
            />
            <Button
              title={isLoading ? "Transferiendo..." : "Transferir"}
              onPress={handleTransferir}
              disabled={isLoading || !validacion?.valido || !galponDestinoId || galpones.length === 0}
              loading={isLoading}
              style={styles.submitButton}
            />
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
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  closeButton: {
    padding: 4,
  },
  loteInfo: {
    padding: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  loteInfoText: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 4,
  },
  loteInfoLabel: {
    fontWeight: '600',
    color: colors.textMedium,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  estadoListo: {
    backgroundColor: colors.success + '15',
  },
  estadoNoListo: {
    backgroundColor: colors.warning + '15',
  },
  estadoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  estadoTextListo: {
    color: colors.success,
  },
  estadoTextNoListo: {
    color: colors.warning,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  galponSelector: {
    gap: 8,
  },
  galponOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    gap: 12,
  },
  galponOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  galponOptionText: {
    fontSize: 15,
    color: colors.textDark,
  },
  galponOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

