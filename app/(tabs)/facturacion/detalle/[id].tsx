/**
 * Pantalla de detalle de factura
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from '../../../../src/components/ui/Button';
import { Card } from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/constants/colors';
import { useFacturacion } from '../../../../src/hooks/useFacturacion';
import { EstadoFactura, Factura } from '../../../../src/types/facturacion';

export default function DetalleFacturaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { obtenerFactura, actualizarFactura, loading } = useFacturacion();
  
  const [factura, setFactura] = useState<Factura | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (id) {
      cargarFactura();
    }
  }, [id]);

  const cargarFactura = async () => {
    try {
      setCargando(true);
      const facturaData = await obtenerFactura(id!);
      setFactura(facturaData);
    } catch (error) {
      console.error('Error al cargar factura:', error);
      Alert.alert('Error', 'No se pudo cargar la factura');
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstado = async (nuevoEstado: EstadoFactura) => {
    if (!factura) return;

    Alert.alert(
      'Cambiar Estado',
      `¿Está seguro de cambiar el estado a "${getEstadoTexto(nuevoEstado)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            const facturaActualizada = await actualizarFactura(factura.id, { estado: nuevoEstado });
            if (facturaActualizada) {
              setFactura(facturaActualizada);
            }
          },
        },
      ]
    );
  };

  const compartirFactura = async () => {
    if (!factura) return;

    const contenido = generarTextoFactura(factura);
    
    try {
      await Share.share({
        message: contenido,
        title: `Factura ${factura.numero}`,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const formatearMoneda = (valor: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const formatearFecha = (fecha: Date): string => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(fecha));
  };

  const getEstadoColor = (estado: EstadoFactura): string => {
    switch (estado) {
      case EstadoFactura.BORRADOR:
        return colors.lightGray;
      case EstadoFactura.EMITIDA:
        return colors.warning;
      case EstadoFactura.PAGADA:
        return colors.success;
      case EstadoFactura.CANCELADA:
        return colors.error;
      default:
        return colors.lightGray;
    }
  };

  const getEstadoTexto = (estado: EstadoFactura): string => {
    switch (estado) {
      case EstadoFactura.BORRADOR:
        return 'Borrador';
      case EstadoFactura.EMITIDA:
        return 'Emitida';
      case EstadoFactura.PAGADA:
        return 'Pagada';
      case EstadoFactura.CANCELADA:
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const generarTextoFactura = (factura: Factura): string => {
    let texto = `FACTURA ${factura.numero}\n`;
    texto += `Fecha: ${formatearFecha(factura.fecha)}\n`;
    texto += `Cliente: ${factura.cliente.nombre}\n`;
    if (factura.cliente.documento) {
      texto += `Documento: ${factura.cliente.documento}\n`;
    }
    texto += '\n--- PRODUCTOS ---\n';
    
    factura.items.forEach((item) => {
      texto += `${item.producto.nombre}\n`;
      texto += `  ${item.cantidad} x ${formatearMoneda(item.precioUnitario)} = ${formatearMoneda(item.total)}\n`;
    });
    
    texto += '\n--- TOTALES ---\n';
    texto += `Subtotal: ${formatearMoneda(factura.subtotal)}\n`;
    if (factura.descuentoTotal > 0) {
      texto += `Descuento: ${formatearMoneda(factura.descuentoTotal)}\n`;
    }
    texto += `IVA: ${formatearMoneda(factura.impuestosTotal)}\n`;
    texto += `TOTAL: ${formatearMoneda(factura.total)}\n`;
    texto += `\nMétodo de pago: ${factura.metodoPago}\n`;
    texto += `Estado: ${getEstadoTexto(factura.estado)}\n`;
    
    if (factura.observaciones) {
      texto += `\nObservaciones: ${factura.observaciones}\n`;
    }
    
    return texto;
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando factura...</Text>
      </View>
    );
  }

  if (!factura) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={48} color={colors.lightGray} />
        <Text style={styles.errorText}>Factura no encontrada</Text>
        <Button
          title="Volver"
          onPress={() => router.back()}
          style={styles.volverButton}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header de la factura */}
      <Card style={styles.headerCard}>
        <View style={styles.facturaHeader}>
          <View>
            <Text style={styles.numeroFactura}>{factura.numero}</Text>
            <Text style={styles.fechaFactura}>{formatearFecha(factura.fecha)}</Text>
          </View>
          <View style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(factura.estado) }
          ]}>
            <Text style={styles.estadoText}>
              {getEstadoTexto(factura.estado)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Información del cliente */}
      <Card style={styles.clienteCard}>
        <Text style={styles.sectionTitle}>Cliente</Text>
        <Text style={styles.clienteNombre}>{factura.cliente.nombre}</Text>
        {factura.cliente.documento && (
          <Text style={styles.clienteDetalle}>Documento: {factura.cliente.documento}</Text>
        )}
        {factura.cliente.telefono && (
          <Text style={styles.clienteDetalle}>Teléfono: {factura.cliente.telefono}</Text>
        )}
        {factura.cliente.email && (
          <Text style={styles.clienteDetalle}>Email: {factura.cliente.email}</Text>
        )}
        {factura.cliente.direccion && (
          <Text style={styles.clienteDetalle}>
            Dirección: {factura.cliente.direccion}
            {factura.cliente.ciudad && `, ${factura.cliente.ciudad}`}
          </Text>
        )}
      </Card>

      {/* Productos */}
      <Card style={styles.productosCard}>
        <Text style={styles.sectionTitle}>Productos</Text>
        {factura.items.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.productoItem,
              index === factura.items.length - 1 && styles.productoItemLast
            ]}
          >
            <View style={styles.productoInfo}>
              <Text style={styles.productoNombre} numberOfLines={1}>
                {item.producto.nombre}
              </Text>
              <Text style={styles.productoDetalle}>
                {item.cantidad} x {formatearMoneda(item.precioUnitario)}
              </Text>
              {item.descuento && item.descuento > 0 && (
                <Text style={styles.productoDescuento}>
                  Descuento: -{formatearMoneda(item.descuento)}
                </Text>
              )}
            </View>
            <Text style={styles.productoTotal}>
              {formatearMoneda(item.total)}
            </Text>
          </View>
        ))}
      </Card>

      {/* Totales */}
      <Card style={styles.totalesCard}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatearMoneda(factura.subtotal)}</Text>
        </View>
        {factura.descuentoTotal > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento:</Text>
            <Text style={styles.totalValue}>-{formatearMoneda(factura.descuentoTotal)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA:</Text>
          <Text style={styles.totalValue}>{formatearMoneda(factura.impuestosTotal)}</Text>
        </View>
        <View style={[styles.totalRow, styles.totalFinal]}>
          <Text style={styles.totalLabelFinal}>Total:</Text>
          <Text style={styles.totalValueFinal}>{formatearMoneda(factura.total)}</Text>
        </View>
      </Card>

      {/* Información adicional */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Información Adicional</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Método de Pago:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {factura.metodoPago}
          </Text>
        </View>
        {factura.observaciones && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Observaciones:</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {factura.observaciones}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Creada:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {formatearFecha(factura.createdAt)}
          </Text>
        </View>
      </Card>

      {/* Acciones */}
      <Card style={styles.accionesCard}>
        <Text style={styles.sectionTitle}>Acciones</Text>

        <View style={styles.accionesGrid}>
          <Button
            title="Compartir"
            onPress={compartirFactura}
            icon="share"
            style={styles.accionButton}
          />

          {factura.estado === EstadoFactura.EMITIDA && (
            <Button
              title="Marcar Pagada"
              onPress={() => cambiarEstado(EstadoFactura.PAGADA)}
              icon="checkmark-circle"
              style={[styles.accionButton, styles.pagarButton]}
            />
          )}

          {factura.estado !== EstadoFactura.CANCELADA && (
            <Button
              title="Cancelar"
              onPress={() => cambiarEstado(EstadoFactura.CANCELADA)}
              icon="close-circle"
              style={[styles.accionButton, styles.cancelarButton]}
            />
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textDark,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  volverButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  headerCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  facturaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numeroFactura: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  fechaFactura: {
    fontSize: 14,
    color: colors.lightGray,
    marginTop: 4,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  clienteCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 8,
  },
  clienteDetalle: {
    fontSize: 14,
    color: colors.lightGray,
    marginBottom: 4,
    lineHeight: 20,
  },
  productosCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  productoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  productoItemLast: {
    borderBottomWidth: 0,
  },
  productoInfo: {
    flex: 1,
    marginRight: 12,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 4,
  },
  productoDetalle: {
    fontSize: 14,
    color: colors.lightGray,
    marginTop: 2,
  },
  productoDescuento: {
    fontSize: 12,
    color: colors.error,
    marginTop: 2,
  },
  productoTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  totalesCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.textDark,
  },
  totalValue: {
    fontSize: 16,
    color: colors.textDark,
  },
  totalFinal: {
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.lightGray,
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textDark,
    flex: 2,
  },
  accionesCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  accionesGrid: {
    gap: 12,
  },
  accionButton: {
    marginBottom: 0,
  },
  pagarButton: {
    backgroundColor: colors.success,
  },
  cancelarButton: {
    backgroundColor: colors.error,
  },
});








