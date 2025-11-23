/**
 * Facturas - Listado simple de facturas generadas desde ventas
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '../../../src/components/layouts/AppHeader';
import { Card } from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useFacturas } from '../../../src/hooks/useFacturas';
import { Factura, EstadoFactura } from '../../../src/services/facturas.service';

export default function FacturasScreen() {
  const router = useRouter();
  const { facturas, isLoading, getFacturas, error } = useFacturas();

  const handleVerDetalle = (factura: Factura) => {
    router.push(`/(tabs)/facturacion/${factura.id}`);
  };

  const getEstadoBadgeStyle = (estado: EstadoFactura) => {
    return estado === EstadoFactura.EMITIDA ? styles.estadoEmitida : styles.estadoAnulada;
  };

  const renderFacturaCard = ({ item: factura }: { item: Factura }) => (
    <TouchableOpacity
      onPress={() => handleVerDetalle(factura)}
      style={styles.facturaCard}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.facturaHeader}>
          <View style={styles.facturaInfo}>
            <Text style={styles.facturaNumero}>{factura.numero}</Text>
            <Text style={styles.facturaFecha}>
              {factura.fecha.toLocaleDateString('es-DO', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          
          <View style={[styles.estadoBadge, getEstadoBadgeStyle(factura.estado)]}>
            <Text style={styles.estadoText}>{factura.estado}</Text>
          </View>
        </View>

        <Text style={styles.clienteNombre}>{factura.cliente.nombre}</Text>
        
        <View style={styles.facturaDetalle}>
          <Text style={styles.itemsCount}>
            {factura.resumen.totalItems} producto{factura.resumen.totalItems !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.facturaTotal}>RD${factura.resumen.total.toFixed(2)}</Text>
        </View>

        <View style={styles.ventaInfo}>
          <Ionicons name="receipt-outline" size={14} color={colors.textMedium} />
          <Text style={styles.ventaInfoText}>Venta: {factura.venta.numero}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={colors.textMedium} />
      <Text style={styles.emptyText}>No hay facturas</Text>
      <Text style={styles.emptySubtext}>
        Las facturas se generan desde las ventas
      </Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader
          title="Facturas"
          showBack={false}
          showProfile={false}
          showNotifications={true}
          statusBarStyle="dark"
          backgroundColor="transparent"
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getFacturas}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader
        title="Facturas"
        showBack={false}
        showProfile={false}
        showNotifications={true}
        statusBarStyle="dark"
        backgroundColor="transparent"
      />

      {isLoading && facturas.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando facturas...</Text>
        </View>
      ) : (
        <FlatList
          data={facturas}
          renderItem={renderFacturaCard}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={getFacturas}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  facturaCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  facturaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  facturaInfo: {
    flex: 1,
  },
  facturaNumero: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  facturaFecha: {
    fontSize: 13,
    color: colors.textMedium,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  estadoEmitida: {
    backgroundColor: colors.success + '20',
  },
  estadoAnulada: {
    backgroundColor: colors.error + '20',
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textDark,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 12,
  },
  facturaDetalle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.textMedium,
  },
  facturaTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  ventaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ventaInfoText: {
    fontSize: 13,
    color: colors.textMedium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
  },
});
