/**
 * Dashboard profesional orientado a ganancias
 */

import { useLevantesStore } from '@/src/stores/levantesStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CostProductionStats from '../../src/components/dashboard/CostProductionStats';
import Card from '../../src/components/ui/Card';
import { colors } from '../../src/constants/colors';
import { initializePushNotifications } from '../../src/services/push-notifications.service';
import { useAppConfigStore } from '../../src/stores/appConfigStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useEngordeStore } from '../../src/stores/engordeStore';
import { useFinancialStore } from '../../src/stores/financialStore';
import { usePonedorasStore } from '../../src/stores/ponedorasStore';

export default function DashboardScreen() {
  const { user, isAuthenticated, authInitialized } = useAuthStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const pushNotificationsInitialized = useRef(false);
  
  // Stores
  const ponedorasStore = usePonedorasStore();
  const engordeStore = useEngordeStore();
  const levantesStore = useLevantesStore();
  const { config, cargarConfiguracion, isLoading: configLoading } = useAppConfigStore();
  const { 
    estadisticasGenerales, 
    estadisticasLotes, 
    cargarTodasLasEstadisticas, 
    isLoading: financialLoading 
  } = useFinancialStore();
  
  // Cargar datos al montar el componente
  useEffect(() => {
    console.log('📊 Dashboard: Inicializando...');
    cargarDatosIniciales();
  }, []);
  
  // Cargar estadísticas financieras cuando tengamos configuración y lotes
  useEffect(() => {
    const totalLotes = ponedorasStore.lotes.length + engordeStore.lotes.length + levantesStore.lotes.length;
    if (config && totalLotes > 0 && !financialLoading) {
      cargarEstadisticasFinancieras();
    }
  }, [config, ponedorasStore.lotes, engordeStore.lotes, levantesStore.lotes]);

  // Inicializar push notifications SOLO cuando Firebase Auth confirme que hay usuario autenticado
  // Esto evita errores de "Usuario no autenticado" al guardar el token
  useEffect(() => {
    if (authInitialized && isAuthenticated && user && !pushNotificationsInitialized.current) {
      console.log('✅ Dashboard: Usuario autenticado confirmado por Firebase Auth - Inicializando push notifications...');
      pushNotificationsInitialized.current = true;
      initializePushNotifications().catch((error) => {
        console.error('❌ Error al inicializar push notifications:', error);
      });
    }
  }, [authInitialized, isAuthenticated, user]);
  
  const cargarDatosIniciales = async () => {
    try {
      await Promise.all([
        cargarConfiguracion(),
        ponedorasStore.cargarLotes(),
        engordeStore.cargarLotes(),
        levantesStore.cargarLotes(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };
  
  const cargarEstadisticasFinancieras = async () => {
    if (!config) return;
    
    try {
      await cargarTodasLasEstadisticas(
        config,
        ponedorasStore.lotes,
        engordeStore.lotes,
        levantesStore.lotes
      );
    } catch (error) {
      console.error('Error al cargar estadísticas financieras:', error);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatosIniciales();
    await cargarEstadisticasFinancieras();
    setRefreshing(false);
  };
  
  // Estados de carga
  const isLoading = ponedorasStore.isLoading || engordeStore.isLoading || 
                   levantesStore.isLoading || configLoading || financialLoading;
  
  // Estadísticas básicas
  const ponedorasActivas = ponedorasStore.lotes.length;
  const engordeActivos = engordeStore.lotes.length;
  const israeliesActivos = levantesStore.lotes.length;
  const totalLotes = ponedorasStore.lotes.length + engordeStore.lotes.length + levantesStore.lotes.length;
  const lotesActivos = ponedorasActivas + engordeActivos + israeliesActivos;
  
  // Formatear números para mostrar
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };
  
  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(1)}%`;
  };
  
  // Top 3 lotes más rentables
  const topLotesRentables = estadisticasLotes
    .filter(lote => lote.ganancias > 0)
    .sort((a, b) => b.margenGanancia - a.margenGanancia)
    .slice(0, 3);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.welcomeText}>
            Bienvenido, {user?.displayName || 'Usuario'}
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.configButton}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Estadísticas por Tipo de Negocio */}
      <View style={styles.businessTypesContainer}>
        <Card style={StyleSheet.flatten([styles.businessTypeCard, { borderLeftColor: colors.primary }])}>
          <View style={styles.businessTypeHeader}>
            <Ionicons name="egg" size={20} color={colors.primary} />
            <Text style={styles.businessTypeTitle}>Ponedoras</Text>
          </View>
          <Text style={styles.businessTypeValue}>
            {ponedorasActivas} Lotes
          </Text>
          
        </Card>

        <Card style={StyleSheet.flatten([styles.businessTypeCard, { borderLeftColor: colors.warning }])}>
          <View style={styles.businessTypeHeader}>
            <Ionicons name="fast-food" size={20} color={colors.warning} />
            <Text style={styles.businessTypeTitle}>Engorde</Text>
          </View>
          <Text style={styles.businessTypeValue}>
            {engordeActivos} Lotes
          </Text>
        </Card>

        <Card style={StyleSheet.flatten([styles.businessTypeCard, { borderLeftColor: colors.success }])}>
          <View style={styles.businessTypeHeader}>
            <Ionicons name="nutrition" size={20} color={colors.success} />
            <Text style={styles.businessTypeTitle}>Levantes</Text>
          </View>
          <Text style={styles.businessTypeValue}>
            {israeliesActivos} Lotes
          </Text>
        </Card>
      </View>

      {/* Estadísticas de Costos de Producción */}
      <CostProductionStats isLoading={isLoading} />

      {/* Top Lotes Rentables */}
      {topLotesRentables.length > 0 && (
        <Card style={styles.topLotesCard}>
          <View style={styles.topLotesHeader}>
            <Ionicons name="trophy" size={24} color={colors.warning} />
            <Text style={styles.cardTitle}>Lotes Más Rentables</Text>
          </View>
          {topLotesRentables.map((lote, index) => (
            <View key={lote.loteId} style={styles.topLoteItem}>
              <View style={styles.topLoteRank}>
                <Text style={styles.topLoteRankText}>{index + 1}</Text>
              </View>
              <View style={styles.topLoteInfo}>
                <Text style={styles.topLoteName}>{lote.nombre}</Text>
                <Text style={styles.topLoteType}>
                  {lote.tipoLote === 'ponedoras' ? 'Ponedoras' : 
                   lote.tipoLote === 'engorde' ? 'Engorde' : 'Israelíes'}
                </Text>
              </View>
              <View style={styles.topLoteStats}>
                <Text style={styles.topLoteGanancia}>
                  {formatearMoneda(lote.ganancias)}
                </Text>
                <Text style={styles.topLoteMargen}>
                  {formatearPorcentaje(lote.margenGanancia)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Acciones Rápidas 
      <Card style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/ponedoras')}
          >
            <Ionicons name="egg" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Ponedoras</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/engorde')}
          >
            <Ionicons name="fast-food" size={24} color={colors.warning} />
            <Text style={styles.quickActionText}>Engorde</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/levantes')}
          >
            <Ionicons name="nutrition" size={24} color={colors.success} />
            <Text style={styles.quickActionText}>Levantes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/gastos')}
          >
            <Ionicons name="receipt" size={24} color={colors.danger} />
            <Text style={styles.quickActionText}>Gastos</Text>
          </TouchableOpacity>
        </View>
      </Card>
*/}
      {/* Estado de Configuración */}
      {!config && (
        <Card style={styles.configAlertCard}>
          <View style={styles.configAlertContent}>
            <Ionicons name="settings" size={24} color={colors.warning} />
            <View style={styles.configAlertText}>
              <Text style={styles.configAlertTitle}>Configuración Requerida</Text>
              <Text style={styles.configAlertSubtitle}>
                Configure los precios de venta para obtener cálculos financieros precisos
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.configAlertButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Text style={styles.configAlertButtonText}>Configurar</Text>
            </TouchableOpacity>
          </View>
        </Card>
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
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  dateText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 4,
  },
  configButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  
  // Business Types
  businessTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  businessTypeCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderLeftWidth: 4,
    borderRadius: 12,
  },
  businessTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 8,
  },
  businessTypeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  businessTypeLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 8,
  },
  businessTypeSubtext: {
    fontSize: 11,
    color: colors.textLight,
  },
  
  // Top Lotes
  topLotesCard: {
    marginBottom: 20,
  },
  topLotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  topLoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
    marginBottom: 8,
  },
  topLoteRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topLoteRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  topLoteInfo: {
    flex: 1,
  },
  topLoteName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  topLoteType: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  topLoteStats: {
    alignItems: 'flex-end',
  },
  topLoteGanancia: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
  },
  topLoteMargen: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  
  // Quick Actions
  quickActionsCard: {
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textDark,
    marginTop: 8,
  },
  
  // Config Alert
  configAlertCard: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
    marginBottom: 20,
  },
  configAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  configAlertText: {
    flex: 1,
    marginLeft: 12,
  },
  configAlertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  configAlertSubtitle: {
    fontSize: 14,
    color: '#856404',
    marginTop: 4,
  },
  configAlertButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  configAlertButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  
  // Common
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
});