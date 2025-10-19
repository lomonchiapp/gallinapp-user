/**
 * Hook para verificar si el AuthStore ha sido hidratado desde AsyncStorage
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuthHydration = () => {
  const { hasHydrated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (hasHydrated) {
      setIsHydrated(true);
    }
  }, [hasHydrated]);

  return isHydrated;
};












