/**
 * Ejemplo de integración del sistema de notificaciones
 * Muestra cómo usar las notificaciones en otros hooks
 */

import { useCallback, useEffect } from 'react';
import { getEggTrackingInfo, getWeightTrackingInfo } from '../services/tracking.service';
import { useAuthStore } from '../stores/authStore';
import { useEngordeStore } from '../stores/engordeStore';
import { useFarmStore } from '../stores/farmStore';
import { useLevantesStore } from '../stores/levantesStore';
import { useMortalityStore } from '../stores/mortalityStore';
import { usePonedorasStore } from '../stores/ponedorasStore';
import { TipoAve } from '../types/enums';
import { getFarmConfig } from '../utils/farmConfig';
import { useNotifications } from './useNotifications';

/**
 * Hook que integra las notificaciones con los diferentes stores
 * Este es un ejemplo de cómo usar el sistema de notificaciones
 */
export const useNotificationIntegration = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { production, financial, events, reminders } = useNotifications();
  
  // Stores - solo usar si está autenticado
  const ponedorasStore = usePonedorasStore();
  const levantesStore = useLevantesStore();
  const engordeStore = useEngordeStore();
  const mortalityStore = useMortalityStore();
  const { currentFarm } = useFarmStore();

  // Solo usar los datos si está autenticado
  const ponedorasLotes = isAuthenticated ? ponedorasStore.lotes : [];
  const levantesLotes = isAuthenticated ? levantesStore.lotes : [];
  const engordeLotes = isAuthenticated ? engordeStore.lotes : [];
  const registrosMortalidadGlobal = isAuthenticated ? mortalityStore.registrosMortalidadGlobal : [];
  const config = isAuthenticated && currentFarm ? getFarmConfig(currentFarm) : null;

  // Verificar mortalidad alta
  const checkHighMortality = useCallback(async () => {
    if (!config) return;

    const allLotes = [
      ...ponedorasLotes.map(l => ({ ...l, tipo: 'ponedoras' })),
      ...levantesLotes.map(l => ({ ...l, tipo: 'levantes' })),
      ...engordeLotes.map(l => ({ ...l, tipo: 'engorde' })),
    ];

    for (const lote of allLotes) {
      const mortalidadLote = registrosMortalidadGlobal.filter(r => r.loteId === lote.id);
      const totalMuertes = mortalidadLote.reduce((sum, r) => sum + r.cantidad, 0);
      const tasaMortalidad = (totalMuertes / lote.cantidadInicial) * 100;

      // Si la mortalidad supera el umbral aceptable
      if (config && tasaMortalidad > config.acceptableMortalityRate) {
        await production.mortalidadAlta(lote.id, lote.nombre, tasaMortalidad);
      }
    }
  }, [
    ponedorasLotes,
    levantesLotes,
    engordeLotes,
    registrosMortalidadGlobal,
    config,
    production
  ]);

  // Verificar peso objetivo para engorde
  const checkWeightGoals = useCallback(async () => {
    if (!config) return;

    for (const lote of engordeLotes) {
      // Aquí se verificaría el peso actual vs objetivo
      // Esto es un ejemplo, necesitarías obtener los registros de peso reales
      const pesoActual = 4.5; // Ejemplo
      
      if (config && pesoActual >= config.targetEngordeWeight) {
        await production.pesoObjetivo(
          lote.id,
          lote.nombre,
          pesoActual,
          config.targetEngordeWeight
        );
      }
    }
  }, [engordeLotes, config, production]);

  // Verificar lotes que necesitan revisión
  const checkLotReviews = useCallback(async () => {
    const now = new Date();
    const allLotes = [
      ...ponedorasLotes,
      ...levantesLotes,
      ...engordeLotes,
    ];

    for (const lote of allLotes) {
      const diasSinRevision = Math.floor(
        (now.getTime() - lote.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Si no se ha actualizado en más de 7 días
      if (diasSinRevision > 7) {
        await reminders.revisionLote(lote.id, lote.nombre, diasSinRevision);
      }
    }
  }, [ponedorasLotes, levantesLotes, engordeLotes, reminders]);

  // Verificar registros pendientes
  const checkPendingRecords = useCallback(async () => {
    const now = new Date();
    const allLotes = [
      ...ponedorasLotes.map(l => ({ ...l, tipo: 'ponedoras' })),
      ...levantesLotes.map(l => ({ ...l, tipo: 'levantes' })),
      ...engordeLotes.map(l => ({ ...l, tipo: 'engorde' })),
    ];

    for (const lote of allLotes) {
      const diasSinRegistro = Math.floor(
        (now.getTime() - lote.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Recordatorios específicos por tipo
      if (lote.tipo === 'ponedoras' && diasSinRegistro > 1) {
        await reminders.registroPendiente(
          lote.id,
          lote.nombre,
          'producción de huevos'
        );
      } else if (lote.tipo === 'engorde' && diasSinRegistro > 3) {
        await reminders.registroPendiente(
          lote.id,
          lote.nombre,
          'peso de pollos'
        );
      } else if (lote.tipo === 'levantes' && diasSinRegistro > 2) {
        await reminders.registroPendiente(
          lote.id,
          lote.nombre,
          'peso de pollos'
        );
      }
    }
  }, [ponedorasLotes, levantesLotes, engordeLotes, reminders]);

  // Verificar pesaje de lotes (cada 7 días máximo)
  const checkWeightTracking = useCallback(async () => {
    try {
      // Verificar lotes de levantes
      const levantesTracking = await getWeightTrackingInfo(levantesLotes, TipoAve.POLLO_LEVANTE);
      for (const tracking of levantesTracking) {
        if (tracking.estadoPesaje === 'emergencia') {
          await reminders.registroPendiente(
            tracking.loteId,
            tracking.loteName,
            `pesaje urgente (${tracking.diasSinPesar} días sin pesar)`
          );
        } else if (tracking.estadoPesaje === 'advertencia') {
          await reminders.registroPendiente(
            tracking.loteId,
            tracking.loteName,
            `pesaje próximo (${tracking.diasSinPesar} días sin pesar)`
          );
        }
      }

      // Verificar lotes de engorde
      const engordeTracking = await getWeightTrackingInfo(engordeLotes, TipoAve.POLLO_ENGORDE);
      for (const tracking of engordeTracking) {
        if (tracking.estadoPesaje === 'emergencia') {
          await reminders.registroPendiente(
            tracking.loteId,
            tracking.loteName,
            `pesaje urgente (${tracking.diasSinPesar} días sin pesar)`
          );
        } else if (tracking.estadoPesaje === 'advertencia') {
          await reminders.registroPendiente(
            tracking.loteId,
            tracking.loteName,
            `pesaje próximo (${tracking.diasSinPesar} días sin pesar)`
          );
        }
      }
    } catch (error) {
      console.error('Error en verificación de pesaje:', error);
    }
  }, [levantesLotes, engordeLotes, reminders]);

  // Verificar recolección de huevos (diario para ponedoras)
  const checkEggCollection = useCallback(async () => {
    try {
      const eggTracking = await getEggTrackingInfo(ponedorasLotes);
      for (const tracking of eggTracking) {
        if (tracking.estadoRecoleccion === 'emergencia') {
          await reminders.registroPendiente(
            tracking.loteId,
            tracking.loteName,
            `recolección de huevos urgente (${tracking.diasSinRecoleccion} días sin recolectar)`
          );
        } else if (tracking.estadoRecoleccion === 'advertencia') {
          await reminders.registroPendiente(
            tracking.loteId,
            tracking.loteName,
            `recolección de huevos próxima (${tracking.diasSinRecoleccion} días sin recolectar)`
          );
        }
      }
    } catch (error) {
      console.error('Error en verificación de recolección de huevos:', error);
    }
  }, [ponedorasLotes, reminders]);

  // Ejecutar verificaciones periódicamente solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      console.log('🔔 useNotificationIntegration: Usuario no autenticado, saltando verificaciones');
      return;
    }

    console.log('🔔 useNotificationIntegration: Iniciando verificaciones para usuario autenticado');

    const runChecks = async () => {
      try {
        await Promise.all([
          checkHighMortality(),
          checkWeightGoals(),
          checkLotReviews(),
          checkPendingRecords(),
          checkWeightTracking(),
          checkEggCollection(),
        ]);
      } catch (error) {
        console.error('Error en verificaciones de notificaciones:', error);
      }
    };

    // Ejecutar inmediatamente
    runChecks();

    // Ejecutar cada hora
    const interval = setInterval(runChecks, 60 * 60 * 1000);

    return () => {
      console.log('🔔 useNotificationIntegration: Limpiando verificaciones');
      clearInterval(interval);
    };
  }, [isAuthenticated, authLoading, checkHighMortality, checkWeightGoals, checkLotReviews, checkPendingRecords, checkWeightTracking, checkEggCollection]);

  // Funciones para eventos específicos (para llamar desde otros hooks)
  const notifyLoteCreated = useCallback(async (
    loteId: string,
    loteName: string,
    tipoAve: string
  ) => {
    await events.loteCreado(loteId, loteName, tipoAve);
  }, [events]);

  const notifyHighExpense = useCallback(async (
    amount: number,
    categoria: string,
    loteId?: string,
    loteName?: string
  ) => {
    // Verificar si el gasto es considerado alto (ejemplo: > $1000)
    if (amount > 1000) {
      await financial.gastoAlto(amount, categoria, loteId, loteName);
    }
  }, [financial]);

  const notifyLowProfitability = useCallback(async (
    loteId: string,
    loteName: string,
    margen: number
  ) => {
    // Notificar si el margen es menor al 15%
    if (margen < 15) {
      await financial.rentabilidadBaja(loteId, loteName, margen);
    }
  }, [financial]);

  const notifyProductionGoal = useCallback(async (
    metaAmount: number,
    actualAmount: number,
    periodo: string
  ) => {
    if (actualAmount >= metaAmount) {
      await financial.metaIngresos(metaAmount, actualAmount, periodo);
    }
  }, [financial]);

  // Funciones específicas para pesaje y recolección
  const notifyWeightRequired = useCallback(async (
    loteId: string,
    loteName: string,
    diasSinPesar: number,
    isEmergency: boolean = false
  ) => {
    await reminders.registroPendiente(
      loteId,
      loteName,
      isEmergency ? 
        `pesaje URGENTE (${diasSinPesar} días sin pesar)` :
        `pesaje requerido (${diasSinPesar} días sin pesar)`
    );
  }, [reminders]);

  const notifyEggCollectionRequired = useCallback(async (
    loteId: string,
    loteName: string,
    diasSinRecoleccion: number,
    isEmergency: boolean = false
  ) => {
    await reminders.registroPendiente(
      loteId,
      loteName,
      isEmergency ? 
        `recolección de huevos URGENTE (${diasSinRecoleccion} días sin recolectar)` :
        `recolección de huevos requerida (${diasSinRecoleccion} días sin recolectar)`
    );
  }, [reminders]);

  return {
    // Funciones para llamar desde otros hooks
    notifyLoteCreated,
    notifyHighExpense,
    notifyLowProfitability,
    notifyProductionGoal,
    notifyWeightRequired,
    notifyEggCollectionRequired,
    
    // Acceso directo a las categorías de notificaciones
    production,
    financial,
    events,
    reminders,
  };
};

export default useNotificationIntegration;
