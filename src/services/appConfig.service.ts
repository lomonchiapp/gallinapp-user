/**
 * Servicio para manejar la configuración de la aplicación
 * Incluye cache y suscripción en tiempo real para performance óptima
 */

import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { AppConfig } from '../types/appConfig';
import { getCurrentUserId } from './auth.service';

const CONFIG_COLLECTION = 'appConfig';
const CONFIG_DOC_ID = 'main';

/**
 * Configuración por defecto de la aplicación
 */
const DEFAULT_CONFIG: Omit<AppConfig, 'id' | 'updatedAt' | 'updatedBy'> = {
  precioHuevo: 8.0, // RD$ por huevo
  precioLibraEngorde: 65.0, // RD$ por libra
  precioUnidadIsraeli: 150.0, // RD$ por pollo israelí
  diasCrecimientoIsraeli: 45, // días
  diasCrecimientoEngorde: 42, // días
  pesoObjetivoEngorde: 4.5, // libras
  tasaMortalidadAceptable: 5.0, // porcentaje
  cantidadHuevosPorCaja: 30, // Cantidad estándar de huevos por caja
};

/**
 * Cache en memoria de la configuración
 */
let cachedConfig: AppConfig | null = null;
let unsubscribeSnapshot: (() => void) | null = null;

/**
 * Inicializa la suscripción en tiempo real a la configuración
 * Debe llamarse al inicio de la app
 */
export const inicializarConfiguracion = (): (() => void) => {
  console.log('⚙️ [AppConfig] Inicializando suscripción en tiempo real...');
  
  const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
  
  unsubscribeSnapshot = onSnapshot(
    configRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        cachedConfig = {
          id: snapshot.id,
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as AppConfig;
        console.log('✅ [AppConfig] Configuración actualizada en cache:', cachedConfig);
      } else {
        // Si no existe, crear configuración por defecto
        console.log('⚠️ [AppConfig] No existe configuración, creando por defecto...');
        cachedConfig = await crearConfiguracionPorDefecto();
      }
    },
    (error) => {
      console.error('❌ [AppConfig] Error en suscripción:', error);
    }
  );
  
  return () => {
    console.log('🔕 [AppConfig] Desuscribiendo de configuración');
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    cachedConfig = null;
  };
};

/**
 * Obtener la configuración actual de la aplicación
 * Usa cache si está disponible, sino consulta Firebase
 */
export const obtenerConfiguracion = async (): Promise<AppConfig> => {
  try {
    // Si hay cache, devolverlo inmediatamente
    if (cachedConfig) {
      console.log('🚀 [AppConfig] Usando configuración desde cache');
      return cachedConfig;
    }
    
    // Si no hay cache, consultar Firebase
    console.log('🔄 [AppConfig] Cache vacío, consultando Firebase...');
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      const config = {
        id: configDoc.id,
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as AppConfig;
      
      // Guardar en cache
      cachedConfig = config;
      console.log('✅ [AppConfig] Configuración obtenida y guardada en cache');
      return config;
    } else {
      // Si no existe configuración, crear una por defecto
      console.log('⚠️ [AppConfig] No existe configuración, creando por defecto...');
      return await crearConfiguracionPorDefecto();
    }
  } catch (error) {
    console.error('❌ [AppConfig] Error al obtener configuración:', error);
    
    // Si hay error pero tenemos cache, devolver el cache
    if (cachedConfig) {
      console.warn('⚠️ [AppConfig] Usando cache como fallback ante error');
      return cachedConfig;
    }
    
    throw error;
  }
};

/**
 * Obtener configuración síncrona desde cache (para uso en transacciones)
 * Retorna null si no hay cache disponible
 */
export const obtenerConfiguracionSync = (): AppConfig | null => {
  if (cachedConfig) {
    console.log('🚀 [AppConfig] Retornando configuración síncrona desde cache');
    return cachedConfig;
  }
  console.warn('⚠️ [AppConfig] No hay cache disponible para obtención síncrona');
  return null;
};

/**
 * Crear configuración por defecto
 */
export const crearConfiguracionPorDefecto = async (): Promise<AppConfig> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const configData = {
      ...DEFAULT_CONFIG,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };
    
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(configRef, configData);
    
    const newConfig = {
      id: CONFIG_DOC_ID,
      ...DEFAULT_CONFIG,
      updatedAt: new Date(),
      updatedBy: userId,
    };
    
    // Guardar en cache
    cachedConfig = newConfig;
    console.log('✅ [AppConfig] Configuración por defecto creada y guardada en cache');
    
    return newConfig;
  } catch (error) {
    console.error('❌ [AppConfig] Error al crear configuración por defecto:', error);
    throw error;
  }
};

/**
 * Actualizar configuración de la aplicación
 */
export const actualizarConfiguracion = async (
  config: Partial<Omit<AppConfig, 'id' | 'updatedAt' | 'updatedBy'>>
): Promise<AppConfig> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const updateData = {
      ...config,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };
    
    await updateDoc(configRef, updateData);
    
    // Obtener la configuración actualizada
    return await obtenerConfiguracion();
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    throw error;
  }
};

/**
 * Validar configuración
 */
export const validarConfiguracion = (config: Partial<AppConfig>): string[] => {
  const errores: string[] = [];
  
  if (config.precioHuevo !== undefined && config.precioHuevo <= 0) {
    errores.push('El precio del huevo debe ser mayor a 0');
  }
  
  if (config.precioLibraEngorde !== undefined && config.precioLibraEngorde <= 0) {
    errores.push('El precio por libra de engorde debe ser mayor a 0');
  }
  
  if (config.precioUnidadIsraeli !== undefined && config.precioUnidadIsraeli <= 0) {
    errores.push('El precio unitario israelí debe ser mayor a 0');
  }
  
  if (config.diasCrecimientoIsraeli !== undefined && config.diasCrecimientoIsraeli <= 0) {
    errores.push('Los días de crecimiento israelí deben ser mayor a 0');
  }
  
  if (config.diasCrecimientoEngorde !== undefined && config.diasCrecimientoEngorde <= 0) {
    errores.push('Los días de crecimiento de engorde deben ser mayor a 0');
  }
  
  if (config.pesoObjetivoEngorde !== undefined && config.pesoObjetivoEngorde <= 0) {
    errores.push('El peso objetivo de engorde debe ser mayor a 0');
  }
  
  if (config.tasaMortalidadAceptable !== undefined && 
      (config.tasaMortalidadAceptable < 0 || config.tasaMortalidadAceptable > 100)) {
    errores.push('La tasa de mortalidad debe estar entre 0 y 100%');
  }
  
  return errores;
};


