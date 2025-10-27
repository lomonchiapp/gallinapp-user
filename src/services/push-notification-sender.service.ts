/**
 * 📨 SERVICIO DE ENVÍO DE PUSH NOTIFICATIONS
 * 
 * Maneja el envío de notificaciones push a través de la API de Expo
 */

/**
 * Interfaz para el mensaje de push notification
 */
export interface PushMessage {
  to: string | string[];      // Token(s) del dispositivo
  title: string;               // Título de la notificación
  body: string;                // Mensaje principal
  data?: Record<string, any>;  // Datos adicionales personalizados
  sound?: 'default' | null;    // Sonido de notificación
  priority?: 'default' | 'normal' | 'high';  // Prioridad
  badge?: number;              // Badge count
  channelId?: string;          // Canal de Android
  categoryId?: string;         // Categoría de iOS
  subtitle?: string;           // Subtítulo (iOS)
}

/**
 * Respuesta de la API de Expo
 */
export interface PushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

/**
 * Enviar notificación push usando la API de Expo Push Notifications
 * 
 * @param message Configuración del mensaje push
 * @returns Resultado del envío
 */
export const sendPushNotification = async (
  message: PushMessage
): Promise<PushTicket> => {
  try {
    console.log('📤 Enviando push notification via Expo API...');
    console.log('   Destinatario(s):', message.to);
    console.log('   Título:', message.title);
    console.log('   Prioridad:', message.priority || 'default');

    // Validar que hay un token válido
    if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
      throw new Error('No hay tokens de destino válidos');
    }

    // Enviar request a la API de Expo
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: message.to,
        title: message.title,
        body: message.body,
        data: message.data || {},
        sound: message.sound === null ? null : 'default',
        priority: message.priority || 'default',
        badge: message.badge,
        channelId: message.channelId,
        categoryIdentifier: message.categoryId,
        subtitle: message.subtitle,
      }),
    });

    // Verificar respuesta
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📥 Respuesta de Expo:', result);

    // Procesar resultado
    if (result.data) {
      const ticket = result.data[0] || result.data;
      
      if (ticket.status === 'error') {
        console.error('❌ Error en push notification:', ticket.message);
        console.error('   Detalles:', ticket.details);
        return ticket;
      }

      console.log('✅ Push notification enviada exitosamente');
      console.log('   Ticket ID:', ticket.id);
      return ticket;
    }

    return { status: 'ok' };
  } catch (error) {
    console.error('❌ Error al enviar push notification:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

/**
 * Enviar notificaciones push a múltiples dispositivos
 * 
 * @param messages Array de mensajes push
 * @returns Array de resultados
 */
export const sendPushNotificationBatch = async (
  messages: PushMessage[]
): Promise<PushTicket[]> => {
  try {
    console.log(`📤 Enviando ${messages.length} push notifications en batch...`);

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Batch de ${messages.length} notificaciones enviado`);

    return result.data || [];
  } catch (error) {
    console.error('❌ Error al enviar batch de push notifications:', error);
    return [];
  }
};

/**
 * Verificar el estado de un ticket de notificación
 * Útil para saber si la notificación fue entregada exitosamente
 * 
 * @param ticketId ID del ticket recibido al enviar la notificación
 * @returns Estado de entrega de la notificación
 */
export const checkPushReceipt = async (
  ticketId: string
): Promise<any> => {
  try {
    console.log('🔍 Verificando estado de entrega del ticket:', ticketId);

    const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: [ticketId],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const receipt = result.data?.[ticketId];

    if (receipt) {
      if (receipt.status === 'ok') {
        console.log('✅ Notificación entregada exitosamente');
      } else if (receipt.status === 'error') {
        console.error('❌ Error en entrega:', receipt.message);
        console.error('   Detalles:', receipt.details);
      }
    }

    return receipt;
  } catch (error) {
    console.error('❌ Error al verificar receipt:', error);
    return null;
  }
};

/**
 * Crear mensaje de push para alerta de bienestar animal
 * Función helper que formatea correctamente las alertas
 * 
 * @param token Token del dispositivo
 * @param title Título de la alerta
 * @param message Mensaje de la alerta
 * @param priority Prioridad (CRITICAL, HIGH, MEDIUM, LOW)
 * @param data Datos adicionales
 * @returns Mensaje formateado para Expo
 */
export const createAnimalWelfareAlertMessage = (
  token: string,
  title: string,
  message: string,
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  data?: Record<string, any>
): PushMessage => {
  // Mapear prioridad de la app a prioridad de Expo
  const expoPriority = priority === 'CRITICAL' || priority === 'HIGH' ? 'high' : 'default';

  // Badge count según prioridad
  const badge = priority === 'CRITICAL' ? 1 : undefined;

  return {
    to: token,
    title,
    body: message,
    data: {
      ...data,
      type: 'ANIMAL_WELFARE_ALERT',
      priority,
      timestamp: new Date().toISOString(),
    },
    sound: 'default',
    priority: expoPriority,
    badge,
    channelId: 'animal-welfare', // Canal de Android para alertas de bienestar
  };
};
















