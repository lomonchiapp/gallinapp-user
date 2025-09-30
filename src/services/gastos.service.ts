/**
 * Servicio para gestionar gastos en Firebase
 */

import {
    addDoc,
    collection,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { Gasto } from '../types';
import { TipoAve } from '../types/enums';
import { Articulo } from '../types/gastos/articulo';
import { getCurrentUserId } from './auth.service';

// Colecciones
const GASTOS_COLLECTION = 'gastos';
const ARTICULOS_COLLECTION = 'articulos';

/**
 * Registrar un nuevo gasto
 */
export const registrarGasto = async (gastoData: Omit<Gasto, 'id' | 'createdBy' | 'createdAt'>): Promise<Gasto> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const gasto = {
      ...gastoData,
      createdBy: userId,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, GASTOS_COLLECTION), gasto);
    
    return {
      id: docRef.id,
      ...gastoData,
      createdBy: userId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error al registrar gasto:', error);
    throw error;
  }
};

/**
 * Obtener gastos con filtros opcionales
 */
export const obtenerGastos = async (loteId?: string, tipoLote?: TipoAve): Promise<Gasto[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('Usuario no autenticado, retornando array vacío');
      return [];
    }
    
    let constraints: any[] = [
      where('createdBy', '==', userId),
      orderBy('fecha', 'desc')
    ];
    
    // Agregar filtros si se proporcionan
    if (loteId) {
      constraints.splice(1, 0, where('loteId', '==', loteId));
    }
    
    if (tipoLote) {
      constraints.splice(loteId ? 2 : 1, 0, where('tipoLote', '==', tipoLote));
    }
    
    const q = query(collection(db, GASTOS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convertir string legacy a TipoAve enum
      let tipoLote = data.tipoLote;
      if (typeof tipoLote === 'string') {
        switch (tipoLote) {
          case 'engorde':
            tipoLote = TipoAve.POLLO_ENGORDE;
            break;
          case 'israelies':
          case 'levantes':
            tipoLote = TipoAve.POLLO_LEVANTE;
            break;
          case 'ponedoras':
            tipoLote = TipoAve.PONEDORA;
            break;
          default:
            console.warn(`Tipo de lote desconocido: ${tipoLote}, usando POLLO_ENGORDE por defecto`);
            tipoLote = TipoAve.POLLO_ENGORDE;
        }
      }
      
      return {
        id: doc.id,
        loteId: data.loteId,
        tipoLote,
        articuloId: data.articuloId,
        articuloNombre: data.articuloNombre,
        cantidad: data.cantidad,
        precioUnitario: data.precioUnitario,
        total: data.total,
        fecha: data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha),
        categoria: data.categoria,
        descripcion: data.descripcion,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      };
    });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    return [];
  }
};

/**
 * Crear un nuevo artículo
 */
export const crearArticulo = async (articuloData: Omit<Articulo, 'id'>): Promise<Articulo> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const articulo = {
      ...articuloData,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, ARTICULOS_COLLECTION), articulo);
    
    return {
      id: docRef.id,
      ...articuloData,
    };
  } catch (error) {
    console.error('Error al crear artículo:', error);
    throw error;
  }
};

/**
 * Obtener todos los artículos activos
 */
export const obtenerArticulos = async (soloActivos = true): Promise<Articulo[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('Usuario no autenticado, retornando array vacío');
      return [];
    }
    
    let constraints: any[] = [
      where('createdBy', '==', userId),
      orderBy('nombre', 'asc')
    ];
    
    if (soloActivos) {
      constraints.splice(1, 0, where('activo', '==', true));
    }
    
    const q = query(collection(db, ARTICULOS_COLLECTION), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio || 0,
        unidadMedida: data.unidadMedida || 'Unidad',
        costoFijo: data.costoFijo || false,
        activo: data.activo,
      };
    });
  } catch (error) {
    console.error('Error al obtener artículos:', error);
    return [];
  }
};

