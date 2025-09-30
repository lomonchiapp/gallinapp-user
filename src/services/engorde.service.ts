/**
 * Servicios básicos para el módulo de pollos de engorde
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { LoteEngorde } from '../types';
import { getCurrentUserId } from './auth.service';

// Colecciones
const LOTES_COLLECTION = 'lotesEngorde';

/**
 * Crear un nuevo lote de engorde
 */
export const crearLoteEngorde = async (lote: Omit<LoteEngorde, 'id'>): Promise<LoteEngorde> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const loteData = {
      ...lote,
      userId,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, LOTES_COLLECTION), loteData);
    
    return {
      id: docRef.id,
      ...lote,
      galponId: lote.galponId,
      userId,
      activo: true
    };
  } catch (error) {
    console.error('Error al crear lote de engorde:', error);
    throw error;
  }
};

/**
 * Obtener todos los lotes de engorde
 */
export const obtenerLotesEngorde = async (): Promise<LoteEngorde[]> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            console.log('Usuario no autenticado, retornando array vacío');
            return [];
        }

        const q = query(
            collection(db, LOTES_COLLECTION),
            where('userId', '==', userId),
            orderBy('fechaInicio', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('No se encontraron lotes de engorde');
            return [];
        }
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio)
            } as LoteEngorde;
        });
    } catch (error) {
        console.error('Error al obtener lotes de engorde:', error);
        return [];
    }
};

/**
 * Actualizar un lote de engorde
 */
export const actualizarLoteEngorde = async (id: string, lote: Partial<LoteEngorde>): Promise<void> => {
  try {
    const loteRef = doc(db, LOTES_COLLECTION, id);
    await updateDoc(loteRef, {
      ...lote,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar lote de engorde:', error);
    throw error;
  }
};

/**
 * Finalizar un lote de engorde
 */
export const finalizarLoteEngorde = async (id: string): Promise<void> => {
  try {
    const loteRef = doc(db, LOTES_COLLECTION, id);
    await updateDoc(loteRef, {
            activo: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al finalizar lote de engorde:', error);
    throw error;
  }
};

/**
 * Obtener un lote por ID
 */
export const obtenerLoteEngorde = async (id: string): Promise<LoteEngorde | null> => {
  try {
    const loteRef = doc(db, LOTES_COLLECTION, id);
    const loteSnap = await getDoc(loteRef);
    
    if (!loteSnap.exists()) {
      return null;
    }
    
    const loteData = loteSnap.data();
    return {
      id: loteSnap.id,
      ...loteData,
            fechaInicio: loteData.fechaInicio?.toDate ? loteData.fechaInicio.toDate() : new Date(loteData.fechaInicio)
    } as LoteEngorde;
  } catch (error) {
    console.error('Error al obtener lote de engorde:', error);
        return null;
    }
};

/**
 * Suscribirse a cambios en los lotes de engorde en tiempo real
 */
export const suscribirseALotesEngorde = (callback: (lotes: LoteEngorde[]) => void): (() => void) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('Usuario no autenticado, no se puede suscribir a lotes de engorde');
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, LOTES_COLLECTION),
      where('userId', '==', userId),
      orderBy('fechaInicio', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        console.log('No se encontraron lotes de engorde');
        callback([]);
        return;
      }

      const lotes = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
          fechaNacimiento: data.fechaNacimiento?.toDate ? data.fechaNacimiento.toDate() : new Date(data.fechaNacimiento)
        } as LoteEngorde;
      });

      console.log('Lotes de engorde actualizados:', lotes.length);
      callback(lotes);
    }, (error) => {
      console.error('Error en suscripción a lotes de engorde:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error al suscribirse a lotes de engorde:', error);
    callback([]);
    return () => {};
  }
};