/**
 * Formulario dinámico para registrar peso de pollos
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { registrarPeso } from '../../../src/services/peso.service';
import { useLevantesStore } from '../../../src/stores/levantesStore';
import { TipoAve } from '../../../src/types';
import { formatDate } from '../../../src/utils/dateUtils';
import { WeightUnit, WeightValue, convertToPounds, formatWeight, getUnitLabel, validateWeight } from '../../../src/utils/weightUtils';

export default function RegistrarPesoScreen() {
  const { loteId } = useLocalSearchParams<{ loteId: string }>();
  const [cantidadPollos, setCantidadPollos] = useState('');
  const [pesosIndividuales, setPesosIndividuales] = useState<string[]>([]);
  const [unidadPeso, setUnidadPeso] = useState<WeightUnit>(WeightUnit.POUNDS);
  const [observaciones, setObservaciones] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mostrandoInputs, setMostrandoInputs] = useState(false);

  const { loteActual, cargarLote, isLoading: loteLoading, error } = useLevantesStore();

  // Cargar información del lote
  useEffect(() => {
    if (loteId) {
      cargarLote(loteId);
    }
  }, [loteId]);

  // Generar inputs de peso cuando cambia la cantidad
  const handleCantidadChange = (cantidad: string) => {
    setCantidadPollos(cantidad);
    const num = parseInt(cantidad);
    
    if (num > 0 && num <= 50) { // Límite máximo de 50 pollos
      const nuevosInputs = Array(num).fill('');
      setPesosIndividuales(nuevosInputs);
      setMostrandoInputs(true);
    } else {
      setPesosIndividuales([]);
      setMostrandoInputs(false);
    }
  };

  // Actualizar peso individual
  const handlePesoChange = (index: number, peso: string) => {
    const nuevosPesos = [...pesosIndividuales];
    nuevosPesos[index] = peso;
    setPesosIndividuales(nuevosPesos);
  };

  // Calcular estadísticas en tiempo real
  const calcularEstadisticas = () => {
    const pesosValidos = pesosIndividuales
      .map(p => parseFloat(p))
      .filter(p => !isNaN(p) && p > 0)
      .map(p => ({ value: p, unit: unidadPeso }));

    if (pesosValidos.length === 0) {
      return { 
        totalLibras: 0, 
        promedioLibras: 0, 
        totalUnidadActual: 0,
        promedioUnidadActual: 0,
        completados: 0, 
        faltantes: pesosIndividuales.length 
      };
    }

    // Calcular totales en libras (unidad estándar del sistema)
    const totalLibras = pesosValidos.reduce((sum, peso) => sum + convertToPounds(peso), 0);
    const promedioLibras = totalLibras / pesosValidos.length;
    
    // Calcular totales en la unidad actual para mostrar
    const totalUnidadActual = pesosValidos.reduce((sum, peso) => sum + peso.value, 0);
    const promedioUnidadActual = totalUnidadActual / pesosValidos.length;

    const completados = pesosValidos.length;
    const faltantes = pesosIndividuales.length - completados;

    return { 
      totalLibras, 
      promedioLibras, 
      totalUnidadActual,
      promedioUnidadActual,
      completados, 
      faltantes 
    };
  };

  // Validar formulario
  const validarFormulario = () => {
    if (!cantidadPollos || parseInt(cantidadPollos) <= 0) {
      Alert.alert('Error', 'Debe especificar una cantidad válida de pollos');
      return false;
    }

    const pesosValidos = pesosIndividuales
      .map(p => parseFloat(p))
      .filter(p => !isNaN(p) && p > 0);

    if (pesosValidos.length !== pesosIndividuales.length) {
      Alert.alert('Error', 'Debe completar todos los pesos de los pollos');
      return false;
    }

    // Validar cada peso usando las utilidades de peso
    for (let i = 0; i < pesosValidos.length; i++) {
      const peso: WeightValue = { value: pesosValidos[i], unit: unidadPeso };
      const validacion = validateWeight(peso);
      if (!validacion.isValid) {
        Alert.alert('Error', `Pollo ${i + 1}: ${validacion.message}`);
        return false;
      }
    }

    return true;
  };

  // Registrar peso
  const handleRegistrarPeso = async () => {
    if (!validarFormulario() || !loteActual) return;

    setIsLoading(true);
    try {
      // Convertir todos los pesos a libras (unidad estándar del sistema)
      const pesosEnLibras = pesosIndividuales
        .map(p => parseFloat(p))
        .map(p => convertToPounds({ value: p, unit: unidadPeso }));

      const estadisticas = calcularEstadisticas();

      await registrarPeso({
        loteId: loteId,
        tipoLote: TipoAve.POLLO_LEVANTE,
        fecha: new Date(),
        edadEnDias: 0, // Se calcula automáticamente en el servicio
        edadEnSemanas: 0, // Se calcula automáticamente en el servicio
        cantidadPollosPesados: pesosEnLibras.length,
        pesosIndividuales: pesosEnLibras, // Guardamos en libras
        pesoPromedio: estadisticas.promedioLibras, // Promedio en libras
        pesoTotal: estadisticas.totalLibras, // Total en libras
        ...(observaciones.trim() && { observaciones: observaciones.trim() })
      });

      Alert.alert(
        'Éxito',
        'El registro de peso se ha guardado correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo registrar el peso');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-llenar pesos para testing (solo en desarrollo)
  const autoLlenarPesos = () => {
    const pesosAleatorios = pesosIndividuales.map(() => {
      if (unidadPeso === WeightUnit.POUNDS) {
        return (Math.random() * 2 + 3).toFixed(2); // Pesos entre 3-5 libras
      } else {
        return (Math.random() * 32 + 48).toFixed(1); // Pesos entre 48-80 onzas (3-5 libras)
      }
    });
    setPesosIndividuales(pesosAleatorios);
  };

  const estadisticas = calcularEstadisticas();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Registrar Peso</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Información del lote */}
      <Card style={styles.loteCard}>
        <Text style={styles.cardTitle}>Información del Lote</Text>
        {loteLoading ? (
          <Text style={styles.loteInfo}>Cargando información del lote...</Text>
        ) : loteActual ? (
          <View style={styles.loteInfoContainer}>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Lote:</Text> {loteActual.nombre}
            </Text>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Pollos actuales:</Text> {loteActual.cantidadActual}
            </Text>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Fecha inicio:</Text> {formatDate(loteActual.fechaInicio)}
            </Text>
            <Text style={styles.loteInfo}>
              <Text style={styles.loteInfoLabel}>Raza:</Text> {loteActual.raza}
            </Text>
          </View>
        ) : (
          <Text style={styles.errorText}>No se pudo cargar la información del lote</Text>
        )}
        
        {error && <Text style={styles.errorText}>{error}</Text>}
      </Card>

      {/* Configuración inicial */}
      <Card style={styles.configCard}>
        <Text style={styles.cardTitle}>Configuración del Pesaje</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>¿Cuántos pollos va a pesar?</Text>
          <Input
            value={cantidadPollos}
            onChangeText={handleCantidadChange}
            placeholder="Ej: 10"
            keyboardType="numeric"
            maxLength={2}
            style={styles.cantidadInput}
          />
          <Text style={styles.helperText}>
            Máximo 50 pollos por registro
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Unidad de peso</Text>
          <View style={styles.unitSelector}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unidadPeso === WeightUnit.POUNDS && styles.unitButtonActive
              ]}
              onPress={() => setUnidadPeso(WeightUnit.POUNDS)}
            >
              <Text style={[
                styles.unitButtonText,
                unidadPeso === WeightUnit.POUNDS && styles.unitButtonTextActive
              ]}>
                {getUnitLabel(WeightUnit.POUNDS)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unidadPeso === WeightUnit.OUNCES && styles.unitButtonActive
              ]}
              onPress={() => setUnidadPeso(WeightUnit.OUNCES)}
            >
              <Text style={[
                styles.unitButtonText,
                unidadPeso === WeightUnit.OUNCES && styles.unitButtonTextActive
              ]}>
                {getUnitLabel(WeightUnit.OUNCES)}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            {unidadPeso === WeightUnit.POUNDS 
              ? 'Recomendado: 3-6 libras por pollo de levante'
              : 'Recomendado: 48-96 onzas por pollo de levante'
            }
          </Text>
        </View>

        {__DEV__ && mostrandoInputs && (
          <Button
            title="Auto-llenar (Dev)"
            onPress={autoLlenarPesos}
            variant="outline"
            size="small"
            style={styles.devButton}
          />
        )}
      </Card>

      {/* Inputs de peso dinámicos */}
      {mostrandoInputs && (
        <Card style={styles.pesosCard}>
          <View style={styles.pesosHeader}>
            <Text style={styles.cardTitle}>Pesos Individuales ({getUnitLabel(unidadPeso)})</Text>
            {estadisticas.completados > 0 && (
              <View style={styles.estadisticasChip}>
                <Text style={styles.estadisticasText}>
                  {estadisticas.completados}/{pesosIndividuales.length}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.pesosGrid}>
            {pesosIndividuales.map((peso, index) => (
              <View key={index} style={styles.pesoItem}>
                <Text style={styles.pesoLabel}>Pollo {index + 1}</Text>
                <Input
                  value={peso}
                  onChangeText={(value) => handlePesoChange(index, value)}
                  placeholder={unidadPeso === WeightUnit.POUNDS ? "0.00" : "0.0"}
                  keyboardType="decimal-pad"
                  style={styles.pesoInput}
                  maxLength={unidadPeso === WeightUnit.POUNDS ? 5 : 6}
                />
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Estadísticas en tiempo real */}
      {mostrandoInputs && estadisticas.completados > 0 && (
        <Card style={styles.estadisticasCard}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <View style={styles.estadisticasGrid}>
            <View style={styles.estadisticaItem}>
              <Text style={styles.estadisticaValue}>
                {formatWeight(estadisticas.promedioUnidadActual, unidadPeso)}
              </Text>
              <Text style={styles.estadisticaLabel}>Peso Promedio</Text>
            </View>
            <View style={styles.estadisticaItem}>
              <Text style={styles.estadisticaValue}>
                {formatWeight(estadisticas.totalUnidadActual, unidadPeso)}
              </Text>
              <Text style={styles.estadisticaLabel}>Peso Total</Text>
            </View>
            <View style={styles.estadisticaItem}>
              <Text style={styles.estadisticaValue}>
                {estadisticas.completados}
              </Text>
              <Text style={styles.estadisticaLabel}>Completados</Text>
            </View>
            <View style={styles.estadisticaItem}>
              <Text style={styles.estadisticaValue}>
                {estadisticas.faltantes}
              </Text>
              <Text style={styles.estadisticaLabel}>Faltantes</Text>
            </View>
          </View>
        </Card>
      )}

      {/* Observaciones */}
      {mostrandoInputs && (
        <Card style={styles.observacionesCard}>
          <Text style={styles.cardTitle}>Observaciones (Opcional)</Text>
          <Input
            value={observaciones}
            onChangeText={setObservaciones}
            placeholder="Notas adicionales sobre el pesaje..."
            multiline
            numberOfLines={3}
            style={styles.observacionesInput}
          />
        </Card>
      )}

      {/* Botón de registrar */}
      {mostrandoInputs && (
        <Button
          title="Registrar Peso"
          onPress={handleRegistrarPeso}
          loading={isLoading}
          disabled={estadisticas.faltantes > 0}
          style={styles.submitButton}
        />
      )}
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  loteCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  loteInfoContainer: {
    gap: 8,
  },
  loteInfo: {
    fontSize: 14,
    color: colors.textMedium,
  },
  loteInfoLabel: {
    fontWeight: '600',
    color: colors.textDark,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 8,
  },
  configCard: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  cantidadInput: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  devButton: {
    marginTop: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.veryLightGray,
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: colors.primary,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
  },
  unitButtonTextActive: {
    color: colors.white,
  },
  pesosCard: {
    marginBottom: 16,
  },
  pesosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  estadisticasChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadisticasText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  pesosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pesoItem: {
    width: '48%',
    marginBottom: 12,
  },
  pesoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMedium,
    marginBottom: 4,
  },
  pesoInput: {
    textAlign: 'center',
    fontSize: 14,
  },
  estadisticasCard: {
    marginBottom: 16,
    backgroundColor: colors.primary + '05',
    borderColor: colors.primary + '20',
    borderWidth: 1,
  },
  estadisticasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  estadisticaItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  estadisticaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  estadisticaLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  observacionesCard: {
    marginBottom: 16,
  },
  observacionesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 8,
  },
});
