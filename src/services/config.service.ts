/**
 * ConfigService - Servicio de configuración con cache inteligente
 * 
 * Características:
 * - Cache en memoria con TTL inteligente
 * - Suscripción en tiempo real para actualizaciones
 * - Valores por defecto inmediatos
 * - API síncrona para acceso instantáneo
 */

import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { requireAuth } from './auth.service';

export interface AppConfig {
  // Precios
  precioHuevo: number;
  precioLibraEngorde: number;
  precioUnidadIsraeli: number;
  cantidadHuevosPorCaja: number;
  
  // Configuración de crecimiento
  diasCrecimientoIsraeli: number;
  diasCrecimientoEngorde: number;
  pesoObjetivoEngorde: number;
  tasaMortalidadAceptable: number;
  
  // Configuración de facturación
  empresa: {
    nombre: string;
    nit?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  numeracion: {
    prefijo: string;
    siguienteNumero: number;
    formato: string;
  };
  
  // Metadatos
  id: string;
  updatedAt: Date;
  updatedBy: string;
}

interface CachedConfig {
  config: AppConfig;
  timestamp: number;
  isValid: boolean;
}

class ConfigService {
  private cache: CachedConfig | null = null;
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutos
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  // Configuración por defecto disponible inmediatamente
  private readonly DEFAULT_CONFIG: Omit<AppConfig, 'id' | 'updatedAt' | 'updatedBy'> = {
    // Precios por defecto
    precioHuevo: 8.0,
    precioLibraEngorde: 65.0,
    precioUnidadIsraeli: 150.0,
    cantidadHuevosPorCaja: 30,
    
    // Configuración de crecimiento
    diasCrecimientoIsraeli: 45,
    diasCrecimientoEngorde: 42,
    pesoObjetivoEngorde: 4.5,
    tasaMortalidadAceptable: 5.0,
    
    // Configuración de facturación
    empresa: {
      nombre: 'Asoaves',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
    },
    numeracion: {
      prefijo: 'FAC',
      siguienteNumero: 1,
      formato: '{prefijo}-{numero:4}',
    },
  };

  /**
   * Inicializa el servicio con suscripción en tiempo real
   * Debe llamarse una vez al inicio de la app
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const userId = requireAuth();
      const configRef = doc(db, 'configuraciones', userId);

      // Configurar suscripción en tiempo real
      this.unsubscribe = onSnapshot(
        configRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const config: AppConfig = {
              id: snapshot.id,
              ...data,
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as AppConfig;

            this.cache = {
              config,
              timestamp: Date.now(),
              isValid: true,
            };

            console.log('✅ [ConfigService] Configuración actualizada desde Firebase');
          } else {
            // Si no existe configuración, crear una por defecto
            this.createDefaultConfig();
          }
        },
        (error) => {
          console.error('❌ [ConfigService] Error en suscripción:', error);
          // En caso de error, usar configuración por defecto
          this.useDefaultConfig();
        }
      );

      this.isInitialized = true;
      console.log('🔧 [ConfigService] Inicializado con suscripción en tiempo real');
    } catch (error) {
      console.error('❌ [ConfigService] Error al inicializar:', error);
      this.useDefaultConfig();
    }
  }

  /**
   * Obtiene la configuración de forma SÍNCRONA
   * Retorna inmediatamente desde cache o valores por defecto
   */
  getConfig(): AppConfig {
    // Si hay cache válido, usarlo
    if (this.cache && this.isCacheValid()) {
      return this.cache.config;
    }

    // Si no hay cache válido, usar configuración por defecto
    console.log('⚡ [ConfigService] Usando configuración por defecto (cache no disponible)');
    return this.createDefaultConfigObject();
  }

  /**
   * Obtiene configuración de forma asíncrona (para compatibilidad)
   * Intenta cargar desde Firebase si no hay cache
   */
  async getConfigAsync(): Promise<AppConfig> {
    // Si hay cache válido, usarlo inmediatamente
    if (this.cache && this.isCacheValid()) {
      return this.cache.config;
    }

    try {
      const userId = requireAuth();
      const configRef = doc(db, 'configuraciones', userId);
      const snapshot = await getDoc(configRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const config: AppConfig = {
          id: snapshot.id,
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AppConfig;

        // Actualizar cache
        this.cache = {
          config,
          timestamp: Date.now(),
          isValid: true,
        };

        return config;
      } else {
        // Crear configuración por defecto
        return await this.createDefaultConfig();
      }
    } catch (error) {
      console.error('❌ [ConfigService] Error al obtener configuración:', error);
      return this.getConfig(); // Fallback a configuración por defecto
    }
  }

  /**
   * Actualiza la configuración
   */
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    try {
      const userId = requireAuth();
      const configRef = doc(db, 'configuraciones', userId);
      const currentConfig = this.getConfig();

      const updatedConfig = {
        ...currentConfig,
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      };

      await setDoc(configRef, updatedConfig, { merge: true });
      console.log('✅ [ConfigService] Configuración actualizada');
    } catch (error) {
      console.error('❌ [ConfigService] Error al actualizar configuración:', error);
      throw error;
    }
  }

  /**
   * Invalida el cache manualmente
   */
  invalidateCache(): void {
    if (this.cache) {
      this.cache.isValid = false;
    }
    console.log('🗑️ [ConfigService] Cache invalidado');
  }

  /**
   * Cleanup - desuscribirse de cambios
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.cache = null;
    this.isInitialized = false;
    console.log('🧹 [ConfigService] Limpieza completada');
  }

  // Métodos privados

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    if (!this.cache.isValid) return false;
    
    const now = Date.now();
    const age = now - this.cache.timestamp;
    return age < this.CACHE_TTL;
  }

  private createDefaultConfigObject(): AppConfig {
    const userId = 'default';
    return {
      ...this.DEFAULT_CONFIG,
      id: userId,
      updatedAt: new Date(),
      updatedBy: userId,
    };
  }

  private async createDefaultConfig(): Promise<AppConfig> {
    try {
      const userId = requireAuth();
      const configRef = doc(db, 'configuraciones', userId);
      
      const defaultConfig = {
        ...this.DEFAULT_CONFIG,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      };

      await setDoc(configRef, defaultConfig);
      
      const config: AppConfig = {
        ...this.DEFAULT_CONFIG,
        id: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      // Actualizar cache
      this.cache = {
        config,
        timestamp: Date.now(),
        isValid: true,
      };

      console.log('✅ [ConfigService] Configuración por defecto creada');
      return config;
    } catch (error) {
      console.error('❌ [ConfigService] Error al crear configuración por defecto:', error);
      return this.createDefaultConfigObject();
    }
  }

  private useDefaultConfig(): void {
    const config = this.createDefaultConfigObject();
    this.cache = {
      config,
      timestamp: Date.now(),
      isValid: true,
    };
    console.log('⚡ [ConfigService] Usando configuración por defecto como fallback');
  }
}

// Instancia singleton
export const configService = new ConfigService();

// Funciones de conveniencia
export const getConfig = () => configService.getConfig();
export const getConfigAsync = () => configService.getConfigAsync();
export const updateConfig = (updates: Partial<AppConfig>) => configService.updateConfig(updates);
export const initializeConfig = () => configService.initialize();
export const cleanupConfig = () => configService.cleanup();




