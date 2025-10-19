/**
 * Componente para mostrar la comparación de desempeño de un lote con métricas de referencia
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import {
    AlertaDesempeno,
    ComparacionDesempeno,
    generarAlertasDesempeno,
    NivelDesempeno
} from '../../services/metricas-comparacion.service';
import Card from './Card';

interface PerformanceComparisonProps {
    comparaciones: {
        peso?: ComparacionDesempeno;
        produccion?: ComparacionDesempeno;
        mortalidad?: ComparacionDesempeno;
    };
    lote: any;
    isLoading?: boolean;
}

export default function PerformanceComparison({ 
    comparaciones, 
    lote,
    isLoading = false 
}: PerformanceComparisonProps) {
    const [alertas, setAlertas] = useState<AlertaDesempeno[]>([]);

    useEffect(() => {
        const cargarAlertas = async () => {
            const alertasGeneradas = await generarAlertasDesempeno(lote, comparaciones);
            setAlertas(alertasGeneradas);
        };
        cargarAlertas();
    }, [comparaciones, lote]);

    if (isLoading) {
        return (
            <Card style={styles.card}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Comparando con benchmarks...</Text>
                </View>
            </Card>
        );
    }

    const tieneComparaciones = comparaciones.peso || comparaciones.produccion || comparaciones.mortalidad;

    if (!tieneComparaciones) {
        return (
            <Card style={styles.card}>
                <View style={styles.header}>
                    <Ionicons name="analytics-outline" size={24} color={colors.textMedium} />
                    <Text style={styles.title}>Desempeño vs Benchmark</Text>
                </View>
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
                        No hay métricas de referencia configuradas para esta raza
                    </Text>
                    <Text style={styles.noDataSubtext}>
                        Ve a Configuración → Métricas de Referencia para establecer benchmarks
                    </Text>
                </View>
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="analytics" size={24} color={colors.primary} />
                <Text style={styles.title}>Desempeño vs Benchmark</Text>
            </View>

            {/* Comparaciones */}
            <View style={styles.comparacionesContainer}>
                {comparaciones.peso && (
                    <ComparacionItem comparacion={comparaciones.peso} tipo="Peso" unidad="lb" />
                )}
                {comparaciones.produccion && (
                    <ComparacionItem comparacion={comparaciones.produccion} tipo="Producción" unidad="%" />
                )}
                {comparaciones.mortalidad && (
                    <ComparacionItem comparacion={comparaciones.mortalidad} tipo="Mortalidad" unidad="%" />
                )}
            </View>

            {/* Alertas */}
            {alertas.length > 0 && (
                <View style={styles.alertasContainer}>
                    <View style={styles.alertasHeader}>
                        <Ionicons name="warning" size={20} color={colors.danger} />
                        <Text style={styles.alertasTitle}>Alertas y Recomendaciones</Text>
                    </View>
                    {alertas.map((alerta, index) => (
                        <AlertaItem key={index} alerta={alerta} />
                    ))}
                </View>
            )}
        </Card>
    );
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

interface ComparacionItemProps {
    comparacion: ComparacionDesempeno;
    tipo: string;
    unidad: string;
}

