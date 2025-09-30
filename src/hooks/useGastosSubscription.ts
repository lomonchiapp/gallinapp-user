/**
 * Hook personalizado para manejar suscripciones de gastos en tiempo real
 */

import { useCallback, useEffect } from 'react';
import { useGastosStore } from '../stores/gastosStore';
import { TipoAve } from '../types/enums';

export const useGastosSubscription = (tipoLote?: TipoAve) => {
  const { subscribeToGastosByTipo, gastos, cargarGastos } = useGastosStore();

  // Suscribirse a gastos en tiempo real
  const subscribeToGastos = useCallback(() => {
    if (tipoLote) {
      console.log(`💰 Suscribiéndose a gastos para ${tipoLote}`);
      return subscribeToGastosByTipo(tipoLote);
    }
    return () => {}; // Retornar función vacía si no hay tipoLote
  }, [tipoLote, subscribeToGastosByTipo]);

  // Cargar gastos iniciales
  const loadInitialGastos = useCallback(async () => {
    if (tipoLote) {
      console.log(`💰 Cargando gastos iniciales para ${tipoLote}`);
      await cargarGastos(undefined, tipoLote);
    }
  }, [tipoLote, cargarGastos]);

  // Suscribirse y cargar gastos iniciales
  useEffect(() => {
    const unsubscribe = subscribeToGastos();
    loadInitialGastos();

    return () => {
      console.log(`💰 Cancelando suscripción de gastos para ${tipoLote}`);
      unsubscribe();
    };
  }, [tipoLote, subscribeToGastos, loadInitialGastos]);

  // Filtrar gastos por tipo si es necesario
  const gastosFiltrados = tipoLote
    ? gastos.filter(gasto => gasto.tipoLote === tipoLote)
    : gastos;

  // Calcular estadísticas de gastos
  const estadisticasGastos = {
    gastoTotal: gastosFiltrados.reduce((sum, gasto) => sum + gasto.total, 0),
    numeroGastos: gastosFiltrados.length,
    gastosPorCategoria: gastosFiltrados.reduce((acc, gasto) => {
      const categoria = gasto.categoria || 'Sin categoría';
      acc[categoria] = (acc[categoria] || 0) + gasto.total;
      return acc;
    }, {} as Record<string, number>),
  };

  // Debug: Log estadísticas calculadas
  console.log(`💰 useGastosSubscription [${tipoLote}]: Gastos filtrados:`, gastosFiltrados.length);
  console.log(`💰 useGastosSubscription [${tipoLote}]: Gasto total:`, estadisticasGastos.gastoTotal);
  console.log(`💰 useGastosSubscription [${tipoLote}]: Categorías:`, estadisticasGastos.gastosPorCategoria);

  return {
    gastos: gastosFiltrados,
    estadisticasGastos,
    isLoading: false, // El store maneja el loading
    error: null, // El store maneja los errores
    refetch: loadInitialGastos
  };
};

// Hook para todos los gastos (sin filtrar por tipo)
export const useAllGastosSubscription = () => {
  const { subscribeToGastosByTipo, gastos } = useGastosStore();

  // Suscribirse a todos los gastos
  const subscribeToAllGastos = useCallback(() => {
    console.log(`💰 Suscribiéndose a TODOS los gastos`);
    // Suscribirse a todos los tipos de ave
    const unsubscribers: (() => void)[] = [];

    Object.values(TipoAve).forEach(tipoLote => {
      const unsubscribe = subscribeToGastosByTipo(tipoLote);
      unsubscribers.push(unsubscribe);
    });

    // Retornar función que cancele todas las suscripciones
    return () => {
      console.log(`💰 Cancelando suscripciones a gastos`);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribeToGastosByTipo]);

  // Cargar gastos iniciales de todos los tipos
  const loadAllGastos = useCallback(async () => {
    console.log(`💰 Cargando gastos iniciales de todos los tipos`);
    Object.values(TipoAve).forEach(async (tipoLote) => {
      await cargarGastos(undefined, tipoLote);
    });
  }, [cargarGastos]);

  // Suscribirse y cargar gastos iniciales
  useEffect(() => {
    const unsubscribe = subscribeToAllGastos();
    loadAllGastos();

    return unsubscribe;
  }, [subscribeToAllGastos, loadAllGastos]);

  // Calcular estadísticas generales
  const estadisticasGastos = {
    gastoTotal: gastos.reduce((sum, gasto) => sum + gasto.total, 0),
    numeroGastos: gastos.length,
    gastosPorTipo: gastos.reduce((acc, gasto) => {
      acc[gasto.tipoLote] = (acc[gasto.tipoLote] || 0) + gasto.total;
      return acc;
    }, {} as Record<string, number>),
    gastosPorCategoria: gastos.reduce((acc, gasto) => {
      acc[gasto.categoria] = (acc[gasto.categoria] || 0) + gasto.total;
      return acc;
    }, {} as Record<string, number>),
  };

  return {
    gastos,
    estadisticasGastos,
    isLoading: false,
    error: null,
    refetch: loadAllGastos
  };
};
