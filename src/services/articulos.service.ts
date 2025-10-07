/**
 * Servicio para la gestión de artículos
 */

import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { MeasurementUnit } from '../types/enums';
import { IArticulo } from '../types/interfaces';

// Colecciones
const ARTICULOS_COLLECTION = 'articulos';

/**
 * Crear un nuevo artículo
 */
export const crearArticulo = async (articulo: Omit<IArticulo, 'id'>): Promise<IArticulo> => {
  try {
    const articuloData = {
      ...articulo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, ARTICULOS_COLLECTION), articuloData);
    
    return {
      id: docRef.id,
      ...articulo
    };
  } catch (error) {
    console.error('Error al crear artículo:', error);
    throw error;
  }
};

/**
 * Actualizar un artículo existente
 */
export const actualizarArticulo = async (id: string, articulo: Partial<IArticulo>): Promise<void> => {
  try {
    const articuloRef = doc(db, ARTICULOS_COLLECTION, id);
    
    await updateDoc(articuloRef, {
      ...articulo,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar artículo:', error);
    throw error;
  }
};

/**
 * Eliminar un artículo
 */
export const eliminarArticulo = async (id: string): Promise<void> => {
  try {
    const articuloRef = doc(db, ARTICULOS_COLLECTION, id);
    
    // En lugar de eliminar físicamente, marcamos como inactivo
    await updateDoc(articuloRef, {
      activo: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    throw error;
  }
};

/**
 * Obtener un artículo por ID
 */
export const obtenerArticulo = async (id: string): Promise<IArticulo | null> => {
  try {
    const articuloRef = doc(db, ARTICULOS_COLLECTION, id);
    const articuloSnap = await getDoc(articuloRef);
    
    if (!articuloSnap.exists()) {
      return null;
    }
    
    const articuloData = articuloSnap.data();
    
    return {
      id: articuloSnap.id,
      ...articuloData
    } as IArticulo;
  } catch (error) {
    console.error('Error al obtener artículo:', error);
    throw error;
  }
};

/**
 * Obtener todos los artículos
 */
export const obtenerArticulos = async (soloActivos: boolean = true): Promise<IArticulo[]> => {
  try {
    let q = collection(db, ARTICULOS_COLLECTION);
    
    if (soloActivos) {
      q = query(q, where('activo', '==', true));
    }
    
    q = query(q, orderBy('nombre', 'asc'));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as IArticulo;
    });
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    throw error;
  }
};

/**
 * Obtener artículos por unidad de medida
 */
export const obtenerArticulosPorUnidad = async (
  unidad: MeasurementUnit, 
  soloActivos: boolean = true
): Promise<IArticulo[]> => {
  try {
    let q = collection(db, ARTICULOS_COLLECTION);
    
    if (soloActivos) {
      q = query(
        q, 
        where('unidadMedida', '==', unidad),
        where('activo', '==', true)
      );
    } else {
      q = query(q, where('unidadMedida', '==', unidad));
    }
    
    q = query(q, orderBy('nombre', 'asc'));
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as IArticulo;
    });
  } catch (error) {
    console.error('Error al obtener artículos por unidad:', error);
    throw error;
  }
};































