/**
 * Pantalla principal del módulo de Gastos
 */

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import GastoSheet from '../../../src/components/ui/GastoSheet';
import { colors } from '../../../src/constants/colors';
import { useArticulosStore } from '../../../src/stores/articulosStore';
import { useGastosStore } from '../../../src/stores/gastosStore';

export default function GastosScreen() {
  const { registrarGasto, tipo, nombre } = useLocalSearchParams<{
    registrarGasto?: string;
    tipo?: string;
    nombre?: string;
  }>();
  
  const [seccionActiva, setSeccionActiva] = useState('articulos');
  const [gastoSheetVisible, setGastoSheetVisible] = useState(false);
  const [loteSeleccionado, setLoteSeleccionado] = useState<{
    id: string;
    tipo: string;
    nombre: string;
  } | null>(null);
  
  const { articulos, loadArticulos, isLoading: articulosLoading, error: articulosError } = useArticulosStore();
  const { gastos, estadisticas, cargarGastos, cargarEstadisticas, isLoading: gastosLoading } = useGastosStore();
  
  // Cargar artículos y gastos al montar el componente
  React.useEffect(() => {
    console.log('🔄 Cargando artículos y gastos...');
    loadArticulos();
    cargarGastos();
    cargarEstadisticas();
  }, []);

  // Debug: mostrar artículos cargados
  React.useEffect(() => {
    console.log('📦 Artículos cargados:', articulos.length, articulos);
    if (articulosError) {
      console.error('❌ Error en artículos:', articulosError);
    }
  }, [articulos, articulosError]);
  
  // Manejar parámetros de URL para abrir el sheet
  React.useEffect(() => {
    if (registrarGasto && tipo && nombre) {
      setLoteSeleccionado({
        id: registrarGasto,
        tipo,
        nombre: decodeURIComponent(nombre)
      });
      setGastoSheetVisible(true);
    }
  }, [registrarGasto, tipo, nombre]);

  const handleNuevoArticulo = () => {
    router.push('/gastos/agregar-articulo');
  };

  const handleVerArticulo = (articuloId: string) => {
    router.push({
      pathname: '/(modules)/gastos/articulo/[id]',
      params: { id: articuloId }
    });
  };

  const handleVerHistorialGastos = () => {
    router.push('/(modules)/gastos/historial');
  };
  
  const handleRegistrarGasto = (loteId: string, tipo: string, nombre: string) => {
    setLoteSeleccionado({ id: loteId, tipo, nombre });
    setGastoSheetVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Gastos y Artículos</Text>
        <Button 
          title="Nuevo Artículo" 
          onPress={handleNuevoArticulo} 
          size="small"
          style={styles.addButton}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, seccionActiva === 'articulos' && styles.activeTab]}
          onPress={() => setSeccionActiva('articulos')}
        >
          <Text style={seccionActiva === 'articulos' ? styles.activeTabText : styles.tabText}>
            Artículos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, seccionActiva === 'historial' && styles.activeTab]}
          onPress={() => setSeccionActiva('historial')}
        >
          <Text style={seccionActiva === 'historial' ? styles.activeTabText : styles.tabText}>
            Historial de Gastos
          </Text>
        </TouchableOpacity>
      </View>

      {seccionActiva === 'articulos' ? (
        articulosLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Cargando artículos...</Text>
          </View>
        ) : articulosError ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
            <Text style={styles.emptyStateTitle}>Error al cargar artículos</Text>
            <Text style={styles.emptyStateText}>{articulosError}</Text>
            <Button 
              title="Reintentar" 
              onPress={() => loadArticulos()} 
              style={styles.createButton}
            />
          </View>
        ) : articulos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color={colors.lightGray} />
            <Text style={styles.emptyStateTitle}>No hay artículos registrados</Text>
            <Text style={styles.emptyStateText}>
              Comience registrando los artículos que utiliza en sus lotes
            </Text>
            <Button 
              title="Agregar Artículo" 
              onPress={handleNuevoArticulo} 
              style={styles.createButton}
            />
          </View>
        ) : (
          // Listado real de artículos
          <View>
            {articulos.map((articulo) => (
              <Card key={articulo.id} style={styles.articuloCard}>
                <View style={styles.articuloHeader}>
                  <View>
                    <Text style={styles.articuloName}>{articulo.nombre}</Text>
                    <Text style={styles.articuloMedida}>
                      Estado: {articulo.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                  <View style={styles.articuloStatus}>
                    <View style={[
                      styles.statusBadge, 
                      articulo.activo ? styles.activeBadge : styles.inactiveBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        articulo.activo ? styles.activeText : styles.inactiveText
                      ]}>
                        {articulo.activo ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.articuloActions}>
                  <Button 
                    title="Editar" 
                    onPress={() => handleVerArticulo(articulo.id)} 
                    variant="outline"
                    size="small"
                    style={styles.actionButton}
                  />
                  <Button 
                    title={articulo.activo ? 'Desactivar' : 'Activar'}
                    onPress={() => {
                      // TODO: Implementar toggle de estado
                      Alert.alert('Info', 'Función por implementar');
                    }} 
                    variant={articulo.activo ? 'danger' : 'primary'}
                    size="small"
                    style={styles.actionButton}
                  />
                </View>
              </Card>
            ))}
          </View>
        )
      ) : (
        // Sección de historial de gastos
        <View style={styles.historialContainer}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumen de Gastos</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  RD${estadisticas?.ponedoras?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.summaryLabel}>Ponedoras</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  RD${estadisticas?.israelies?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.summaryLabel}>Israelíes</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  RD${estadisticas?.engorde?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.summaryLabel}>Engorde</Text>
              </View>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total General:</Text>
              <Text style={styles.totalValue}>
                RD${estadisticas?.total?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </Card>
          
          <View style={styles.historialHeader}>
            <Text style={styles.historialTitle}>Gastos Recientes</Text>
            <Button 
              title="Ver Todos" 
              onPress={handleVerHistorialGastos} 
              variant="outline"
              size="small"
            />
          </View>
          
          {gastosLoading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Cargando gastos...</Text>
            </View>
          ) : gastos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.lightGray} />
              <Text style={styles.emptyStateTitle}>No hay gastos registrados</Text>
              <Text style={styles.emptyStateText}>
                Los gastos se registrarán automáticamente al agregarlos a los lotes
              </Text>
            </View>
          ) : (
            <View style={styles.gastosListContainer}>
              {gastos.slice(0, 10).map((gasto) => (
                <Card key={gasto.id} style={styles.gastoCard}>
                  <View style={styles.gastoHeader}>
                    <View style={styles.gastoInfo}>
                      <Text style={styles.gastoConcepto}>{gasto.articuloNombre}</Text>
                      <Text style={styles.gastoFecha}>
                        {gasto.fecha.toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                    <Text style={styles.gastoMonto}>RD${gasto.total.toFixed(2)}</Text>
                  </View>
                  
                  {gasto.loteId && (
                    <View style={styles.gastoLoteInfo}>
                      <Text style={styles.gastoLoteText}>
                        <Text style={styles.gastoLoteLabel}>Lote:</Text> {gasto.loteId}
                      </Text>
                      <Text style={styles.gastoTipoText}>
                        <Text style={styles.gastoTipoLabel}>Tipo:</Text> {gasto.tipoLote}
                      </Text>
                    </View>
                  )}
                  
                  {gasto.descripcion && (
                    <Text style={styles.gastoDescripcion}>{gasto.descripcion}</Text>
                  )}
                </Card>
              ))}
            </View>
          )}
        </View>
      )}
      
      {/* Sheet para registrar gastos */}
      {loteSeleccionado && (
        <GastoSheet
          visible={gastoSheetVisible}
          onClose={() => setGastoSheetVisible(false)}
          loteId={loteSeleccionado.id}
          tipoLote={loteSeleccionado.tipo}
          loteNombre={loteSeleccionado.nombre}
          articulos={articulos.map(a => ({ id: a.id, nombre: a.nombre }))}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  addButton: {
    minWidth: 130,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.danger,
  },
  tabText: {
    color: colors.textMedium,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    minWidth: 150,
  },
  articuloCard: {
    marginBottom: 16,
    padding: 16,
  },
  articuloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  articuloName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  articuloMedida: {
    fontSize: 14,
    color: colors.textMedium,
  },
  articuloPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  articuloActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  historialContainer: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 16,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.danger,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
  },
  gastosListContainer: {
    flex: 1,
  },
  gastoCard: {
    marginBottom: 12,
    padding: 16,
  },
  gastoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gastoInfo: {
    flex: 1,
  },
  gastoConcepto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 2,
  },
  gastoFecha: {
    fontSize: 14,
    color: colors.textMedium,
  },
  gastoMonto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
  gastoLoteInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gastoLoteText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  gastoLoteLabel: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  gastoTipoText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  gastoTipoLabel: {
    fontWeight: 'bold',
    color: colors.textDark,
  },
  gastoDescripcion: {
    fontSize: 14,
    color: colors.textMedium,
    fontStyle: 'italic',
  },
  articuloStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: colors.success + '20',
  },
  inactiveBadge: {
    backgroundColor: colors.lightGray + '40',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: colors.success,
  },
  inactiveText: {
    color: colors.textMedium,
  },
});

