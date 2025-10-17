/**
 * 📱 SERVICIO DE PUSH NOTIFICATIONS
 * 
 * Maneja todo el ciclo de vida de las notificaciones push:
 * - Solicitar permisos
 * - Obtener token del dispositivo
 * - Guardar token en Firebase
 * - Escuchar notificaciones entrantes
 * - Manejar tap en notificaciones
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../components/config/firebase';
import { getCurrentUserId } from './auth.service';

/**
 * NOTA IMPORTANTE: Este servicio requiere las siguientes dependencias:
 * 
 * Para instalar:
 * ```bash
 * npx expo install expo-notifications expo-device
 * ```
 * 
 * Las notificaciones push SOLO funcionan en dispositivos físicos,
 * NO en emuladores o simuladores.
 */

/**
 * Configurar comportamiento de notificaciones cuando la app está en primer plano
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // Mostrar alerta visual
    shouldPlaySound: true,    // Reproducir sonido
    shouldSetBadge: true,     // Actualizar badge del ícono
  }),
});

/**
 * Solicitar permisos de notificaciones push al usuario
 * @returns true si se otorgaron permisos, false en caso contrario
 */
export const requestPushPermissions = async (): Promise<boolean> => {
  // Las push notifications solo funcionan en dispositivos físicos
  if (!Device.isDevice) {
    console.warn('📱 Push notifications solo funcionan en dispositivos físicos, no en emuladores');
    return false;
  }

  try {
    // Verificar permisos actuales
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Si no tiene permisos, solicitarlos
    if (existingStatus !== 'granted') {
      console.log('🔐 Solicitando permisos de notificaciones...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Usuario denegó permisos de notificaciones push');
      return false;
    }

    console.log('✅ Permisos de push notifications concedidos');
    return true;
  } catch (error) {
    console.error('❌ Error al solicitar permisos:', error);
    return false;
  }
};

/**
 * Obtener token Expo Push del dispositivo actual
 * Este token es único por dispositivo y se usa para enviar notificaciones
 * @returns Token Expo Push o null si falla
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('📱 No se puede obtener token en emulador');
    return null;
  }

  try {
    // Primero solicitar permisos
    const hasPermissions = await requestPushPermissions();
    if (!hasPermissions) {
      return null;
    }

    // Configuración del proyecto Expo
    // Lee el projectId desde Constants (app.json/app.config.js)
    const Constants = await import('expo-constants').then(m => m.default);
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '2df095ff-3ae8-48d2-b6f6-ad230be71b99';
    
    console.log('🔑 Obteniendo Expo Push Token...');
    console.log('📋 Project ID:', projectId);
    
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('✅ Expo Push Token obtenido:', token.data);
    return token.data;
  } catch (error) {
    console.error('❌ Error al obtener Expo Push Token:', error);
    console.error('📋 Detalles del error:', error);
    return null;
  }
};

/**
 * Guardar token de push en Firebase para el usuario actual
 * @param token Token Expo Push del dispositivo
 */
export const savePushTokenToFirebase = async (token: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    console.log('💾 Guardando token en Firebase para userId:', userId);

    await setDoc(
      doc(db, 'userPushTokens', userId),
      {
        token,
        platform: Platform.OS,
        deviceModel: Device.modelName || 'Unknown',
        deviceName: Device.deviceName || 'Unknown',
        osVersion: Device.osVersion || 'Unknown',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('✅ Token guardado correctamente en Firebase');
  } catch (error) {
    console.error('❌ Error al guardar token en Firebase:', error);
    throw error;
  }
};

/**
 * Obtener token de push del usuario desde Firebase
 * @param userId ID del usuario (opcional, usa el actual si no se proporciona)
 * @returns Token de push o null si no existe
 */
export const getUserPushToken = async (userId?: string): Promise<string | null> => {
  try {
    const targetUserId = userId || getCurrentUserId();
    if (!targetUserId) {
      console.warn('⚠️ No hay usuario autenticado');
      return null;
    }

    const tokenDoc = await getDoc(doc(db, 'userPushTokens', targetUserId));
    
    if (!tokenDoc.exists()) {
      console.warn('⚠️ Usuario no tiene token de push registrado');
      return null;
    }

    const data = tokenDoc.data();
    return data.token || null;
  } catch (error) {
    console.error('❌ Error al obtener token de Firebase:', error);
    return null;
  }
};

/**
 * Inicializar servicio de push notifications
 * Esta función debe llamarse al iniciar la app (en _layout.tsx)
 */
export const initializePushNotifications = async (): Promise<void> => {
  try {
    console.log('🚀 Inicializando sistema de push notifications...');

    // Verificar si es dispositivo físico
    if (!Device.isDevice) {
      console.warn('📱 Emulador detectado - Push notifications deshabilitadas');
      return;
    }

    // 1. Obtener token del dispositivo
    const token = await getExpoPushToken();
    if (!token) {
      console.warn('⚠️ No se pudo obtener token de push - notificaciones deshabilitadas');
      return;
    }

    // 2. Guardar token en Firebase
    await savePushTokenToFirebase(token);

    // 3. Configurar listeners de notificaciones
    setupNotificationListeners();

    console.log('✅ Sistema de push notifications inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar push notifications:', error);
  }
};

/**
 * Configurar listeners para manejar notificaciones
 */
const setupNotificationListeners = () => {
  console.log('👂 Configurando listeners de notificaciones...');

  // Listener: Notificación recibida (app abierta o en background)
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 Notificación recibida:', notification);
    console.log('   Título:', notification.request.content.title);
    console.log('   Mensaje:', notification.request.content.body);
    console.log('   Data:', notification.request.content.data);
  });

  // Listener: Usuario hace tap en la notificación
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Usuario hizo tap en notificación');
    
    const data = response.notification.request.content.data;
    console.log('   Data de notificación:', data);
    
    // Aquí puedes implementar navegación según el tipo de notificación
    if (data.loteId) {
      console.log('   → Navegar a lote:', data.loteId);
      // TODO: Implementar navegación con router.push()
      // Ejemplo: router.push(`/(tabs)/levantes/detalles/${data.loteId}`);
    }
  });

  console.log('✅ Listeners configurados');
};

/**
 * Enviar notificación push LOCAL (para testing)
 * Esta notificación se envía desde el dispositivo mismo, no desde un servidor
 * 
 * @param title Título de la notificación
 * @param body Mensaje de la notificación
 * @param data Datos adicionales (opcional)
 */
export const sendLocalPushNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<void> => {
  try {
    console.log('📤 Enviando notificación local de prueba...');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Enviar inmediatamente
    });

    console.log('✅ Notificación local enviada');
  } catch (error) {
    console.error('❌ Error al enviar notificación local:', error);
  }
};

/**
 * Cancelar todas las notificaciones programadas
 */
export const cancelAllScheduledNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Todas las notificaciones programadas canceladas');
  } catch (error) {
    console.error('❌ Error al cancelar notificaciones:', error);
  }
};

/**
 * Obtener badge count actual (número en el ícono de la app)
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    const count = await Notifications.getBadgeCountAsync();
    return count;
  } catch (error) {
    console.error('❌ Error al obtener badge count:', error);
    return 0;
  }
};

/**
 * Actualizar badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
    console.log('✅ Badge count actualizado a:', count);
  } catch (error) {
    console.error('❌ Error al actualizar badge count:', error);
  }
};

/**
 * Limpiar badge (poner en 0)
 */
export const clearBadge = async (): Promise<void> => {
  await setBadgeCount(0);
};

