/**
 * Detalle de Factura - Diseño moderno tipo recibo digital
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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
import { compartirFacturaPDF, generarFacturaPDF, imprimirFactura } from '../../../src/services/factura-pdf.service';
import { EstadoFactura, Factura, facturasService } from '../../../src/services/facturas.service';

export default function DetalleFacturaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    cargarFactura();
  }, [id]);

  const cargarFactura = async () => {
    try {
      setLoading(true);
      const facturaData = await facturasService.getFactura(id as string);
      setFactura(facturaData);
    } catch (error) {
      console.error('Error cargando factura:', error);
      Alert.alert('Error', 'No se pudo cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarPDF = async () => {
    if (!factura) return;

    try {
      setGenerandoPDF(true);
      const uri = await generarFacturaPDF(factura);
      
      Alert.alert(
        'PDF Generado',
        '¿Qué deseas hacer con el PDF?',
        [
          {
            text: 'Compartir',
            onPress: () => handleCompartirPDF(uri),
          },
          {
            text: 'Ver',
            onPress: () => {
              // Aquí podrías abrir el PDF con un visor
              Alert.alert('PDF guardado', `Archivo guardado en: ${uri}`);
            },
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

  const handleCompartirPDF = async (uri?: string) => {
    if (!factura) return;

    try {
      let pdfUri = uri;
      
      if (!pdfUri) {
        setGenerandoPDF(true);
        pdfUri = await generarFacturaPDF(factura);
      }

      await compartirFacturaPDF(pdfUri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleImprimir = async () => {
    if (!factura) return;

    try {
      await imprimirFactura(factura);
    } catch (error) {
      Alert.alert('Error', 'No se pudo imprimir la factura');
    }
  };

  const getEstadoBadgeStyle = (estado: EstadoFactura) => {
    switch (estado) {
      case EstadoFactura.EMITIDA:
        return styles.estadoEmitida;
      case EstadoFactura.ANULADA:
        return styles.estadoCancelada;
      default:
        return styles.estadoEmitida;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="Factura"
          showBack
          showProfile={false}
          statusBarStyle="dark"
          backgroundColor="transparent"
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando factura...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!factura) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader
          title="Factura"
          showBack
          statusBarStyle="dark"
          backgroundColor="transparent"
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="receipt-outline" size={64} color={colors.textMedium} />
          <Text style={styles.errorText}>Factura no encontrada</Text>
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
        title="Factura"
        showBack
        showProfile={false}
        statusBarStyle="dark"
        backgroundColor="transparent"
        onBackPress={() => router.back()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo y número de factura */}
        <View style={styles.headerSection}>
          <Image
            source={require('../../../assets/images/full-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.invoiceNumber}>{factura.numero}</Text>
          <View style={[styles.estadoBadge, getEstadoBadgeStyle(factura.estado)]}>
            <Text style={styles.estadoText}>{factura.estado}</Text>
          </View>
        </View>

        {/* Información del cliente */}
        <Card style={styles.clienteCard}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.clienteInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.clienteNombre}>{factura.cliente.nombre}</Text>
            </View>
            {factura.cliente.documento && (
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={18} color={colors.textMedium} />
                <Text style={styles.infoText}>{factura.cliente.documento}</Text>
              </View>
            )}
            {factura.cliente.telefono && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={colors.textMedium} />
                <Text style={styles.infoText}>{factura.cliente.telefono}</Text>
              </View>
            )}
            {factura.cliente.email && (
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textMedium} />
                <Text style={styles.infoText}>{factura.cliente.email}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.textMedium} />
              <Text style={styles.infoText}>
                {factura.fecha.toLocaleDateString('es-DO', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Productos / Servicios</Text>
          {factura.venta.items.map((item, index) => (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNombre}>{item.producto.nombre}</Text>
                <Text style={styles.itemSubtotal}>RD${item.subtotal.toFixed(2)}</Text>
              </View>
              {item.producto.descripcion && (
                <Text style={styles.itemDescripcion}>{item.producto.descripcion}</Text>
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetailText}>
                  {item.cantidad} × RD${item.precioUnitario.toFixed(2)}
                </Text>
                {item.descuento && item.descuento > 0 && (
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
            <Text style={styles.totalValue}>RD${factura.resumen.subtotal.toFixed(2)}</Text>
          </View>
          {factura.resumen.descuentoTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento</Text>
              <Text style={[styles.totalValue, styles.descuentoValue]}>
                -RD${factura.resumen.descuentoTotal.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text style={styles.totalFinalLabel}>Total</Text>
            <Text style={styles.totalFinalValue}>RD${factura.resumen.total.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Información adicional */}
        <View style={styles.additionalInfo}>
          <Card style={styles.infoCard}>
            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
            <Text style={styles.infoCardLabel}>Método de Pago</Text>
            <Text style={styles.infoCardValue}>{factura.venta.metodoPago}</Text>
          </Card>
          <Card style={styles.infoCard}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
            <Text style={styles.infoCardLabel}>Total Items</Text>
            <Text style={styles.infoCardValue}>{factura.resumen.totalItems}</Text>
          </Card>
        </View>

        {/* Observaciones */}
        {factura.venta.observaciones && (
          <Card style={styles.observacionesCard}>
            <View style={styles.observacionesHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.warning} />
              <Text style={styles.observacionesTitle}>Observaciones</Text>
            </View>
            <Text style={styles.observacionesText}>{factura.venta.observaciones}</Text>
          </Card>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Botones de acción flotantes */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => handleCompartirPDF()}
          disabled={generandoPDF}
        >
          {generandoPDF ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Compartir</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => handleGenerarPDF()}
          disabled={generandoPDF}
        >
          {generandoPDF ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Generar PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: -100,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
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
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: 12,
  },
  estadoBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  estadoEmitida: {
    backgroundColor: colors.success + '20',
  },
  estadoCancelada: {
    backgroundColor: colors.error + '20',
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  clienteInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  itemSubtotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  itemDescripcion: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 8,
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
  bottomSpacer: {
    height: 20,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

