/**
 * Detalle de Venta
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../../../src/components/layouts/AppHeader';
import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useVentas } from '../../../src/hooks/useVentas';
import { compartirFacturaPDF, generarFacturaPDF } from '../../../src/services/factura-pdf.service';
import { facturasService } from '../../../src/services/facturas.service';
import { EstadoVenta, Venta, ventasService } from '../../../src/services/ventas.service';

export default function DetalleVentaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { ventas, getVentas } = useVentas();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    cargarVenta();
  }, [id]);

  const cargarVenta = async () => {
    try {
      setLoading(true);
      
      // Obtener el ID correcto (puede venir como string o array)
      const ventaId = Array.isArray(id) ? id[0] : id;
      
      if (!ventaId) {
        console.error('❌ [DetalleVenta] No se proporcionó ID de venta');
        setVenta(null);
        setLoading(false);
        return;
      }
      
      console.log('🔍 [DetalleVenta] Buscando venta con ID:', ventaId);
      
      // Primero intentar buscar en las ventas ya cargadas del hook
      if (ventas.length > 0) {
        const ventaEncontrada = ventas.find(v => v.id === ventaId);
        if (ventaEncontrada) {
          console.log('✅ [DetalleVenta] Venta encontrada en estado:', ventaEncontrada.numero);
          setVenta(ventaEncontrada);
          setLoading(false);
          return;
        }
      }
      
      // Si no está en el estado, obtener directamente del servicio
      console.log('⚠️ [DetalleVenta] Venta no encontrada en estado, buscando directamente en servicio...');
      const todasLasVentas = await ventasService.getVentas();
      
      // Buscar por ID exacto
      let ventaDirecta = todasLasVentas.find(v => v.id === ventaId);
      
      // Si no se encuentra, buscar por número de venta (por si acaso)
      if (!ventaDirecta) {
        ventaDirecta = todasLasVentas.find(v => v.numero === ventaId);
      }
      
      if (ventaDirecta) {
        console.log('✅ [DetalleVenta] Venta encontrada directamente:', ventaDirecta.numero, 'ID:', ventaDirecta.id);
        setVenta(ventaDirecta);
        // Actualizar el estado del hook también para futuras búsquedas
        await getVentas();
      } else {
        console.error('❌ [DetalleVenta] Venta no encontrada con ID:', ventaId);
        console.log('📊 [DetalleVenta] Total de ventas:', todasLasVentas.length);
        if (todasLasVentas.length > 0) {
          console.log('📊 [DetalleVenta] Primeros IDs disponibles:', todasLasVentas.slice(0, 5).map(v => ({ id: v.id, numero: v.numero })));
        } else {
          console.log('⚠️ [DetalleVenta] No hay ventas cargadas');
        }
        setVenta(null);
      }
    } catch (error) {
      console.error('❌ [DetalleVenta] Error cargando venta:', error);
      Alert.alert('Error', 'No se pudo cargar la venta');
      setVenta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerFactura = async () => {
    if (!venta) return;

    try {
      // Buscar si existe una factura para esta venta
      const facturas = await facturasService.getFacturas();
      const factura = facturas.find(f => f.ventaId === venta.id);

      if (factura) {
        router.push(`/(tabs)/facturacion/${factura.id}`);
      } else {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error buscando factura:', error);
      setShowModal(true);
    }
  };

  const handleGenerarFactura = async () => {
    if (!venta) return;

    try {
      setShowModal(false);
      Alert.alert(
        'Generar Factura',
        '¿Deseas generar una factura para esta venta?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Generar',
            onPress: async () => {
              try {
                const factura = await facturasService.generarFactura({
                  ventaId: venta.id,
                  formato: {
                    empresa: 'ASOAVES',
                    footer: 'Gracias por su preferencia',
                  },
                });
                
                Alert.alert(
                  'Factura Generada',
                  `Factura ${factura.numero} creada exitosamente`,
                  [
                    {
                      text: 'Ver Factura',
                      onPress: () => router.push(`/(tabs)/facturacion/${factura.id}`),
                    },
                  ]
                );
              } catch (error) {
                Alert.alert('Error', 'No se pudo generar la factura');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error');
    }
  };

  const handleGenerarPDF = async () => {
    if (!venta) return;

    try {
      setShowModal(false);
      setGenerandoPDF(true);

      // Primero generar factura si no existe
      const facturas = await facturasService.getFacturas();
      let factura = facturas.find(f => f.ventaId === venta.id);

      if (!factura) {
        factura = await facturasService.generarFactura({
          ventaId: venta.id,
          formato: {
            empresa: 'ASOAVES',
            footer: 'Gracias por su preferencia',
          },
        });
      }

      const uri = await generarFacturaPDF(factura);

      Alert.alert(
        'PDF Generado',
        '¿Qué deseas hacer?',
        [
          {
            text: 'Compartir',
            onPress: () => compartirFacturaPDF(uri),
          },
          {
            text: 'Cerrar',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleCompartir = async () => {
    await handleGenerarPDF();
  };

  const getEstadoBadgeStyle = (estado: EstadoVenta) => {
    switch (estado) {
      case EstadoVenta.CONFIRMADA:
        return styles.estadoConfirmada;
      case EstadoVenta.PENDIENTE:
        return styles.estadoPendiente;
      case EstadoVenta.CANCELADA:
        return styles.estadoCancelada;
      default:
        return styles.estadoPendiente;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader
          title="Detalle de Venta"
          showBack
          statusBarStyle="dark"
          backgroundColor="transparent"
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando venta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!venta) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader
          title="Detalle de Venta"
          showBack
          statusBarStyle="dark"
          backgroundColor="transparent"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.textMedium} />
          <Text style={styles.errorText}>Venta no encontrada</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Detalle de Venta"
        showBack
        statusBarStyle="dark"
        backgroundColor="transparent"
        onBackPress={() => router.back()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Número y estado */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.numeroLabel}>Venta</Text>
              <Text style={styles.numeroValue}>{venta.numero}</Text>
            </View>
            <View style={[styles.estadoBadge, getEstadoBadgeStyle(venta.estado)]}>
              <Text style={styles.estadoText}>{venta.estado}</Text>
            </View>
          </View>
          <Text style={styles.fechaText}>
            {venta.fecha.toLocaleDateString('es-DO', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </Card>

        {/* Cliente */}
        <Card style={styles.clienteCard}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.clienteNombre}>{venta.cliente.nombre}</Text>
          </View>
          {venta.cliente.telefono && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={colors.textMedium} />
              <Text style={styles.infoText}>{venta.cliente.telefono}</Text>
            </View>
          )}
          {venta.cliente.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textMedium} />
              <Text style={styles.infoText}>{venta.cliente.email}</Text>
            </View>
          )}
        </Card>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {venta.items.map((item) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
                <Text style={styles.itemTotal}>RD${item.total.toFixed(2)}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetailText}>
                  {item.cantidad} × RD${item.precioUnitario.toFixed(2)}
                </Text>
                {item.descuento > 0 && (
                  <Text style={styles.itemDescuento}>
                    Desc: -RD${item.descuento.toFixed(2)}
                  </Text>
                )}
              </View>
            </Card>
          ))}
        </View>

        {/* Totales */}
        <Card style={styles.totalesCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>RD${venta.subtotal.toFixed(2)}</Text>
          </View>
          {venta.descuentoTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento</Text>
              <Text style={[styles.totalValue, styles.descuentoValue]}>
                -RD${venta.descuentoTotal.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>RD${venta.total.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Información adicional */}
        <View style={styles.additionalInfo}>
          <Card style={styles.infoCard}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.infoCardLabel}>Método de Pago</Text>
            <Text style={styles.infoCardValue}>{venta.metodoPago}</Text>
          </Card>
          <Card style={styles.infoCard}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
            <Text style={styles.infoCardLabel}>Total Items</Text>
            <Text style={styles.infoCardValue}>{venta.items.length}</Text>
          </Card>
        </View>

        {/* Observaciones */}
        {venta.observaciones && (
          <Card style={styles.observacionesCard}>
            <View style={styles.observacionesHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.warning} />
              <Text style={styles.observacionesTitle}>Observaciones</Text>
            </View>
            <Text style={styles.observacionesText}>{venta.observaciones}</Text>
          </Card>
        )}

        {/* Botón Ver Factura */}
        <TouchableOpacity
          style={styles.verFacturaButton}
          onPress={handleVerFactura}
          disabled={generandoPDF}
        >
          {generandoPDF ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="receipt-outline" size={24} color={colors.white} />
              <Text style={styles.verFacturaText}>Ver Factura</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de opciones */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opciones de Factura</Text>
            <Text style={styles.modalSubtitle}>
              No existe una factura para esta venta
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleGenerarFactura}
            >
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Generar Factura</Text>
                <Text style={styles.modalOptionDesc}>Crear comprobante de venta</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleGenerarPDF}
            >
              <Ionicons name="download-outline" size={24} color={colors.primary} />
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Generar PDF</Text>
                <Text style={styles.modalOptionDesc}>Crear y descargar PDF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleCompartir}
            >
              <Ionicons name="share-outline" size={24} color={colors.primary} />
              <View style={styles.modalOptionText}>
                <Text style={styles.modalOptionTitle}>Compartir</Text>
                <Text style={styles.modalOptionDesc}>Generar y compartir PDF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  numeroLabel: {
    fontSize: 13,
    color: colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  numeroValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  estadoBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  estadoConfirmada: {
    backgroundColor: colors.success + '20',
  },
  estadoPendiente: {
    backgroundColor: colors.warning + '20',
  },
  estadoCancelada: {
    backgroundColor: colors.error + '20',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fechaText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  clienteCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  clienteNombre: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: colors.textDark,
    flex: 1,
  },
  itemsSection: {
    marginBottom: 16,
  },
  itemCard: {
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    flex: 1,
    marginRight: 12,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetailText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  itemDescuento: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '600',
  },
  totalesCard: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: colors.primary + '08',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: colors.textMedium,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  descuentoValue: {
    color: colors.warning,
  },
  totalFinal: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  totalFinalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  totalFinalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  additionalInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 8,
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 4,
    textAlign: 'center',
  },
  observacionesCard: {
    padding: 16,
    backgroundColor: colors.warning + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 16,
  },
  observacionesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  observacionesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
  },
  observacionesText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  verFacturaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  verFacturaText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.textMedium,
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  modalOptionDesc: {
    fontSize: 13,
    color: colors.textMedium,
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMedium,
  },
});

