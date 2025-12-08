/**
 * Servicio de autenticación centralizado
 */

import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile as updateFirebaseProfile,
    UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../components/config/firebase';
import { UserRole } from '../types/enums';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  lastLogin: Date;
  createdAt: Date;
}

/**
 * Obtiene el usuario actual completo desde Firebase Auth y Firestore
 */
export const getCurrentUser = async (): Promise<AppUser | null> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    // Obtener datos adicionales del usuario desde Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      console.warn('Usuario de Firebase Auth existe pero no en Firestore');
      return null;
    }

    const userData = userDoc.data();
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: userData.displayName || '',
      role: userData.role || UserRole.OPERADOR,
      lastLogin: userData.lastLogin?.toDate() || new Date(),
      createdAt: userData.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

/**
 * Obtiene el ID del usuario actual
 */
export const getCurrentUserId = (): string | null => {
  try {
    const user = auth.currentUser;
    return user?.uid || null;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

/**
 * Obtiene el email del usuario actual
 */
export const getCurrentUserEmail = (): string | null => {
  try {
    const user = auth.currentUser;
    return user?.email || null;
  } catch (error) {
    console.error('Error al obtener email del usuario:', error);
    return null;
  }
};

/**
 * Verifica si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return getCurrentUserId() !== null;
};

/**
 * Requiere autenticación - lanza error si no está autenticado
 */
export const requireAuth = (): string => {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
};

/**
 * Inicia sesión con email y contraseña
 */
export const loginUser = async (email: string, password: string): Promise<AppUser> => {
  try {
    console.log('🔐 Iniciando sesión para:', email);
    
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Actualizar último login en Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      lastLogin: new Date()
    }, { merge: true });
    
    // Obtener datos completos del usuario
    const appUser = await getCurrentUser();
    if (!appUser) {
      throw new Error('Error al obtener datos del usuario');
    }
    
    console.log('✅ Sesión iniciada exitosamente para:', email);
    return appUser;
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

/**
 * Registra un nuevo usuario
 */
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string, 
  role: UserRole = UserRole.OPERADOR
): Promise<AppUser> => {
  try {
    console.log('📝 Registrando nuevo usuario:', email);
    
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Crear documento del usuario en Firestore
    const userData = {
      email: firebaseUser.email,
      displayName,
      role,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    
    console.log('✅ Usuario registrado exitosamente:', email);
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName,
      role,
      lastLogin: new Date(),
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('❌ Error al registrar usuario:', error);
    throw new Error(error.message || 'Error al registrar usuario');
  }
};

/**
 * Cierra la sesión del usuario
 */
export const logoutUser = async (): Promise<void> => {
  try {
    console.log('🚪 Cerrando sesión...');
    await signOut(auth);
    console.log('✅ Sesión cerrada exitosamente');
  } catch (error: any) {
    console.error('❌ Error al cerrar sesión:', error);
    throw new Error(error.message || 'Error al cerrar sesión');
  }
};

/**
 * Envía email para restablecer contraseña
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log('📧 Enviando email de restablecimiento a:', email);
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Email de restablecimiento enviado');
  } catch (error: any) {
    console.error('❌ Error al enviar email de restablecimiento:', error);
    throw new Error(error.message || 'Error al enviar email de restablecimiento');
  }
};

/**
 * Actualiza el perfil del usuario actual
 */
export const updateProfile = async (displayName: string): Promise<AppUser> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Usuario no autenticado');
    }

    console.log('📝 Actualizando perfil del usuario:', firebaseUser.uid);
    
    // Actualizar displayName en Firebase Auth
    await updateFirebaseProfile(firebaseUser, {
      displayName: displayName
    });
    
    // Actualizar displayName en Firestore
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      displayName: displayName,
      updatedAt: serverTimestamp()
    });
    
    // Obtener datos actualizados del usuario
    const appUser = await getCurrentUser();
    if (!appUser) {
      throw new Error('Error al obtener datos actualizados del usuario');
    }
    
    console.log('✅ Perfil actualizado exitosamente');
    return appUser;
  } catch (error: any) {
    console.error('❌ Error al actualizar perfil:', error);
    throw new Error(error.message || 'Error al actualizar perfil');
  }
};