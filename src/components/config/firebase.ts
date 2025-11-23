/**
 * Configuración de Firebase para Asoaves
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

// Configuración de Firebase proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyBLEeXnPTB2k88s11qB8PK4UsmUoiL0L2Y",
  authDomain: "asoaves-4e9a4.firebaseapp.com",
  projectId: "asoaves-4e9a4",
  storageBucket: "asoaves-4e9a4.firebasestorage.app",
  messagingSenderId: "304670090768",
  appId: "1:304670090768:web:75ade8f833fae9a8894c95"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia específica por plataforma
// React Native persistence solo funciona en iOS/Android, no en web
let auth;
if (Platform.OS === 'web') {
  // Para web, usar el auth por defecto (usa localStorage automáticamente)
  auth = getAuth(app);
} else {
  // Para React Native (iOS/Android), usar AsyncStorage
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };

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
