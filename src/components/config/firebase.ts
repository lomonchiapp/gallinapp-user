/**
 * Configuración de Firebase para Gallinapp
 * Soporte multi-tenant con autenticación React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { FIREBASE_CONFIG } from '../../config/env';

// Usar configuración desde variables de entorno
// Fallback a valores hardcodeados si no están disponibles
const firebaseConfig = {
    apiKey: FIREBASE_CONFIG.apiKey || "AIzaSyBYQxBE85YnWANj7lxuyCNVM5Fu0ZqWWt8",
    authDomain: FIREBASE_CONFIG.authDomain || "gallinapp-ac9d8.firebaseapp.com",
    projectId: FIREBASE_CONFIG.projectId || "gallinapp-ac9d8",
    storageBucket: FIREBASE_CONFIG.storageBucket || "gallinapp-ac9d8.firebasestorage.app",
    messagingSenderId: FIREBASE_CONFIG.messagingSenderId || "216089169768",
    appId: FIREBASE_CONFIG.appId || "1:216089169768:web:35841d73e72caceb5ad0dd"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia AsyncStorage para React Native
// Esto mantiene las sesiones automáticamente entre cierres de app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Storage
export const storage = getStorage(app);

// Exportar todo como un objeto para facilitar importaciones
export const firebase = {
  app,
  auth,
  db,
  storage
};

export default firebase;
