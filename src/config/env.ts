/**
 * Configuración de variables de entorno
 * Centraliza el acceso a las variables de entorno de Expo
 */

import Constants from 'expo-constants';

/**
 * Obtiene una variable de entorno desde expo-constants
 * @param key - Nombre de la clave en extra (de app.config.js)
 * @param envKey - Nombre alternativo de la variable de entorno
 * @param defaultValue - Valor por defecto si no existe
 */
const getEnvVar = (key: string, envKey?: string, defaultValue: string = ''): string => {
  const extra = Constants.expoConfig?.extra || {};
  
  // 1. Primero intenta desde extra con el nombre procesado (app.config.js)
  if (extra[key] && extra[key] !== '') return extra[key];
  
  // 2. Intenta con el nombre EXPO_PUBLIC_ (si EAS lo inyecta directamente)
  if (envKey && extra[envKey] && extra[envKey] !== '') return extra[envKey];
  
  // 3. Intenta sin el prefijo EXPO_PUBLIC_ (por si EAS lo guarda así)
  if (envKey) {
    const keyWithoutPrefix = envKey.replace('EXPO_PUBLIC_', '');
    if (extra[keyWithoutPrefix] && extra[keyWithoutPrefix] !== '') return extra[keyWithoutPrefix];
  }
  
  return defaultValue;
};

/**
 * Variables de entorno disponibles en la aplicación
 */
export const ENV = {
  // RevenueCat - Busca en ambos lugares para compatibilidad
  // TEMPORAL: Fallback hardcodeado para testing rápido (REMOVER EN PRODUCCIÓN)
  REVENUECAT_API_KEY: getEnvVar('revenueCatApiKey', 'EXPO_PUBLIC_REVENUECAT_API_KEY') || 'test_ymFMDrtBLXkdfqUwhdHMZKBPjfB',
  REVENUECAT_APP_ID: getEnvVar('revenueCatAppId', 'EXPO_PUBLIC_REVENUECAT_APP_ID') || 'ofrng0c5db0f4a8',
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: getEnvVar('stripePublishableKey'),
  
  // Firebase
  FIREBASE_API_KEY: getEnvVar('firebaseApiKey'),
  FIREBASE_AUTH_DOMAIN: getEnvVar('firebaseAuthDomain'),
  FIREBASE_PROJECT_ID: getEnvVar('firebaseProjectId'),
  FIREBASE_STORAGE_BUCKET: getEnvVar('firebaseStorageBucket'),
  FIREBASE_MESSAGING_SENDER_ID: getEnvVar('firebaseMessagingSenderId'),
  FIREBASE_APP_ID: getEnvVar('firebaseAppId'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: getEnvVar('googleClientId'),
  GOOGLE_IOS_CLIENT_ID: getEnvVar('googleIosClientId'),
  GOOGLE_ANDROID_CLIENT_ID: getEnvVar('googleAndroidClientId'),
  GOOGLE_WEB_CLIENT_ID: getEnvVar('googleWebClientId'),
  
  // Gallinapp
  API_URL: getEnvVar('gallinapp')?.apiUrl || 'https://api.gallinapp.com',
  SUPPORT_EMAIL: getEnvVar('gallinapp')?.supportEmail || 'soporte@gallinapp.com',
  WEBSITE_URL: getEnvVar('gallinapp')?.websiteUrl || 'https://gallinapp.com',
  
  // EAS
  EAS_PROJECT_ID: getEnvVar('eas')?.projectId || '',
};

/**
 * Verifica si estamos en modo desarrollo
 */
export const isDevelopment = __DEV__;

/**
 * Verifica si estamos en Expo Go
 */
export const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Configuración de Firebase
 */
export const FIREBASE_CONFIG = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
};

/**
 * Log de configuración en desarrollo
 */
if (isDevelopment) {
  const allExtraKeys = Object.keys(Constants.expoConfig?.extra || {});
  const revenueCatKeys = allExtraKeys.filter(k => 
    k.toLowerCase().includes('revenuecat') || 
    k.toLowerCase().includes('revenue')
  );
  
  console.log('🔧 ENV Config:', {
    isExpoGo,
    hasRevenueCatKey: !!ENV.REVENUECAT_API_KEY,
    revenueCatKeyValue: ENV.REVENUECAT_API_KEY ? `${ENV.REVENUECAT_API_KEY.substring(0, 10)}...` : 'NO DEFINIDA',
    revenueCatAppId: ENV.REVENUECAT_APP_ID || 'No configurado',
    hasStripeKey: !!ENV.STRIPE_PUBLISHABLE_KEY,
    hasFirebaseConfig: !!ENV.FIREBASE_API_KEY,
    allExtraKeys: allExtraKeys,
    revenueCatRelatedKeys: revenueCatKeys,
    revenueCatApiKeyFromExtra: Constants.expoConfig?.extra?.revenueCatApiKey ? '✅' : '❌',
    EXPO_PUBLIC_REVENUECAT_API_KEY_FromExtra: Constants.expoConfig?.extra?.EXPO_PUBLIC_REVENUECAT_API_KEY ? '✅' : '❌',
  });
}

