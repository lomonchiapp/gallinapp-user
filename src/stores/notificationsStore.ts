/**
 * Store de notificaciones usando Zustand
 */

import { create } from 'zustand';
import {
    archiveNotification,
    cleanupExpiredNotifications,
    createDefaultNotificationSettings,
    createNotification,
    deleteNotification,
    getNotificationSettings,
    getNotificationStats,
    getUserNotifications,
    markAsRead,
    markMultipleAsRead,
    subscribeToNotifications,
    updateNotificationSettings,
} from '../services/notifications.service';
import {
    CreateNotification,
    Notification,
    NotificationFilter,
    NotificationSettings,
    NotificationStats,
    NotificationStatus,
} from '../types/notification';

interface NotificationsState {
  // Estado
  notifications: Notification[];
  settings: NotificationSettings | null;
  stats: NotificationStats | null;
  
  // Estados de carga
  isLoading: boolean;
  isLoadingSettings: boolean;
  isLoadingStats: boolean;
  
  // Errores
  error: string | null;
  settingsError: string | null;
  
  // Filtros y paginación
  currentFilter: NotificationFilter | null;
  hasMoreNotifications: boolean;
  
  // Suscripción en tiempo real
  unsubscribeRealtime: (() => void) | null;
  
  // Acciones principales
  loadNotifications: (filter?: NotificationFilter) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  createNewNotification: (notification: CreateNotification) => Promise<string>;
  refreshNotifications: () => Promise<void>;
  
  // Acciones de notificaciones individuales
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markSelectedAsRead: (ids: string[]) => Promise<void>;
  archiveNotificationById: (id: string) => Promise<void>;
  deleteNotificationById: (id: string) => Promise<void>;
  
  // Gestión de configuración
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  createDefaultSettings: () => Promise<void>;
  
  // Estadísticas
  loadStats: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Tiempo real
  startRealtimeUpdates: (filter?: NotificationFilter) => void;
  stopRealtimeUpdates: () => void;
  
  // Utilidades
  getUnreadCount: () => number;
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByPriority: (priority: string) => Notification[];
  clearError: () => void;
  applyFilter: (filter: NotificationFilter) => Promise<void>;
  clearFilter: () => Promise<void>;
  
  // Limpieza
  cleanupExpired: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  // Estado inicial
  notifications: [],
  settings: null,
  stats: null,
  
  isLoading: false,
  isLoadingSettings: false,
  isLoadingStats: false,
  
  error: null,
  settingsError: null,
  
  currentFilter: null,
  hasMoreNotifications: true,
  unsubscribeRealtime: null,
  
  // Cargar notificaciones
  loadNotifications: async (filter?: NotificationFilter) => {
    set({ isLoading: true, error: null });
    try {
      const notifications = await getUserNotifications(undefined, filter);
      set({
        notifications,
        currentFilter: filter || null,
        hasMoreNotifications: notifications.length === (filter?.limit || 50),
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Error al cargar notificaciones',
        isLoading: false,
      });
    }
  },
  
  // Cargar más notificaciones (paginación)
  loadMoreNotifications: async () => {
    const { notifications, currentFilter, hasMoreNotifications } = get();
    if (!hasMoreNotifications) return;
    
    try {
      const filter = {
        ...currentFilter,
        offset: notifications.length,
        limit: currentFilter?.limit || 20,
      };
      
      const moreNotifications = await getUserNotifications(undefined, filter);
      
      set({
        notifications: [...notifications, ...moreNotifications],
        hasMoreNotifications: moreNotifications.length === (filter.limit || 20),
      });
    } catch (error: any) {
      set({ error: error.message || 'Error al cargar más notificaciones' });
    }
  },
  
  // Crear nueva notificación
  createNewNotification: async (notification: CreateNotification): Promise<string> => {
    try {
      const notificationId = await createNotification(notification);
      
      // Refrescar las notificaciones para incluir la nueva
      await get().refreshNotifications();
      
      return notificationId;
    } catch (error: any) {
      set({ error: error.message || 'Error al crear notificación' });
      throw error;
    }
  },
  
  // Refrescar notificaciones
  refreshNotifications: async () => {
    const { currentFilter } = get();
    await get().loadNotifications(currentFilter || undefined);
  },
  
