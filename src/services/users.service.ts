/**
 * Servicio para gestión de usuarios (solo para admins)
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../components/config/firebase';
import { User, UserRole } from '../types';

/**
 * Obtener todos los usuarios (solo para admins)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('displayName'));
    const querySnapshot = await getDocs(q);
    
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName,
        role: data.role as UserRole,
        photoURL: data.photoURL || null,
        lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : undefined
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Crear un nuevo usuario (solo para admins)
 */
export const createUserByAdmin = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<User> => {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
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
      createdAt: serverTimestamp(),
      lastLogin: null
    });
    
    return userData;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

/**
 * Actualizar usuario (solo para admins)
 */
export const updateUserByAdmin = async (
  uid: string,
  updates: {
    displayName?: string;
    role?: UserRole;
    email?: string;
  }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

/**
 * Eliminar usuario (solo para admins)
 */
export const deleteUserByAdmin = async (uid: string): Promise<void> => {
  try {
    // Eliminar documento de Firestore
    await deleteDoc(doc(db, 'users', uid));
    
    // Nota: Para eliminar el usuario de Firebase Auth, necesitarías
    // usar Firebase Admin SDK en el backend, no se puede hacer desde el cliente
    console.log('Usuario eliminado de Firestore. Nota: El usuario aún existe en Firebase Auth');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

/**
 * Verificar si el usuario actual es admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    const userDoc = await getDocs(query(collection(db, 'users'), orderBy('role')));
    const userData = userDoc.docs.find(doc => doc.id === currentUser.uid)?.data();
    
    return userData?.role === UserRole.ADMIN;
  } catch (error) {
    console.error('Error al verificar rol de admin:', error);
    return false;
  }
};

/**
 * Generar contraseña temporal
 */
export const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};










