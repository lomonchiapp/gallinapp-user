/**
 * Servicio para gestión de notificaciones
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import {
    CreateNotification,
    Notification,
    NotificationCategory,
    NotificationFilter,
    NotificationPriority,
    NotificationSettings,
    NotificationStats,
    NotificationStatus,
    NotificationType
} from '../types/notification';
import { getCurrentUserId, isAuthenticated } from './auth.service';

/**
 * Verificar si ya existe una notificación similar (deduplicación)
 */
const checkDuplicateNotification = async (
  userId: string,
  notificationData: CreateNotification
): Promise<boolean> => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // Última hora
    
    // Crear clave única para deduplicación basada en tipo, título y datos clave
    const deduplicationKey = createDeduplicationKey(notificationData);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('type', '==', notificationData.type),
      where('title', '==', notificationData.title),
      where('createdAt', '>=', oneHourAgo),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.warn('Error verificando duplicados:', error);
    return false; // En caso de error, permitir creación
  }
};

/**
 * Crear clave única para deduplicación
 */
const createDeduplicationKey = (notificationData: CreateNotification): string => {
  const keyParts = [
    notificationData.type,
    notificationData.title,
    notificationData.data?.loteId || '',
    notificationData.data?.razon || '',
  ];
  return keyParts.join('|');
};

/**
 * Consolidar notificaciones similares en una sola
 */
