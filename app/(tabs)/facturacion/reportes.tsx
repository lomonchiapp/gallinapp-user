/**
 * Pantalla de reportes de facturación
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
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
import { EstadoFactura, Factura } from '../../../src/types/facturacion';

const formatearMoneda = (valor: number): string =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(valor);

const formatearFecha = (fecha: Date) =>
  new Date(fecha).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
  });

const getEstadoBadge = (estado: EstadoFactura) => {
  switch (estado) {
    case EstadoFactura.PAGADA:
      return { label: 'Pagada', color: colors.success };
    case EstadoFactura.EMITIDA:
      return { label: 'Emitida', color: colors.secondary };
    case EstadoFactura.BORRADOR:
      return { label: 'Borrador', color: colors.warning };
    case EstadoFactura.CANCELADA:
      return { label: 'Cancelada', color: colors.error };
    default:
      return { label: estado, color: colors.lightGray };
  }
};

const periodos = [
  { id: '30', label: 'Últimos 30 días' },
  { id: '90', label: 'Últimos 3 meses' },
  { id: '365', label: 'Último año' },
];

export default function ReportesScreen() {
  const { facturas, refrescarDatos } = useFacturacion();
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState('30');

  const onRefresh = async () => {
    setRefreshing(true);
    await refrescarDatos();
    setRefreshing(false);
  };

  const { facturasFiltradas, ingresosTotales, ticketsPromedio, pendientesCobro } = useMemo(() => {
    const dias = parseInt(periodo, 10);
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);

    const filtradas = facturas.filter((factura) => new Date(factura.fecha) >= fechaLimite);
    const totalIngresos = filtradas.reduce((acum, factura) => acum + factura.total, 0);
    const promedio = filtradas.length > 0 ? totalIngresos / filtradas.length : 0;
    const porCobrar = filtradas
      .filter((factura) => factura.estado !== EstadoFactura.PAGADA)
      .reduce((acum, factura) => acum + factura.total, 0);

    return {
      facturasFiltradas: filtradas,
      ingresosTotales: totalIngresos,
      ticketsPromedio: promedio,
      pendientesCobro: porCobrar,
    };
  }, [facturas, periodo]);

  const facturasRecientes = useMemo(
    () => facturasFiltradas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 6),
    [facturasFiltradas]
  );

  const facturacionPorEstado = useMemo(() => {
    return facturasFiltradas.reduce(
      (acum, factura) => {
        acum[factura.estado] = (acum[factura.estado] || 0) + factura.total;
        return acum;
      },
      {} as Record<EstadoFactura, number>
    );
  }, [facturasFiltradas]);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, { nombre: string; total: number; cantidad: number }>();
    facturasFiltradas.forEach((factura) => {
      const actual = mapa.get(factura.cliente.id) || {
        nombre: factura.cliente.nombre,
        total: 0,
        cantidad: 0,
      };
      mapa.set(factura.cliente.id, {
        nombre: actual.nombre,
        total: actual.total + factura.total,
        cantidad: actual.cantidad + 1,
      });
    });

    return Array.from(mapa.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [facturasFiltradas]);

  const porcentajePorEstado = (estado: EstadoFactura) => {
    const total = Object.values(facturacionPorEstado).reduce((acum, valor) => acum + valor, 0);
    if (total === 0) return 0;
    return Math.round(((facturacionPorEstado[estado] || 0) / total) * 100);
  };

  const renderFacturaRow = (factura: Factura) => {
    const badge = getEstadoBadge(factura.estado);
    return (
      <View key={factura.id} style={styles.tableRow}>
        <View style={styles.tableRowLeft}>
          <Text style={styles.tableFacturaId}>#{factura.numero}</Text>
          <Text style={styles.tableFacturaCliente}>{factura.cliente.nombre}</Text>
        </View>
        <View style={styles.tableRowRight}>
          <Text style={styles.tableFacturaFecha}>{formatearFecha(factura.fecha)}</Text>
          <View style={[styles.estadoBadge, { backgroundColor: `${badge.color}20` }]}
          >
            <Text style={[styles.estadoBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <Text style={styles.tableFacturaTotal}>{formatearMoneda(factura.total)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <Card style={[styles.sectionCard, styles.heroCard]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLabel}>Resumen financiero</Text>
            <Text style={styles.heroTitle}>Reportes de facturación</Text>
          </View>
          <View style={styles.segmentedSmall}>
            {periodos.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.segmentedSmallButton, periodo === item.id && styles.segmentedSmallButtonActive]}
                onPress={() => setPeriodo(item.id)}
              >
                <Text style={[styles.segmentedSmallText, periodo === item.id && styles.segmentedSmallTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Ingresos del periodo</Text>
            <Text style={styles.heroStatValue}>{formatearMoneda(ingresosTotales)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Ticket promedio</Text>
            <Text style={styles.heroStatValue}>{formatearMoneda(ticketsPromedio)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Pendiente de cobro</Text>
            <Text style={styles.heroStatValue}>{formatearMoneda(pendientesCobro)}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.gridTwo}>
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Estado de facturas</Text>
            <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.estadoList}>
            {Object.values(EstadoFactura).map((estado) => {
              const badge = getEstadoBadge(estado);
              const porcentaje = porcentajePorEstado(estado);
              return (
                <View key={estado} style={styles.estadoRow}>
                  <View style={[styles.estadoDot, { backgroundColor: badge.color }]} />
                  <Text style={styles.estadoLabel}>{badge.label}</Text>
                  <View style={styles.estadoBarBackground}>
                    <View style={[styles.estadoBarFill, { width: `${porcentaje}%`, backgroundColor: `${badge.color}` }]} />
                  </View>
                  <Text style={styles.estadoValue}>{porcentaje}%</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Clientes top</Text>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
          </View>
          {topClientes.length === 0 ? (
            <Text style={styles.emptyText}>No hay datos suficientes mientras el periodo seleccionado.</Text>
          ) : (
            <View style={styles.topClientesList}>
              {topClientes.map((cliente, index) => (
                <View key={cliente.id} style={styles.topClienteRow}>
                  <View style={styles.topClienteIndex}>
                    <Text style={styles.topClienteIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topClienteInfo}>
                    <Text style={styles.topClienteNombre}>{cliente.nombre}</Text>
                    <Text style={styles.topClienteDatos}>
                      {cliente.cantidad} factura{cliente.cantidad !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.topClienteTotal}>{formatearMoneda(cliente.total)}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </View>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Facturas recientes</Text>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
        </View>
        {facturasRecientes.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay facturas registradas en el periodo.</Text>
        ) : (
          <View style={styles.table}>
            {facturasRecientes.map(renderFacturaRow)}
          </View>
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
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  heroCard: {
    backgroundColor: colors.primary,
    padding: 22,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 6,
  },
  heroStatValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  heroDivider: {
    width: 1,
    height: 46,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 18,
  },
  segmentedSmall: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 4,
  },
  segmentedSmallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  segmentedSmallButtonActive: {
    backgroundColor: colors.white,
  },
  segmentedSmallText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  segmentedSmallTextActive: {
    color: colors.primary,
  },
  gridTwo: {
    flexDirection: 'row',
    gap: 16,
  },
  sectionHeaderRow: {
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
  estadoList: {
    gap: 12,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  estadoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  estadoLabel: {
    width: 80,
    fontSize: 13,
    color: colors.textDark,
  },
  estadoBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.veryLightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  estadoBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  estadoValue: {
    width: 40,
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'right',
  },
  topClientesList: {
    gap: 12,
  },
  topClienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topClienteIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topClienteIndexText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  topClienteInfo: {
    flex: 1,
  },
  topClienteNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  topClienteDatos: {
    fontSize: 12,
    color: colors.textMedium,
  },
  topClienteTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  table: {
    gap: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    gap: 12,
  },
  tableRowLeft: {
    flex: 1,
  },
  tableFacturaId: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  tableFacturaCliente: {
    fontSize: 12,
    color: colors.textMedium,
  },
  tableRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableFacturaFecha: {
    fontSize: 12,
    color: colors.textMedium,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableFacturaTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMedium,
  },
});

