/**
 * Página para editar lotes de ponedoras
 */

import { useGalpones } from '@/src/hooks/useGalpones';
import { usePonedorasStore } from '@/src/stores/ponedorasStore';
import { EstadoLote, RazaGallina } from '@/src/types';
import { formatDate } from '@/src/utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AppHeader from '../../../../src/components/layouts/AppHeader';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Input from '../../../../src/components/ui/Input';
import { colors } from '../../../../src/constants/colors';

export default function EditarLotePonedora() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [raza, setRaza] = useState<RazaGallina>(RazaGallina.COOB);
  const [estado, setEstado] = useState<EstadoLote>(EstadoLote.ACTIVO);
  const [observaciones, setObservaciones] = useState('');
  
  // Estados para dropdowns
  const [razaDropdownVisible, setRazaDropdownVisible] = useState(false);
  const [estadoDropdownVisible, setEstadoDropdownVisible] = useState(false);

  const { 
    loteActual, 
    cargarLotePonedora, 
    actualizarLote,
    isLoading, 
    error 
  } = usePonedorasStore();
  const { galpones } = useGalpones();
  const [galponSeleccionado, setGalponSeleccionado] = useState<string>('');

  // Cargar datos del lote al montar
  useEffect(() => {
    if (loteId) {
      cargarDatosLote();
    }
  }, [loteId]);

  // Llenar formulario cuando se carga el lote
  useEffect(() => {
    if (loteActual && !loading) {
      setNombre(loteActual.nombre);
      setCantidadInicial(loteActual.cantidadInicial.toString());
      setRaza(loteActual.raza as RazaGallina);
      setEstado(loteActual.estado);
      setObservaciones(loteActual.observaciones || '');
      setGalponSeleccionado(loteActual.galponId ?? '');
    }
  }, [loteActual, loading]);

  const cargarDatosLote = async () => {
    try {
      setLoading(true);
      await cargarLotePonedora(loteId);
    } catch (error) {
      console.error('Error al cargar lote:', error);
      Alert.alert('Error', 'No se pudo cargar el lote');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarCambios = async () => {
    if (!validarFormulario()) return;

    try {
      const datosActualizados = {
        nombre: nombre.trim(),
        cantidadInicial: parseInt(cantidadInicial),
        raza,
        estado,
        galponId: galponSeleccionado,
        ...(observaciones.trim() && { observaciones: observaciones.trim() }),
      };

      await actualizarLote(loteId, datosActualizados);
      
      Alert.alert(
        'Éxito',
        'Lote actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error al actualizar lote:', error);
      Alert.alert('Error', 'No se pudo actualizar el lote');
    }
  };

  const validarFormulario = (): boolean => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del lote es requerido');
      return false;
    }

    if (!galponSeleccionado) {
      Alert.alert('Galpón requerido', 'Selecciona el galpón donde está el lote.');
      return false;
    }

    if (!cantidadInicial || parseInt(cantidadInicial) <= 0) {
      Alert.alert('Error', 'La cantidad inicial debe ser mayor a 0');
      return false;
    }

    return true;
  };

  if (loading || !loteActual) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="time-outline" size={48} color={colors.primary} />
        <Text style={styles.loadingText}>Cargando datos del lote...</Text>
      </View>
    );
  }

  const razasDisponibles = Object.values(RazaGallina);
  const estadosDisponibles = Object.values(EstadoLote);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader
        title={loteActual ? `Editar ${loteActual.nombre}` : 'Editar Lote'}
        showBack
        showProfile={false}
        showNotifications={false}
        tintColor={colors.ponedoras}
        secondaryAction={{
          label: 'Cancelar',
          onPress: () => router.back(),
          icon: 'close',
          tintColor: colors.ponedoras,
        }}
        primaryAction={{
          label: 'Guardar cambios',
          onPress: handleGuardarCambios,
          loading: isLoading,
          icon: 'checkmark',
          tintColor: colors.ponedoras,
        }}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Información básica */}
        <Card style={styles.formCard}>
          <Text style={styles.cardTitle}>Información Básica</Text>
          
          <View style={styles.formGroup}>
            <Input
              label="Nombre del Lote"
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej: Lote Ponedoras A1"
              required
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Galpón *</Text>
            <View style={styles.galponSelector}>
              {galpones.length === 0 ? (
                <Text style={styles.helperText}>No hay galpones registrados.</Text>
              ) : (
                galpones.map((galpon) => (
                  <Button
                    key={galpon.id}
                    title={galpon.nombre}
                    onPress={() => setGalponSeleccionado(galpon.id)}
                    variant={galponSeleccionado === galpon.id ? 'primary' : 'outline'}
                    size="small"
                    style={styles.galponButton}
                  />
                ))
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Input
              label="Cantidad Inicial"
              value={cantidadInicial}
              onChangeText={setCantidadInicial}
              placeholder="100"
              keyboardType="numeric"
              required
            />
            <Text style={styles.helperText}>
              Cantidad actual: {loteActual.cantidadActual} gallinas
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Raza <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setRazaDropdownVisible(!razaDropdownVisible)}
            >
              <Text style={styles.dropdownText}>{raza}</Text>
              <Ionicons 
                name={razaDropdownVisible ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textMedium} 
              />
            </TouchableOpacity>
            
            {razaDropdownVisible && (
              <View style={styles.dropdownList}>
                {razasDisponibles.map((razaOption) => (
                  <TouchableOpacity
                    key={razaOption}
                    style={[
                      styles.dropdownItem,
                      raza === razaOption && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setRaza(razaOption);
                      setRazaDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      raza === razaOption && styles.dropdownItemTextSelected
                    ]}>
                      {razaOption}
                    </Text>
                    {raza === razaOption && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setEstadoDropdownVisible(!estadoDropdownVisible)}
            >
              <Text style={styles.dropdownText}>{estado}</Text>
              <Ionicons 
                name={estadoDropdownVisible ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textMedium} 
              />
            </TouchableOpacity>
            
            {estadoDropdownVisible && (
              <View style={styles.dropdownList}>
                {estadosDisponibles.map((estadoOption) => (
                  <TouchableOpacity
                    key={estadoOption}
                    style={[
                      styles.dropdownItem,
                      estado === estadoOption && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setEstado(estadoOption);
                      setEstadoDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      estado === estadoOption && styles.dropdownItemTextSelected
                    ]}>
                      {estadoOption}
                    </Text>
                    {estado === estadoOption && (
                      <Ionicons name="checkmark" size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Input
              label="Observaciones"
              value={observaciones}
              onChangeText={setObservaciones}
              placeholder="Notas adicionales sobre el lote..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </Card>

        {/* Información del sistema */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Información del Sistema</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de inicio:</Text>
            <Text style={styles.infoValue}>
              {formatDate(loteActual.fechaInicio)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de nacimiento:</Text>
            <Text style={styles.infoValue}>
              {formatDate(loteActual.fechaNacimiento)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Creado:</Text>
            <Text style={styles.infoValue}>
              {formatDate(loteActual.createdAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última actualización:</Text>
            <Text style={styles.infoValue}>
              {formatDate(loteActual.updatedAt)}
            </Text>
          </View>
        </Card>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Guardar Cambios"
            onPress={handleGuardarCambios}
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: colors.white,
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flex: 1,
  },
  galponSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galponButton: {
    minWidth: 80,
  },
});