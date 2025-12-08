/**
 * Servicio de Alertas que respeta la configuración de notificaciones
 */

import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { obtenerConfiguracionSync } from '../services/appConfig.service';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
  type?: 'success' | 'error' | 'info' | 'warning' | 'confirmation';
}

/**
 * Muestra una alerta respetando la configuración de notificaciones
 */
export const showAlert = (options: AlertOptions): void => {
  const config = obtenerConfiguracionSync();
  
  // Valores por defecto si no hay configuración
  const defaultNotificaciones = {
    alertasHabilitadas: true,
    mostrarAlertasExito: true,
    mostrarAlertasError: true,
    mostrarAlertasConfirmacion: true,
    sonidoAlertas: true,
    vibrarEnAlertas: true,
  };
  
  const notificaciones = config?.notificaciones || defaultNotificaciones;

  // Si las alertas están deshabilitadas, no mostrar nada
  if (!notificaciones.alertasHabilitadas) {
    console.log(`[Alert] Suprimido por configuración: ${options.title} - ${options.message}`);
    return;
  }

  // Verificar si el tipo de alerta está habilitado
  const type = options.type || 'info';
  let shouldShow = false;

  switch (type) {
    case 'success':
      shouldShow = notificaciones.mostrarAlertasExito;
      break;
    case 'error':
      shouldShow = notificaciones.mostrarAlertasError;
      break;
    case 'confirmation':
      shouldShow = notificaciones.mostrarAlertasConfirmacion;
      break;
    case 'info':
    case 'warning':
    default:
      shouldShow = true; // Siempre mostrar info y warning
      break;
  }

  if (!shouldShow) {
    console.log(`[Alert] Suprimido por configuración (tipo ${type}): ${options.title} - ${options.message}`);
    return;
  }

  // Reproducir sonido si está habilitado
  if (notificaciones.sonidoAlertas) {
    // El sonido se maneja automáticamente por Alert en React Native
  }

  // Vibrar si está habilitado
  if (notificaciones.vibrarEnAlertas && Platform.OS !== 'web') {
    try {
      if (type === 'error' || type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      // Ignorar errores de haptics si no está disponible
      console.warn('Error al vibrar:', error);
    }
  }

  // Mostrar la alerta
  if (options.buttons && options.buttons.length > 0) {
    Alert.alert(
      options.title,
      options.message,
      options.buttons,
      { cancelable: options.cancelable !== false }
    );
  } else {
    Alert.alert(
      options.title,
      options.message,
      [{ text: 'OK' }],
      { cancelable: options.cancelable !== false }
    );
  }
};

/**
 * Muestra una alerta de éxito
 */
export const showSuccessAlert = (
  title: string,
  message?: string,
  onPress?: () => void
): void => {
  showAlert({
    title,
    message,
    type: 'success',
    buttons: onPress ? [{ text: 'OK', onPress }] : undefined,
  });
};

/**
 * Muestra una alerta de error
 */
export const showErrorAlert = (
  title: string,
  message?: string,
  onPress?: () => void
): void => {
  showAlert({
    title,
    message,
    type: 'error',
    buttons: onPress ? [{ text: 'OK', onPress }] : undefined,
  });
};

/**
 * Muestra una alerta de confirmación
 */
export const showConfirmationAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void,
  confirmText: string = 'Confirmar',
  cancelText: string = 'Cancelar'
): void => {
  showAlert({
    title,
    message,
    type: 'confirmation',
    buttons: [
      {
        text: cancelText,
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: confirmText,
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
  });
};

/**
 * Muestra una alerta informativa
 */
export const showInfoAlert = (
  title: string,
  message?: string,
  onPress?: () => void
): void => {
  showAlert({
    title,
    message,
    type: 'info',
    buttons: onPress ? [{ text: 'OK', onPress }] : undefined,
  });
};

/**
 * Muestra una alerta de advertencia
 */
export const showWarningAlert = (
  title: string,
  message?: string,
  onPress?: () => void
): void => {
  showAlert({
    title,
    message,
    type: 'warning',
    buttons: onPress ? [{ text: 'OK', onPress }] : undefined,
  });
};

