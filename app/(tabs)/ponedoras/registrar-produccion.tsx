/**
 * Pantalla para registrar producción diaria de huevos en lotes de ponedoras
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { usePonedorasStore } from '../../../src/stores/ponedorasStore';

export default function RegistrarProduccionScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const [cantidadHuevos, setCantidadHuevos] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lote, setLote] = useState<any>(null);
  
  const { lotes, registrarProduccionHuevos, isLoading, error } = usePonedorasStore();
  
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
    // Validar cantidad
    if (!cantidadHuevos || isNaN(parseInt(cantidadHuevos)) || parseInt(cantidadHuevos) < 0) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida de huevos');
      return;
    }
    
    const cantidadNum = parseInt(cantidadHuevos);
    
    try {
      const registroData: any = {
        loteId: loteId as string,
        fecha: new Date(),
        cantidadHuevos: cantidadNum,
      };
      
      // Solo agregar observaciones si hay contenido
      if (observaciones && observaciones.trim()) {
        registroData.observaciones = observaciones.trim();
      }
      
      await registrarProduccionHuevos(registroData);

      Alert.alert(
        'Éxito', 
        'Producción registrada correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar producción');
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="egg" size={32} color={colors.ponedoras} />
          <Text style={styles.title}>Registrar Producción de Huevos</Text>
        </View>
        
        {lote ? (
          <View style={styles.loteInfoContainer}>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Lote:</Text> {lote.nombre}
            </Text>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Gallinas actuales:</Text> {lote.numeroAves}
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
            label="Cantidad de Huevos Producidos"
            value={cantidadHuevos}
            onChangeText={setCantidadHuevos}
            keyboardType="numeric"
            placeholder="Ingrese la cantidad de huevos"
            required
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Observaciones (Opcional)"
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Notas sobre la producción del día"
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
    backgroundColor: colors.ponedoras + '10',
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
