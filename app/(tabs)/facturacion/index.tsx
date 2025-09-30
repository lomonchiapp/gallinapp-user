/**
 * Tab de facturación - Pantalla principal
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useFacturacion } from '../../../src/hooks/useFacturacion';
import { useGalpones } from '../../../src/hooks/useGalpones';
import { facturacionService } from '../../../src/services/facturacion.service';
import { TipoAve } from '../../../src/types/enums';
import { EstadoFactura, ResumenVentas } from '../../../src/types/facturacion';

export default function FacturacionScreen() {
  const router = useRouter();
  const { facturas, clientes, productos, lotes, configuracion, loading, error } = useFacturacion();
  const { galpones } = useGalpones();
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  interface LoteResumen {
    id: string;
    nombre: string;
    raza?: string;
    tipo: string;
    cantidadActual?: number;
  }

  interface LotesGalpon {
    lotes: LoteResumen[];
    totalAves: number;
  }

  const lotesPorGalpon = useMemo(() => {
    const agrupados: Record<string, LotesGalpon> = {};
    const agregar = (galponId: string | undefined, lote: LoteResumen) => {
      if (!galponId) return;
      if (!agrupados[galponId]) {
        agrupados[galponId] = { lotes: [], totalAves: 0 };
      }
      agrupados[galponId].lotes.push(lote);
      agrupados[galponId].totalAves += lote.cantidadActual ?? 0;
    };

    lotes.ponedoras.forEach((lote) =>
      agregar(lote.galponId, {
        id: lote.id,
        nombre: lote.nombre,
        raza: lote.raza,
        tipo: 'Ponedoras',
        cantidadActual: lote.cantidadActual,
      })
    );
    lotes.levantes.forEach((lote) =>
      agregar(lote.galponId, {
        id: lote.id,
        nombre: lote.nombre,
        raza: lote.raza,
        tipo: 'Levante',
        cantidadActual: lote.cantidadActual,
      })
    );
    lotes.engordes.forEach((lote) =>
      agregar(lote.galponId, {
        id: lote.id,
        nombre: lote.nombre,
        raza: lote.raza,
        tipo: 'Engorde',
        cantidadActual: lote.cantidadActual,
      })
    );

    return agrupados;
  }, [lotes]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [facturasData, resumenData] = await Promise.all([
        facturacionService.getFacturas(),
        generarResumenMensual(),
      ]);

      const facturasOrdenadas = facturasData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setResumen(resumenData);
    } catch (error) {
      console.error('Error al cargar datos de facturación:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de facturación');
    } finally {
      setRefreshing(false);
    }
  };

  const generarResumenMensual = async (): Promise<ResumenVentas> => {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaFin.getMonth() - 1);

    const resumenGenerado = await facturacionService.generarResumenVentas(
      fechaInicio,
      fechaFin
    );
    return (
      resumenGenerado || {
        periodo: { inicio: fechaInicio, fin: fechaFin },
        totalFacturas: 0,
        totalVentas: 0,
        ventasPorTipo: {
          LOTE_COMPLETO: { cantidad: 0, valor: 0 },
          UNIDADES_GALLINAS_PONEDORAS: { cantidad: 0, valor: 0 },
          UNIDADES_POLLOS_LEVANTE: { cantidad: 0, valor: 0 },
          UNIDADES_POLLOS_ENGORDE: { cantidad: 0, valor: 0 },
          HUEVOS: { cantidad: 0, valor: 0 },
        },
        ventasPorAve: {
          [TipoAve.PONEDORA]: { cantidad: 0, valor: 0 },
          [TipoAve.POLLO_LEVANTE]: { cantidad: 0, valor: 0 },
          [TipoAve.POLLO_ENGORDE]: { cantidad: 0, valor: 0 },
        },
        clientesMasCompradores: [],
      }
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
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
    }).format(new Date(fecha));
  };

  const formatearFechaCorta = (fecha: Date): string => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(fecha));
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

  const getEstadoBadgeVariant = (estado: EstadoFactura) => {
    switch (estado) {
      case EstadoFactura.PAGADA:
        return {
          label: 'Pagada',
          background: 'rgba(46, 204, 113, 0.15)',
          color: colors.success,
        };
      case EstadoFactura.EMITIDA:
        return {
          label: 'Emitida',
          background: 'rgba(243, 156, 18, 0.15)',
          color: colors.warning,
        };
      case EstadoFactura.CANCELADA:
        return {
          label: 'Cancelada',
          background: 'rgba(231, 76, 60, 0.15)',
          color: colors.error,
        };
      default:
        return {
          label: 'Borrador',
          background: 'rgba(153, 153, 153, 0.15)',
          color: colors.mediumGray,
        };
    }
  };

  const navegarANuevaFactura = () => {
    router.push('/facturacion/nueva-factura');
  };

  const navegarADetalleFactura = (facturaId: string) => {
    router.push(`/facturacion/detalle/${facturaId}`);
  };

  const navegarAReportes = () => {
    router.push('/facturacion/reportes');
  };

  const navegarAClientes = () => {
    router.push('/facturacion/clientes');
  };

  const navegarAProductos = () => {
    router.push('/facturacion/productos');
  };

  const totalVentas = resumen?.totalVentas ?? 0;
  const totalFacturas = resumen?.totalFacturas ?? facturas.length;

  const periodoLabel = useMemo(() => {
    if (!resumen) {
      return 'Sin periodo definido';
    }
    return `${formatearFechaCorta(resumen.periodo.inicio)} - ${formatearFechaCorta(resumen.periodo.fin)}`;
  }, [resumen]);

  const accionesRapidas = useMemo(
    () => [
      {
        id: 'clientes',
        label: 'Clientes',
        descripcion: 'Gestiona tu cartera de compradores',
        icono: 'people-outline' as const,
        color: colors.primary,
        fondo: 'rgba(10, 61, 98, 0.12)',
        onPress: navegarAClientes,
      },
      {
        id: 'productos',
        label: 'Productos',
        descripcion: 'Actualiza precios y disponibilidad',
        icono: 'cube-outline' as const,
        color: colors.secondary,
        fondo: 'rgba(50, 130, 184, 0.12)',
        onPress: navegarAProductos,
      },
      {
        id: 'reportes',
        label: 'Reportes',
        descripcion: 'Analiza el desempeño de ventas',
        icono: 'bar-chart-outline' as const,
        color: colors.secondary,
        fondo: 'rgba(10, 61, 98, 0.12)',
        onPress: navegarAReportes,
      },
    ],
    []
  );

  const aveMeta: Record<TipoAve, { label: string; icon: string; color: string; fondo: string }> = {
    [TipoAve.PONEDORA]: {
      label: 'Gallinas ponedoras',
      icon: 'egg-outline',
      color: colors.ponedoras,
      fondo: 'rgba(30, 132, 73, 0.12)',
    },
    [TipoAve.POLLO_LEVANTE]: {
      label: 'Pollos de levante',
      icon: 'trending-up-outline',
      color: colors.secondary,
      fondo: 'rgba(50, 130, 184, 0.12)',
    },
    [TipoAve.POLLO_ENGORDE]: {
      label: 'Pollos de engorde',
      icon: 'fast-food-outline',
      color: colors.engorde,
      fondo: 'rgba(155, 89, 182, 0.12)',
    },
  };

  const ventasPorAve = useMemo(() => {
    return (Object.keys(aveMeta) as TipoAve[]).map((tipoAve) => {
      const datos = resumen?.ventasPorAve?.[tipoAve];
      return {
        tipo: tipoAve,
        label: aveMeta[tipoAve].label,
        icon: aveMeta[tipoAve].icon,
        color: aveMeta[tipoAve].color,
        fondo: aveMeta[tipoAve].fondo,
        valor: formatearMoneda(datos?.valor ?? 0),
        cantidad: datos?.cantidad ?? 0,
      };
    });
  }, [resumen]);

  const ultimasFacturas = useMemo(() => facturas.slice(0, 5), [facturas]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando facturación...</Text>
      </View>
    );
  }

  const renderLoteCard: ListRenderItem<LoteBase> = ({ item }) => (
    <View style={styles.loteCard}>
      <Text style={styles.loteNombre}>{item.nombre}</Text>
      {item.raza ? (
        <View style={styles.loteBadge}>
          <Text style={styles.loteBadgeText}>{item.raza}</Text>
        </View>
      ) : null}
      <Text style={styles.loteCantidad}>{item.cantidadActual ?? 0} aves actuales</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Card style={[styles.sectionCard, styles.heroCard]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Resumen mensual</Text>
            <Text style={styles.heroTitle}>Ventas totales</Text>
          </View>
          <TouchableOpacity
            style={styles.heroAction}
            onPress={navegarANuevaFactura}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.heroActionText}>Nueva factura</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.heroBody}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{formatearMoneda(totalVentas)}</Text>
            <Text style={styles.heroStatLabel}>Total vendido</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{totalFacturas}</Text>
            <Text style={styles.heroStatLabel}>Facturas emitidas</Text>
          </View>
        </View>
        <View style={styles.heroFooter}>
          <View style={styles.heroBadge}>
            <Ionicons name="calendar-outline" size={14} color={colors.white} />
            <Text style={styles.heroBadgeText}>{periodoLabel}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="time-outline" size={14} color={colors.white} />
            <Text style={styles.heroBadgeText}>Actualizado en tiempo real</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        </View>
        <View style={styles.actionGrid}>
          {accionesRapidas.map((accion) => (
            <TouchableOpacity
              key={accion.id}
              style={styles.actionItem}
              onPress={accion.onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: accion.fondo }]}> 
                <Ionicons name={accion.icono} size={20} color={accion.color} />
              </View>
              <Text style={styles.actionTitle}>{accion.label}</Text>
              <Text style={styles.actionDescription}>{accion.descripcion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ventas por tipo de lote</Text>
        </View>
        <View style={styles.metricGrid}>
          {ventasPorAve.map((item) => (
            <View key={item.tipo} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: item.fondo }]}> 
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={styles.metricValue}>{item.valor}</Text>
              <Text style={styles.metricCaption}>{item.cantidad} unidades vendidas</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Facturas recientes</Text>
          <TouchableOpacity
            onPress={() => router.push('/facturacion/todas')}
            style={styles.sectionAction}
            activeOpacity={0.8}
          >
            <Text style={styles.sectionActionText}>Ver historial</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {ultimasFacturas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={36} color={colors.lightGray} />
            </View>
            <Text style={styles.emptyTitle}>No hay facturas registradas</Text>
            <Text style={styles.emptySubtitle}>
              Genera tu primera factura para empezar a registrar las ventas de tus lotes.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={navegarANuevaFactura} activeOpacity={0.8}>
              <Text style={styles.emptyButtonText}>Crear factura</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.invoiceList}>
            {ultimasFacturas.map((factura, index) => {
              const estado = getEstadoBadgeVariant(factura.estado);
              return (
                <TouchableOpacity
                  key={factura.id}
                  style={[
                    styles.invoiceRow,
                    index === ultimasFacturas.length - 1 && styles.invoiceRowLast,
                  ]}
                  onPress={() => navegarADetalleFactura(factura.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceNumber} numberOfLines={1}>
                      {factura.numero}
                    </Text>
                    <Text style={styles.invoiceClient} numberOfLines={1}>
                      {factura.cliente.nombre}
                    </Text>
                    <View style={styles.invoiceMeta}>
                      <Ionicons name="calendar-outline" size={12} color={colors.lightGray} />
                      <Text style={styles.invoiceMetaText}>{formatearFecha(factura.fecha)}</Text>
                    </View>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>{formatearMoneda(factura.total)}</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: estado.background }]}> 
                      <View style={[styles.estadoDot, { backgroundColor: estado.color }]} />
                      <Text style={[styles.estadoText, { color: estado.color }]}>{estado.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </Card>

      <Card style={[styles.sectionCard, styles.bannerCard]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerIcon}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
          </View>
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>Facturación basada en lotes</Text>
            <Text style={styles.bannerSubtitle}>
              Cada venta descuenta automáticamente las unidades del lote correspondiente y marca el lote como vendido cuando se factura completo.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bannerButton}
            onPress={navegarAReportes}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerButtonText}>Ver reportes</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Galpones y lotes</Text>
          <TouchableOpacity onPress={() => router.push('/facturacion/galpones')}>
            <Text style={styles.sectionAction}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {galpones.length === 0 ? (
          <Text style={styles.emptyStateText}>Aún no has configurado galpones.</Text>
        ) : (
          galpones.map((galpon) => {
            const datosGalpon = lotesPorGalpon[galpon.id];
            const lotesAsociados = datosGalpon?.lotes || [];
            const totalAves = datosGalpon?.totalAves || 0;
            return (
              <View key={galpon.id} style={styles.galponCard}>
                <View style={styles.galponHeader}>
                  <View>
                    <Text style={styles.galponNombre}>{galpon.nombre}</Text>
                    <Text style={styles.galponMeta}>
                      {lotesAsociados.length} lote
                      {lotesAsociados.length !== 1 ? 's' : ''} · {totalAves} aves
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.galponAction}
                    onPress={() => router.push('/facturacion/galpones')}
                  >
                    <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {lotesAsociados.length > 0 ? (
                  <View style={styles.loteList}>
                    {lotesAsociados.slice(0, 3).map((lote) => (
                      <View key={lote.id} style={styles.loteItem}>
                        <Ionicons name="archive-outline" size={16} color={colors.primary} />
                        <View style={styles.loteInfo}>
                          <Text style={styles.loteNombre}>{lote.nombre}</Text>
                          <Text style={styles.loteMeta}>
                            {lote.tipo} · {lote.raza || 'Sin raza'} · {lote.cantidadActual} aves
                          </Text>
                        </View>
                      </View>
                    ))}
                    {lotesAsociados.length > 3 ? (
                      <Text style={styles.loteExtra}>
                        +{lotesAsociados.length - 3} lote
                        {lotesAsociados.length - 3 !== 1 ? 's' : ''} adicionales
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.emptyGalponText}>Aún no hay lotes en este galpón.</Text>
                )}
              </View>
            );
          })
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
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
  sectionCard: {
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  heroActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroStat: {
    flex: 1,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  heroFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  heroBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  actionItem: {
    flexBasis: '31%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  actionDescription: {
    fontSize: 12,
    color: colors.lightGray,
    lineHeight: 18,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '48%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    gap: 8,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 13,
    color: colors.mediumGray,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  metricCaption: {
    fontSize: 12,
    color: colors.lightGray,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  invoiceList: {
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    gap: 16,
  },
  invoiceRowLast: {
    borderBottomWidth: 0,
  },
  invoiceInfo: {
    flex: 1,
    gap: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  invoiceClient: {
    fontSize: 13,
    color: colors.mediumGray,
  },
  invoiceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceMetaText: {
    fontSize: 12,
    color: colors.lightGray,
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  estadoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bannerCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextWrapper: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.mediumGray,
    lineHeight: 19,
  },
  bannerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bannerButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  loteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  loteRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  loteCard: {
    flexBasis: '48%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  loteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  loteBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.secondary + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  loteBadgeText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '600',
  },
  loteCantidad: {
    marginTop: 12,
    fontSize: 14,
    color: colors.lightGray,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.lightGray,
    textAlign: 'center',
    paddingVertical: 20,
  },
  galponCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  galponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galponNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  galponMeta: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },
  galponAction: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.veryLightGray,
  },
  loteList: {
    gap: 10,
  },
  loteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loteInfo: {
    flex: 1,
  },
  loteNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  loteMeta: {
    fontSize: 12,
    color: colors.textMedium,
  },
  loteExtra: {
    fontSize: 12,
    color: colors.primary,
  },
  emptyGalponText: {
    fontSize: 13,
    color: colors.textMedium,
  },
});
