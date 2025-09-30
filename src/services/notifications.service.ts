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
 * Crear una nueva notificación
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

    const notification = {
      ...notificationData,
      userId,
      status: NotificationStatus.UNREAD,
      createdAt: serverTimestamp(),
      sentToPush: false,
      pushDelivered: false,
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    
    // Si está configurado para enviar push notification
    if (notificationData.sendPush) {
      await schedulePushNotification(docRef.id, notification);
    }
    
    return docRef.id;
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
const schedulePushNotification = async (
  notificationId: string,
  notification: any
): Promise<void> => {
  // TODO: Implementar lógica de push notifications
  // Aquí se integraría con Expo Notifications o Firebase Cloud Messaging
  console.log('Push notification programada:', notificationId, notification.title);
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
