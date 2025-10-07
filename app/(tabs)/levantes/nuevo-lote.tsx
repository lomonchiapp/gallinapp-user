/**
 * Pantalla para crear un nuevo lote de pollos de levante
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../../src/components/layouts/AppHeader';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import DatePicker from '../../../src/components/ui/DatePicker';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useGalpones } from '../../../src/hooks/useGalpones';
import { useLevantes } from '../../../src/hooks/useLevantes';
import { useAuthStore } from '../../../src/stores/authStore';
import { EstadoLote, RazaPollo, TipoAve } from '../../../src/types/enums';

export default function NuevoLoteLevanteScreen() {
  const [nombre, setNombre] = useState('');
  const [numeroAves, setNumeroAves] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [raza, setRaza] = useState<RazaPollo>(RazaPollo.ROSS_308);
  const [observaciones, setObservaciones] = useState('');
  const [usarPrecioUnitario, setUsarPrecioUnitario] = useState(false);
  const [costoTotal, setCostoTotal] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [costoCalculado, setCostoCalculado] = useState<number>(0);
  const [galponSeleccionado, setGalponSeleccionado] = useState<string>('');
  const [busquedaGalpon, setBusquedaGalpon] = useState('');
  const [modalGalponVisible, setModalGalponVisible] = useState(false);
  const [diasMaduracion, setDiasMaduracion] = useState('');
  
  const { crearLote, isLoading } = useLevantes();
  const { user } = useAuthStore();
  const { galpones, cargarGalpones } = useGalpones();

  useEffect(() => {
    cargarGalpones();
  }, [cargarGalpones]);

  const galponesFiltrados = useMemo(() => {
    const termino = busquedaGalpon.trim().toLowerCase();
    if (!termino) return galpones;
    return galpones.filter((galpon) => galpon.nombre.toLowerCase().includes(termino));
  }, [galpones, busquedaGalpon]);

  useEffect(() => {
    if (usarPrecioUnitario && costoUnitario && numeroAves) {
      const unitario = parseFloat(costoUnitario);
      const cantidad = parseInt(numeroAves, 10);
      if (!isNaN(unitario) && !isNaN(cantidad)) {
        setCostoCalculado(unitario * cantidad);
      }
    } else if (!usarPrecioUnitario && costoTotal) {
      const total = parseFloat(costoTotal);
      if (!isNaN(total)) {
        setCostoCalculado(total);
      }
    }
  }, [usarPrecioUnitario, costoUnitario, costoTotal, numeroAves]);
  const handleCrearLote = async () => {
    if (!nombre || !numeroAves || !fechaNacimiento) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    if (!galponSeleccionado) {
      Alert.alert('Galpón requerido', 'Selecciona el galpón donde alojaremos el lote.');
      return;
    }
    
    const cantidad = parseInt(numeroAves, 10);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a cero');
      return;
    }
    
    const fechaNac = new Date(fechaNacimiento);
    if (isNaN(fechaNac.getTime())) {
      Alert.alert('Error', 'La fecha de nacimiento debe ser válida');
      return;
    }
    
    if (fechaNac > new Date()) {
      Alert.alert('Error', 'La fecha de nacimiento no puede ser futura');
      return;
    }
    
    try {
      await crearLote({
        nombre: nombre.trim(),
        fechaInicio: new Date(),
        fechaNacimiento: fechaNac,
        cantidadInicial: cantidad,
        cantidadActual: cantidad,
        raza: raza,
        estado: EstadoLote.ACTIVO,
        tipo: TipoAve.POLLO_LEVANTE,
        createdBy: user?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        galponId: galponSeleccionado,
        ...(costoCalculado > 0 && { costo: costoCalculado }),
        ...(usarPrecioUnitario && costoUnitario && { costoUnitario: parseFloat(costoUnitario) }),
        ...(diasMaduracion && { diasMaduracion: parseInt(diasMaduracion, 10) }),
        ...observaciones.trim() && { observaciones: observaciones.trim() }
      });

      Alert.alert(
        'Éxito', 
        'Lote de levante creado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('❌ Error en UI al crear lote:', error);
      Alert.alert(
        'Error', 
        error.message || 'Error al crear el lote de levante'
      );
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <AppHeader 
        title="Nuevo Lote de Levante"
        showBack
        showProfile={false}
        showNotifications={false}
        tintColor={colors.secondary}
        secondaryAction={{
          label: 'Cancelar',
          onPress: handleCancel,
          icon: 'close',
          tintColor: colors.secondary,
        }}
        primaryAction={{
          label: 'Guardar',
          onPress: handleCrearLote,
          loading: isLoading,
          icon: 'checkmark',
          tintColor: colors.secondary,
        }}
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}> 
        <Card style={styles.card}>
        
        {/* Galpón selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Galpón <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.galponSelector}
            onPress={() => setModalGalponVisible(true)}
          >
            <Ionicons name="business" size={18} color={colors.secondary} />
            <Text style={styles.galponSelectorText}>
              {galponSeleccionado
                ? galpones.find((g) => g.id === galponSeleccionado)?.nombre || 'No disponible'
                : 'Seleccionar galpón'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textMedium} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Nombre del Lote"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Lote 001"
            required
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Cantidad de Aves"
            value={numeroAves}
            onChangeText={setNumeroAves}
            placeholder="Ej: 150"
            keyboardType="numeric"
            required
          />
        </View>
        
        {/* Sección de Costos */}
        <View style={styles.costSection}>
          <Text style={styles.sectionTitle}>💰 Información de Costos</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Usar precio por ave</Text>
            <Switch
              value={usarPrecioUnitario}
              onValueChange={setUsarPrecioUnitario}
              trackColor={{ false: colors.lightGray, true: colors.secondary }}
              thumbColor={usarPrecioUnitario ? colors.white : colors.gray}
            />
          </View>
        
          {usarPrecioUnitario ? (
            <View style={styles.formGroup}>
              <Input
                label="Precio por Ave ($)"
                value={costoUnitario}
                onChangeText={setCostoUnitario}
                placeholder="Ej: 12.50"
                keyboardType="decimal-pad"
              />
              {costoCalculado > 0 && (
                <Text style={styles.calculatedCost}>
                  Costo total calculado: ${costoCalculado.toFixed(2)}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.formGroup}>
              <Input
                label="Costo Total del Lote ($)"
                value={costoTotal}
                onChangeText={setCostoTotal}
                placeholder="Ej: 1875.00"
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <DatePicker
            label="Fecha de Nacimiento"
            value={fechaNacimiento}
            onDateChange={setFechaNacimiento}
            placeholder="Seleccionar fecha de nacimiento"
            required
            maximumDate={new Date()}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Raza <Text style={styles.required}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.razaSelector}>
            {Object.values(RazaPollo).map((razaOption) => (
              <Button
                key={razaOption}
                title={razaOption.replace('_', ' ')}
                onPress={() => setRaza(razaOption)}
                variant={raza === razaOption ? 'primary' : 'outline'}
                size="small"
                style={styles.razaButton}
              />
            ))}
          </ScrollView>
        </View>
        
        {/* Sección de Maduración */}
        <View style={styles.maturationSection}>
          <Text style={styles.sectionTitle}>📅 Días de Maduración</Text>
          <Text style={styles.helperText}>
            Ingresa el número de días estimados hasta la maduración/venta del lote
          </Text>
          <View style={styles.formGroup}>
            <Input
              label="Días de Maduración (opcional)"
              value={diasMaduracion}
              onChangeText={setDiasMaduracion}
              placeholder="Ej: 120"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Input
            label="Observaciones"
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Notas adicionales sobre el lote"
            multiline
            numberOfLines={3}
          />
        </View>
        
        </Card>

        <Modal visible={modalGalponVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecciona un galpón</Text>
                <TouchableOpacity onPress={() => setModalGalponVisible(false)}>
                  <Ionicons name="close" size={20} color={colors.textDark} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalSearch}>
                <Ionicons name="search" size={16} color={colors.lightGray} />
                <TextInput
                  value={busquedaGalpon}
                  onChangeText={setBusquedaGalpon}
                  placeholder="Buscar galpón"
                  placeholderTextColor={colors.lightGray}
                  style={styles.modalInput}
                />
                {busquedaGalpon ? (
                  <TouchableOpacity onPress={() => setBusquedaGalpon('')}>
                    <Ionicons name="close-circle" size={16} color={colors.lightGray} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <ScrollView style={styles.modalList}>
                {galponesFiltrados.length === 0 ? (
                  <Text style={styles.helperText}>No hay galpones que coincidan.</Text>
                ) : (
                  galponesFiltrados.map((galpon) => (
                    <TouchableOpacity
                      key={galpon.id}
                      style={styles.modalItem}
                      onPress={() => {
                        setGalponSeleccionado(galpon.id);
                        setModalGalponVisible(false);
                      }}
                    >
                      <Text style={styles.modalItemText}>{galpon.nombre}</Text>
                      {galponSeleccionado === galpon.id && (
                        <Ionicons name="checkmark" size={18} color={colors.secondary} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Card>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 12,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: colors.danger,
  },
  costSection: {
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.textDark,
    fontWeight: '500',
  },
  calculatedCost: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 6,
  },
  razaSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  razaButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    minWidth: 70,
  },
  saveButton: {
    minWidth: 70,
  },
  galponSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  galponSelectorText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    paddingBottom: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  modalList: {
    paddingHorizontal: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalItemText: {
    fontSize: 15,
    color: colors.textDark,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  maturationSection: {
    backgroundColor: colors.secondary + '08',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '20',
  },
});

