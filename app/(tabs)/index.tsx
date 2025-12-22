/**
 * Dashboard profesional personalizable con widgets modulares
 */

import { useLevantesStore } from '@/src/stores/levantesStore';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../components/theme-provider';
import { DashboardContent } from '../../src/components/dashboard/DashboardContent';
import { FarmOnboardingScreen } from '../../src/components/dashboard/FarmOnboardingScreen';
import { PlanOnboardingScreen } from '../../src/components/onboarding/PlanOnboardingScreen';
import AppHeader from '../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../src/components/navigation/ScreenWrapper';
import { initializePushNotifications } from '../../src/services/push-notifications.service';
import { useAuthStore } from '../../src/stores/authStore';
import { useDashboardStore } from '../../src/stores/dashboardStore';
import { useEngordeStore } from '../../src/stores/engordeStore';
import { useFarmStore } from '../../src/stores/farmStore';
import { useFinancialStore } from '../../src/stores/financialStore';
import { useMultiTenantAuthStore } from '../../src/stores/multiTenantAuthStore';
import { useOrganizationStore } from '../../src/stores/organizationStore';
import { usePonedorasStore } from '../../src/stores/ponedorasStore';

export default function DashboardScreen() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const { user, isAuthenticated, authInitialized } = useAuthStore();
  const { user: multiTenantUser } = useMultiTenantAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const pushNotificationsInitialized = useRef(false);
  const farmsLoadedRef = useRef(false);
  const dataLoadedRef = useRef<string | null>(null);
  
  // Stores
  const ponedorasStore = usePonedorasStore();
  const engordeStore = useEngordeStore();
  const levantesStore = useLevantesStore();
  const { 
    estadisticasLotes, 
    cargarTodasLasEstadisticas, 
    isLoading: financialLoading 
  } = useFinancialStore();
  const { loadOrganizations } = useOrganizationStore();
  const { 
    loadConfig, 
    toggleEditMode, 
    isEditMode,
    saveConfig 
  } = useDashboardStore();
  const { loadFarms, currentFarm, farms, isLoading: farmsLoading } = useFarmStore();
  
  // Obtener userId una sola vez
  const userId = multiTenantUser?.uid || user?.uid;
  
  // Cargar granjas al montar - solo una vez
  useEffect(() => {
    if (!userId || farmsLoadedRef.current) return;
    
    console.log('📊 Dashboard: Inicializando...');
    farmsLoadedRef.current = true;
    
    loadFarms();
    loadConfig(userId);
  }, [userId]); // Solo depende de userId

  // Cargar datos solo si hay granja - evitar múltiples ejecuciones
  useEffect(() => {
    if (!currentFarm || farmsLoading || dataLoadedRef.current === currentFarm.id) {
      return;
    }

    console.log('📊 Dashboard: Cargando datos para granja:', currentFarm.id);
    dataLoadedRef.current = currentFarm.id;
    
    // Cargar solicitudes de acceso junto con otros datos (Single Source of Truth)
    const { loadAccessRequests } = useFarmStore.getState();
    loadAccessRequests(currentFarm.id);
    
    cargarDatosIniciales.current();
  }, [currentFarm?.id, farmsLoading]);
  
  // Guardar configuración cuando cambie - con debounce implícito
  useEffect(() => {
    if (!userId || !isEditMode) return;
    
    const dashboardConfig = useDashboardStore.getState().config;
    if (dashboardConfig) {
      // Usar timeout para evitar múltiples guardados
      const timeoutId = setTimeout(() => {
        saveConfig(userId, dashboardConfig);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isEditMode, userId]);
  
  // Cargar estadísticas financieras - solo cuando cambie el número de lotes
  const statsLoadedRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!currentFarm || financialLoading) return;
    
    const totalLotes = ponedorasStore.lotes.length + engordeStore.lotes.length + levantesStore.lotes.length;
    const statsKey = `${currentFarm.id}-${totalLotes}`;
    
    if (totalLotes > 0 && statsLoadedRef.current !== statsKey) {
      statsLoadedRef.current = statsKey;
      cargarEstadisticasFinancieras.current();
    }
  }, [currentFarm?.id, ponedorasStore.lotes.length, engordeStore.lotes.length, levantesStore.lotes.length]);

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
  
  const cargarDatosIniciales = React.useRef(async () => {
    if (!currentFarm) {
      console.log('⚠️ No hay granja, omitiendo carga de datos');
      return;
    }

    try {
      await Promise.all([
        ponedorasStore.cargarLotes(),
        engordeStore.cargarLotes(),
        levantesStore.cargarLotes(),
      ]);
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  });
  
  // Actualizar la función cuando cambie currentFarm
  React.useEffect(() => {
    cargarDatosIniciales.current = async () => {
      if (!currentFarm) {
        console.log('⚠️ No hay granja, omitiendo carga de datos');
        return;
      }

      try {
        await Promise.all([
          ponedorasStore.cargarLotes(),
          engordeStore.cargarLotes(),
          levantesStore.cargarLotes(),
        ]);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };
  }, [currentFarm?.id]);
  
  const cargarEstadisticasFinancieras = React.useRef(async () => {
    if (!currentFarm) return;
    
    try {
      await cargarTodasLasEstadisticas(
        currentFarm,
        ponedorasStore.lotes,
        engordeStore.lotes,
        levantesStore.lotes
      );
    } catch (error) {
      console.error('Error al cargar estadísticas financieras:', error);
    }
  });
  
  // Actualizar la función cuando cambien las dependencias
  React.useEffect(() => {
    cargarEstadisticasFinancieras.current = async () => {
      if (!currentFarm) return;
      
      try {
        await cargarTodasLasEstadisticas(
          currentFarm,
          ponedorasStore.lotes,
          engordeStore.lotes,
          levantesStore.lotes
        );
      } catch (error) {
        console.error('Error al cargar estadísticas financieras:', error);
      }
    };
  }, [currentFarm?.id, ponedorasStore.lotes.length, engordeStore.lotes.length, levantesStore.lotes.length]);
  
  const onRefresh = async () => {
    if (!currentFarm) {
      // Si no hay granja, solo recargar farms
      await loadFarms();
      return;
    }

    setRefreshing(true);
    await loadFarms(); // Recargar farms también
    await cargarDatosIniciales.current();
    await cargarEstadisticasFinancieras.current();
    setRefreshing(false);
  };

  const handleFarmCreated = React.useCallback(async () => {
    console.log('🎉 Dashboard: Granja creada, recargando...');
    // Resetear refs para permitir recarga
    farmsLoadedRef.current = false;
    dataLoadedRef.current = null;
    
    try {
      // Recargar farms después de crear una granja
      await loadFarms();
      
      // Esperar un momento para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { currentFarm: updatedFarm, farms: updatedFarms } = useFarmStore.getState();
      console.log('📊 Dashboard: Estado después de crear granja:', {
        farmsCount: updatedFarms.length,
        currentFarm: updatedFarm?.name || 'null'
      });
      
      if (updatedFarm) {
        console.log('✅ Dashboard: Granja cargada:', updatedFarm.name);
        // Forzar recarga de datos
        dataLoadedRef.current = null;
      } else if (updatedFarms.length > 0) {
        // Si hay granjas pero no hay currentFarm, seleccionar la primera
        console.log('🔄 Dashboard: Seleccionando primera granja...');
        const { switchFarm } = useFarmStore.getState();
        await switchFarm(updatedFarms[0].id);
      }
    } catch (error) {
      console.error('❌ Error al recargar después de crear granja:', error);
    }
  }, [loadFarms]);
  
  // Estados de carga
  const isLoading = ponedorasStore.isLoading || engordeStore.isLoading || 
                   levantesStore.isLoading || financialLoading;
  
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

  // Verificar si necesita onboarding de planes primero (usuario nuevo sin organización)
  const needsPlanOnboarding = !multiTenantUser?.currentOrganizationId && 
                               (!multiTenantUser?.organizations || 
                                Object.keys(multiTenantUser?.organizations || {}).length === 0);

  // Si necesita onboarding de planes, mostrarlo primero
  if (needsPlanOnboarding && !farmsLoading) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <PlanOnboardingScreen onPlanSelected={() => {
            // Después de seleccionar plan, continuar al onboarding de granja
            console.log('✅ Plan seleccionado, continuando al onboarding de granja');
          }} />
        </View>
      </ScreenWrapper>
    );
  }

  // Si no hay granja, mostrar pantalla de onboarding
  // Solo mostrar onboarding si no está cargando y no hay granjas
  if (!currentFarm && !farmsLoading && farms.length === 0) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <FarmOnboardingScreen onFarmCreated={handleFarmCreated} />
        </View>
      </ScreenWrapper>
    );
  }

  // Si está cargando farms, mostrar loading
  if (farmsLoading) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <View style={styles.loadingContainer}>
            {/* Cargando granjas... */}
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Si hay granjas pero no hay currentFarm seleccionada, seleccionar la primera
  if (farms.length > 0 && !currentFarm) {
    React.useEffect(() => {
      const { switchFarm } = useFarmStore.getState();
      switchFarm(farms[0].id);
    }, [farms.length]);
    
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <View style={styles.loadingContainer}>
            {/* Seleccionando granja... */}
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  // Dashboard normal cuando hay granja
  return (
    <ScreenWrapper transitionType="fade">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppHeader
          variant="fixed"
          enableBlur={false}
          showFarmSwitcher={true}
          showThemeToggle={true}
          title1={`Bienvenido,`}
          title2={multiTenantUser?.displayName || user?.displayName || 'Usuario'}
          showFarmButton={true}
          showFarmSettings={true}
        />

        {/* Contenido escrolleable del Dashboard */}
        <DashboardContent
          currentFarm={currentFarm}
          ponedorasActivas={ponedorasActivas}
          engordeActivos={engordeActivos}
          israeliesActivos={israeliesActivos}
          topLotesRentables={topLotesRentables}
          isLoading={isLoading}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Widgets Container
});