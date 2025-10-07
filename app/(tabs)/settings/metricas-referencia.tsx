/**
 * Configuración de Métricas de Referencia y Benchmarks
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Card from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import {
    eliminarMetricaEngorde,
    eliminarMetricaLevantes,
    eliminarMetricaPonedoras,
    obtenerConfiguracionMetricas
} from '../../../src/services/metricas-referencia.service';
import {
    ConfiguracionMetricas,
    MetricasEngordeReferencia,
    MetricasLevantesReferencia,
    MetricasPonedorasReferencia,
    PesoReferencia
} from '../../../src/types/metricas-referencia';

export default function MetricasReferenciaScreen() {
    const [tabActivo, setTabActivo] = useState<'engorde' | 'levantes' | 'ponedoras'>('engorde');
    const [configuracion, setConfiguracion] = useState<ConfiguracionMetricas | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [metricaSeleccionada, setMetricaSeleccionada] = useState<any>(null);

    useEffect(() => {
        cargarConfiguracion();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            setIsLoading(true);
            const config = await obtenerConfiguracionMetricas();
            setConfiguracion(config);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            Alert.alert('Error', 'No se pudo cargar la configuración de métricas');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarConfiguracion();
        setRefreshing(false);
    };

    const handleVerDetalle = (metrica: any) => {
        setMetricaSeleccionada(metrica);
        setModalVisible(true);
    };

    const handleEliminarMetrica = async (id: string, tipo: 'engorde' | 'levantes' | 'ponedoras') => {
        Alert.alert(
            'Eliminar Métrica',
            '¿Estás seguro de que deseas eliminar esta métrica de referencia?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (tipo === 'engorde') {
                                await eliminarMetricaEngorde(id);
                            } else if (tipo === 'levantes') {
                                await eliminarMetricaLevantes(id);
                            } else {
                                await eliminarMetricaPonedoras(id);
                            }
                            await cargarConfiguracion();
                            Alert.alert('Éxito', 'Métrica eliminada correctamente');
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar la métrica');
                        }
                    }
                }
            ]
        );
    };

    const tabs = [
        { id: 'engorde' as const, label: 'Engorde', icon: 'fast-food', color: colors.engorde },
        { id: 'levantes' as const, label: 'Levantes', icon: 'nutrition', color: colors.secondary },
        { id: 'ponedoras' as const, label: 'Ponedoras', icon: 'egg', color: colors.ponedoras },
    ];

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando configuración...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Métricas de Referencia</Text>
                    <Text style={styles.headerSubtitle}>
                        Configura benchmarks para comparar el desempeño
                    </Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tab,
                            tabActivo === tab.id && styles.tabActivo,
                            { borderBottomColor: tab.color }
                        ]}
                        onPress={() => setTabActivo(tab.id)}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={20}
                            color={tabActivo === tab.id ? tab.color : colors.textMedium}
                        />
                        <Text
                            style={[
                                styles.tabText,
                                tabActivo === tab.id && { color: tab.color }
                            ]}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Contenido por Tab */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {tabActivo === 'engorde' && (
                    <TabEngorde
                        metricas={configuracion?.engorde || []}
                        onVerDetalle={handleVerDetalle}
                        onEliminar={(id) => handleEliminarMetrica(id, 'engorde')}
                    />
                )}
                {tabActivo === 'levantes' && (
                    <TabLevantes
                        metricas={configuracion?.levantes || []}
                        onVerDetalle={handleVerDetalle}
                        onEliminar={(id) => handleEliminarMetrica(id, 'levantes')}
                    />
                )}
                {tabActivo === 'ponedoras' && (
                    <TabPonedoras
                        metricas={configuracion?.ponedoras || []}
                        onVerDetalle={handleVerDetalle}
                        onEliminar={(id) => handleEliminarMetrica(id, 'ponedoras')}
                    />
                )}
            </ScrollView>

            {/* Modal de Detalle */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {metricaSeleccionada?.raza || 'Detalle'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textDark} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {metricaSeleccionada && (
                                <DetalleMetrica metrica={metricaSeleccionada} tipo={tabActivo} />
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// Componentes de Tabs
function TabEngorde({
    metricas,
    onVerDetalle,
    onEliminar
}: {
    metricas: MetricasEngordeReferencia[];
    onVerDetalle: (metrica: any) => void;
    onEliminar: (id: string) => void;
}) {
    return (
        <View style={styles.tabContent}>
            <Card style={styles.infoCard}>
                <View style={styles.infoHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.engorde} />
                    <Text style={styles.infoTitle}>Métricas de Engorde</Text>
                </View>
                <Text style={styles.infoText}>
                    Configura los pesos esperados por edad para diferentes razas de pollos de engorde.
                    El sistema comparará el peso real con estos benchmarks para alertarte sobre posibles problemas.
                </Text>
            </Card>

            {metricas.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Ionicons name="analytics-outline" size={48} color={colors.lightGray} />
                    <Text style={styles.emptyText}>No hay métricas configuradas</Text>
                    <Text style={styles.emptySubtext}>
                        Las métricas predefinidas se cargarán automáticamente
                    </Text>
                </Card>
            ) : (
                metricas.map(metrica => (
                    <Card key={metrica.id} style={styles.metricaCard}>
                        <View style={styles.metricaHeader}>
                            <View style={styles.metricaInfo}>
                                <Text style={styles.metricaRaza}>{metrica.raza}</Text>
                                <Text style={styles.metricaDetalle}>
                                    {metrica.pesosPorEdad.length} puntos de referencia
                                </Text>
                            </View>
                            <View style={styles.metricaActions}>
                                <TouchableOpacity
                                    onPress={() => onVerDetalle(metrica)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="eye-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => metrica.id && onEliminar(metrica.id)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.metricaStats}>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Peso final objetivo</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.pesoObjetivoFinal} lb
                                </Text>
                            </View>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Edad sacrificio</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.edadSacrificio} días
                                </Text>
                            </View>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Conv. Alimenticia</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.conversionAlimenticia}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))
            )}
        </View>
    );
}

function TabLevantes({
    metricas,
    onVerDetalle,
    onEliminar
}: {
    metricas: MetricasLevantesReferencia[];
    onVerDetalle: (metrica: any) => void;
    onEliminar: (id: string) => void;
}) {
    return (
        <View style={styles.tabContent}>
            <Card style={styles.infoCard}>
                <View style={styles.infoHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.secondary} />
                    <Text style={styles.infoTitle}>Métricas de Levantes</Text>
                </View>
                <Text style={styles.infoText}>
                    Define los estándares de crecimiento para pollos en etapa de levante.
                    Estos benchmarks ayudan a identificar problemas de desarrollo temprano.
                </Text>
            </Card>

            {metricas.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Ionicons name="analytics-outline" size={48} color={colors.lightGray} />
                    <Text style={styles.emptyText}>No hay métricas configuradas</Text>
                </Card>
            ) : (
                metricas.map(metrica => (
                    <Card key={metrica.id} style={styles.metricaCard}>
                        <View style={styles.metricaHeader}>
                            <View style={styles.metricaInfo}>
                                <Text style={styles.metricaRaza}>{metrica.raza}</Text>
                                <Text style={styles.metricaDetalle}>
                                    {metrica.pesosPorEdad.length} puntos de referencia
                                </Text>
                            </View>
                            <View style={styles.metricaActions}>
                                <TouchableOpacity
                                    onPress={() => onVerDetalle(metrica)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="eye-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => metrica.id && onEliminar(metrica.id)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.metricaStats}>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Peso venta objetivo</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.pesoObjetivoVenta} lb
                                </Text>
                            </View>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Madurez sexual</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.edadMadurezSexual} días
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))
            )}
        </View>
    );
}

