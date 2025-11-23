/**
 * useConfig - Hook para configuración global
 * 
 * Maneja:
 * - Acceso a configuración de la aplicación
 * - Actualizaciones de configuración
 * - Cache inteligente con suscripciones
 * - Valores por defecto inmediatos
 */

import { useCallback, useEffect, useState } from 'react';
import { configService, AppConfig, updateConfig, initializeConfig, cleanupConfig } from '../services/config.service';

interface UseConfigReturn {
  // Estado
  config: AppConfig;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  actualizarConfig: (updates: Partial<AppConfig>) => Promise<void>;
  recargarConfig: () => Promise<void>;
  
  // Utilidades
  clearError: () => void;
}

export const useConfig = (): UseConfigReturn => {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Actualiza la configuración
   */
  const actualizarConfig = useCallback(async (updates: Partial<AppConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('⚙️ [useConfig] Actualizando configuración...');
      
      await updateConfig(updates);
      
      // Obtener configuración actualizada
      const nuevaConfig = configService.getConfig();
      setConfig(nuevaConfig);
      
      console.log('✅ [useConfig] Configuración actualizada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setError(errorMessage);
      console.error('❌ [useConfig] Error al actualizar configuración:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Recarga la configuración desde Firebase
   */
  const recargarConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 [useConfig] Recargando configuración...');
      
      const nuevaConfig = await configService.getConfigAsync();
      setConfig(nuevaConfig);
      
      console.log('✅ [useConfig] Configuración recargada');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al recargar configuración';
      setError(errorMessage);
      console.error('❌ [useConfig] Error al recargar configuración:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Limpia el error actual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Inicializar configuración al montar el hook
  useEffect(() => {
    let isMounted = true;
    
    const initConfig = async () => {
      try {
        await initializeConfig();
        
        if (isMounted) {
          // Actualizar estado con configuración inicializada
          const nuevaConfig = configService.getConfig();
          setConfig(nuevaConfig);
          console.log('✅ [useConfig] Configuración inicializada');
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ [useConfig] Error al inicializar configuración:', error);
          setError('Error al inicializar configuración');
        }
      }
    };

    initConfig();

    // Cleanup al desmontar
    return () => {
      isMounted = false;
      cleanupConfig();
    };
  }, []);

  // Escuchar cambios en el servicio de configuración
  useEffect(() => {
    const interval = setInterval(() => {
      const nuevaConfig = configService.getConfig();
      setConfig(prev => {
        // Solo actualizar si hay cambios reales
        if (JSON.stringify(prev) !== JSON.stringify(nuevaConfig)) {
          console.log('🔄 [useConfig] Configuración actualizada desde cache');
          return nuevaConfig;
        }
        return prev;
      });
    }, 1000); // Verificar cada segundo

    return () => clearInterval(interval);
  }, []);

  return {
    // Estado
    config,
    isLoading,
    error,
    
    // Acciones
    actualizarConfig,
    recargarConfig,
    
    // Utilidades
    clearError,
  };
};




