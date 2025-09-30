/**
 * Panel de predicciones de rendimiento con ML
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../constants/colors';
import { generarPredicciones as generarPrediccionesService, PredictionData, PredictionResult } from '../../services/ml-predictions.service';
import { formatDate } from '../../utils/dateUtils';
import Card from './Card';

interface PredictionsPanelProps {
  data: PredictionData;
  style?: any;
}

export default function PredictionsPanel({ data, style }: PredictionsPanelProps) {
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    generarPredicciones();
  }, [data]);

  const generarPredicciones = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await generarPrediccionesService(data);
      setPredictions(result);
    } catch (err) {
      setError('Error al generar predicciones');
      console.error('Error en predicciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.primary;
    if (confidence >= 0.4) return colors.warning;
    return colors.danger;
  };

  const getRecommendationColor = (tipo: string): string => {
    switch (tipo) {
      case 'critico': return colors.danger;
      case 'importante': return colors.warning;
      case 'sugerencia': return colors.primary;
      default: return colors.textMedium;
    }
  };

  const getRecommendationIcon = (tipo: string): string => {
    switch (tipo) {
      case 'critico': return 'warning';
      case 'importante': return 'alert-circle';
      case 'sugerencia': return 'bulb';
      default: return 'information-circle';
    }
  };

  if (loading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Generando predicciones...</Text>
        </View>
      </Card>
    );
  }

  if (error || !predictions) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={32} color={colors.danger} />
          <Text style={styles.errorText}>{error || 'Error desconocido'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generarPredicciones}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color={colors.primary} />
          <Text style={styles.title}>Predicciones IA</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.efficiencyBadge}>
            <Text style={styles.efficiencyText}>
              {predictions.eficienciaProyectada.toFixed(0)}%
            </Text>
          </View>
          <Ionicons 
            name={expanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textMedium} 
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.content} nestedScrollEnabled>
          {/* Predicción de peso */}
          <View style={styles.predictionSection}>
            <Text style={styles.sectionTitle}>Peso Final Proyectado</Text>
            <View style={styles.predictionCard}>
              <View style={styles.predictionMain}>
                <Text style={styles.predictionValue}>
                  {predictions.pesoFinal.valor.toFixed(2)} kg
                </Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(predictions.pesoFinal.confianza) + '20' }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: getConfidenceColor(predictions.pesoFinal.confianza) }
                  ]}>
                    {(predictions.pesoFinal.confianza * 100).toFixed(0)}% confianza
                  </Text>
                </View>
              </View>
              {predictions.pesoFinal.diasParaAlcanzar > 0 && (
                <Text style={styles.predictionDetail}>
                  En {predictions.pesoFinal.diasParaAlcanzar} días aproximadamente
                </Text>
              )}
            </View>
          </View>

          {/* Predicción de mortalidad */}
          <View style={styles.predictionSection}>
            <Text style={styles.sectionTitle}>Mortalidad Esperada</Text>
            <View style={styles.predictionCard}>
              <View style={styles.predictionMain}>
                <Text style={styles.predictionValue}>
                  {Math.round(predictions.mortalidadEsperada.valor)} aves
                </Text>
                <View style={[
                  styles.confidenceBadge,
                  { backgroundColor: getConfidenceColor(predictions.mortalidadEsperada.confianza) + '20' }
                ]}>
                  <Text style={[
                    styles.confidenceText,
                    { color: getConfidenceColor(predictions.mortalidadEsperada.confianza) }
                  ]}>
                    {(predictions.mortalidadEsperada.confianza * 100).toFixed(0)}% confianza
                  </Text>
                </View>
              </View>
              {predictions.mortalidadEsperada.factoresRiesgo.length > 0 && (
                <View style={styles.riskFactors}>
                  <Text style={styles.riskTitle}>Factores de riesgo:</Text>
                  {predictions.mortalidadEsperada.factoresRiesgo.map((factor, index) => (
                    <Text key={index} style={styles.riskFactor}>• {factor}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Predicción de rentabilidad */}
          <View style={styles.predictionSection}>
            <Text style={styles.sectionTitle}>Rentabilidad Proyectada</Text>
            <View style={styles.predictionCard}>
              <View style={styles.rentabilityGrid}>
                <View style={styles.rentabilityItem}>
                  <Text style={styles.rentabilityValue}>
                    RD${predictions.rentabilidad.ingresoEstimado.toFixed(0)}
                  </Text>
                  <Text style={styles.rentabilityLabel}>Ingreso Estimado</Text>
                </View>
                <View style={styles.rentabilityItem}>
                  <Text style={[
                    styles.rentabilityValue,
                    { color: predictions.rentabilidad.gananciaNeta >= 0 ? colors.success : colors.danger }
                  ]}>
                    RD${predictions.rentabilidad.gananciaNeta.toFixed(0)}
                  </Text>
                  <Text style={styles.rentabilityLabel}>Ganancia Neta</Text>
                </View>
                <View style={styles.rentabilityItem}>
                  <Text style={[
                    styles.rentabilityValue,
                    { color: predictions.rentabilidad.roi >= 15 ? colors.success : colors.warning }
                  ]}>
                    {predictions.rentabilidad.roi.toFixed(1)}%
                  </Text>
                  <Text style={styles.rentabilityLabel}>ROI</Text>
                </View>
              </View>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(predictions.rentabilidad.confianza) + '20', marginTop: 12 }
              ]}>
                <Text style={[
                  styles.confidenceText,
                  { color: getConfidenceColor(predictions.rentabilidad.confianza) }
                ]}>
                  {(predictions.rentabilidad.confianza * 100).toFixed(0)}% confianza en precios
                </Text>
              </View>
            </View>
          </View>

          {/* Fecha óptima de salida */}
          <View style={styles.predictionSection}>
            <Text style={styles.sectionTitle}>Fecha Óptima de Comercialización</Text>
            <View style={styles.predictionCard}>
              <View style={styles.dateContainer}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.optimalDate}>
                  {formatDate(predictions.fechaOptimaSalida)}
                </Text>
              </View>
            </View>
          </View>

          {/* Recomendaciones */}
          {predictions.recomendaciones.length > 0 && (
            <View style={styles.predictionSection}>
              <Text style={styles.sectionTitle}>Recomendaciones</Text>
              <View style={styles.recommendationsContainer}>
                {predictions.recomendaciones.map((rec, index) => (
                  <View key={index} style={[
                    styles.recommendationCard,
                    { borderLeftColor: getRecommendationColor(rec.tipo) }
                  ]}>
                    <View style={styles.recommendationHeader}>
                      <Ionicons 
                        name={getRecommendationIcon(rec.tipo) as any} 
                        size={16} 
                        color={getRecommendationColor(rec.tipo)} 
                      />
                      <Text style={[
                        styles.recommendationType,
                        { color: getRecommendationColor(rec.tipo) }
                      ]}>
                        {rec.tipo.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.recommendationMessage}>{rec.mensaje}</Text>
                    <Text style={styles.recommendationAction}>{rec.accion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 12,
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  efficiencyBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  efficiencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.success,
  },
  content: {
    maxHeight: 600,
  },
  predictionSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  predictionCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
  },
  predictionMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  predictionDetail: {
    fontSize: 12,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  riskFactors: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.danger + '05',
    borderRadius: 6,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 6,
  },
  riskFactor: {
    fontSize: 11,
    color: colors.danger,
    marginBottom: 2,
  },
  rentabilityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rentabilityItem: {
    alignItems: 'center',
    flex: 1,
  },
  rentabilityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  rentabilityLabel: {
    fontSize: 10,
    color: colors.textMedium,
    marginTop: 4,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optimalDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 8,
  },
  recommendationsContainer: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recommendationType: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  recommendationMessage: {
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 6,
    fontWeight: '500',
  },
  recommendationAction: {
    fontSize: 12,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
});
