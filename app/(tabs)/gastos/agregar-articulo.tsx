/**
 * Pantalla simple para agregar un artículo (solo nombre)
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useArticulosStore } from '../../../src/stores/articulosStore';
import { UnidadMedida } from '../../../src/types/enums';

export default function AgregarArticuloScreen() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>(UnidadMedida.UNIDAD);
  const [costoFijo, setCostoFijo] = useState(false);
  const { crearNuevoArticulo, isLoading, error } = useArticulosStore();
  
  const handleAgregarArticulo = async () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Por favor ingrese el nombre del artículo');
      return;
    }

    if (costoFijo && (!precio.trim() || isNaN(parseFloat(precio)) || parseFloat(precio) < 0)) {
      Alert.alert('Error', 'Por favor ingrese un precio válido para artículos de costo fijo');
      return;
    }
    
    try {
      const articuloData = {
        nombre: nombre.trim(),
        precio: costoFijo ? parseFloat(precio) : 0,
        unidadMedida,
        costoFijo,
        activo: true,
      };

      await crearNuevoArticulo(articuloData);
      
      Alert.alert(
        'Éxito', 
        'Artículo agregado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al agregar artículo');
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
          <Text style={styles.title}>Agregar Artículo</Text>
        </View>
        
        <Text style={styles.description}>
          Agregue un nuevo artículo que podrá usar para registrar gastos en sus lotes
        </Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.formGroup}>
          <Input
            label="Nombre del Artículo"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Maíz, Vacunas, Vinagre..."
            required
          />
        </View>

       


        <View style={styles.formGroup}>
          <View style={styles.costoFijoContainer}>
            <TouchableOpacity
              style={styles.costoFijoToggle}
              onPress={() => setCostoFijo(!costoFijo)}
            >
              <View style={[
                styles.checkbox,
                costoFijo && styles.checkboxSelected
              ]}>
                {costoFijo && <Ionicons name="checkmark" size={16} color={colors.white} />}
              </View>
              <Text style={styles.costoFijoLabel}>Precio Fijo</Text>
            </TouchableOpacity>
            <Text style={styles.costoFijoDescription}>
              Marque si este artículo tiene un precio fijo conocido
            </Text>
          </View>
        </View>

        {costoFijo && (
          <View style={styles.formGroup}>
            <Input
              label="Precio (RD$)"
              value={precio}
              onChangeText={setPrecio}
              placeholder="0.00"
              keyboardType="numeric"
              required
            />
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Agregar Artículo"
            onPress={handleAgregarArticulo}
            loading={isLoading}
            style={styles.button}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 24,
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  unidadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unidadOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    backgroundColor: colors.white,
  },
  unidadOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unidadOptionText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  unidadOptionTextSelected: {
    color: colors.white,
    fontWeight: '500',
  },
  costoFijoContainer: {
    marginTop: 8,
  },
  costoFijoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.veryLightGray,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  costoFijoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
  },
  costoFijoDescription: {
    fontSize: 14,
    color: colors.textMedium,
    marginLeft: 28,
    fontStyle: 'italic',
  },
});