const consolidateSimilarNotifications = async (
  userId: string,
  notificationData: CreateNotification
): Promise<string> => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Buscar notificaciones similares en las últimas 24 horas
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('type', '==', notificationData.type),
      where('createdAt', '>=', last24Hours),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    const similarNotifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (similarNotifications.length >= 3) {
      // Si hay 3 o más notificaciones similares, crear una consolidada
      const consolidatedTitle = getConsolidatedTitle(notificationData.type, similarNotifications.length + 1);
      const consolidatedMessage = getConsolidatedMessage(notificationData.type, similarNotifications.length + 1);
      
      // Crear notificación consolidada
      const consolidatedNotification = {
        ...notificationData,
        title: consolidatedTitle,
        message: consolidatedMessage,
        data: {
          ...notificationData.data,
          consolidated: true,
          count: similarNotifications.length + 1,
          originalNotifications: similarNotifications.map(n => n.id)
        }
      };
      
      // Marcar las notificaciones originales como leídas
      const batch = writeBatch(db);
      similarNotifications.forEach(notification => {
        const ref = doc(db, 'notifications', notification.id);
        batch.update(ref, { 
          status: NotificationStatus.READ,
          consolidated: true,
          consolidatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      
      console.log(`🔔 Consolidando ${similarNotifications.length + 1} notificaciones similares`);
      return await createNewNotification(consolidatedNotification);
    }
    
    // Verificar límites de frecuencia antes de crear nueva notificación
    const canCreate = await checkFrequencyLimits(userId, notificationData);
    if (!canCreate) {
      console.log('🔔 Notificación bloqueada por límites de frecuencia:', notificationData.title);
      return '';
    }
    
    return await createNewNotification(notificationData);
  } catch (error) {
    console.warn('Error consolidando notificaciones:', error);
    return await createNewNotification(notificationData);
  }
};

/**
 * Crear título consolidado
 */
const getConsolidatedTitle = (type: NotificationType, count: number): string => {
  switch (type) {
    case NotificationType.MORTALIDAD_ALTA:
      return `⚠️ ${count} Alertas de Mortalidad`;
    case NotificationType.PRODUCCION_BAJA:
      return `📉 ${count} Alertas de Producción`;
    case NotificationType.CUSTOM:
      return `🚨 ${count} Alertas de Emergencia`;
    default:
      return `${count} Notificaciones Similares`;
  }
};

/**
 * Crear mensaje consolidado
 */
const getConsolidatedMessage = (type: NotificationType, count: number): string => {
  switch (type) {
    case NotificationType.MORTALIDAD_ALTA:
      return `Se han detectado ${count} alertas de mortalidad elevada en diferentes lotes. Revisa todos los lotes afectados.`;
    case NotificationType.PRODUCCION_BAJA:
      return `Se han detectado ${count} alertas de producción baja en diferentes lotes. Verifica las condiciones de los lotes.`;
    case NotificationType.CUSTOM:
      return `Se han detectado ${count} alertas de emergencia que requieren atención inmediata.`;
    default:
      return `Se han detectado ${count} notificaciones similares que requieren tu atención.`;
  }
};

/**
 * Verificar límites de frecuencia para evitar spam
 */
const checkFrequencyLimits = async (
  userId: string,
  notificationData: CreateNotification
): Promise<boolean> => {
  try {
    const now = new Date();
    const timeWindows = {
      critical: 15 * 60 * 1000, // 15 minutos para críticas
      high: 30 * 60 * 1000,     // 30 minutos para altas
      medium: 60 * 60 * 1000,    // 1 hora para medias
      low: 2 * 60 * 60 * 1000,   // 2 horas para bajas
    };
    
    const timeWindow = timeWindows[notificationData.priority] || timeWindows.medium;
    const windowStart = new Date(now.getTime() - timeWindow);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('type', '==', notificationData.type),
      where('createdAt', '>=', windowStart),
      limit(5)
    );
    
    const snapshot = await getDocs(q);
    const recentCount = snapshot.size;
    
    // Límites por prioridad
    const limits = {
      [NotificationPriority.CRITICAL]: 3, // Máximo 3 críticas en 15 min
      [NotificationPriority.HIGH]: 2,     // Máximo 2 altas en 30 min
      [NotificationPriority.MEDIUM]: 1,  // Máximo 1 media en 1 hora
      [NotificationPriority.LOW]: 1,     // Máximo 1 baja en 2 horas
    };
    
    const limit = limits[notificationData.priority] || 1;
    
    if (recentCount >= limit) {
      console.log(`🔔 Límite de frecuencia alcanzado: ${recentCount}/${limit} notificaciones ${notificationData.priority} en ${timeWindow/60000} minutos`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Error verificando límites de frecuencia:', error);
    return true; // En caso de error, permitir creación
  }
};

/**
 * Crear nueva notificación sin verificaciones adicionales
 */
const createNewNotification = async (notificationData: CreateNotification): Promise<string> => {
  const userId = notificationData.userId || getCurrentUserId();
  
  const notification = {
    ...notificationData,
    userId,
    status: NotificationStatus.UNREAD,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'notifications'), notification);
  
  // Programar push notification si está habilitado
  if (notificationData.sendPush) {
    await schedulePushNotification(docRef.id, notification);
  }

  return docRef.id;
};

/**
 * Limpiar notificaciones duplicadas existentes
 */
export const cleanupDuplicateNotifications = async (userId?: string): Promise<void> => {
  try {
    const targetUserId = userId || getCurrentUserId();
    if (!targetUserId) return;

    console.log('🧹 Iniciando limpieza de notificaciones duplicadas...');
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc'),
      limit(200) // Procesar últimas 200 notificaciones
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    // Agrupar por tipo y título para encontrar duplicados
    const groupedNotifications = new Map<string, any[]>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.type}|${data.title}`;
      
      if (!groupedNotifications.has(key)) {
        groupedNotifications.set(key, []);
      }
      groupedNotifications.get(key)!.push({ id: doc.id, ...data });
    });
    
    let duplicatesRemoved = 0;
    const batch = writeBatch(db);
    
    // Eliminar duplicados (mantener solo la más reciente de cada grupo)
    groupedNotifications.forEach((notifications, key) => {
      if (notifications.length > 1) {
        // Ordenar por fecha de creación (más reciente primero)
        notifications.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        
        // Eliminar todas excepto la más reciente
        for (let i = 1; i < notifications.length; i++) {
          const ref = doc(db, 'notifications', notifications[i].id);
          batch.delete(ref);
          duplicatesRemoved++;
        }
      }
    });
    
    if (duplicatesRemoved > 0) {
      await batch.commit();
      console.log(`🧹 Limpieza completada: ${duplicatesRemoved} notificaciones duplicadas eliminadas`);
    } else {
      console.log('🧹 No se encontraron notificaciones duplicadas');
    }
  } catch (error) {
    console.warn('Error en limpieza de duplicados:', error);
  }
};

/**
 * Limpiar notificaciones antiguas y duplicadas
 */
export const cleanupOldNotifications = async (userId?: string): Promise<void> => {
  try {
    const targetUserId = userId || getCurrentUserId();
    if (!targetUserId) return;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', targetUserId),
      where('createdAt', '<', thirtyDaysAgo),
      limit(100) // Procesar en lotes
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🧹 Limpieza: ${snapshot.size} notificaciones antiguas eliminadas`);
  } catch (error) {
    console.warn('Error en limpieza de notificaciones:', error);
  }
};

