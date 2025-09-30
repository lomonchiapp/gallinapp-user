/**
 * Formulario para crear nuevo lote de pollos de engorde
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import colors from '../../../constants/colors';
import { useEngordeStore } from '../../../stores/engordeStore';
import { LoteStatus, RazaPollo } from '../../../types';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

export const NuevoLoteForm: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [raza, setRaza] = useState<RazaPollo>(RazaPollo.ROSS_308);
  const [pesoInicial, setPesoInicial] = useState('');
  const [pesoObjetivo, setPesoObjetivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  const { crearLote, isLoading, error, clearError } = useEngordeStore();
  
  const handleCrearLote = async () => {
    // Validaciones
    if (!nombre || !cantidadInicial || !pesoInicial || !pesoObjetivo) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }
    
    const cantidad = parseInt(cantidadInicial, 10);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a cero');
      return;
    }
    
    const pesoIni = parseFloat(pesoInicial);
    if (isNaN(pesoIni) || pesoIni <= 0) {
      Alert.alert('Error', 'El peso inicial debe ser un número válido');
      return;
    }
    
    const pesoObj = parseFloat(pesoObjetivo);
    if (isNaN(pesoObj) || pesoObj <= pesoIni) {
      Alert.alert('Error', 'El peso objetivo debe ser mayor al peso inicial');
      return;
    }
    
    try {
      await crearLote({
        nombre,
        fechaInicio: new Date(),
        cantidadInicial: cantidad,
        cantidadActual: cantidad,
        status: LoteStatus.ACTIVO,
        raza,
        pesoInicial: pesoIni,
        pesoObjetivo: pesoObj,
        observaciones
      });
      
      Alert.alert(
        'Éxito', 
        'Lote creado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      // Los errores se manejan en el store
    }
  };
  
  const handleCancel = () => {
    router.back();
  };
  
  // Limpiar error al montar el componente
  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, []);
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Nuevo Lote de Pollos de Engorde</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
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
          label="Cantidad Inicial"
          value={cantidadInicial}
          onChangeText={setCantidadInicial}
          placeholder="Ej: 200"
          keyboardType="numeric"
          required
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
      
      <View style={styles.formGroup}>
        <Input
          label="Peso Inicial (gramos)"
          value={pesoInicial}
          onChangeText={setPesoInicial}
          placeholder="Ej: 40"
          keyboardType="numeric"
          required
        />
      </View>
      
      <View style={styles.formGroup}>
        <Input
          label="Peso Objetivo (gramos)"
          value={pesoObjetivo}
          onChangeText={setPesoObjetivo}
          placeholder="Ej: 2000"
          keyboardType="numeric"
          required
        />
      </View>
      
      <View style={styles.formGroup}>
        <Input
          label="Observaciones"
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Observaciones adicionales..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cancelar"
          onPress={handleCancel}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Crear Lote"
          onPress={handleCrearLote}
          loading={isLoading}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.textDark,
  },
  formGroup: {
    marginBottom: 16,
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
  razaSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  razaButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  errorText: {
    color: colors.danger,
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default NuevoLoteForm;






















