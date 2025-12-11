/**
 * AnimatedCharts - Componentes de gráficos con animaciones para métricas
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface AnimatedBarChartProps {
  data: ChartData[];
  title?: string;
  style?: ViewStyle;
  height?: number;
  animated?: boolean;
  showValues?: boolean;
}

interface AnimatedPieChartProps {
  data: ChartData[];
  title?: string;
  style?: ViewStyle;
  size?: number;
  animated?: boolean;
  showPercentages?: boolean;
}

interface AnimatedLineChartProps {
  data: { x: string; y: number }[];
  title?: string;
  style?: ViewStyle;
  height?: number;
  animated?: boolean;
  showDots?: boolean;
}

// Componente de Gráfico de Barras Animado
export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
  data,
  title,
  style,
  height = 200,
  animated = true,
  showValues = true,
}) => {
  const animatedValues = useRef(
    data.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (animated) {
      const animations = animatedValues.map((animValue, index) =>
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1000,
          delay: index * 100,
          useNativeDriver: false,
        })
      );

      Animated.parallel(animations).start();
    } else {
      animatedValues.forEach(animValue => animValue.setValue(1));
    }
  }, [data, animated]);

  const maxValue = Math.max(...data.map(item => item.value));
  const chartWidth = screenWidth - spacing[8];
  const barWidth = (chartWidth - spacing[4] * (data.length + 1)) / data.length;

  return (
    <View style={[styles.chartContainer, style]}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      
      <View style={[styles.barChartContent, { height }]}>
        <View style={styles.barsContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.barColumn}>
              <View style={[styles.barWrapper, { width: barWidth }]}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (item.value / maxValue) * (height - 50)],
                      }),
                      backgroundColor: item.color || colors.primary[500],
                      width: barWidth,
                    },
                  ]}
                />
                {showValues && (
                  <Animated.View
                    style={{
                      opacity: animatedValues[index],
                    }}
                  >
                    <Text style={styles.barValue}>{item.value}</Text>
                  </Animated.View>
                )}
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Componente de Gráfico Circular Animado
export const AnimatedPieChart: React.FC<AnimatedPieChartProps> = ({
  data,
  title,
  style,
  size = 120,
  animated = true,
  showPercentages = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(1);
    }
  }, [data, animated]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <View style={[styles.chartContainer, style]}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      
      <View style={styles.pieChartContent}>
        <View style={styles.pieContainer}>
          {/* Círculo base */}
          <View
            style={[
              styles.pieCircle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <Animated.View
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.primary[500],
                transform: [{
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                }],
              }}
            />
          </View>
        </View>
        
        {/* Leyenda */}
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <Animated.View
              key={index}
              style={[
                styles.legendItem,
                {
                  opacity: animatedValue,
                },
              ]}
            >
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: item.color || colors.primary[500] },
                ]}
              />
              <Text style={styles.legendLabel}>{item.label}</Text>
              {showPercentages && (
                <Text style={styles.legendValue}>
                  {((item.value / total) * 100).toFixed(1)}%
                </Text>
              )}
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Componente de Gráfico de Línea Animado
export const AnimatedLineChart: React.FC<AnimatedLineChartProps> = ({
  data,
  title,
  style,
  height = 150,
  animated = true,
  showDots = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(1);
    }
  }, [data, animated]);

  const maxValue = Math.max(...data.map(item => item.y));
  const minValue = Math.min(...data.map(item => item.y));
  const valueRange = maxValue - minValue;

  return (
    <View style={[styles.chartContainer, style]}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      
      <View style={[styles.lineChartContent, { height }]}>
        <Animated.View
          style={{
            flex: 1,
            opacity: animatedValue,
          }}
        >
          {/* Línea de tendencia simulada */}
          <View style={styles.lineContainer}>
            {data.map((item, index) => (
              <View key={index} style={styles.dataPoint}>
                {showDots && (
                  <View
                    style={[
                      styles.dot,
                      {
                        bottom: ((item.y - minValue) / valueRange) * (height - 40),
                      },
                    ]}
                  />
                )}
                <Text style={styles.xAxisLabel}>{item.x}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginVertical: spacing[2],
  },
  chartTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  
  // Bar Chart Styles
  barChartContent: {
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: spacing[2],
  },
  barColumn: {
    alignItems: 'center',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: borderRadius.sm,
    minHeight: 4,
  },
  barValue: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
    marginTop: spacing[1],
  },
  barLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: spacing[2],
    textAlign: 'center',
  },
  
  // Pie Chart Styles
  pieChartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieLegend: {
    flex: 1,
    marginLeft: spacing[4],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing[2],
  },
  legendLabel: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },
  legendValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.neutral[700],
  },
  
  // Line Chart Styles
  lineChartContent: {
    position: 'relative',
  },
  lineContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: spacing[4],
  },
  dataPoint: {
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    position: 'absolute',
  },
  xAxisLabel: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    marginTop: spacing[1],
  },
});


