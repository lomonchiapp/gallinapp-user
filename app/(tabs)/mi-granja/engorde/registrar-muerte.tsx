/**
 * Pantalla para registrar mortalidad en lotes de engorde
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
import { useMortalityStore } from '../../../../src/stores/mortalityStore';
import { TipoAve } from '../../../../src/types';

export default function RegistrarMuerteScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const [cantidad, setCantidad] = useState('');
  const [causa, setCausa] = useState('');
  const [lote, setLote] = useState<any>(null);
  
  const { registrarNuevaMortalidad, isLoading: mortalityLoading, error: mortalityError } = useMortalityStore();
  const { lotes, cargarLote, isLoading: loteLoading } = useEngordeStore();
  
  const isLoading = mortalityLoading || loteLoading;
  const error = mortalityError;
  
  // Cargar datos del lote
  useEffect(() => {
    if (loteId) {
      const cargarDatosLote = async () => {
        try {
          // Primero intentamos encontrar el lote en el estado actual
          let loteEncontrado = lotes.find(l => l.id === loteId);
          
          // Si no lo encontramos, lo cargamos desde Firebase
          if (!loteEncontrado) {
            await cargarLote(loteId);
            loteEncontrado = lotes.find(l => l.id === loteId);
          }
          
          if (loteEncontrado) {
            setLote(loteEncontrado);
          } else {
            Alert.alert('Error', 'No se pudo encontrar el lote');
            router.back();
          }
        } catch (error) {
          console.error('Error al cargar lote:', error);
          Alert.alert('Error', 'No se pudo cargar la información del lote');
          router.back();
        }
      };
      
      cargarDatosLote();
    }
  }, [loteId, lotes]);
  
  const handleRegistrarMuerte = async () => {
    // Validar cantidad
    if (!cantidad || isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida');
      return;
    }
    
    try {
      await registrarNuevaMortalidad(
        loteId as string, 
        TipoAve.POLLO_ENGORDE, 
        parseInt(cantidad), 
        causa
      );
      
      Alert.alert(
        'Éxito', 
        'Mortalidad registrada correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      // El error se maneja en el store
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={32} color={colors.danger} />
          <Text style={styles.title}>Registrar Mortalidad</Text>
        </View>
        
        <Text style={styles.loteInfo}>
          Lote: {lote?.nombre || 'Cargando...'}
        </Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.formGroup}>
          <Input
            label="Cantidad de Aves Muertas"
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
            placeholder="Ingrese la cantidad"
            required
          />
        </View>
        
        <View style={styles.formGroup}>
          <Input
            label="Causa (Opcional)"
            value={causa}
            onChangeText={setCausa}
            placeholder="Ingrese la causa de la muerte"
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
            onPress={handleRegistrarMuerte}
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
  loteInfo: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 16,
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