function TabPonedoras({
    metricas,
    onVerDetalle,
    onEliminar
}: {
    metricas: MetricasPonedorasReferencia[];
    onVerDetalle: (metrica: any) => void;
    onEliminar: (id: string) => void;
}) {
    return (
        <View style={styles.tabContent}>
            <Card style={styles.infoCard}>
                <View style={styles.infoHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.ponedoras} />
                    <Text style={styles.infoTitle}>Métricas de Ponedoras</Text>
                </View>
                <Text style={styles.infoText}>
                    Establece las tasas de postura esperadas por edad para diferentes razas.
                    Compara la producción real contra estos estándares de la industria.
                </Text>
            </Card>

            {metricas.length === 0 ? (
                <Card style={styles.emptyCard}>
                    <Ionicons name="analytics-outline" size={48} color={colors.lightGray} />
                    <Text style={styles.emptyText}>No hay métricas configuradas</Text>
                </Card>
            ) : (
                metricas.map(metrica => (
                    <Card key={metrica.id} style={styles.metricaCard}>
                        <View style={styles.metricaHeader}>
                            <View style={styles.metricaInfo}>
                                <Text style={styles.metricaRaza}>{metrica.raza}</Text>
                                <Text style={styles.metricaDetalle}>
                                    {metrica.produccionPorEdad.length} puntos de referencia
                                </Text>
                            </View>
                            <View style={styles.metricaActions}>
                                <TouchableOpacity
                                    onPress={() => onVerDetalle(metrica)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="eye-outline" size={20} color={colors.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => metrica.id && onEliminar(metrica.id)}
                                    style={styles.actionButton}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.metricaStats}>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Pico producción</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.tasaPicoProduccion}% @ {metrica.picoProduccion}sem
                                </Text>
                            </View>
                            <View style={styles.metricaStat}>
                                <Text style={styles.metricaStatLabel}>Primer huevo</Text>
                                <Text style={styles.metricaStatValue}>
                                    {metrica.edadPrimerHuevo} sem
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))
            )}
        </View>
    );
}

