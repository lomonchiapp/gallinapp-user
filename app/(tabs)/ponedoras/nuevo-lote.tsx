/**
 * Pantalla para crear un nuevo lote de gallinas ponedoras
 */

import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import AppHeader from '../../../src/components/layouts/AppHeader';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useGalpones } from '../../../src/hooks/useGalpones';
import { usePonedorasStore } from '../../../src/stores/ponedorasStore';
import { EstadoLote, RazaGallina, TipoAve } from '../../../src/types/enums';

export default function NuevoLotePonedorasScreen() {
  const [nombre, setNombre] = useState('');
  const [numeroAves, setNumeroAves] = useState('');
  const [raza, setRaza] = useState<RazaGallina>(RazaGallina.HYLINE_BROWN);
  const [estadoSalud, setEstadoSalud] = useState('Saludable');
  const [observaciones, setObservaciones] = useState('');
  const [usarPrecioUnitario, setUsarPrecioUnitario] = useState(false);
  const [costoTotal, setCostoTotal] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [costoCalculado, setCostoCalculado] = useState<number>(0);
  const [galponSeleccionado, setGalponSeleccionado] = useState<string>('');

  const { crearLote, isLoading } = usePonedorasStore();
  const { galpones, cargarGalpones } = useGalpones();

  useEffect(() => {
    cargarGalpones();
  }, [cargarGalpones]);

  const galponesOrdenados = useMemo(
    () => galpones.slice().sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [galpones]
  );

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
    if (!nombre || !numeroAves) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    if (!galponSeleccionado) {
      Alert.alert('Galpón requerido', 'Selecciona el galpón donde estará el lote.');
      return;
    }

    const cantidad = parseInt(numeroAves, 10);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a cero');
      return;
    }

    try {
      await crearLote({
        nombre: nombre.trim(),
        fechaInicio: new Date(),
        cantidadInicial: cantidad,
        cantidadActual: cantidad,
        raza,
        estado: EstadoLote.ACTIVO,
        tipo: TipoAve.PONEDORA,
        galponId: galponSeleccionado,
        ...(costoCalculado > 0 && { costo: costoCalculado }),
        ...(usarPrecioUnitario && costoUnitario && {
          costoUnitario: parseFloat(costoUnitario),
        }),
        ...(observaciones.trim() && { observaciones: observaciones.trim() }),
        ...(estadoSalud.trim() && { estadoSalud: estadoSalud.trim() }),
      });

      Alert.alert('Éxito', 'Lote de ponedoras creado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('❌ Error en UI al crear lote:', error);
      Alert.alert('Error', error.message || 'Error al crear el lote de ponedoras');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <AppHeader 
        title="Nuevo Lote de Ponedoras"
        showBack
        showProfile={false}
        showNotifications={false}
        tintColor={colors.ponedoras}
        secondaryAction={{
          label: 'Cancelar',
          onPress: handleCancel,
          icon: 'close',
          tintColor: colors.ponedoras,
        }}
        primaryAction={{
          label: 'Guardar',
          onPress: handleCrearLote,
          loading: isLoading,
          icon: 'checkmark',
          tintColor: colors.ponedoras,
        }}
      />
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.card}>
        
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
            placeholder="Ej: 100"
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
              trackColor={{ false: colors.lightGray, true: colors.ponedoras }}
              thumbColor={usarPrecioUnitario ? colors.white : colors.mediumGray}
            />
          </View>

          {usarPrecioUnitario ? (
            <View style={styles.formGroup}>
              <Input
                label="Precio por Gallina ($)"
                value={costoUnitario}
                onChangeText={setCostoUnitario}
                placeholder="Ej: 25.00"
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
                placeholder="Ej: 2500.00"
                keyboardType="decimal-pad"
              />
            </View>
          )}
        </View>
        
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Raza <Text style={styles.required}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.razaSelector}>
            {Object.values(RazaGallina).map((razaOption) => (
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
        
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Galpón <Text style={styles.required}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galponSelector}>
            {galponesOrdenados.length === 0 ? (
              <Text style={styles.emptyGalponText}>No hay galpones registrados</Text>
            ) : (
              galponesOrdenados.map((galpon) => (
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
          </ScrollView>
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
    color: colors.ponedoras,
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
    marginBottom: 8,
  },
  galponButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  emptyGalponText: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 8,
  },
});

