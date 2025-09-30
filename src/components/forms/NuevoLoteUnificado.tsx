/**
 * Componente unificado para crear lotes de cualquier tipo
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useLotes } from '../../hooks';
import {
    TipoAve,
    LotePonedora,
    LoteIsraeli,
    LoteEngorde,
    RazaGallina,
    RazaPollo
} from '../../types';

interface Props {
    tipoLote: TipoAve;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface FormData {
    nombre: string;
    fechaInicio: string;
    numeroAves: string;
    raza: string;
    estadoSalud: string;
    // Campos específicos para israelíes
    edadInicial?: string;
    precioVentaUnidad?: string;
}

const RAZAS_GALLINA = Object.values(RazaGallina);
const RAZAS_POLLO = Object.values(RazaPollo);

export const NuevoLoteUnificado: React.FC<Props> = ({
    tipoLote,
    onSuccess,
    onCancel
}) => {
    const { ponedorasStore, israeliesStore, engordeStore } = useLotes();
    
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        numeroAves: '',
        raza: '',
        estadoSalud: 'Saludable',
        edadInicial: '1',
        precioVentaUnidad: '0'
    });
    
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Determinar qué razas mostrar según el tipo
    const razasDisponibles = tipoLote === TipoAve.PONEDORA 
        ? RAZAS_GALLINA 
        : RAZAS_POLLO;
    
    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};
        
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        }
        
        if (!formData.fechaInicio) {
            newErrors.fechaInicio = 'La fecha de inicio es requerida';
        }
        
        const numeroAves = parseInt(formData.numeroAves);
        if (!numeroAves || numeroAves <= 0) {
            newErrors.numeroAves = 'El número de aves debe ser mayor a 0';
        }
        
        if (!formData.raza) {
            newErrors.raza = 'Debe seleccionar una raza';
        }
        
        if (tipoLote === TipoAve.POLLO_ISRAELI) {
            const edadInicial = parseInt(formData.edadInicial || '0');
            if (edadInicial < 0 || edadInicial > 365) {
                newErrors.edadInicial = 'La edad inicial debe estar entre 0 y 365 días';
            }
            
            const precio = parseFloat(formData.precioVentaUnidad || '0');
            if (precio < 0) {
                newErrors.precioVentaUnidad = 'El precio no puede ser negativo';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        setIsLoading(true);
        
        try {
            const baseData = {
                nombre: formData.nombre.trim(),
                fechaInicio: new Date(formData.fechaInicio),
                numeroAves: parseInt(formData.numeroAves),
                raza: formData.raza,
                estadoSalud: formData.estadoSalud
            };
            
            switch (tipoLote) {
                case TipoAve.PONEDORA:
                    await ponedorasStore.crearLote({
                        ...baseData,
                        tipo: TipoAve.PONEDORA
                    } as Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>);
                    break;
                    
                case TipoAve.POLLO_ISRAELI:
                    await israeliesStore.crearLote({
                        ...baseData,
                        edadInicial: parseInt(formData.edadInicial || '1'),
                        precioVentaUnidad: parseFloat(formData.precioVentaUnidad || '0'),
                        activo: true
                    } as Omit<LoteIsraeli, 'id'>);
                    break;
                    
                case TipoAve.POLLO_ENGORDE:
                    await engordeStore.crearLote({
                        ...baseData,
                        tipo: TipoAve.POLLO_ENGORDE
                    } as Omit<LoteEngorde, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>);
                    break;
            }
            
            Alert.alert(
                'Éxito',
                `Lote de ${getTipoLoteNombre(tipoLote)} creado exitosamente`,
                [{ text: 'OK', onPress: onSuccess }]
            );
            
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'Error al crear el lote'
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    const getTipoLoteNombre = (tipo: TipoAve): string => {
        switch (tipo) {
            case TipoAve.PONEDORA:
                return 'gallinas ponedoras';
            case TipoAve.POLLO_ISRAELI:
                return 'pollos israelíes';
            case TipoAve.POLLO_ENGORDE:
                return 'pollos de engorde';
            default:
                return 'aves';
        }
    };
    
    const updateFormData = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    
    return (
        <Card style={{ padding: 20, margin: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
                Nuevo Lote - {getTipoLoteNombre(tipoLote)}
            </Text>
            
            <Input
                label="Nombre del lote"
                value={formData.nombre}
                onChangeText={(value) => updateFormData('nombre', value)}
                error={errors.nombre}
                placeholder="Ej: Lote A - Enero 2024"
            />
            
            <Input
                label="Fecha de inicio"
                value={formData.fechaInicio}
                onChangeText={(value) => updateFormData('fechaInicio', value)}
                error={errors.fechaInicio}
                placeholder="YYYY-MM-DD"
            />
            
            <Input
                label="Número de aves"
                value={formData.numeroAves}
                onChangeText={(value) => updateFormData('numeroAves', value)}
                error={errors.numeroAves}
                placeholder="Ej: 100"
                keyboardType="numeric"
            />
            
            {/* Selector de raza - en una implementación real sería un picker */}
            <View style={{ marginVertical: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
                    Raza
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                    Razas disponibles: {razasDisponibles.join(', ')}
                </Text>
                <Input
                    value={formData.raza}
                    onChangeText={(value) => updateFormData('raza', value)}
                    error={errors.raza}
                    placeholder="Seleccione una raza"
                />
            </View>
            
            <Input
                label="Estado de salud"
                value={formData.estadoSalud}
                onChangeText={(value) => updateFormData('estadoSalud', value)}
                placeholder="Ej: Saludable, En tratamiento"
            />
            
            {/* Campos específicos para israelíes */}
            {tipoLote === TipoAve.POLLO_ISRAELI && (
                <>
                    <Input
                        label="Edad inicial (días)"
                        value={formData.edadInicial}
                        onChangeText={(value) => updateFormData('edadInicial', value)}
                        error={errors.edadInicial}
                        placeholder="1"
                        keyboardType="numeric"
                    />
                    
                    <Input
                        label="Precio de venta por unidad (DOP)"
                        value={formData.precioVentaUnidad}
                        onChangeText={(value) => updateFormData('precioVentaUnidad', value)}
                        error={errors.precioVentaUnidad}
                        placeholder="0.00"
                        keyboardType="numeric"
                    />
                </>
            )}
            
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                {onCancel && (
                    <Button
                        title="Cancelar"
                        onPress={onCancel}
                        variant="outline"
                        style={{ flex: 1 }}
                    />
                )}
                
                <Button
                    title={isLoading ? "Creando..." : "Crear Lote"}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={{ flex: 1 }}
                />
            </View>
        </Card>
    );
};
