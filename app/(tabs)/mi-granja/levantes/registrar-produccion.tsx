/**
 * Pantalla para registrar producción/crecimiento de pollos de levante
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Input from '../../../../src/components/ui/Input';
import { colors } from '../../../../src/constants/colors';
import { useLevantesStore } from '../../../../src/stores/levantesStore';

export default function RegistrarProduccionLevantesScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const [edad, setEdad] = useState('');
  const [pesoPromedio, setPesoPromedio] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lote, setLote] = useState<any>(null);
  
  const { lotes, registrarEdad, isLoading, error } = useLevantesStore();
  
  // Cargar datos del lote
  useEffect(() => {
    if (loteId) {
      const loteEncontrado = lotes.find(l => l.id === loteId);
      if (loteEncontrado) {
        setLote(loteEncontrado);
      } else {
        Alert.alert('Error', 'No se pudo encontrar el lote');
        router.back();
      }
    }
  }, [loteId, lotes]);
  
  const handleRegistrarProduccion = async () => {
    // Validar edad
    if (!edad || isNaN(parseInt(edad)) || parseInt(edad) <= 0) {
      Alert.alert('Error', 'Por favor ingrese una edad válida en días');
      return;
    }
    
    // Validar peso promedio
    if (!pesoPromedio || isNaN(parseFloat(pesoPromedio)) || parseFloat(pesoPromedio) <= 0) {
      Alert.alert('Error', 'Por favor ingrese un peso promedio válido');
      return;
    }
    
    const edadNum = parseInt(edad);
    const pesoNum = parseFloat(pesoPromedio);
    
    try {
      const registroData: any = {
        loteId: loteId as string,
        fecha: new Date(),
        edadDias: edadNum,
        pesoPromedio: pesoNum,
      };
      
      // Solo agregar observaciones si hay contenido
      if (observaciones && observaciones.trim()) {
        registroData.observaciones = observaciones.trim();
      }
      
      await registrarEdad(registroData);
      
      Alert.alert(
        'Éxito', 
        'Registro de crecimiento guardado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar crecimiento');
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="trending-up" size={32} color={colors.israelies} />
          <Text style={styles.title}>Registrar Crecimiento</Text>
        </View>
        
        {lote ? (
          <View style={styles.loteInfoContainer}>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Lote:</Text> {lote.nombre}
            </Text>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Pollos actuales:</Text> {lote.numeroAves}
            </Text>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Fecha:</Text> {new Date().toLocaleDateString('es-ES')}
            </Text>
          </View>
        ) : (
          <Text style={styles.errorText}>Cargando información del lote...</Text>
        )}
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.formGroup}>
          <Input
            label="Edad en Días"
            value={edad}
            onChangeText={setEdad}
            keyboardType="numeric"
            placeholder="Ingrese la edad actual en días"
            required
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Peso Promedio (libras)"
            value={pesoPromedio}
            onChangeText={setPesoPromedio}
            keyboardType="decimal-pad"
            placeholder="Ingrese el peso promedio"
            required
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Observaciones (Opcional)"
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Notas sobre el crecimiento y desarrollo"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={() => router.back()}
            variant="outline"
            style={styles.button}
          />
          <Button
            title="Registrar"
            onPress={handleRegistrarProduccion}
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
  loteInfoContainer: {
    marginBottom: 16,
    backgroundColor: colors.israelies + '10',
    padding: 12,
    borderRadius: 8,
  },
  loteInfo: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 4,
  },
  loteInfoLabel: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  formGroup: {
    marginBottom: 16,
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
});
