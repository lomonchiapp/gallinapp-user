/**
 * Servicio para gestionar registros de peso de pollos
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
    where
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { CrearPesoRegistro, PesoRegistro, TipoAve } from '../types';
import { calculateAgeInDays } from '../utils/dateUtils';
import { getCurrentUserId } from './auth.service';

// Colección
const PESO_COLLECTION = 'registrosPeso';

/**
 * Obtener información del lote para calcular edad
 */
const obtenerFechaNacimientoLote = async (loteId: string, tipoLote: TipoAve): Promise<Date | null> => {
  let collection_name = '';
  
  switch (tipoLote) {
    case TipoAve.POLLO_LEVANTE:
      collection_name = 'lotesLevantes';
      break;
    case TipoAve.POLLO_ENGORDE:
      collection_name = 'lotesEngorde';
      break;
    case TipoAve.PONEDORA:
      // Las ponedoras no tienen fechaNacimiento, retornar null
      return null;
    default:
      throw new Error('Tipo de lote no válido');
  }
  
  const loteRef = doc(db, collection_name, loteId);
  const loteSnap = await getDoc(loteRef);
  
  if (!loteSnap.exists()) {
    throw new Error('Lote no encontrado');
  }
  
  const loteData = loteSnap.data();
  const fechaNacimiento = loteData.fechaNacimiento?.toDate ? 
    loteData.fechaNacimiento.toDate() : 
    new Date(loteData.fechaNacimiento);
    
  return fechaNacimiento;
};

/**
 * Registrar peso de pollos
 */
export const registrarPeso = async (
  registroData: CrearPesoRegistro
): Promise<PesoRegistro> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    // Validaciones
    if (!registroData.loteId) throw new Error('ID de lote requerido');
    if (!registroData.pesosIndividuales || registroData.pesosIndividuales.length === 0) {
      throw new Error('Debe proporcionar al menos un peso');
    }
    if (registroData.cantidadPollosPesados !== registroData.pesosIndividuales.length) {
      throw new Error('La cantidad de pollos pesados no coincide con los pesos proporcionados');
    }
    
    // Validar que todos los pesos sean números positivos
    const pesosValidos = registroData.pesosIndividuales.every(peso => 
      typeof peso === 'number' && peso > 0
    );
    if (!pesosValidos) {
      throw new Error('Todos los pesos deben ser números positivos');
    }
    
    // Obtener fecha de nacimiento del lote para calcular edad (solo para pollos, no ponedoras)
    const fechaNacimiento = await obtenerFechaNacimientoLote(registroData.loteId, registroData.tipoLote);
    let edadEnDias = 0;
    let edadEnSemanas = 0;
    
    if (fechaNacimiento) {
      edadEnDias = calculateAgeInDays(fechaNacimiento);
      edadEnSemanas = Math.floor(edadEnDias / 7);
    }
    
    // Calcular estadísticas de peso
    // Si ya se proporcionó pesoPromedio y pesoTotal, usarlos (ya están en kg)
    // De lo contrario, calcularlos desde pesosIndividuales (que también están en kg)
    const pesoTotal = registroData.pesoTotal !== undefined 
      ? registroData.pesoTotal 
      : registroData.pesosIndividuales.reduce((sum, peso) => sum + peso, 0);
    
    const pesoPromedio = registroData.pesoPromedio !== undefined
      ? registroData.pesoPromedio
      : pesoTotal / registroData.pesosIndividuales.length;
    
    console.log(`⚖️ [PesoService] Guardando peso - Total: ${pesoTotal.toFixed(2)} kg, Promedio: ${pesoPromedio.toFixed(2)} kg`);
    
    // Crear documento con edad calculada
    const documentoData = {
      ...registroData,
      edadEnDias,
      edadEnSemanas,
      pesoTotal,
      pesoPromedio,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, PESO_COLLECTION), documentoData);
    
    return {
      id: docRef.id,
      ...registroData,
      edadEnDias,
      edadEnSemanas,
      pesoTotal,
      pesoPromedio,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar peso:', error);
    throw error;
  }
};

/**
 * Obtener registros de peso de un lote
 */
export const obtenerRegistrosPeso = async (
  loteId: string,
  tipoLote?: TipoAve
): Promise<PesoRegistro[]> => {
  try {
    let constraints = [
      where('loteId', '==', loteId),
      orderBy('fecha', 'desc')
    ];
    
    if (tipoLote) {
      constraints.unshift(where('tipoLote', '==', tipoLote));
    }
    
    const q = query(
      collection(db, PESO_COLLECTION),
      ...constraints
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
      } as PesoRegistro;
    });
  } catch (error) {
    console.error('Error al obtener registros de peso:', error);
    throw error;
  }
};

/**
 * Obtener todos los registros de peso por tipo de ave
 */
export const obtenerRegistrosPesoPorTipo = async (
  tipoLote: TipoAve
): Promise<PesoRegistro[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    const q = query(
      collection(db, PESO_COLLECTION),
      where('tipoLote', '==', tipoLote),
      where('createdBy', '==', userId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
      } as PesoRegistro;
    });
  } catch (error) {
    console.error('Error al obtener registros de peso por tipo:', error);
    return [];
  }
};

/**
 * Obtener el último registro de peso de un lote (para mostrar peso actual)
 */
export const obtenerUltimoPesoLote = async (
  loteId: string,
  tipoLote: TipoAve
): Promise<PesoRegistro | null> => {
  try {
    const registros = await obtenerRegistrosPeso(loteId, tipoLote);
    return registros.length > 0 ? registros[0] : null;
  } catch (error) {
    console.error('Error al obtener último peso del lote:', error);
    return null;
  }
};

/**
 * Suscribirse a los registros de peso por tipo de ave en tiempo real
 */
export const subscribeToPesoRegistros = (
  tipoLote: TipoAve,
  callback: (registros: PesoRegistro[]) => void
) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('Usuario no autenticado, no se puede suscribir a registros de peso');
    callback([]);
    return () => {}; // Retornar función vacía si no hay usuario
  }

  console.log(`⚖️ Suscribiéndose a registros de peso para ${tipoLote}`);

  const q = query(
    collection(db, PESO_COLLECTION),
    where('tipoLote', '==', tipoLote),
    where('createdBy', '==', userId),
    orderBy('fecha', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const registros = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
      } as PesoRegistro;
    });
    
    console.log(`⚖️ Suscripción peso: Actualizados ${registros.length} registros para ${tipoLote}`);
    callback(registros);
  }, (error) => {
    console.error('Error en suscripción a registros de peso:', error);
    callback([]); // En caso de error, retornar array vacío
  });
};
