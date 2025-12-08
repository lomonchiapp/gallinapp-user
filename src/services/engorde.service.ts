/**
 * Servicios básicos para el módulo de pollos de engorde
 */

import {
  addDoc,
  collection,
  deleteDoc,
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
import { Gasto, LoteEngorde, TipoAve } from '../types';
import { EstadoLote } from '../types/enums';
import { getCurrentUserId } from './auth.service';

// Colecciones
const LOTES_COLLECTION = 'lotesEngorde';
const GASTOS_COLLECTION = 'gastos';

/**
 * Registrar gasto para un lote de engorde
 */
export const registrarGastoEngorde = async (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>): Promise<Gasto> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const gastoData = {
      ...gasto,
      tipoLote: TipoAve.POLLO_ENGORDE,
      createdBy: userId,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, GASTOS_COLLECTION), gastoData);
    
    return {
      id: docRef.id,
      ...gasto,
      tipoLote: TipoAve.POLLO_ENGORDE,
      createdBy: userId,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar gasto engorde:', error);
    throw error;
  }
};

/**
 * Crear un nuevo lote de engorde
 */
export const crearLoteEngorde = async (lote: Omit<LoteEngorde, 'id'>): Promise<LoteEngorde> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const loteData = {
      ...lote,
      createdBy: userId,
      estado: lote.estado || EstadoLote.ACTIVO,
      activo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, LOTES_COLLECTION), loteData);
    
    // Si el lote tiene un costo inicial, registrarlo como gasto
    if (lote.costo && lote.costo > 0) {
      console.log('💰 Registrando costo inicial del lote como gasto:', lote.costo);
      const { CategoriaGasto } = await import('../types/enums');
      await registrarGastoEngorde({
        loteId: docRef.id,
        articuloId: 'costo-inicial',
        articuloNombre: 'Costo Inicial del Lote',
        cantidad: lote.cantidadInicial,
        precioUnitario: lote.costoUnitario || (lote.costo / lote.cantidadInicial),
        total: lote.costo,
        fecha: lote.fechaInicio,
        categoria: CategoriaGasto.OTHER,
        descripcion: `Costo inicial de compra de ${lote.cantidadInicial} pollitos de engorde`
      });
    }
    
    return {
      id: docRef.id,
      ...lote,
      galponId: lote.galponId,
      createdBy: userId,
      estado: lote.estado || EstadoLote.ACTIVO
    };
  } catch (error) {
    console.error('Error al crear lote de engorde:', error);
    throw error;
  }
};

/**
 * Obtener todos los lotes de engorde
 * Busca lotes con createdBy O userId para compatibilidad con lotes antiguos
 */