function ComparacionItem({ comparacion, tipo, unidad }: ComparacionItemProps) {
    const getIcon = () => {
        switch (comparacion.nivelDesempeno) {
            case NivelDesempeno.EXCELENTE:
                return 'trending-up';
            case NivelDesempeno.BUENO:
                return 'checkmark-circle';
            case NivelDesempeno.ACEPTABLE:
                return 'alert-circle';
            case NivelDesempeno.POR_DEBAJO:
                return 'warning';
            case NivelDesempeno.CRITICO:
                return 'close-circle';
            default:
                return 'help-circle';
        }
    };

    return (
        <View style={styles.comparacionItem}>
            <View style={styles.comparacionHeader}>
                <View style={[styles.iconContainer, { backgroundColor: comparacion.color + '20' }]}>
                    <Ionicons 
                        name={getIcon() as any} 
                        size={20} 
                        color={comparacion.color} 
                    />
                </View>
                <View style={styles.comparacionInfo}>
                    <Text style={styles.comparacionTipo}>{tipo}</Text>
                    <Text style={styles.comparacionMensaje}>{comparacion.mensaje}</Text>
                </View>
            </View>

            <View style={styles.comparacionStats}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Actual</Text>
                    <Text style={[styles.statValue, { color: comparacion.color }]}>
                        {comparacion.valorActual.toFixed(1)} {unidad}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Esperado</Text>
                    <Text style={styles.statValue}>
                        {comparacion.valorEsperado.toFixed(1)} {unidad}
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Diferencia</Text>
                    <Text style={[
                        styles.statValue, 
                        { color: comparacion.diferencia >= 0 ? colors.success : colors.danger }
                    ]}>
                        {comparacion.diferencia >= 0 ? '+' : ''}{comparacion.diferencia.toFixed(1)} {unidad}
                    </Text>
                </View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                    <View 
                        style={[
                            styles.progressBarFill, 
                            { 
                                width: `${Math.min(comparacion.porcentajeVsEsperado, 100)}%`,
                                backgroundColor: comparacion.color
                            }
                        ]} 
                    />
                </View>
                <Text style={styles.progressText}>
                    {comparacion.porcentajeVsEsperado.toFixed(0)}% del objetivo
                </Text>
            </View>
        </View>
    );
}

interface AlertaItemProps {
    alerta: AlertaDesempeno;
}

function AlertaItem({ alerta }: AlertaItemProps) {
    const getNivelColor = () => {
        switch (alerta.nivel) {
            case 'DANGER':
                return colors.danger;
            case 'WARNING':
                return colors.warning;
            case 'INFO':
                return colors.primary;
            default:
                return colors.textMedium;
        }
    };

    return (
        <View style={[styles.alertaItem, { borderLeftColor: getNivelColor() }]}>
            <Text style={styles.alertaTitulo}>{alerta.titulo}</Text>
            <Text style={styles.alertaMensaje}>{alerta.mensaje}</Text>
            
            {alerta.recomendaciones.length > 0 && (
                <View style={styles.recomendacionesContainer}>
                    <Text style={styles.recomendacionesTitle}>Recomendaciones:</Text>
                    {alerta.recomendaciones.map((rec, index) => (
                        <View key={index} style={styles.recomendacionItem}>
                            <Text style={styles.recomendacionBullet}>•</Text>
                            <Text style={styles.recomendacionText}>{rec}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

// ============================================================================
// ESTILOS
// ============================================================================

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        padding: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginLeft: 12,
        fontSize: 14,
        color: colors.textMedium,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
        marginLeft: 8,
    },
    noDataContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 14,
        color: colors.textMedium,
        textAlign: 'center',
        marginBottom: 8,
    },
    noDataSubtext: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'center',
    },
    comparacionesContainer: {
        gap: 16,
    },
    comparacionItem: {
        backgroundColor: colors.veryLightGray,
        borderRadius: 12,
        padding: 12,
    },
    comparacionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    comparacionInfo: {
        flex: 1,
    },
    comparacionTipo: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: 4,
    },
    comparacionMensaje: {
        fontSize: 13,
        color: colors.textMedium,
        lineHeight: 18,
    },
    comparacionStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: colors.textLight,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
    },
    progressContainer: {
        marginTop: 8,
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: colors.lightGray,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 11,
        color: colors.textMedium,
        textAlign: 'center',
    },
    alertasContainer: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.veryLightGray,
    },
    alertasHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    alertasTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textDark,
        marginLeft: 8,
    },
    alertaItem: {
        backgroundColor: colors.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
    },
    alertaTitulo: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: 4,
    },
    alertaMensaje: {
        fontSize: 13,
        color: colors.textMedium,
        marginBottom: 8,
    },
    recomendacionesContainer: {
        marginTop: 8,
    },
    recomendacionesTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textDark,
        marginBottom: 6,
    },
    recomendacionItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    recomendacionBullet: {
        fontSize: 12,
        color: colors.textMedium,
        marginRight: 6,
    },
    recomendacionText: {
        flex: 1,
        fontSize: 12,
        color: colors.textMedium,
        lineHeight: 18,
    },
});
