// Componente de detalle
function DetalleMetrica({ metrica, tipo }: { metrica: any; tipo: string }) {
    if (tipo === 'ponedoras') {
        return (
            <View>
                <Text style={styles.detalleSeccion}>Producción por Edad</Text>
                {metrica.produccionPorEdad?.map((prod: any, index: number) => (
                    <View key={index} style={styles.detalleItem}>
                        <Text style={styles.detalleLabel}>Semana {prod.edad}</Text>
                        <Text style={styles.detalleValue}>
                            {prod.tasaPostura}% - {prod.huevosPorDia} huevos/día
                        </Text>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View>
            <Text style={styles.detalleSeccion}>Pesos por Edad</Text>
            {metrica.pesosPorEdad?.map((peso: PesoReferencia, index: number) => (
                <View key={index} style={styles.detalleItem}>
                    <Text style={styles.detalleLabel}>Día {peso.edad}</Text>
                    <Text style={styles.detalleValue}>
                        {peso.pesoPromedio}g ({peso.pesoMinimo}-{peso.pesoMaximo}g)
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textMedium,
        marginTop: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.veryLightGray,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textMedium,
        marginTop: 2,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.veryLightGray,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActivo: {
        borderBottomWidth: 3,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMedium,
        marginLeft: 6,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    tabContent: {
        paddingBottom: 24,
    },
    infoCard: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: colors.white,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textDark,
        marginLeft: 8,
    },
    infoText: {
        fontSize: 14,
        color: colors.textMedium,
        lineHeight: 20,
    },
    emptyCard: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMedium,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    metricaCard: {
        marginBottom: 12,
        padding: 16,
    },
    metricaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    metricaInfo: {
        flex: 1,
    },
    metricaRaza: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    metricaDetalle: {
        fontSize: 13,
        color: colors.textMedium,
        marginTop: 2,
    },
    metricaActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    metricaStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    metricaStat: {
        flex: 1,
    },
    metricaStatLabel: {
        fontSize: 11,
        color: colors.textLight,
        marginBottom: 4,
    },
    metricaStatValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDark,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.veryLightGray,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    modalBody: {
        padding: 20,
    },
    detalleSeccion: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textDark,
        marginBottom: 12,
    },
    detalleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.veryLightGray,
    },
    detalleLabel: {
        fontSize: 14,
        color: colors.textMedium,
    },
    detalleValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textDark,
    },
});

