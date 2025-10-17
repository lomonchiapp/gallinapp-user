/**
 * Servicio para gestionar el registro de mortalidad en lotes
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
import { RegistroMortalidad, TipoAve } from '../types';
import { getCurrentUserId } from './auth.service';

// Colecciones
const MORTALIDAD_COLLECTION = 'mortalidad';
const LOTES_PONEDORAS_COLLECTION = 'lotesPonedoras';
const LOTES_LEVANTES_COLLECTION = 'lotesLevantes';
const LOTES_ENGORDE_COLLECTION = 'lotesEngorde';

/**
 * Registrar mortalidad en un lote
 * Actualiza automáticamente cantidadActual restando las muertes
 */
export const registrarMortalidad = async (
  loteId: string, 
  tipoLote: TipoAve, 
  cantidad: number, 
  causa?: string
): Promise<RegistroMortalidad> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    // Validar que la cantidad sea un número positivo
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número mayor a cero');
    }
    
    // Crear registro de mortalidad
    const registroData = {
      loteId,
      tipoLote,
      fecha: new Date(),
      cantidad,
      causa: causa || '',
      createdBy: userId,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, MORTALIDAD_COLLECTION), registroData);
    
    // Actualizar cantidad actual en el lote correspondiente
    let loteCollection = '';
    switch (tipoLote) {
      case TipoAve.PONEDORA:
        loteCollection = LOTES_PONEDORAS_COLLECTION;
        break;
      case TipoAve.POLLO_LEVANTE:
        loteCollection = LOTES_LEVANTES_COLLECTION;
        break;
      case TipoAve.POLLO_ENGORDE:
        loteCollection = LOTES_ENGORDE_COLLECTION;
        break;
      default:
        throw new Error('Tipo de lote no válido');
    }
    
    // Obtener referencia al documento del lote
    const loteRef = doc(db, loteCollection, loteId);
    
    // Actualizar cantidadActual restando las muertes
    const loteDoc = await getDoc(loteRef);
    if (!loteDoc.exists()) {
      throw new Error('El lote no existe');
    }
    
    const loteData = loteDoc.data();
    const cantidadActual = loteData?.cantidadActual || 0;
    const nuevaCantidadActual = Math.max(0, cantidadActual - cantidad); // No permitir valores negativos
    
    console.log(`📉 Actualizando lote ${loteId}: ${cantidadActual} - ${cantidad} = ${nuevaCantidadActual}`);
    
    await updateDoc(loteRef, {
      cantidadActual: nuevaCantidadActual,
      updatedAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      loteId,
      tipoLote,
      fecha: new Date(),
      cantidad,
      causa: causa || '',
      createdBy: userId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error al registrar mortalidad:', error);
    throw error;
  }
};

/**
 * Obtener registros de mortalidad de un lote o todos los registros
 */
export const obtenerRegistrosMortalidad = async (
  loteId?: string, 
  tipoLote?: TipoAve
): Promise<RegistroMortalidad[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('Usuario no autenticado, retornando array vacío');
      return [];
    }
    
    let constraints: any[] = [where('createdBy', '==', userId)];
    
    // Agregar filtros si se proporcionan
    if (loteId) {
      constraints.push(where('loteId', '==', loteId));
    }
    
    if (tipoLote) {
      constraints.push(where('tipoLote', '==', tipoLote));
    }
    
    const q = query(
      collection(db, MORTALIDAD_COLLECTION),
      ...constraints,
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        loteId: data.loteId,
        tipoLote: data.tipoLote,
        fecha: data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha),
        cantidad: data.cantidad,
        causa: data.causa || '',
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch (error) {
    console.error('Error al obtener registros de mortalidad:', error);
    return []; // Retornar array vacío en lugar de lanzar error
  }
};

/**
 * Obtener total de mortalidad de un lote
 */
export const obtenerTotalMortalidad = async (
  loteId: string, 
  tipoLote: TipoAve
): Promise<number> => {
  try {
    const registros = await obtenerRegistrosMortalidad(loteId, tipoLote);
    
    return registros.reduce((total, registro) => total + registro.cantidad, 0);
  } catch (error) {
    console.error('Error al obtener total de mortalidad:', error);
    throw error;
  }
};

/**
 * Suscribirse a cambios en registros de mortalidad en tiempo real
 */
export const suscribirseAMortalidad = (
  tipoLote: TipoAve,
  callback: (registros: RegistroMortalidad[]) => void
): (() => void) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('Usuario no autenticado, no se puede suscribir');
      return () => {};
    }
    
    const { onSnapshot } = require('firebase/firestore');
    
    const q = query(
      collection(db, MORTALIDAD_COLLECTION),
      where('createdBy', '==', userId),
      where('tipoLote', '==', tipoLote),
      orderBy('fecha', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot: any) => {
      const registros = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          loteId: data.loteId,
          tipoLote: data.tipoLote,
          fecha: data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha),
          cantidad: data.cantidad,
          causa: data.causa || '',
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as RegistroMortalidad;
      });
      
      console.log(`🔔 Actualización de mortalidad ${tipoLote}: ${registros.length} registros`);
      callback(registros);
    }, (error: any) => {
      console.error('Error en suscripción de mortalidad:', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error al suscribirse a mortalidad:', error);
    return () => {};
  }
};