  // Marcar como leída
  markNotificationAsRead: async (id: string) => {
    try {
      await markAsRead(id);
      
      // Actualizar estado local
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === id
            ? { ...notification, status: NotificationStatus.READ, readAt: new Date() }
            : notification
        ),
      }));
      
      // Actualizar estadísticas
      await get().refreshStats();
    } catch (error: any) {
      set({ error: error.message || 'Error al marcar como leída' });
    }
  },
  
  // Marcar todas como leídas
  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadIds = notifications
      .filter(n => n.status === NotificationStatus.UNREAD)
      .map(n => n.id);
    
    if (unreadIds.length === 0) return;
    
    try {
      await markMultipleAsRead(unreadIds);
      
      // Actualizar estado local
      set(state => ({
        notifications: state.notifications.map(notification =>
          unreadIds.includes(notification.id)
            ? { ...notification, status: NotificationStatus.READ, readAt: new Date() }
            : notification
        ),
      }));
      
      await get().refreshStats();
    } catch (error: any) {
      set({ error: error.message || 'Error al marcar todas como leídas' });
    }
  },
  
  // Marcar seleccionadas como leídas
  markSelectedAsRead: async (ids: string[]) => {
    try {
      await markMultipleAsRead(ids);
      
      set(state => ({
        notifications: state.notifications.map(notification =>
          ids.includes(notification.id)
            ? { ...notification, status: NotificationStatus.READ, readAt: new Date() }
            : notification
        ),
      }));
      
      await get().refreshStats();
    } catch (error: any) {
      set({ error: error.message || 'Error al marcar seleccionadas como leídas' });
    }
  },
  
  // Archivar notificación
  archiveNotificationById: async (id: string) => {
    try {
      await archiveNotification(id);
      
      set(state => ({
        notifications: state.notifications.map(notification =>
          notification.id === id
            ? { ...notification, status: NotificationStatus.ARCHIVED, archivedAt: new Date() }
            : notification
        ),
      }));
      
      await get().refreshStats();
    } catch (error: any) {
      set({ error: error.message || 'Error al archivar notificación' });
    }
  },
  
  // Eliminar notificación
  deleteNotificationById: async (id: string) => {
    try {
      await deleteNotification(id);
      
      set(state => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
      
      await get().refreshStats();
    } catch (error: any) {
      set({ error: error.message || 'Error al eliminar notificación' });
    }
  },
  
  // Cargar configuración
  loadSettings: async () => {
    set({ isLoadingSettings: true, settingsError: null });
    try {
      let settings = await getNotificationSettings();
      
      // Si no existe configuración, crear una por defecto
      if (!settings) {
        settings = await get().createDefaultSettings();
      }
      
      set({ settings, isLoadingSettings: false });
    } catch (error: any) {
      set({
        settingsError: error.message || 'Error al cargar configuración',
        isLoadingSettings: false,
      });
    }
  },
  
  // Actualizar configuración
  updateSettings: async (newSettings: Partial<NotificationSettings>) => {
    try {
      await updateNotificationSettings(newSettings);
      
      set(state => ({
        settings: state.settings ? { ...state.settings, ...newSettings } : null,
      }));
    } catch (error: any) {
      set({ settingsError: error.message || 'Error al actualizar configuración' });
    }
  },
  
  // Crear configuración por defecto
  createDefaultSettings: async (): Promise<NotificationSettings> => {
    try {
      // Obtener el userId del auth store o servicio
      const userId = 'current-user'; // TODO: Obtener del auth store
      const settings = await createDefaultNotificationSettings(userId);
      set({ settings });
      return settings;
    } catch (error: any) {
      set({ settingsError: error.message || 'Error al crear configuración por defecto' });
      throw error;
    }
  },
  
  // Cargar estadísticas
  loadStats: async () => {
    set({ isLoadingStats: true });
    try {
      const stats = await getNotificationStats();
      set({ stats, isLoadingStats: false });
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
      set({ isLoadingStats: false });
    }
  },
  
  // Refrescar estadísticas
  refreshStats: async () => {
    await get().loadStats();
  },
  
  // Iniciar actualizaciones en tiempo real
  startRealtimeUpdates: (filter?: NotificationFilter) => {
    const { unsubscribeRealtime } = get();
    
    // Si ya hay una suscripción activa, detenerla
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
    }
    
    const unsubscribe = subscribeToNotifications(
      (notifications) => {
        set({ notifications });
        get().refreshStats();
      },
      undefined,
      filter
    );
    
    set({ unsubscribeRealtime: unsubscribe });
  },
  
  // Detener actualizaciones en tiempo real
  stopRealtimeUpdates: () => {
    const { unsubscribeRealtime } = get();
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
      set({ unsubscribeRealtime: null });
    }
  },
  
  // Obtener contador de no leídas
  getUnreadCount: () => {
    const { notifications } = get();
    return notifications.filter(n => n.status === NotificationStatus.UNREAD).length;
  },
  
  // Filtrar por categoría
  getNotificationsByCategory: (category: string) => {
    const { notifications } = get();
    return notifications.filter(n => n.category === category);
  },
  
  // Filtrar por prioridad
  getNotificationsByPriority: (priority: string) => {
    const { notifications } = get();
    return notifications.filter(n => n.priority === priority);
  },
  
  // Limpiar error
  clearError: () => {
    set({ error: null, settingsError: null });
  },
  
  // Aplicar filtro
  applyFilter: async (filter: NotificationFilter) => {
    await get().loadNotifications(filter);
  },
  
  // Limpiar filtro
  clearFilter: async () => {
    set({ currentFilter: null });
    await get().loadNotifications();
  },
  
  // Limpiar notificaciones expiradas
  cleanupExpired: async () => {
    try {
      await cleanupExpiredNotifications();
      await get().refreshNotifications();
    } catch (error: any) {
      set({ error: error.message || 'Error al limpiar notificaciones expiradas' });
    }
  },
  
  // Reset completo del store
  reset: () => {
    const { unsubscribeRealtime } = get();
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
    }
    
    set({
      notifications: [],
      settings: null,
      stats: null,
      isLoading: false,
      isLoadingSettings: false,
      isLoadingStats: false,
      error: null,
      settingsError: null,
      currentFilter: null,
      hasMoreNotifications: true,
      unsubscribeRealtime: null,
    });
  },
}));










