/**
 * Formulario para crear nuevo lote de gallinas ponedoras
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
import { usePonedorasStore } from '../../../stores/ponedorasStore';
import { EstadoLote, RazaGallina, TipoAve } from '../../../types';
import Button from '../../ui/Button';
import Input from '../../ui/Input';

export const NuevoLoteForm: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [cantidadInicial, setCantidadInicial] = useState('');
  const [raza, setRaza] = useState<RazaGallina>(RazaGallina.ISA_BROWN);
  const [edadInicial, setEdadInicial] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  const { crearLote, isLoading, error, clearError } = usePonedorasStore();
  
  const handleCrearLote = async () => {
    // Validaciones
    if (!nombre || !cantidadInicial || !edadInicial) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }
    
    const cantidad = parseInt(cantidadInicial, 10);
    if (isNaN(cantidad) || cantidad <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a cero');
      return;
    }
    
    const edad = parseInt(edadInicial, 10);
    if (isNaN(edad) || edad < 0) {
      Alert.alert('Error', 'La edad debe ser un número válido');
      return;
    }
    
    try {
      await crearLote({
        nombre, // nombre del lote
        tipo: TipoAve.PONEDORA, // Tipo de lote...
        fechaInicio: new Date(), // Fecha de registro
        cantidadInicial: cantidad, // Cantidad de aves con la que inicia de lote...
        cantidadActual: cantidad, // Cantidad de aves actual en el lote...
        estado: EstadoLote.ACTIVO, // Estado del lote...
        raza, // Raza de las aves...
        fechaNacimiento: new Date(), // Fecha de nacimiento de las aves...
        observaciones, // Observaciones o notas...
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
      <Text style={styles.title}>Nuevo Lote de Gallinas Ponedoras</Text>
      
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
          placeholder="Ej: 100"
          keyboardType="numeric"
          required
        />
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
        <Input
          label="Edad Inicial (semanas)"
          value={edadInicial}
          onChangeText={setEdadInicial}
          placeholder="Ej: 16"
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





