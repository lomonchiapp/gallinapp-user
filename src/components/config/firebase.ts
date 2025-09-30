/**
 * Configuración de Firebase para Asoaves
 */

import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Inicializar Auth
export const auth = initializeAuth(app);

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
