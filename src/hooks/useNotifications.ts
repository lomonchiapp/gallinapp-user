/**
 * Hook personalizado para notificaciones
 * Facilita el uso del sistema de notificaciones en otros hooks y componentes
 */

import { useCallback, useEffect } from 'react';
import { cleanupDuplicateNotifications, NotificationTemplates } from '../services/notifications.service';
import { useAuthStore } from '../stores/authStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import {
    CreateNotification,
    NotificationCategory,
    NotificationPriority,
    NotificationType,
} from '../types/notification';

export const useNotifications = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const {
    notifications,
    stats,
    settings,
    isLoading,
    error,
    createNewNotification,
    loadNotifications,
    loadSettings,
    getUnreadCount,
    startRealtimeUpdates,
    stopRealtimeUpdates,
  } = useNotificationsStore();

  // Inicializar notificaciones solo si está autenticado
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    console.log('🔔 useNotifications: Inicializando para usuario autenticado');
    
    const initializeNotifications = async () => {
      try {
        // Ejecutar limpieza de duplicados al inicio
        console.log('🧹 useNotifications: Iniciando limpieza de notificaciones duplicadas...');
        await cleanupDuplicateNotifications();
        
        await loadNotifications();
        await loadSettings();
        startRealtimeUpdates();
      } catch (error) {
        console.error('🔔 Error inicializando notificaciones:', error);
      }
    };

    initializeNotifications();
    
    // Programar limpieza automática cada 24 horas
    const cleanupInterval = setInterval(async () => {
      try {
        console.log('🧹 useNotifications: Limpieza automática programada de notificaciones...');
        await cleanupDuplicateNotifications();
      } catch (error) {
        console.error('🔔 Error en limpieza automática:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 horas

    return () => {
      console.log('🔔 useNotifications: Limpiando para usuario no autenticado');
      stopRealtimeUpdates();
      clearInterval(cleanupInterval);
    };
  }, [isAuthenticated, authLoading]);

  // Crear notificación personalizada
  const createNotification = useCallback(async (
    notification: CreateNotification
  ): Promise<string> => {
    return await createNewNotification(notification);
  }, [createNewNotification]);

  // Crear notificación simple
  const notify = useCallback(async (
    title: string,
    message: string,
    options?: {
      type?: NotificationType;
      category?: NotificationCategory;
      priority?: NotificationPriority;
      icon?: string;
      data?: any;
      sendPush?: boolean;
    }
  ): Promise<string> => {
    return await createNotification({
      type: options?.type || NotificationType.CUSTOM,
      category: options?.category || NotificationCategory.CUSTOM,
      priority: options?.priority || NotificationPriority.MEDIUM,
      title,
      message,
      icon: options?.icon,
      data: options?.data,
      sendPush: options?.sendPush ?? false,
    });
  }, [createNotification]);

  // Notificaciones específicas para producción
  const notifyProduction = {
    mortalidadAlta: useCallback(async (
      loteId: string,
      loteName: string,
      percentage: number
    ) => {
      return await NotificationTemplates.mortalidadAlta(loteId, loteName, percentage);
    }, []),

    pesoObjetivo: useCallback(async (
      loteId: string,
      loteName: string,
      pesoActual: number,
      pesoObjetivo: number
    ) => {
      return await NotificationTemplates.pesoObjetivo(loteId, loteName, pesoActual, pesoObjetivo);
    }, []),

    produccionBaja: useCallback(async (
      loteId: string,
      loteName: string,
      produccionActual: number,
      produccionEsperada: number
    ) => {
      return await createNotification({
        type: NotificationType.PRODUCCION_BAJA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.HIGH,
        title: '📉 Producción Baja Detectada',
        message: `El lote "${loteName}" tiene una producción de ${produccionActual} huevos (esperado: ${produccionEsperada})`,
        icon: 'trending-down',
        data: { loteId, loteName, amount: produccionActual },
        sendPush: true,
      });
    }, [createNotification]),

    maduracionLista: useCallback(async (
      loteId: string,
      loteName: string,
      tipoAve: string,
      edadDias: number
    ) => {
      return await createNotification({
        type: NotificationType.MADURACION_LISTA,
        category: NotificationCategory.PRODUCTION,
        priority: NotificationPriority.MEDIUM,
        title: '🐔 Lote Listo para Venta',
        message: `El lote "${loteName}" de ${tipoAve} tiene ${edadDias} días y está listo para venta`,
        icon: 'checkmark-done',
        data: { loteId, loteName, tipoAve },
        sendPush: true,
      });
    }, [createNotification]),
  };

  // Notificaciones financieras
  const notifyFinancial = {
    gastoAlto: useCallback(async (
      amount: number,
      categoria: string,
      loteId?: string,
      loteName?: string
    ) => {
      return await NotificationTemplates.gastoAlto(amount, categoria);
    }, []),

    rentabilidadBaja: useCallback(async (
      loteId: string,
      loteName: string,
      margen: number
    ) => {
      return await createNotification({
        type: NotificationType.RENTABILIDAD_BAJA,
        category: NotificationCategory.FINANCIAL,
        priority: NotificationPriority.HIGH,
        title: '📊 Rentabilidad Baja',
        message: `El lote "${loteName}" tiene un margen de ganancia del ${margen.toFixed(1)}%`,
        icon: 'trending-down',
        data: { loteId, loteName, percentage: margen },
        sendPush: true,
      });
    }, [createNotification]),

    metaIngresos: useCallback(async (
      metaAmount: number,
      actualAmount: number,
      periodo: string
    ) => {
      return await createNotification({
        type: NotificationType.META_INGRESOS,
        category: NotificationCategory.FINANCIAL,
        priority: NotificationPriority.MEDIUM,
        title: '🎯 Meta de Ingresos Alcanzada',
        message: `Has alcanzado $${actualAmount.toFixed(2)} de $${metaAmount.toFixed(2)} en ${periodo}`,
        icon: 'trophy',
        data: { amount: actualAmount },
        sendPush: true,
      });
    }, [createNotification]),
  };

  // Notificaciones de eventos
  const notifyEvents = {
    loteCreado: useCallback(async (
      loteId: string,
      loteName: string,
      tipoAve: string
    ) => {
      return await NotificationTemplates.loteCreado(loteId, loteName, tipoAve);
    }, []),

    loteFinalizadoCallback: useCallback(async (
      loteId: string,
      loteName: string,
      tipoAve: string,
      duracionDias: number
    ) => {
      return await createNotification({
        type: NotificationType.LOTE_FINALIZADO,
        category: NotificationCategory.EVENT,
        priority: NotificationPriority.MEDIUM,
        title: '✅ Lote Finalizado',
        message: `El lote "${loteName}" de ${tipoAve} ha sido finalizado después de ${duracionDias} días`,
        icon: 'checkmark-circle',
        data: { loteId, loteName, tipoAve },
        sendPush: true,
      });
    }, [createNotification]),

    ventaRegistrada: useCallback(async (
      loteId: string,
      loteName: string,
      cantidad: number,
      monto: number
    ) => {
      return await createNotification({
        type: NotificationType.VENTA_REGISTRADA,
        category: NotificationCategory.EVENT,
        priority: NotificationPriority.LOW,
        title: '💰 Venta Registrada',
        message: `Venta de ${cantidad} unidades del lote "${loteName}" por $${monto.toFixed(2)}`,
        icon: 'cash',
        data: { loteId, loteName, amount: monto },
        sendPush: false,
      });
    }, [createNotification]),
  };

  // Recordatorios
  const notifyReminders = {
    registroPendiente: useCallback(async (
      loteId: string,
      loteName: string,
      tipoRegistro: string
    ) => {
      return await createNotification({
        type: NotificationType.REGISTRO_PENDIENTE,
        category: NotificationCategory.REMINDER,
        priority: NotificationPriority.MEDIUM,
        title: '📝 Registro Pendiente',
        message: `Recuerda registrar ${tipoRegistro} para el lote "${loteName}"`,
        icon: 'clipboard',
        data: { loteId, loteName },
        sendPush: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      });
    }, [createNotification]),

    vacunacionPendiente: useCallback(async (
      loteId: string,
      loteName: string,
      tipoVacuna: string,
      fechaVencimiento: Date
    ) => {
      return await createNotification({
        type: NotificationType.VACUNACION_PENDIENTE,
        category: NotificationCategory.REMINDER,
        priority: NotificationPriority.HIGH,
        title: '💉 Vacunación Pendiente',
        message: `El lote "${loteName}" necesita vacuna ${tipoVacuna} antes del ${fechaVencimiento.toLocaleDateString()}`,
        icon: 'medical',
        data: { loteId, loteName },
        sendPush: true,
        expiresAt: fechaVencimiento,
      });
    }, [createNotification]),

    revisionLote: useCallback(async (
      loteId: string,
      loteName: string,
      diasSinRevision: number
    ) => {
      return await createNotification({
        type: NotificationType.REVISION_LOTE,
        category: NotificationCategory.REMINDER,
        priority: NotificationPriority.MEDIUM,
        title: '🔍 Revisión de Lote',
        message: `El lote "${loteName}" no ha sido revisado en ${diasSinRevision} días`,
        icon: 'eye',
        data: { loteId, loteName },
        sendPush: true,
      });
    }, [createNotification]),
  };

  // Notificaciones del sistema
  const notifySystem = {
    backupCompletado: useCallback(async () => {
      return await createNotification({
        type: NotificationType.BACKUP_COMPLETADO,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.LOW,
        title: '💾 Backup Completado',
        message: 'Los datos han sido respaldados exitosamente',
        icon: 'cloud-done',
        sendPush: false,
      });
    }, [createNotification]),

    usuarioCreado: useCallback(async (
      userName: string,
      userRole: string
    ) => {
      return await createNotification({
        type: NotificationType.USUARIO_CREADO,
        category: NotificationCategory.EVENT,
        priority: NotificationPriority.LOW,
        title: '👤 Nuevo Usuario Creado',
        message: `Se ha creado el usuario "${userName}" con rol ${userRole}`,
        icon: 'person-add',
        data: { userName },
        sendPush: false,
      });
    }, [createNotification]),
  };

  // Verificar si las notificaciones están habilitadas
  const areNotificationsEnabled = useCallback(() => {
    return settings?.enabled ?? true;
  }, [settings]);

  // Verificar si las push notifications están habilitadas
  const arePushNotificationsEnabled = useCallback(() => {
    return settings?.pushEnabled ?? true;
  }, [settings]);

  return {
    // Estado
    notifications,
    stats,
    settings,
    isLoading,
    error,
    unreadCount: getUnreadCount(),
    
    // Funciones básicas
    createNotification,
    notify,
    
    // Verificaciones
    areNotificationsEnabled,
    arePushNotificationsEnabled,
    
    // Notificaciones específicas
    production: notifyProduction,
    financial: notifyFinancial,
    events: notifyEvents,
    reminders: notifyReminders,
    system: notifySystem,
  };
};

export default useNotifications;