export const obtenerLotesEngorde = async (): Promise<LoteEngorde[]> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            console.log('Usuario no autenticado, retornando array vacío');
            return [];
        }

        // Hacer dos consultas en paralelo: una por createdBy y otra por userId
        const consultas: Promise<any>[] = [];
        
        // Consulta 1: Por createdBy
        try {
            const q1 = query(
                collection(db, LOTES_COLLECTION),
                where('createdBy', '==', userId),
                orderBy('fechaInicio', 'desc')
            );
            consultas.push(getDocs(q1));
        } catch (orderError: any) {
            console.warn('⚠️ No se pudo ordenar por fechaInicio (createdBy), consultando sin ordenamiento:', orderError.message);
            const q1 = query(
                collection(db, LOTES_COLLECTION),
                where('createdBy', '==', userId)
            );
            consultas.push(getDocs(q1));
        }

        // Consulta 2: Por userId (para compatibilidad con lotes antiguos)
        try {
            const q2 = query(
                collection(db, LOTES_COLLECTION),
                where('userId', '==', userId),
                orderBy('fechaInicio', 'desc')
            );
            consultas.push(getDocs(q2));
        } catch (orderError: any) {
            console.warn('⚠️ No se pudo ordenar por fechaInicio (userId), consultando sin ordenamiento:', orderError.message);
            const q2 = query(
                collection(db, LOTES_COLLECTION),
                where('userId', '==', userId)
            );
            consultas.push(getDocs(q2));
        }

        // Ejecutar ambas consultas en paralelo
        const [snapshot1, snapshot2] = await Promise.all(consultas);
        
        // Combinar resultados y eliminar duplicados usando un Map
        const lotesMap = new Map<string, LoteEngorde>();
        
        const procesarSnapshot = (snapshot: any) => {
            snapshot.docs.forEach((doc: any) => {
                const data = doc.data();
                // Filtrar solo los lotes que pertenecen al usuario actual
                if (data.createdBy !== userId && data.userId !== userId) {
                    return; // Saltar este documento si no pertenece al usuario
                }

                // Convertir activo a estado si es necesario (para compatibilidad con lotes antiguos)
                let estado = data.estado;
                if (!estado && data.activo !== undefined) {
                    estado = data.activo ? EstadoLote.ACTIVO : EstadoLote.FINALIZADO;
                }
                if (!estado) {
                    estado = EstadoLote.ACTIVO; // Por defecto activo
                }

                const lote = {
                    id: doc.id,
                    ...data,
                    estado: estado as EstadoLote,
                    fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
                    fechaNacimiento: data.fechaNacimiento?.toDate ? data.fechaNacimiento.toDate() : (data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined)
                } as LoteEngorde;

                lotesMap.set(doc.id, lote);
            });
        };

        procesarSnapshot(snapshot1);
        procesarSnapshot(snapshot2);

        if (lotesMap.size === 0) {
            console.log('No se encontraron lotes de engorde');
            return [];
        }

        console.log('📋 Documentos encontrados en engorde:', lotesMap.size);
        
        // Convertir map a array y ordenar
        const lotes = Array.from(lotesMap.values());
        lotes.sort((a, b) => {
            const fechaA = a.fechaInicio?.getTime() || 0;
            const fechaB = b.fechaInicio?.getTime() || 0;
            return fechaB - fechaA; // Descendente
        });
        
        return lotes;
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
      estado: EstadoLote.FINALIZADO,
      activo: false,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al finalizar lote de engorde:', error);
    throw error;
  }
};

/**
 * Eliminar un lote de pollos de engorde
 * Solo permite eliminar lotes que NO estén activos
 */
export const eliminarLoteEngorde = async (id: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    // Obtener el lote primero para validar su estado
    const loteRef = doc(db, LOTES_COLLECTION, id);
    const loteDoc = await getDoc(loteRef);
    
    if (!loteDoc.exists()) {
      throw new Error('Lote no encontrado');
    }

    const loteData = loteDoc.data();
    
    // Validar que el lote NO esté activo
    if (loteData.estado === EstadoLote.ACTIVO) {
      throw new Error('No se puede eliminar un lote activo. Debe finalizarlo primero.');
    }

    await deleteDoc(loteRef);
  } catch (error) {
    console.error('Error al eliminar lote de engorde:', error);
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
    // Convertir activo a estado si es necesario (para compatibilidad con lotes antiguos)
    let estado = loteData.estado;
    if (!estado && loteData.activo !== undefined) {
      estado = loteData.activo ? EstadoLote.ACTIVO : EstadoLote.FINALIZADO;
    }
    if (!estado) {
      estado = EstadoLote.ACTIVO; // Por defecto activo
    }
    return {
      id: loteSnap.id,
      ...loteData,
      estado: estado as EstadoLote,
      fechaInicio: loteData.fechaInicio?.toDate ? loteData.fechaInicio.toDate() : new Date(loteData.fechaInicio)
    } as LoteEngorde;
  } catch (error) {
    console.error('Error al obtener lote de engorde:', error);
        return null;
    }
};

/**
 * Suscribirse a cambios en los lotes de engorde en tiempo real
 * Busca lotes con createdBy O userId para compatibilidad con lotes antiguos
 */