/**
 * Crear una nueva notificación con deduplicación y consolidación
 */
export const createNotification = async (
  notificationData: CreateNotification
): Promise<string> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const userId = notificationData.userId || getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar duplicados antes de crear
    const isDuplicate = await checkDuplicateNotification(userId, notificationData);
    if (isDuplicate) {
      console.log('🔔 Notificación duplicada evitada:', notificationData.title);
      return ''; // Retornar string vacío para indicar que no se creó
    }

    // Intentar consolidar notificaciones similares
    return await consolidateSimilarNotifications(userId, notificationData);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

/**
 * Obtener notificaciones del usuario
 */
export const getUserNotifications = async (
  userId?: string,
  filter?: NotificationFilter
): Promise<Notification[]> => {
  if (!isAuthenticated()) {
    console.warn('🔔 getUserNotifications: Usuario no autenticado');
    return [];
  }

  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🔔 [getUserNotifications] Buscando notificaciones para userId:', currentUserId);
    console.log('🔔 [getUserNotifications] Filtros:', filter);

    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId),
      orderBy('createdAt', 'desc')
    );

    // Aplicar filtros
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        q = query(q, where('status', 'in', filter.status));
      }
      if (filter.category && filter.category.length > 0) {
        q = query(q, where('category', 'in', filter.category));
      }
      if (filter.priority && filter.priority.length > 0) {
        q = query(q, where('priority', 'in', filter.priority));
      }
      if (filter.type && filter.type.length > 0) {
        q = query(q, where('type', 'in', filter.type));
      }
      if (filter.loteId) {
        q = query(q, where('data.loteId', '==', filter.loteId));
      }
      if (filter.limit) {
        q = query(q, limit(filter.limit));
      }
    }

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    console.log('🔔 [getUserNotifications] Documentos encontrados:', querySnapshot.size);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('🔔 [getUserNotifications] Procesando notificación:', doc.id, data.title);
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate(),
        archivedAt: data.archivedAt?.toDate(),
        expiresAt: data.expiresAt?.toDate(),
      } as Notification);
    });

    console.log('🔔 [getUserNotifications] Total notificaciones procesadas:', notifications.length);
    return notifications;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    throw error;
  }
};

/**
 * Suscribirse a notificaciones en tiempo real
 */
export const subscribeToNotifications = (
  callback: (notifications: Notification[]) => void,
  userId?: string,
  filter?: NotificationFilter
) => {
  if (!isAuthenticated()) {
    console.warn('🔔 subscribeToNotifications: Usuario no autenticado');
    return () => {}; // Retornar función vacía para cleanup
  }

  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUserId),
      orderBy('createdAt', 'desc'),
      limit(50) // Limitar para rendimiento
    );

    // Aplicar filtros básicos
    if (filter?.status && filter.status.length > 0) {
      q = query(q, where('status', 'in', filter.status));
    }

    return onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate(),
          archivedAt: data.archivedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as Notification);
      });
      callback(notifications);
    });
  } catch (error) {
    console.error('Error al suscribirse a notificaciones:', error);
    throw error;
  }
};

/**
 * Marcar notificación como leída
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: NotificationStatus.READ,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error al marcar como leída:', error);
    throw error;
  }
};

/**
 * Marcar múltiples notificaciones como leídas
 */
