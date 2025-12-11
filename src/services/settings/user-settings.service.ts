/**
 * Servicio para gestionar configuraciones personales del usuario
 */

import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../components/config/firebase';
import { DEFAULT_USER_SETTINGS, UserSettings } from '../../types/settings';

const USER_SETTINGS_COLLECTION = 'userSettings';

/**
 * Cache de configuraciones de usuario
 */
const settingsCache = new Map<string, UserSettings>();
const unsubscribers = new Map<string, () => void>();

/**
 * Obtener configuraciones del usuario
 */
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    // Verificar cache
    if (settingsCache.has(userId)) {
      console.log('📦 [UserSettings] Retornando desde cache');
      return settingsCache.get(userId)!;
    }
    
    // Consultar Firestore
    const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const settings = {
        ...settingsDoc.data(),
        userId,
        updatedAt: settingsDoc.data().updatedAt?.toDate() || new Date(),
      } as UserSettings;
      
      // Guardar en cache
      settingsCache.set(userId, settings);
      return settings;
    } else {
      // Crear configuración por defecto
      console.log('⚠️ [UserSettings] No existe, creando defaults');
      return await createDefaultUserSettings(userId);
    }
  } catch (error) {
    console.error('❌ [UserSettings] Error:', error);
    
    // Retornar cache si hay error
    if (settingsCache.has(userId)) {
      return settingsCache.get(userId)!;
    }
    
    throw error;
  }
};

/**
 * Crear configuración por defecto para un usuario
 */
export const createDefaultUserSettings = async (
  userId: string
): Promise<UserSettings> => {
  try {
    const settingsData = {
      ...DEFAULT_USER_SETTINGS,
      userId,
      updatedAt: serverTimestamp(),
    };
    
    const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
    await setDoc(settingsRef, settingsData);
    
    const newSettings: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      userId,
      updatedAt: new Date(),
    };
    
    // Guardar en cache
    settingsCache.set(userId, newSettings);
    console.log('✅ [UserSettings] Configuración creada');
    
    return newSettings;
  } catch (error) {
    console.error('❌ [UserSettings] Error al crear defaults:', error);
    throw error;
  }
};

/**
 * Actualizar configuraciones del usuario
 */
export const updateUserSettings = async (
  userId: string,
  updates: Partial<Omit<UserSettings, 'userId' | 'updatedAt'>>
): Promise<UserSettings> => {
  try {
    const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(settingsRef, updateData);
    
    // Actualizar cache
    const currentSettings = settingsCache.get(userId) || { ...DEFAULT_USER_SETTINGS, userId, updatedAt: new Date() };
    const updatedSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date(),
    };
    
    settingsCache.set(userId, updatedSettings);
    console.log('✅ [UserSettings] Actualizado');
    
    return updatedSettings;
  } catch (error) {
    console.error('❌ [UserSettings] Error al actualizar:', error);
    throw error;
  }
};

/**
 * Suscribirse a cambios en tiempo real de las configuraciones del usuario
 */
export const subscribeToUserSettings = (
  userId: string,
  callback: (settings: UserSettings) => void
): (() => void) => {
  console.log('🔔 [UserSettings] Iniciando suscripción');
  
  // Cancelar suscripción anterior si existe
  if (unsubscribers.has(userId)) {
    unsubscribers.get(userId)!();
  }
  
  const settingsRef = doc(db, USER_SETTINGS_COLLECTION, userId);
  
  const unsubscribe = onSnapshot(
    settingsRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const settings = {
          ...snapshot.data(),
          userId,
          updatedAt: snapshot.data().updatedAt?.toDate() || new Date(),
        } as UserSettings;
        
        // Actualizar cache
        settingsCache.set(userId, settings);
        callback(settings);
        console.log('✅ [UserSettings] Actualizado desde Firestore');
      } else {
        // Crear defaults si no existen
        const defaults = await createDefaultUserSettings(userId);
        callback(defaults);
      }
    },
    (error) => {
      console.error('❌ [UserSettings] Error en suscripción:', error);
    }
  );
  
  unsubscribers.set(userId, unsubscribe);
  
  return () => {
    console.log('🔕 [UserSettings] Desuscribiendo');
    unsubscribe();
    unsubscribers.delete(userId);
  };
};

/**
 * Limpiar cache de configuraciones
 */
export const clearUserSettingsCache = (userId?: string) => {
  if (userId) {
    settingsCache.delete(userId);
    if (unsubscribers.has(userId)) {
      unsubscribers.get(userId)!();
      unsubscribers.delete(userId);
    }
  } else {
    settingsCache.clear();
    unsubscribers.forEach(unsub => unsub());
    unsubscribers.clear();
  }
  console.log('🧹 [UserSettings] Cache limpiado');
};



