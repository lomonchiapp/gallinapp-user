/**
 * Configuración de Firebase para Gallinapp
 * Soporte multi-tenant con autenticación React Native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase para Gallinapp
const firebaseConfig = {
    apiKey: "AIzaSyBYQxBE85YnWANj7lxuyCNVM5Fu0ZqWWt8",
    authDomain: "gallinapp-ac9d8.firebaseapp.com",
    projectId: "gallinapp-ac9d8",
    storageBucket: "gallinapp-ac9d8.firebasestorage.app",
    messagingSenderId: "216089169768",
    appId: "1:216089169768:web:35841d73e72caceb5ad0dd"
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
