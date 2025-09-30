/**
 * Componente para registrar gastos en lotes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useGastos, useLotes } from '../../hooks';
import {
    TipoAve,
    CategoriaGasto,
    Articulo,
    IGasto
} from '../../types';

interface Props {
    loteId: string;
    tipoLote: TipoAve;
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface FormData {
    articuloId: string;
    articuloNombre: string;
    cantidad: string;
    precioUnitario: string;
    categoria: CategoriaGasto | '';
    descripcion: string;
    fecha: string;
}

export const RegistrarGastoForm: React.FC<Props> = ({
    loteId,
    tipoLote,
    onSuccess,
    onCancel
}) => {
    const { 
        articulos, 
        registrarGasto, 
        validarGasto, 
        calcularTotal, 
        formatearPrecio,
        obtenerCategorias,
        isLoading: gastosLoading 
    } = useGastos();
    
    const { todosLosLotes } = useLotes();
    
    const [formData, setFormData] = useState<FormData>({
        articuloId: '',
        articuloNombre: '',
        cantidad: '',
        precioUnitario: '',
        categoria: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0]
    });
    
    const [errors, setErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [articulosFiltrados, setArticulosFiltrados] = useState<Articulo[]>([]);
    const [mostrarArticulos, setMostrarArticulos] = useState(false);
    
    const lote = todosLosLotes.find(l => l.id === loteId);
    const categorias = obtenerCategorias();
    
    useEffect(() => {
        // Filtrar artículos basado en la búsqueda
        if (formData.articuloNombre) {
            const filtrados = articulos.filter(articulo =>
                articulo.activo &&
                articulo.nombre.toLowerCase().includes(formData.articuloNombre.toLowerCase())
            );
            setArticulosFiltrados(filtrados);
            setMostrarArticulos(filtrados.length > 0);
        } else {
            setArticulosFiltrados([]);
            setMostrarArticulos(false);
        }
    }, [formData.articuloNombre, articulos]);
    
    const seleccionarArticulo = (articulo: Articulo) => {
        setFormData(prev => ({
            ...prev,
            articuloId: articulo.id,
            articuloNombre: articulo.nombre,
            precioUnitario: articulo.precio.toString()
        }));
        setMostrarArticulos(false);
    };
    
    const calcularTotalGasto = (): number => {
        const cantidad = parseFloat(formData.cantidad) || 0;
        const precio = parseFloat(formData.precioUnitario) || 0;
        return calcularTotal(cantidad, precio);
    };
    
    const validateForm = (): boolean => {
        const gastoData: Partial<IGasto> = {
            articuloId: formData.articuloId,
            articuloNombre: formData.articuloNombre,
            cantidad: parseFloat(formData.cantidad),
            precioUnitario: parseFloat(formData.precioUnitario),
            categoria: formData.categoria as CategoriaGasto,
            fecha: new Date(formData.fecha)
        };
        
        const validationErrors = validarGasto(gastoData);
        setErrors(validationErrors);
        return validationErrors.length === 0;
    };
    
    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        setIsLoading(true);
        
        try {
            const total = calcularTotalGasto();
            
            await registrarGasto(loteId, tipoLote, {
                articuloId: formData.articuloId,
                articuloNombre: formData.articuloNombre,
                cantidad: parseFloat(formData.cantidad),
                precioUnitario: parseFloat(formData.precioUnitario),
                total,
                fecha: new Date(formData.fecha),
                categoria: formData.categoria as CategoriaGasto,
                descripcion: formData.descripcion || undefined
            });
            
            Alert.alert(
                'Éxito',
                `Gasto registrado exitosamente por ${formatearPrecio(total)}`,
                [{ text: 'OK', onPress: onSuccess }]
            );
            
        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message || 'Error al registrar el gasto'
            );
        } finally {
            setIsLoading(false);
        }
    };
    
    const updateFormData = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar errores cuando el usuario empiece a escribir
        if (errors.length > 0) {
            setErrors([]);
        }
    };
    
    const getTipoLoteNombre = (tipo: TipoAve): string => {
        switch (tipo) {
            case TipoAve.PONEDORA:
                return 'Ponedoras';
            case TipoAve.POLLO_ISRAELI:
                return 'Israelíes';
            case TipoAve.POLLO_ENGORDE:
                return 'Engorde';
            default:
                return 'Lote';
        }
    };
    
    return (
        <Card style={{ padding: 20, margin: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                Registrar Gasto
            </Text>
            
            <Text style={{ fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' }}>
                {lote?.nombre} - {getTipoLoteNombre(tipoLote)}
            </Text>
            
            {/* Mostrar errores */}
            {errors.length > 0 && (
                <View style={{ 
                    backgroundColor: '#fee', 
                    padding: 10, 
                    borderRadius: 5, 
                    marginBottom: 15 
                }}>
                    {errors.map((error, index) => (
                        <Text key={index} style={{ color: '#c00', fontSize: 14 }}>
                            • {error}
                        </Text>
                    ))}
                </View>
            )}
            
            {/* Búsqueda de artículo */}
            <View style={{ position: 'relative' }}>
                <Input
                    label="Artículo"
                    value={formData.articuloNombre}
                    onChangeText={(value) => updateFormData('articuloNombre', value)}
                    placeholder="Buscar artículo..."
                />
                
                {/* Lista de artículos filtrados */}
                {mostrarArticulos && (
                    <View style={{
                        position: 'absolute',
                        top: 70,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: '#ddd',
                        borderRadius: 5,
                        maxHeight: 150,
                        zIndex: 1000
                    }}>
                        {articulosFiltrados.map((articulo) => (
                            <View
                                key={articulo.id}
                                style={{
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#eee'
                                }}
                                onTouchEnd={() => seleccionarArticulo(articulo)}
                            >
                                <Text style={{ fontWeight: '600' }}>{articulo.nombre}</Text>
                                <Text style={{ fontSize: 12, color: '#666' }}>
                                    {formatearPrecio(articulo.precio)} / {articulo.unidadMedida}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
            
            <Input
                label="Cantidad"
                value={formData.cantidad}
                onChangeText={(value) => updateFormData('cantidad', value)}
                placeholder="0"
                keyboardType="numeric"
            />
            
            <Input
                label="Precio unitario (DOP)"
                value={formData.precioUnitario}
                onChangeText={(value) => updateFormData('precioUnitario', value)}
                placeholder="0.00"
                keyboardType="numeric"
            />
            
            {/* Mostrar total calculado */}
            {formData.cantidad && formData.precioUnitario && (
                <View style={{ 
                    backgroundColor: '#f0f8ff', 
                    padding: 10, 
                    borderRadius: 5, 
                    marginVertical: 10 
                }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                        Total: {formatearPrecio(calcularTotalGasto())}
                    </Text>
                </View>
            )}
            
            {/* Selector de categoría - en una implementación real sería un picker */}
            <View style={{ marginVertical: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 5 }}>
                    Categoría
                </Text>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 10 }}>
                    Categorías: {categorias.join(', ')}
                </Text>
                <Input
                    value={formData.categoria}
                    onChangeText={(value) => updateFormData('categoria', value)}
                    placeholder="Seleccione una categoría"
                />
            </View>
            
            <Input
                label="Descripción (opcional)"
                value={formData.descripcion}
                onChangeText={(value) => updateFormData('descripcion', value)}
                placeholder="Detalles adicionales del gasto"
                multiline
            />
            
            <Input
                label="Fecha"
                value={formData.fecha}
                onChangeText={(value) => updateFormData('fecha', value)}
                placeholder="YYYY-MM-DD"
            />
            
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
                    title={isLoading ? "Registrando..." : "Registrar Gasto"}
                    onPress={handleSubmit}
                    disabled={isLoading || gastosLoading}
                    style={{ flex: 1 }}
                />
            </View>
        </Card>
    );
};
