/**
 * Componente de gráfico de crecimiento para mostrar la evolución del peso
 */

import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { PesoRegistro } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface GrowthChartProps {
  registros: PesoRegistro[];
  title?: string;
  color?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 32;
const chartHeight = 200;

export default function GrowthChart({ 
  registros, 
  title = "Evolución del Peso", 
  color = colors.primary 
}: GrowthChartProps) {
  if (registros.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No hay datos suficientes para mostrar el gráfico</Text>
      </View>
    );
  }

  // Ordenar registros por fecha (más antiguos primero)
  const registrosOrdenados = [...registros].reverse();
  
  // Calcular valores para el gráfico
  const pesos = registrosOrdenados.map(r => r.pesoPromedio);
  const minPeso = Math.min(...pesos);
  const maxPeso = Math.max(...pesos);
  const rangoPeso = maxPeso - minPeso || 1; // Evitar división por 0
  
  // Calcular posiciones de los puntos
  const puntos = registrosOrdenados.map((registro, index) => {
    const x = (index / (registrosOrdenados.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - 40 - ((registro.pesoPromedio - minPeso) / rangoPeso) * (chartHeight - 80);
    return { x, y, registro };
  });

  // Crear líneas de la cuadrícula
  const lineasHorizontales = [];
  for (let i = 0; i <= 4; i++) {
    const y = 20 + (i * (chartHeight - 40) / 4);
    const valor = maxPeso - (i * rangoPeso / 4);
    lineasHorizontales.push({ y, valor });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chartContainer, { width: Math.max(chartWidth, registrosOrdenados.length * 60) }]}>
          {/* Líneas de cuadrícula horizontales */}
          {lineasHorizontales.map((linea, index) => (
            <View key={index}>
              <View 
                style={[
                  styles.gridLine, 
                  { top: linea.y, width: chartWidth - 40 }
                ]} 
              />
              <Text style={[styles.yAxisLabel, { top: linea.y - 8 }]}>
                {linea.valor.toFixed(1)}
              </Text>
            </View>
          ))}

          {/* Línea de tendencia */}
          {puntos.length > 1 && (
            <View style={styles.lineContainer}>
              {puntos.slice(0, -1).map((punto, index) => {
                const siguientePunto = puntos[index + 1];
                const distancia = Math.sqrt(
                  Math.pow(siguientePunto.x - punto.x, 2) + 
                  Math.pow(siguientePunto.y - punto.y, 2)
                );
                const angulo = Math.atan2(
                  siguientePunto.y - punto.y, 
                  siguientePunto.x - punto.x
                ) * (180 / Math.PI);

                return (
                  <View
                    key={index}
                    style={[
                      styles.line,
                      {
                        left: punto.x,
                        top: punto.y,
                        width: distancia,
                        transform: [{ rotate: `${angulo}deg` }],
                        backgroundColor: color,
                      }
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Puntos de datos */}
          {puntos.map((punto, index) => (
            <View key={index}>
              <View
                style={[
                  styles.dataPoint,
                  {
                    left: punto.x - 4,
                    top: punto.y - 4,
                    backgroundColor: color,
                  }
                ]}
              />
              
              {/* Etiqueta del peso */}
              <Text
                style={[
                  styles.dataLabel,
                  {
                    left: punto.x - 15,
                    top: punto.y - 25,
                  }
                ]}
              >
                {punto.registro.pesoPromedio.toFixed(1)}
              </Text>
              
              {/* Etiqueta de fecha */}
              <Text
                style={[
                  styles.dateLabel,
                  {
                    left: punto.x - 20,
                    top: chartHeight - 15,
                  }
                ]}
              >
                {formatDate(punto.registro.fecha).split('/').slice(0, 2).join('/')}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: color }]} />
          <Text style={styles.legendText}>Peso promedio (kg)</Text>
        </View>
        {registros.length > 1 && (
          <Text style={styles.trendText}>
            Tendencia: {pesos[pesos.length - 1] > pesos[0] ? '↗️ Creciendo' : '↘️ Decreciendo'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    height: chartHeight,
    position: 'relative',
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.veryLightGray,
    left: 20,
  },
  yAxisLabel: {
    position: 'absolute',
    left: 2,
    fontSize: 10,
    color: colors.textMedium,
    width: 15,
    textAlign: 'right',
  },
  lineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: 'absolute',
    height: 2,
    transformOrigin: '0 50%',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  dataLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textDark,
    width: 30,
    textAlign: 'center',
  },
  dateLabel: {
    position: 'absolute',
    fontSize: 9,
    color: colors.textMedium,
    width: 40,
    textAlign: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textMedium,
  },
  trendText: {
    fontSize: 12,
    color: colors.textMedium,
    fontWeight: '500',
  },
  emptyChart: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.veryLightGray,
    borderRadius: 8,
    margin: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
  },
});

