export const markMultipleAsRead = async (notificationIds: string[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    notificationIds.forEach((id) => {
      const notificationRef = doc(db, 'notifications', id);
      batch.update(notificationRef, {
        status: NotificationStatus.READ,
        readAt: serverTimestamp(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error al marcar múltiples como leídas:', error);
    throw error;
  }
};

/**
 * Archivar notificación
 */
export const archiveNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: NotificationStatus.ARCHIVED,
      archivedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error al archivar notificación:', error);
    throw error;
  }
};

/**
 * Eliminar notificación
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de notificaciones
 */
export const getNotificationStats = async (userId?: string): Promise<NotificationStats> => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    const notifications = await getUserNotifications(currentUserId);
    
    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => n.status === NotificationStatus.UNREAD).length,
      byCategory: {} as Record<NotificationCategory, number>,
      byPriority: {} as Record<NotificationPriority, number>,
      byStatus: {} as Record<NotificationStatus, number>,
    };

    // Inicializar contadores
    Object.values(NotificationCategory).forEach(category => {
      stats.byCategory[category] = 0;
    });
    Object.values(NotificationPriority).forEach(priority => {
      stats.byPriority[priority] = 0;
    });
    Object.values(NotificationStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Contar notificaciones
    notifications.forEach(notification => {
      stats.byCategory[notification.category]++;
      stats.byPriority[notification.priority]++;
      stats.byStatus[notification.status]++;
    });

    return stats;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

/**
 * Obtener configuración de notificaciones del usuario
 */
export const getNotificationSettings = async (userId?: string): Promise<NotificationSettings | null> => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    const settingsDoc = await getDocs(
      query(collection(db, 'notificationSettings'), where('userId', '==', currentUserId))
    );

    if (settingsDoc.empty) {
      return null;
    }

    const data = settingsDoc.docs[0].data();
    return {
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as NotificationSettings;
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    throw error;
  }
};

/**
 * Actualizar configuración de notificaciones
 */
export const updateNotificationSettings = async (
  settings: Partial<NotificationSettings>,
  userId?: string
): Promise<void> => {
  try {
    const currentUserId = userId || getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Usuario no autenticado');
    }

    const settingsRef = doc(db, 'notificationSettings', currentUserId);
    await setDoc(settingsRef, {
      ...settings,
      userId: currentUserId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    throw error;
  }
};

/**
 * Crear configuración por defecto
 */
export const createDefaultNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  const defaultSettings: NotificationSettings = {
    userId,
    enabled: true,
    pushEnabled: true,
    emailEnabled: false,
    categories: {
      [NotificationCategory.PRODUCTION]: {
        enabled: true,
        pushEnabled: true,
        emailEnabled: false,
        priority: NotificationPriority.HIGH,
      },
      [NotificationCategory.FINANCIAL]: {
        enabled: true,
        pushEnabled: true,
        emailEnabled: false,
        priority: NotificationPriority.MEDIUM,
      },
      [NotificationCategory.SYSTEM]: {
        enabled: true,
        pushEnabled: false,
        emailEnabled: false,
        priority: NotificationPriority.LOW,
      },
      [NotificationCategory.REMINDER]: {
        enabled: true,
        pushEnabled: true,
        emailEnabled: false,
        priority: NotificationPriority.MEDIUM,
      },
      [NotificationCategory.EVENT]: {
        enabled: true,
        pushEnabled: true,
        emailEnabled: false,
        priority: NotificationPriority.MEDIUM,
      },
      [NotificationCategory.CUSTOM]: {
        enabled: true,
        pushEnabled: true,
        emailEnabled: false,
        priority: NotificationPriority.MEDIUM,
      },
    },
    types: {},
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    },
    deviceTokens: [],
    updatedAt: new Date(),
  };

  await updateNotificationSettings(defaultSettings, userId);
  return defaultSettings;
};

/**
 * Limpiar notificaciones expiradas
 */
