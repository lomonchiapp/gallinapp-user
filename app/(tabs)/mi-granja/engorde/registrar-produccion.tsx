/**
 * Pantalla para registrar producción/peso de pollos de engorde
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Input from '../../../../src/components/ui/Input';
import { colors } from '../../../../src/constants/colors';
import { useEngordeStore } from '../../../../src/stores/engordeStore';

export default function RegistrarProduccionEngordeScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const [pesoPromedio, setPesoPromedio] = useState('');
  const [pesoTotal, setPesoTotal] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [lote, setLote] = useState<any>(null);
  
  const { lotes, registrarPeso, isLoading, error } = useEngordeStore();
  
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
  
  // Calcular peso total automáticamente
  useEffect(() => {
    if (pesoPromedio && lote) {
      const peso = parseFloat(pesoPromedio);
      if (!isNaN(peso)) {
        const total = peso * lote.numeroAves;
        setPesoTotal(total.toFixed(2));
      }
    }
  }, [pesoPromedio, lote]);
  
  const handleRegistrarProduccion = async () => {
    // Validar peso promedio
    if (!pesoPromedio || isNaN(parseFloat(pesoPromedio)) || parseFloat(pesoPromedio) <= 0) {
      Alert.alert('Error', 'Por favor ingrese un peso promedio válido');
      return;
    }
    
    const pesoNum = parseFloat(pesoPromedio);
    const pesoTotalNum = parseFloat(pesoTotal);
    
    try {
      const registroData: any = {
        loteId: loteId as string,
        fecha: new Date(),
        pesoPromedio: pesoNum,
        pesoTotal: pesoTotalNum,
      };
      
      // Solo agregar observaciones si hay contenido
      if (observaciones && observaciones.trim()) {
        registroData.observaciones = observaciones.trim();
      }
      
      await registrarPeso(registroData);
      
      Alert.alert(
        'Éxito', 
        'Registro de peso guardado correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar peso');
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="scale" size={32} color={colors.engorde} />
          <Text style={styles.title}>Registrar Peso</Text>
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
            label="Peso Promedio por Pollo (libras)"
            value={pesoPromedio}
            onChangeText={setPesoPromedio}
            keyboardType="decimal-pad"
            placeholder="Ingrese el peso promedio"
            required
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Peso Total del Lote (libras)"
            value={pesoTotal}
            onChangeText={setPesoTotal}
            keyboardType="decimal-pad"
            placeholder="Se calcula automáticamente"
            editable={false}
            style={styles.readOnlyInput}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Observaciones (Opcional)"
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Notas sobre el peso y desarrollo"
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
    backgroundColor: colors.engorde + '10',
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
  readOnlyInput: {
    backgroundColor: colors.veryLightGray,
    color: colors.textMedium,
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