/**
 * Obtener estadísticas de gastos por tipo de lote
 */
export const obtenerEstadisticasGastos = async (): Promise<{
  ponedoras: number;
  israelies: number;
  engorde: number;
  total: number;
}> => {
  try {
    const gastos = await obtenerGastos();
    
    const estadisticas = {
      ponedoras: 0,
      israelies: 0,
      engorde: 0,
      total: 0,
    };
    
    gastos.forEach(gasto => {
      estadisticas.total += gasto.total;
      
      switch (gasto.tipoLote) {
        case TipoAve.PONEDORA:
          estadisticas.ponedoras += gasto.total;
          break;
        case TipoAve.POLLO_LEVANTE:
          estadisticas.israelies += gasto.total;
          break;
        case TipoAve.POLLO_ENGORDE:
          estadisticas.engorde += gasto.total;
          break;
      }
    });
    
    return estadisticas;
  } catch (error) {
    console.error('Error al obtener estadísticas de gastos:', error);
    return { ponedoras: 0, israelies: 0, engorde: 0, total: 0 };
  }
};

/**
 * Calcular el costo de producción unitario de un lote
 * @param loteId ID del lote
 * @param tipoLote Tipo de ave del lote
 * @returns Costo de producción unitario (gasto total / cantidad actual)
 */
export const calcularCostoProduccionUnitario = async (loteId: string, tipoLote: TipoAve): Promise<number> => {
  try {
    // Obtener todos los gastos del lote
    const gastosLote = await obtenerGastos(loteId, tipoLote);

    // Calcular gasto total
    const gastoTotal = gastosLote.reduce((total, gasto) => total + gasto.total, 0);

    console.log(`💰 Lote ${loteId}: Gasto total calculado: ${gastoTotal}`);

    return gastoTotal;
  } catch (error) {
    console.error('Error al calcular costo de producción unitario:', error);
    return 0;
  }
};

/**
 * Suscribirse a los gastos de un tipo de ave en tiempo real
 */
export const subscribeToGastosByTipo = (
  tipoLote: TipoAve,
  callback: (gastos: Gasto[]) => void
) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('Usuario no autenticado, no se puede suscribir a gastos');
    callback([]);
    return () => {}; // Retornar función vacía si no hay usuario
  }

  console.log(`💰 Suscribiéndose a gastos para ${tipoLote}`);

  const q = query(
    collection(db, GASTOS_COLLECTION),
    where('tipoLote', '==', tipoLote),
    where('createdBy', '==', userId),
    orderBy('fecha', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const gastos = snapshot.docs.map(doc => {
      const data = doc.data();

      // Convertir string legacy a TipoAve enum
      let tipoLote = data.tipoLote;
      if (typeof tipoLote === 'string') {
        switch (tipoLote) {
          case 'engorde':
            tipoLote = TipoAve.POLLO_ENGORDE;
            break;
          case 'israelies':
          case 'levantes':
            tipoLote = TipoAve.POLLO_LEVANTE;
            break;
          case 'ponedoras':
            tipoLote = TipoAve.PONEDORA;
            break;
          default:
            console.warn(`Tipo de lote desconocido: ${tipoLote}, usando POLLO_ENGORDE por defecto`);
            tipoLote = TipoAve.POLLO_ENGORDE;
        }
      }

      return {
        id: doc.id,
        loteId: data.loteId,
        tipoLote,
        articuloId: data.articuloId,
        cantidad: data.cantidad,
        precioUnitario: data.precioUnitario,
        total: data.total,
        fecha: data.fecha?.toDate ? data.fecha.toDate() : new Date(data.fecha),
        observaciones: data.observaciones,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as Gasto;
    });

    console.log(`💰 Suscripción gastos: Actualizados ${gastos.length} gastos para ${tipoLote}`);
    callback(gastos);
  }, (error) => {
    console.error('Error en suscripción a gastos:', error);
    callback([]); // En caso de error, retornar array vacío
  });
};