export const cleanupExpiredNotifications = async (): Promise<void> => {
  try {
    const now = new Date();
    const expiredQuery = query(
      collection(db, 'notifications'),
      where('expiresAt', '<=', now)
    );

    const expiredDocs = await getDocs(expiredQuery);
    const batch = writeBatch(db);

    expiredDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Limpiadas ${expiredDocs.size} notificaciones expiradas`);
  } catch (error) {
    console.error('Error al limpiar notificaciones expiradas:', error);
    throw error;
  }
};

/**
 * Programar push notification (placeholder para implementación futura)
 */
/**
 * Programar y enviar push notification
 * Esta función se llama automáticamente cuando se crea una notificación con sendPush: true
 */
const schedulePushNotification = async (
  notificationId: string,
  notification: any
): Promise<void> => {
  try {
    console.log('📤 Preparando push notification:', notification.title);

    // Importar servicios dinámicamente para evitar dependencias circulares
    const { getUserPushToken } = await import('./push-notifications.service');
    const { sendPushNotification, createAnimalWelfareAlertMessage } = await import('./push-notification-sender.service');

    // 1. Obtener token del usuario
    const userId = notification.userId || getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ No hay userId, no se puede enviar push');
      return;
    }

    const token = await getUserPushToken(userId);
    if (!token) {
      console.warn('⚠️ Usuario no tiene token de push registrado');
      return;
    }

    // 2. Crear mensaje de push formateado
    const pushMessage = createAnimalWelfareAlertMessage(
      token,
      notification.title,
      notification.message,
      notification.priority,
      {
        notificationId,
        ...notification.data,
      }
    );

    // 3. Enviar push notification
    const result = await sendPushNotification(pushMessage);

    // 4. Actualizar estado en Firebase
    if (result.status === 'ok') {
      await updateDoc(doc(db, 'notifications', notificationId), {
        sentToPush: true,
        pushSentAt: serverTimestamp(),
        pushTicketId: result.id,
      });
      console.log('✅ Push notification enviada y registrada en Firebase');
    } else {
      console.error('❌ Error al enviar push:', result.message);
      await updateDoc(doc(db, 'notifications', notificationId), {
        sentToPush: false,
        pushError: result.message,
        pushErrorDetails: result.details,
      });
    }
  } catch (error) {
    console.error('❌ Error al programar push notification:', error);
    
    // Registrar error en Firebase
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        sentToPush: false,
        pushError: error instanceof Error ? error.message : 'Error desconocido',
      });
    } catch (updateError) {
      console.error('❌ Error al actualizar estado de error:', updateError);
    }
  }
};

/**
 * Crear notificaciones predefinidas para diferentes eventos
 */
export const NotificationTemplates = {
  mortalidadAlta: (loteId: string, loteName: string, percentage: number) =>
    createNotification({
      type: NotificationType.MORTALIDAD_ALTA,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.HIGH,
      title: '⚠️ Mortalidad Alta Detectada',
      message: `El lote "${loteName}" tiene una mortalidad del ${percentage.toFixed(1)}%`,
      icon: 'warning',
      data: { loteId, loteName, percentage },
      sendPush: true,
    }),

  pesoObjetivo: (loteId: string, loteName: string, pesoActual: number, pesoObjetivo: number) =>
    createNotification({
      type: NotificationType.PESO_OBJETIVO,
      category: NotificationCategory.PRODUCTION,
      priority: NotificationPriority.MEDIUM,
      title: '🎯 Peso Objetivo Alcanzado',
      message: `El lote "${loteName}" ha alcanzado ${pesoActual.toFixed(2)} lbs (objetivo: ${pesoObjetivo} lbs)`,
      icon: 'checkmark-circle',
      data: { loteId, loteName, amount: pesoActual },
      sendPush: true,
    }),

  loteCreado: (loteId: string, loteName: string, tipoAve: string) =>
    createNotification({
      type: NotificationType.LOTE_CREADO,
      category: NotificationCategory.EVENT,
      priority: NotificationPriority.LOW,
      title: '✨ Nuevo Lote Creado',
      message: `Se ha creado el lote "${loteName}" de ${tipoAve}`,
      icon: 'add-circle',
      data: { loteId, loteName, tipoAve },
      sendPush: false,
    }),

  gastoAlto: (amount: number, categoria: string) =>
    createNotification({
      type: NotificationType.GASTO_ALTO,
      category: NotificationCategory.FINANCIAL,
      priority: NotificationPriority.HIGH,
      title: '💰 Gasto Alto Registrado',
      message: `Se ha registrado un gasto de $${amount.toFixed(2)} en ${categoria}`,
      icon: 'cash',
      data: { amount },
      sendPush: true,
    }),
};