export const suscribirseALotesEngorde = (callback: (lotes: LoteEngorde[]) => void): (() => void) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('⚠️ [Engorde Service] Usuario no autenticado, no se puede suscribir a lotes de engorde');
      callback([]);
      return () => {};
    }

    console.log('🔄 [Engorde Service] Configurando suscripción para userId:', userId);

    // Crear dos consultas: una por createdBy y otra por userId (para compatibilidad)
    let q1, q2;
    let unsubscribes: (() => void)[] = [];
    const lotesMap = new Map<string, LoteEngorde>();

    const procesarSnapshot = (querySnapshot: any, source: string) => {
      console.log(`📥 [Engorde Service] Snapshot recibido de ${source}: ${querySnapshot.size} documentos`);
      
      querySnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        // Filtrar solo los lotes que pertenecen al usuario actual
        if (data.createdBy !== userId && data.userId !== userId) {
          return; // Saltar este documento si no pertenece al usuario
        }

        // Convertir activo a estado si es necesario (para compatibilidad con lotes antiguos)
        let estado = data.estado;
        if (!estado && data.activo !== undefined) {
          estado = data.activo ? EstadoLote.ACTIVO : EstadoLote.FINALIZADO;
        }
        if (!estado) {
          estado = EstadoLote.ACTIVO; // Por defecto activo
        }

        const lote = {
          id: doc.id,
          ...data,
          estado: estado as EstadoLote,
          fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
          fechaNacimiento: data.fechaNacimiento?.toDate ? data.fechaNacimiento.toDate() : (data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined)
        } as LoteEngorde;

        lotesMap.set(doc.id, lote);
      });

      // Convertir map a array y ordenar
      const lotes = Array.from(lotesMap.values());
      lotes.sort((a, b) => {
        const fechaA = a.fechaInicio?.getTime() || 0;
        const fechaB = b.fechaInicio?.getTime() || 0;
        return fechaB - fechaA; // Descendente
      });

      console.log(`✅ [Engorde Service] Lotes de engorde procesados: ${lotes.length}`);
      callback(lotes);
    };

    // Consulta 1: Por createdBy
    try {
      q1 = query(
        collection(db, LOTES_COLLECTION),
        where('createdBy', '==', userId),
        orderBy('fechaInicio', 'desc')
      );
      const unsubscribe1 = onSnapshot(q1, 
        (snapshot) => procesarSnapshot(snapshot, 'createdBy'),
        (error) => {
          console.error('❌ [Engorde Service] Error en suscripción por createdBy:', error);
        }
      );
      unsubscribes.push(unsubscribe1);
    } catch (orderError: any) {
      console.warn('⚠️ [Engorde Service] No se pudo ordenar por fechaInicio (createdBy), consultando sin ordenamiento:', orderError.message);
      q1 = query(
        collection(db, LOTES_COLLECTION),
        where('createdBy', '==', userId)
      );
      const unsubscribe1 = onSnapshot(q1, 
        (snapshot) => procesarSnapshot(snapshot, 'createdBy'),
        (error) => {
          console.error('❌ [Engorde Service] Error en suscripción por createdBy:', error);
        }
      );
      unsubscribes.push(unsubscribe1);
    }

    // Consulta 2: Por userId (para compatibilidad con lotes antiguos)
    try {
      q2 = query(
        collection(db, LOTES_COLLECTION),
        where('userId', '==', userId),
        orderBy('fechaInicio', 'desc')
      );
      const unsubscribe2 = onSnapshot(q2, 
        (snapshot) => procesarSnapshot(snapshot, 'userId'),
        (error) => {
          console.error('❌ [Engorde Service] Error en suscripción por userId:', error);
        }
      );
      unsubscribes.push(unsubscribe2);
    } catch (orderError: any) {
      console.warn('⚠️ [Engorde Service] No se pudo ordenar por fechaInicio (userId), consultando sin ordenamiento:', orderError.message);
      q2 = query(
        collection(db, LOTES_COLLECTION),
        where('userId', '==', userId)
      );
      const unsubscribe2 = onSnapshot(q2, 
        (snapshot) => procesarSnapshot(snapshot, 'userId'),
        (error) => {
          console.error('❌ [Engorde Service] Error en suscripción por userId:', error);
        }
      );
      unsubscribes.push(unsubscribe2);
    }

    // Retornar función que cancela ambas suscripciones
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  } catch (error) {
    console.error('❌ [Engorde Service] Error al suscribirse a lotes de engorde:', error);
    callback([]);
    return () => {};
  }
};