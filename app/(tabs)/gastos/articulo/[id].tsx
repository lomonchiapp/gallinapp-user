/**
 * Pantalla para ver y editar un artículo
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Input from '../../../../src/components/ui/Input';
import { colors } from '../../../../src/constants/colors';
import { useArticulosStore } from '../../../../src/stores/articulosStore';
import { MeasurementUnit } from '../../../../src/types/enums';

export default function DetalleArticuloScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { articuloActual, loadArticulo, actualizarArticuloExistente, eliminarArticuloExistente, isLoading, error } = useArticulosStore();
  
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [unidadMedida, setUnidadMedida] = useState<MeasurementUnit>(MeasurementUnit.UNIDAD);
  const [costoFijo, setCostoFijo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Cargar el artículo al montar el componente
  useEffect(() => {
    if (id) {
      loadArticulo(id as string);
    }
  }, [id]);
  
  // Actualizar estados locales cuando se carga el artículo
  useEffect(() => {
    if (articuloActual) {
      setNombre(articuloActual.nombre);
      setDescripcion(articuloActual.descripcion || '');
      setPrecio(articuloActual.precio.toString());
      setUnidadMedida(articuloActual.unidadMedida);
      setCostoFijo(articuloActual.costoFijo);
    }
  }, [articuloActual]);
  
  const handleActualizarArticulo = async () => {
    // Validaciones básicas
    if (!nombre || !precio) {
      Alert.alert('Error', 'Por favor complete los campos obligatorios');
      return;
    }
    
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      Alert.alert('Error', 'El precio debe ser un número válido');
      return;
    }
    
    try {
      await actualizarArticuloExistente(id as string, {
        nombre,
        descripcion: descripcion || undefined,
        precio: precioNum,
        unidadMedida,
        costoFijo
      });
      
      setIsEditing(false);
      Alert.alert('Éxito', 'Artículo actualizado correctamente');
    } catch (error) {
      // El error se maneja en el store
    }
  };
  
  const handleEliminarArticulo = () => {
    Alert.alert(
      'Eliminar Artículo',
      '¿Está seguro que desea eliminar este artículo? Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              await eliminarArticuloExistente(id as string);
              Alert.alert(
                'Éxito', 
                'Artículo eliminado correctamente',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              // El error se maneja en el store
            }
          },
          style: 'destructive',
        },
      ]
    );
  };
  
  if (isLoading && !articuloActual) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.danger} />
        <Text style={styles.loadingText}>Cargando artículo...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="basket" size={32} color={colors.danger} />
          <Text style={styles.title}>
            {isEditing ? 'Editar Artículo' : 'Detalle de Artículo'}
          </Text>
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        {isEditing ? (
          // Formulario de edición
          <>
            <View style={styles.formGroup}>
              <Input
                label="Nombre del Artículo"
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Maíz"
                required
              />
            </View>
            
            <View style={styles.formGroup}>
              <Input
                label="Descripción (Opcional)"
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Descripción del artículo"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Input
                label="Precio"
                value={precio}
                onChangeText={setPrecio}
                placeholder="0.00"
                keyboardType="numeric"
                required
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Unidad de Medida <Text style={styles.required}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unidadSelector}>
                {Object.values(MeasurementUnit).map((unidad) => (
                  <Button
                    key={unidad}
                    title={unidad}
                    onPress={() => setUnidadMedida(unidad)}
                    variant={unidadMedida === unidad ? 'primary' : 'outline'}
                    size="small"
                    style={styles.unidadButton}
                  />
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Costo Fijo</Text>
              <Switch
                value={costoFijo}
                onValueChange={setCostoFijo}
                trackColor={{ false: colors.lightGray, true: colors.danger + '80' }}
                thumbColor={costoFijo ? colors.danger : colors.white}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Cancelar"
                onPress={() => setIsEditing(false)}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Guardar"
                onPress={handleActualizarArticulo}
                loading={isLoading}
                style={styles.button}
              />
            </View>
          </>
        ) : (
          // Vista de detalle
          <>
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Nombre:</Text>
              <Text style={styles.detailValue}>{articuloActual?.nombre}</Text>
            </View>
            
            {articuloActual?.descripcion && (
              <View style={styles.detailGroup}>
                <Text style={styles.detailLabel}>Descripción:</Text>
                <Text style={styles.detailValue}>{articuloActual.descripcion}</Text>
              </View>
            )}
            
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Precio:</Text>
              <Text style={styles.detailValue}>
                ${articuloActual?.precio.toFixed(2)} / {articuloActual?.unidadMedida}
              </Text>
            </View>
            
            <View style={styles.detailGroup}>
              <Text style={styles.detailLabel}>Tipo de Costo:</Text>
              <Text style={styles.detailValue}>
                {articuloActual?.costoFijo ? 'Fijo' : 'Variable'}
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Eliminar"
                onPress={handleEliminarArticulo}
                variant="danger"
                style={styles.button}
              />
              <Button
                title="Editar"
                onPress={() => setIsEditing(true)}
                style={styles.button}
              />
            </View>
          </>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMedium,
  },
  card: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 12,
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
  unidadSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  unidadButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  detailGroup: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textDark,
  },
});

