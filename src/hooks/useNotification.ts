/**
 * Hook para manejar notificaciones toast
 * Gestión centralizada de feedback visual para el usuario
 */

import { useCallback, useState } from 'react';
import { NotificationType } from '../components/ui/NotificationToast';

interface NotificationState {
  visible: boolean;
  type: NotificationType;
  title: string;
  message?: string;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: 'info',
    title: '',
  });

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message?: string
  ) => {
    setNotification({
      visible: true,
      type,
      title,
      message,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showNotification('success', title, message);
  }, [showNotification]);

  const showError = useCallback((title: string, message?: string) => {
    showNotification('error', title, message);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message?: string) => {
    showNotification('warning', title, message);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message?: string) => {
    showNotification('info', title, message);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};







