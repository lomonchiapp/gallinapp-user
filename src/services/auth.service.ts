/**
 * Servicio de autenticación para Asoaves
 */

import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../components/config/firebase';
import { User, UserRole } from '../types';

/**
 * Registrar un nuevo usuario
 */
export const registerUser = async (
  email: string, 
  password: string, 
  displayName: string,
  role: UserRole = UserRole.OPERADOR
): Promise<User> => {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Actualizar el perfil con el displayName
    await updateProfile(firebaseUser, { displayName });
    
    // Crear documento de usuario en Firestore
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      role,
      lastLogin: new Date()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      role,
      lastLogin: serverTimestamp()
    });
    
    return userData;
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    throw error;
  }
};

/**
 * Iniciar sesión con email y contraseña
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Iniciando proceso de login para:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('✅ Usuario autenticado en Firebase:', firebaseUser.uid);
    
    // Actualizar última fecha de inicio de sesión
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    console.log('📝 Actualizado lastLogin en Firestore');
    
    // Obtener datos completos del usuario
    const userDoc = await getDoc(userRef);
    console.log('📄 Documento de usuario obtenido:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 Datos del usuario desde Firestore:', userData);
      
      const user: User = {
        uid: firebaseUser.uid,
        email: userData.email || firebaseUser.email!,
        displayName: userData.displayName || firebaseUser.displayName!,
        role: userData.role as UserRole,
        photoURL: firebaseUser.photoURL,
        lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
      };
      
      console.log('🎉 Usuario procesado correctamente:', user);
      return user;
    } else {
      console.error('❌ Usuario no encontrado en Firestore');
      throw new Error('Usuario no encontrado en la base de datos');
    }
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    throw error;
  }
};

/**
 * Cerrar sesión
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

/**
 * Enviar correo para restablecer contraseña
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error al enviar correo de restablecimiento:', error);
    throw error;
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }
  
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: firebaseUser.uid,
        email: userData.email || firebaseUser.email!,
        displayName: userData.displayName || firebaseUser.displayName!,
        role: userData.role as UserRole,
        photoURL: firebaseUser.photoURL,
        lastLogin: userData.lastLogin?.toDate ? userData.lastLogin.toDate() : new Date()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return null;
  }
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Obtener el ID del usuario actual
 */
export const getCurrentUserId = (): string | null => {
  const userId = auth.currentUser?.uid || null;
  console.log('🔑 getCurrentUserId called:', {
    hasCurrentUser: !!auth.currentUser,
    userId: userId,
    userEmail: auth.currentUser?.email
  });
  return userId;
};

/**
 * Convertir FirebaseUser a User
 */
export const firebaseUserToUser = (firebaseUser: FirebaseUser, userData?: Partial<User>): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email!,
    displayName: firebaseUser.displayName || 'Usuario',
    role: userData?.role || UserRole.OPERADOR,
    photoURL: firebaseUser.photoURL,
    lastLogin: new Date()
  };
};

