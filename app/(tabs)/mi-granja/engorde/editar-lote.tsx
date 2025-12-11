/**
 * Formulario para editar un lote de engorde existente
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
import AppHeader from '../../../../src/components/layouts/AppHeader';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import Input from '../../../../src/components/ui/Input';
import { colors } from '../../../../src/constants/colors';
import { useGalpones } from '../../../../src/hooks/useGalpones';
import { useEngordeStore } from '../../../../src/stores/engordeStore';
import { EstadoLote } from '../../../../src/types';

const RAZAS_ENGORDE = [
    'Ross 308',
    'Cobb 500',
    'Arbor Acres',
    'Hubbard',
    'Otra'
];

export default function EditarLoteEngordeScreen() {
    const { loteId } = useLocalSearchParams<{ loteId: string }>();
    const { loteActual, cargarLote, actualizarLote, isLoading, error } = useEngordeStore();
    const { galpones } = useGalpones();
    
    // Estados del formulario
    const [nombre, setNombre] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [cantidadInicial, setCantidadInicial] = useState('');
    const [cantidadActual, setCantidadActual] = useState('');
    const [raza, setRaza] = useState('');
    const [estado, setEstado] = useState<EstadoLote>(EstadoLote.ACTIVO);
    const [observaciones, setObservaciones] = useState('');
    const [galponSeleccionado, setGalponSeleccionado] = useState<string>('');
    const [mostrarRazas, setMostrarRazas] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar el lote al montar el componente
    useEffect(() => {
        if (loteId) {
            cargarLote(loteId);
        }
    }, [loteId]);

    // Llenar el formulario cuando se cargue el lote
    useEffect(() => {
        if (loteActual) {
            setNombre(loteActual.nombre);
            setFechaInicio(formatDateForInput(loteActual.fechaInicio));
            setFechaNacimiento(formatDateForInput(loteActual.fechaNacimiento));
            setCantidadInicial(loteActual.cantidadInicial.toString());
            setCantidadActual(loteActual.cantidadActual.toString());
            setRaza(loteActual.raza);
            setEstado(loteActual.estado);
            setObservaciones(loteActual.observaciones || '');
            setGalponSeleccionado(loteActual.galponId ?? '');
        }
    }, [loteActual]);

    const formatDateForInput = (date: any): string => {
        try {
            let fechaObj: Date;
            if (date && typeof date === 'object' && date.seconds) {
                fechaObj = new Date(date.seconds * 1000);
            } else if (typeof date === 'string') {
                fechaObj = new Date(date);
            } else if (date instanceof Date) {
                fechaObj = date;
            } else {
                return '';
            }
            return fechaObj.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formateando fecha:', error);
            return '';
        }
    };

    const validarFormulario = (): boolean => {
        if (!nombre.trim()) {
            Alert.alert('Error', 'El nombre del lote es obligatorio');
            return false;
        }

        if (!galponSeleccionado) {
            Alert.alert('Galpón requerido', 'Selecciona el galpón correspondiente.');
            return false;
        }

        if (!fechaInicio) {
            Alert.alert('Error', 'La fecha de inicio es obligatoria');
            return false;
        }

        if (!fechaNacimiento) {
            Alert.alert('Error', 'La fecha de nacimiento es obligatoria');
            return false;
        }

        const cantidadInicialNum = parseInt(cantidadInicial);
        if (!cantidadInicial || isNaN(cantidadInicialNum) || cantidadInicialNum <= 0) {
            Alert.alert('Error', 'La cantidad inicial debe ser un número mayor a 0');
            return false;
        }

        const cantidadActualNum = parseInt(cantidadActual);
        if (!cantidadActual || isNaN(cantidadActualNum) || cantidadActualNum < 0) {
            Alert.alert('Error', 'La cantidad actual debe ser un número mayor o igual a 0');
            return false;
        }

        if (cantidadActualNum > cantidadInicialNum) {
            Alert.alert('Error', 'La cantidad actual no puede ser mayor a la cantidad inicial');
            return false;
        }

        if (!raza.trim()) {
            Alert.alert('Error', 'La raza es obligatoria');
            return false;
        }

        // Validar fechas
        const fechaInicioDate = new Date(fechaInicio);
        const fechaNacimientoDate = new Date(fechaNacimiento);
        
        if (fechaInicioDate < fechaNacimientoDate) {
            Alert.alert('Error', 'La fecha de inicio no puede ser anterior a la fecha de nacimiento');
            return false;
        }

        return true;
    };

    const handleGuardar = async () => {
        if (!validarFormulario() || !loteActual) return;

        setIsSubmitting(true);
        try {
            await actualizarLote(loteActual.id, {
                nombre: nombre.trim(),
                fechaInicio: new Date(fechaInicio),
                fechaNacimiento: new Date(fechaNacimiento),
                cantidadInicial: parseInt(cantidadInicial),
                cantidadActual: parseInt(cantidadActual),
                raza: raza.trim(),
                estado: estado,
                ...(observaciones.trim() && { observaciones: observaciones.trim() }),
                galponId: galponSeleccionado,
            });

            Alert.alert(
                'Éxito',
                'El lote se ha actualizado correctamente',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el lote');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && !loteActual) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando lote...</Text>
            </View>
        );
    }

    if (error || !loteActual) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
                <Text style={styles.errorTitle}>Error al cargar el lote</Text>
                <Text style={styles.errorText}>{error || 'Lote no encontrado'}</Text>
                <Button
                    title="Volver"
                    onPress={() => router.back()}
                    style={styles.errorButton}
                />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <AppHeader
                title={loteActual ? `Editar ${loteActual.nombre}` : 'Editar Lote'}
                showBack
                showProfile={false}
                showNotifications={false}
                tintColor={colors.engorde}
                secondaryAction={{
                    label: 'Cancelar',
                    onPress: () => router.back(),
                    icon: 'close',
                    tintColor: colors.engorde,
                }}
                primaryAction={{
                    label: isSubmitting ? 'Guardando...' : 'Guardar',
                    onPress: handleGuardar,
                    loading: isSubmitting,
                    icon: 'checkmark',
                    tintColor: colors.engorde,
                }}
            />
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            {/* Información básica */}
            <Card style={styles.card}>
                <Text style={styles.cardTitle}>Información Básica</Text>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre del lote *</Text>
                    <Input
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Ej: Lote Engorde 001"
                        maxLength={50}
                    />
                </View>

                <View style={styles.dateRow}>
                    <View style={styles.dateGroup}>
                        <Text style={styles.label}>Fecha de inicio *</Text>
                        <Input
                            value={fechaInicio}
                            onChangeText={setFechaInicio}
                            placeholder="YYYY-MM-DD"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.dateGroup}>
                        <Text style={styles.label}>Fecha de nacimiento *</Text>
                        <Input
                            value={fechaNacimiento}
                            onChangeText={setFechaNacimiento}
                            placeholder="YYYY-MM-DD"
                            keyboardType="numeric"
                        />
                    </View>
                </View>

                <View style={styles.numberRow}>
                    <View style={styles.numberGroup}>
                        <Text style={styles.label}>Cantidad inicial *</Text>
                        <Input
                            value={cantidadInicial}
                            onChangeText={setCantidadInicial}
                            placeholder="0"
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>
                    <View style={styles.numberGroup}>
                        <Text style={styles.label}>Cantidad actual *</Text>
                        <Input
                            value={cantidadActual}
                            onChangeText={setCantidadActual}
                            placeholder="0"
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>
                </View>
            </Card>

            {/* Información técnica */}
            <Card style={styles.card}>
                <Text style={styles.cardTitle}>Información Técnica</Text>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Raza *</Text>
                    <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setMostrarRazas(true)}
                    >
                        <Text style={[styles.pickerText, !raza && styles.placeholderText]}>
                            {raza || 'Seleccionar raza'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={colors.textMedium} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Galpón *</Text>
                    <View style={styles.galponSelector}>
                        {galpones.length === 0 ? (
                            <Text style={styles.helperText}>No hay galpones registrados.</Text>
                        ) : (
                            galpones.map((galpon) => (
                                <Button
                                    key={galpon.id}
                                    title={galpon.nombre}
                                    onPress={() => setGalponSeleccionado(galpon.id)}
                                    variant={galponSeleccionado === galpon.id ? 'primary' : 'outline'}
                                    size="small"
                                    style={styles.galponButton}
                                />
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Estado del lote</Text>
                    <View style={styles.estadoContainer}>
                        <TouchableOpacity
                            style={[
                                styles.estadoButton,
                                estado === EstadoLote.ACTIVO && styles.estadoButtonActive
                            ]}
                            onPress={() => setEstado(EstadoLote.ACTIVO)}
                        >
                            <Text style={[
                                styles.estadoButtonText,
                                estado === EstadoLote.ACTIVO && styles.estadoButtonTextActive
                            ]}>
                                Activo
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.estadoButton,
                                estado === EstadoLote.FINALIZADO && styles.estadoButtonInactive
                            ]}
                            onPress={() => setEstado(EstadoLote.FINALIZADO)}
                        >
                            <Text style={[
                                styles.estadoButtonText,
                                estado === EstadoLote.FINALIZADO && styles.estadoButtonTextInactive
                            ]}>
                                Finalizado
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Observaciones</Text>
                    <Input
                        value={observaciones}
                        onChangeText={setObservaciones}
                        placeholder="Observaciones adicionales..."
                        multiline
                        numberOfLines={3}
                        style={styles.textArea}
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>{observaciones.length}/500</Text>
                </View>
            </Card>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
                <Button
                    title="Cancelar"
                    onPress={() => router.back()}
                    variant="outline"
                    style={styles.cancelButton}
                />
                <Button
                    title={isSubmitting ? "Guardando..." : "Guardar Cambios"}
                    onPress={handleGuardar}
                    disabled={isSubmitting}
                    style={styles.saveButton}
                />
            </View>

            {/* Modal de selección de raza */}
            {mostrarRazas && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Seleccionar Raza</Text>
                            <TouchableOpacity onPress={() => setMostrarRazas(false)}>
                                <Ionicons name="close" size={24} color={colors.textDark} />
                            </TouchableOpacity>
                        </View>
                        {RAZAS_ENGORDE.map((razaOption) => (
                            <TouchableOpacity
                                key={razaOption}
                                style={[
                                    styles.razaOption,
                                    raza === razaOption && styles.razaOptionSelected
                                ]}
                                onPress={() => {
                                    setRaza(razaOption);
                                    setMostrarRazas(false);
                                }}
                            >
                                <Text style={[
                                    styles.razaOptionText,
                                    raza === razaOption && styles.razaOptionTextSelected
                                ]}>
                                    {razaOption}
                                </Text>
                                {raza === razaOption && (
                                    <Ionicons name="checkmark" size={20} color={colors.engorde} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: colors.background,
    },
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
        backgroundColor: colors.background,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textMedium,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 20,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: colors.textMedium,
        textAlign: 'center',
        marginBottom: 24,
    },
    errorButton: {
        minWidth: 120,
    },
    card: {
        marginBottom: 16,
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
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
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateGroup: {
        flex: 1,
    },
    numberRow: {
        flexDirection: 'row',
        gap: 12,
    },
    numberGroup: {
        flex: 1,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.veryLightGray,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    pickerText: {
        fontSize: 16,
        color: colors.textDark,
    },
    placeholderText: {
        color: colors.textLight,
    },
    estadoContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    estadoButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.veryLightGray,
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    estadoButtonActive: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
    },
    estadoButtonInactive: {
        backgroundColor: colors.lightGray + '20',
        borderColor: colors.lightGray,
    },
    estadoButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textMedium,
    },
    estadoButtonTextActive: {
        color: colors.success,
    },
    estadoButtonTextInactive: {
        color: colors.textMedium,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'right',
        marginTop: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
    },
    cancelButton: {
        flex: 1,
    },
    saveButton: {
        flex: 1,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 8,
        width: '80%',
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.veryLightGray,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textDark,
    },
    razaOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    razaOptionSelected: {
        backgroundColor: colors.engorde + '10',
    },
    razaOptionText: {
        fontSize: 16,
        color: colors.textDark,
    },
    razaOptionTextSelected: {
        color: colors.engorde,
        fontWeight: '500',
    },
    helperText: {
        fontSize: 12,
        color: colors.textMedium,
        marginTop: 4,
    },
    galponSelector: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    galponButton: {
        minWidth: 90,
    },
});
