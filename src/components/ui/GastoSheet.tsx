/**
 * Sheet modal para registrar gastos de manera simple
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { colors } from '../../constants/colors';
import { useGastosStore } from '../../stores/gastosStore';
import { CategoriaGasto, TipoAve } from '../../types';
import Button from './Button';
import Input from './Input';

interface GastoSheetProps {
  visible: boolean;
  onClose: () => void;
  loteId: string;
  tipoLote: TipoAve;
  loteNombre: string;
  articulos: Array<{ 
    id: string; 
    nombre: string; 
    costoFijo: boolean; 
    precio?: number; 
  }>;
}

export default function GastoSheet({ 
  visible, 
  onClose, 
  loteId, 
  tipoLote, 
  loteNombre, 
  articulos 
}: GastoSheetProps) {
  const [articuloId, setArticuloId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  
  const { registrarGasto, isLoading } = useGastosStore();
  
  // Debug: mostrar artículos recibidos
  React.useEffect(() => {
    console.log('📦 GastoSheet - Artículos recibidos:', articulos.length, articulos);
  }, [articulos]);
  
  const handleRegistrarGasto = async () => {
    if (!articuloId) {
      Alert.alert('Error', 'Por favor seleccione un artículo');
      return;
    }
    
    // Validar cantidad
    if (!cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) {
      Alert.alert('Error', 'Por favor ingrese una cantidad válida');
      return;
    }
    
    const cantidadNum = parseFloat(cantidad);
    const articuloSeleccionado = articulos.find(a => a.id === articuloId);
    
    // Determinar el precio unitario a usar
    let precioUnitario: number;
    if (articuloSeleccionado?.costoFijo) {
      // Usar precio fijo del artículo
      if (!articuloSeleccionado.precio || articuloSeleccionado.precio <= 0) {
        Alert.alert('Error', 'El artículo seleccionado no tiene un precio válido');
        return;
      }
      precioUnitario = articuloSeleccionado.precio;
    } else {
      // Usar monto ingresado manualmente
      if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
        Alert.alert('Error', 'Por favor ingrese un precio unitario válido');
        return;
      }
      precioUnitario = parseFloat(monto);
    }
    
    const totalFinal = precioUnitario * cantidadNum;
    
    try {
      const gastoData: any = {
        articuloId,
        articuloNombre: articuloSeleccionado?.nombre || 'Artículo',
        cantidad: cantidadNum,
        precioUnitario: precioUnitario,
        total: totalFinal,
        fecha: new Date(),
        categoria: CategoriaGasto.OTHER,
        loteId,
        tipoLote,
      };

      // Solo agregar descripción si tiene contenido
      if (descripcion.trim()) {
        gastoData.descripcion = descripcion.trim();
      }

      await registrarGasto(gastoData);
      
      Alert.alert(
        'Éxito', 
        `Gasto de $${totalFinal.toFixed(2)} RD$ registrado para ${loteNombre} (${cantidadNum} x $${precioUnitario.toFixed(2)})`,
        [{ text: 'OK', onPress: onClose }]
      );
      
      // Limpiar formulario
      setArticuloId('');
      setCantidad('1');
      setMonto('');
      setDescripcion('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al registrar gasto');
    }
  };
  
  const handleClose = () => {
    setArticuloId('');
    setCantidad('1');
    setMonto('');
    setDescripcion('');
    setDropdownVisible(false);
    onClose();
  };

  const handleSelectArticulo = (articulo: { id: string; nombre: string }) => {
    setArticuloId(articulo.id);
    setDropdownVisible(false);
  };

  const getArticuloSeleccionado = () => {
    return articulos.find(a => a.id === articuloId);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="receipt" size={24} color={colors.primary} />
              <Text style={styles.title}>Registrar Gasto</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textMedium} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.loteInfo}>
            <Text style={styles.loteInfoText}>
              <Text style={styles.loteInfoLabel}>Lote:</Text> {loteNombre}
            </Text>
            <Text style={styles.loteInfoText}>
              <Text style={styles.loteInfoLabel}>Tipo:</Text> {
                tipoLote === TipoAve.POLLO_ENGORDE ? 'Engorde' :
                tipoLote === TipoAve.POLLO_LEVANTE ? 'Levantes' :
                tipoLote === TipoAve.PONEDORA ? 'Ponedoras' : tipoLote
              }
            </Text>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Artículo</Text>
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setDropdownVisible(!dropdownVisible)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dropdownButtonText,
                    !articuloId && styles.placeholderText
                  ]}>
                    {getArticuloSeleccionado()?.nombre || 'Seleccione un artículo'}
                  </Text>
                  <Ionicons 
                    name={dropdownVisible ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textMedium} 
                  />
                </TouchableOpacity>
                
                {dropdownVisible && (
                  <>
                    <TouchableOpacity
                      style={styles.dropdownBackdrop}
                      activeOpacity={1}
                      onPress={() => setDropdownVisible(false)}
                    />
                    <View style={styles.dropdownList}>
                      <ScrollView 
                        style={styles.dropdownScrollView}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled={true}
                      >
                        {articulos.map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.dropdownItem,
                              articuloId === item.id && styles.dropdownItemSelected
                            ]}
                            onPress={() => handleSelectArticulo(item)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.dropdownItemContent}>
                              <Text style={[
                                styles.dropdownItemText,
                                articuloId === item.id && styles.dropdownItemTextSelected
                              ]}>
                                {item.nombre}
                              </Text>
                              {item.costoFijo && item.precio && (
                                <Text style={styles.dropdownItemPrice}>
                                  RD${item.precio.toFixed(2)}
                                </Text>
                              )}
                            </View>
                            {articuloId === item.id && (
                              <Ionicons name="checkmark" size={16} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            </View>
            
            {/* Campo de cantidad */}
            <View style={styles.formGroup}>
              <Input
                label="Cantidad"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="decimal-pad"
                placeholder="1"
                required
              />
            </View>
            
            {/* Mostrar precio fijo o input de monto */}
            {(() => {
              const articuloSeleccionado = getArticuloSeleccionado();
              
              if (articuloSeleccionado?.costoFijo) {
                const precioUnitario = articuloSeleccionado.precio || 0;
                const cantidadNum = parseFloat(cantidad) || 1;
                const total = precioUnitario * cantidadNum;
                
                return (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Precio Unitario</Text>
                      <View style={styles.precioFijoContainer}>
                        <Text style={styles.precioFijoText}>
                          RD${precioUnitario.toFixed(2)}
                        </Text>
                        <View style={styles.precioFijoBadge}>
                          <Ionicons name="lock-closed" size={14} color={colors.success} />
                          <Text style={styles.precioFijoBadgeText}>Precio fijo</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Total</Text>
                      <View style={styles.totalContainer}>
                        <Text style={styles.totalText}>
                          RD${total.toFixed(2)}
                        </Text>
                        <Text style={styles.totalCalculation}>
                          {cantidadNum} x RD${precioUnitario.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </>
                );
              } else if (articuloId) {
                const precioUnitario = parseFloat(monto) || 0;
                const cantidadNum = parseFloat(cantidad) || 1;
                const total = precioUnitario * cantidadNum;
                
                return (
                  <>
                    <View style={styles.formGroup}>
                      <Input
                        label="Precio Unitario (RD$)"
                        value={monto}
                        onChangeText={setMonto}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        required
                      />
                    </View>
                    
                    {monto && !isNaN(precioUnitario) && precioUnitario > 0 && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Total</Text>
                        <View style={styles.totalContainer}>
                          <Text style={styles.totalText}>
                            RD${total.toFixed(2)}
                          </Text>
                          <Text style={styles.totalCalculation}>
                            {cantidadNum} x RD${precioUnitario.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                );
              }
              
              return null;
            })()}
            
            <View style={styles.formGroup}>
              <Input
                label="Descripción (Opcional)"
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Detalles del gasto"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <Button
              title="Cancelar"
              onPress={handleClose}
              variant="outline"
              style={styles.button}
            />
            <Button
              title="Registrar Gasto"
              onPress={handleRegistrarGasto}
              loading={isLoading}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  loteInfo: {
    backgroundColor: colors.primary + '10',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  loteInfoText: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 2,
  },
  loteInfoLabel: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  placeholderText: {
    color: colors.textMedium,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 200,
  },
  dropdownScrollView: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  dropdownItemText: {
    fontSize: 16,
    color: colors.textDark,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  dropdownItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemPrice: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
    backgroundColor: colors.success + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  precioFijoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    borderWidth: 1,
    borderColor: colors.success + '30',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  precioFijoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  precioFijoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  precioFijoBadgeText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalCalculation: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});
