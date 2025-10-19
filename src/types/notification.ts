/**
 * Tipos para el sistema de notificaciones
 */

export enum NotificationType {
  // Alertas de producción
  MORTALIDAD_ALTA = 'MORTALIDAD_ALTA',
  PRODUCCION_BAJA = 'PRODUCCION_BAJA',
  PESO_OBJETIVO = 'PESO_OBJETIVO',
  MADURACION_LISTA = 'MADURACION_LISTA',
  
  // Alertas financieras
  GASTO_ALTO = 'GASTO_ALTO',
  RENTABILIDAD_BAJA = 'RENTABILIDAD_BAJA',
  META_INGRESOS = 'META_INGRESOS',
  
  // Alertas de sistema
  BACKUP_COMPLETADO = 'BACKUP_COMPLETADO',
  ACTUALIZACION_DISPONIBLE = 'ACTUALIZACION_DISPONIBLE',
  MANTENIMIENTO_PROGRAMADO = 'MANTENIMIENTO_PROGRAMADO',
  
  // Recordatorios
  REGISTRO_PENDIENTE = 'REGISTRO_PENDIENTE',
  VACUNACION_PENDIENTE = 'VACUNACION_PENDIENTE',
  REVISION_LOTE = 'REVISION_LOTE',
  
  // Eventos importantes
  LOTE_CREADO = 'LOTE_CREADO',
  LOTE_FINALIZADO = 'LOTE_FINALIZADO',
  VENTA_REGISTRADA = 'VENTA_REGISTRADA',
  USUARIO_CREADO = 'USUARIO_CREADO',
  
  // Alertas personalizadas
  CUSTOM = 'CUSTOM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

export enum NotificationCategory {
  PRODUCTION = 'PRODUCTION',
  FINANCIAL = 'FINANCIAL',
  SYSTEM = 'SYSTEM',
  REMINDER = 'REMINDER',
  EVENT = 'EVENT',
  CUSTOM = 'CUSTOM',
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  params?: Record<string, any>;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface NotificationData {
  loteId?: string;
  loteName?: string;
  tipoAve?: string;
  amount?: number;
  percentage?: number;
  userId?: string;
  userName?: string;
  customData?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  
  // Contenido
  title: string;
  message: string;
  icon?: string;
  image?: string;
  
  // Metadatos
  userId: string;
  createdAt: Date;
  readAt?: Date;
  archivedAt?: Date;
  expiresAt?: Date;
  
  // Datos adicionales
  data?: NotificationData;
  actions?: NotificationAction[];
  
  // Push notification
  pushNotificationId?: string;
  sentToPush?: boolean;
  pushDelivered?: boolean;
}

export interface CreateNotification {
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  icon?: string;
  image?: string;
  userId?: string; // Si no se proporciona, se usa el usuario actual
  expiresAt?: Date;
  data?: NotificationData;
  actions?: NotificationAction[];
  sendPush?: boolean;
}

export interface NotificationSettings {
  userId: string;
  
  // Configuración general
  enabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  
  // Configuración por categoría
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      pushEnabled: boolean;
      emailEnabled: boolean;
      priority: NotificationPriority;
    }
  };
  
  // Configuración por tipo específico
  types: {
    [key in NotificationType]?: {
      enabled: boolean;
      pushEnabled: boolean;
      emailEnabled: boolean;
    }
  };
  
  // Horarios de no molestar
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  
  // Configuración de push
  pushToken?: string;
  deviceTokens: string[];
  
  updatedAt: Date;
}

export interface NotificationFilter {
  status?: NotificationStatus[];
  category?: NotificationCategory[];
  priority?: NotificationPriority[];
  type?: NotificationType[];
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  loteId?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  byStatus: Record<NotificationStatus, number>;
}



































