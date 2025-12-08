/**
 * Servicios para el módulo de gallinas ponedoras
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
import {
    EstadoLote,
    Gasto,
    HuevoRegistro,
    LotePonedora,
    TipoAve
} from '../types';
import { getCurrentUserId } from './auth.service';

// Interfaces temporales hasta que se definan en types
interface FiltroLote {
  status?: EstadoLote;
}

interface RegistroDiarioPonedora {
  id: string;
  loteId: string;
  fecha: Date;
  cantidadHuevosPequenos: number;
  cantidadHuevosMedianos: number;
  cantidadHuevosGrandes: number;
  cantidadHuevosExtraGrandes: number;
  observaciones?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VentaHuevos {
  id: string;
  loteId: string;
  fecha: Date;
  cantidad: number;
  tamano: string;
  calidad: string;
  precioUnitario: number;
  total: number;
  cliente?: string;
  observaciones?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IngresoPonedora {
  id: string;
  loteId: string;
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: Date;
  comprobante?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EstadisticasLotePonedora {
  loteId: string;
  produccionTotal: number;
  promedioProduccionDiaria: number;
  tasaPostura: number;
  mortalidad: number;
  ingresoTotal: number;
  gastoTotal: number;
  gananciaTotal: number;
}

// Colecciones
const LOTES_COLLECTION = 'lotesPonedoras';
const REGISTROS_COLLECTION = 'registrosPonedoras';
const HUEVOS_COLLECTION = 'registrosPonedoras';
const VENTAS_COLLECTION = 'ventasHuevos';
const GASTOS_COLLECTION = 'gastos';
const INGRESOS_COLLECTION = 'ingresos';

/**
 * Crear un nuevo lote de gallinas ponedoras
 */
export const crearLotePonedora = async (lote: Omit<LotePonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<LotePonedora> => {
  try {
    console.log('🐔 Iniciando creación de lote ponedora:', lote);
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('❌ Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('👤 Usuario ID:', userId);
    
    // Asegurar que fechaInicio sea un Timestamp para Firebase
    const loteData = {
      ...lote,
      fechaInicio: lote.fechaInicio,
      galponId: lote.galponId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      estado: EstadoLote.ACTIVO,
    };
    
    console.log('📝 Datos a guardar:', loteData);
    
    const docRef = await addDoc(collection(db, LOTES_COLLECTION), loteData);
    console.log('✅ Documento creado con ID:', docRef.id);
    
    // Si el lote tiene un costo inicial, registrarlo como gasto
    if (lote.costo && lote.costo > 0) {
      console.log('💰 Registrando costo inicial del lote como gasto:', lote.costo);
      const { CategoriaGasto } = await import('../types/enums');
      await registrarGastoPonedora({
        loteId: docRef.id,
        articuloId: 'costo-inicial',
        articuloNombre: 'Costo Inicial del Lote',
        cantidad: lote.cantidadInicial,
        precioUnitario: lote.costoUnitario || (lote.costo / lote.cantidadInicial),
        total: lote.costo,
        fecha: lote.fechaInicio,
        categoria: CategoriaGasto.OTHER,
        descripcion: `Costo inicial de compra de ${lote.cantidadInicial} gallinas ponedoras`
      });
    }
    
    const nuevoLote = {
      id: docRef.id,
      ...lote,
      galponId: lote.galponId,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      estado: EstadoLote.ACTIVO,
    };
    
    console.log('🎉 Lote ponedora creado exitosamente:', nuevoLote);
    return nuevoLote;
  } catch (error) {
    console.error('❌ Error al crear lote de ponedoras:', error);
    throw error;
  }
};

/**
 * Actualizar un lote existente
 */
export const actualizarLotePonedora = async (id: string, lote: Partial<LotePonedora>): Promise<void> => {
  try {
    const loteRef = doc(db, LOTES_COLLECTION, id);
    
    await updateDoc(loteRef, {
        ...lote,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al actualizar lote de ponedoras:', error);
    throw error;
  }
};


export const finalizarLotePonedora = async (id: string, fechaFin: Date): Promise<void> => {
  try {
    const loteRef = doc(db, LOTES_COLLECTION, id);
    
    await updateDoc(loteRef, {
      status: EstadoLote.FINALIZADO,
      fechaFin,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error al finalizar lote de ponedoras:', error);
    throw error;
  }
};

/**
 * Obtener un lote por ID
 */
export const obtenerLotePonedora = async (id: string): Promise<LotePonedora | null> => {
  try {
    const loteRef = doc(db, LOTES_COLLECTION, id);
    const loteSnap = await getDoc(loteRef);
    
    if (!loteSnap.exists()) {
      return null;
    }
    
    const loteData = loteSnap.data();
    
    return {
      id: loteSnap.id,
      nombre: loteData.nombre,
      fechaInicio: loteData.fechaInicio.toDate(),
      cantidadActual: loteData.cantidadActual,
      cantidadInicial: loteData.cantidadInicial,
      estado: loteData.estado,
      fechaNacimiento: loteData.fechaNacimiento?.toDate ? loteData.fechaNacimiento.toDate() : new Date(loteData.fechaNacimiento),
      raza: loteData.raza,
      estadoSalud: loteData.estadoSalud,
      tipo: loteData.tipo as TipoAve,
      activo: loteData.activo,
      createdBy: loteData.createdBy,
      createdAt: loteData.createdAt.toDate(),
      updatedAt: loteData.updatedAt.toDate(),
      costo: loteData.costo,
      costoUnitario: loteData.costoUnitario
    } as LotePonedora;
  } catch (error) {
    console.error('Error al obtener lote de ponedoras:', error);
    throw error;
  }
};

/**
 * Obtener todos los lotes con filtros opcionales
 */
export const obtenerLotesPonedoras = async (filtro?: FiltroLote): Promise<LotePonedora[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('Usuario no autenticado, retornando array vacío');
      return [];
    }

    // Consulta básica con filtro de usuario
    const constraints = [where('createdBy', '==', userId)];

    // Aplicar filtros adicionales si existen
    if (filtro?.status) {
      constraints.push(where('estado', '==', filtro.status));
    }
    
    const q = query(
      collection(db, LOTES_COLLECTION),
      ...constraints,
      orderBy('fechaInicio', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
        if (querySnapshot.empty) {
      console.log('No se encontraron lotes de ponedoras');
      return [];
    }

    console.log('📋 Documentos encontrados en ponedoras:', querySnapshot.size);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        galponId: data.galponId,
        fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
        cantidadActual: data.cantidadActual,
        cantidadInicial: data.cantidadInicial,
        estado: data.estado,
        raza: data.raza,
        estadoSalud: data.estadoSalud,
        tipo: data.tipo as TipoAve,
        activo: data.activo,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        costo: data.costo,
        costoUnitario: data.costoUnitario,
        observaciones: data.observaciones
      } as LotePonedora;
    });
  } catch (error) {
    console.error('Error al obtener lotes de ponedoras:', error);
    // En lugar de lanzar el error, retornamos un array vacío para evitar que la app se cuelgue
    return [];
  }
};

/**
 * Registrar producción diaria
 */
export const registrarProduccionDiaria = async (registro: Omit<RegistroDiarioPonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<RegistroDiarioPonedora> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const registroData = {
      ...registro,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, REGISTROS_COLLECTION), registroData);
    
    return {
      id: docRef.id,
      ...registro,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar producción diaria:', error);
    throw error;
  }
};

/**
 * Obtener registros diarios de un lote
 */
export const obtenerRegistrosDiarios = async (loteId: string): Promise<RegistroDiarioPonedora[]> => {
  try {
    const q = query(
      collection(db, REGISTROS_COLLECTION),
      where('loteId', '==', loteId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as RegistroDiarioPonedora;
    });
  } catch (error) {
    console.error('Error al obtener registros diarios:', error);
    throw error;
  }
};

/**
 * Obtener registros de huevos de un lote
 */
export const obtenerRegistrosHuevos = async (loteId: string): Promise<HuevoRegistro[]> => {
  try {
    const q = query(
      collection(db, HUEVOS_COLLECTION),
      where('loteId', '==', loteId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        loteId: data.loteId,
        fecha: data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha),
        cantidad: data.cantidadHuevos || data.cantidad || 0, // El campo en BD es cantidadHuevos según registrarProduccionHuevos
        cantidadVendida: data.cantidadVendida || 0, // Cantidad ya vendida de este registro
      };
    });
  } catch (error) {
    console.error('Error al obtener registros de huevos:', error);
    throw error;
  }
};

/**
 * Registrar venta de huevos
 */
export const registrarVentaHuevos = async (venta: Omit<VentaHuevos, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<VentaHuevos> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const ventaData = {
      ...venta,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, VENTAS_COLLECTION), ventaData);
    
    // Registrar también como ingreso
    await registrarIngresoPonedora({
      loteId: venta.loteId,
      tipo: 'VENTA_HUEVOS',
      descripcion: `Venta de ${venta.cantidad} huevos ${venta.tamano} ${venta.calidad}`,
      monto: venta.total,
      fecha: venta.fecha,
      comprobante: undefined
    });
    
    return {
      id: docRef.id,
      ...venta,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar venta de huevos:', error);
    throw error;
  }
};

/**
 * Obtener ventas de huevos de un lote
 */
export const obtenerVentasHuevos = async (loteId: string): Promise<VentaHuevos[]> => {
  try {
    const q = query(
      collection(db, VENTAS_COLLECTION),
      where('loteId', '==', loteId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as VentaHuevos;
    });
  } catch (error) {
    console.error('Error al obtener ventas de huevos:', error);
    throw error;
  }
};

/**
 * Registrar gasto para un lote de ponedoras
 */
export const registrarGastoPonedora = async (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>): Promise<Gasto> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const gastoData = {
      ...gasto,
      tipoLote: 'ponedora',
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, GASTOS_COLLECTION), gastoData);
    
    return {
      id: docRef.id,
      ...gasto,
      tipoLote: TipoAve.PONEDORA,
      createdBy: userId,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar gasto de ponedoras:', error);
    throw error;
  }
};

/**
 * Obtener gastos de un lote de ponedoras
 */
export const obtenerGastosPonedora = async (loteId: string): Promise<Gasto[]> => {
  try {
    const q = query(
      collection(db, GASTOS_COLLECTION),
      where('loteId', '==', loteId),
      where('tipoLote', '==', 'ponedoras'),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        loteId: data.loteId,
        tipoLote: data.tipoLote,
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
    console.error('Error al obtener gastos de ponedoras:', error);
    throw error;
  }
};

/**
 * Registrar ingreso para un lote de ponedoras
 */
export const registrarIngresoPonedora = async (ingreso: Omit<IngresoPonedora, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<IngresoPonedora> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const ingresoData = {
      ...ingreso,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, INGRESOS_COLLECTION), ingresoData);
    
    return {
      id: docRef.id,
      ...ingreso,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar ingreso de ponedoras:', error);
    throw error;
  }
};

/**
 * Obtener ingresos de un lote de ponedoras
 */
export const obtenerIngresosPonedora = async (loteId: string): Promise<IngresoPonedora[]> => {
  try {
    const q = query(
      collection(db, INGRESOS_COLLECTION),
      where('loteId', '==', loteId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: data.fecha.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as IngresoPonedora;
    });
  } catch (error) {
    console.error('Error al obtener ingresos de ponedoras:', error);
    throw error;
  }
};

/**
 * Calcular estadísticas de un lote de ponedoras
 */
export const calcularEstadisticasLotePonedora = async (loteId: string): Promise<EstadisticasLotePonedora> => {
  try {
    // Obtener lote
    const lote = await obtenerLotePonedora(loteId);
    if (!lote) throw new Error('Lote no encontrado');
    
    // Obtener registros diarios
    const registros = await obtenerRegistrosDiarios(loteId);
    
    // Obtener ingresos
    const ingresos = await obtenerIngresosPonedora(loteId);
    
    // Obtener gastos
    const gastos = await obtenerGastosPonedora(loteId);
    
    // Calcular producción total
    const produccionTotal = registros.reduce((total, registro) => {
      return total + registro.cantidadHuevosPequenos + 
                     registro.cantidadHuevosMedianos + 
                     registro.cantidadHuevosGrandes + 
                     registro.cantidadHuevosExtraGrandes;
    }, 0);
    
    // Calcular promedio de producción diaria
    const promedioProduccionDiaria = registros.length > 0 ? produccionTotal / registros.length : 0;
    
    // Calcular tasa de postura (usando numeroAves como cantidad inicial)
    const tasaPostura = registros.length > 0 ? 
      (produccionTotal / (lote.cantidadActual * registros.length)) * 100 : 0;
    
    // Calcular mortalidad (por ahora 0, se puede implementar después)
    const mortalidad = 0;
    
    // Calcular ingresos totales
    const ingresoTotal = ingresos.reduce((total, ingreso) => total + ingreso.monto, 0);
    
    // Calcular gastos totales
    const gastoTotal = gastos.reduce((total, gasto) => total + gasto.total, 0);
    
    // Calcular ganancia total
    const gananciaTotal = ingresoTotal - gastoTotal;
    
    return {
      loteId,
      produccionTotal,
      promedioProduccionDiaria,
      tasaPostura,
      mortalidad,
      ingresoTotal,
      gastoTotal,
      gananciaTotal
    };
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    throw error;
  }
};

/**
 * Registrar producción de huevos
 */
export const registrarProduccionHuevos = async (registro: { 
  loteId: string; 
  fecha: Date; 
  cantidadHuevos: number; 
  observaciones?: string 
}): Promise<any> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const registroData: any = {
      loteId: registro.loteId,
      fecha: registro.fecha,
      cantidadHuevos: registro.cantidadHuevos,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Solo agregar observaciones si existen
    if (registro.observaciones && registro.observaciones.trim()) {
      registroData.observaciones = registro.observaciones.trim();
    }

    const docRef = await addDoc(collection(db, HUEVOS_COLLECTION), registroData);
    
    return {
      id: docRef.id,
      ...registroData,
      fecha: registro.fecha,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error al registrar producción de huevos:', error);
    throw error;
  }
};

/**
 * Actualizar un registro de producción de huevos
 */
export const actualizarRegistroHuevos = async (
  registroId: string,
  datos: {
    fecha?: Date;
    cantidadHuevos?: number;
    observaciones?: string;
  }
): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const registroRef = doc(db, HUEVOS_COLLECTION, registroId);
    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (datos.fecha !== undefined) {
      updateData.fecha = datos.fecha;
    }
    if (datos.cantidadHuevos !== undefined) {
      updateData.cantidadHuevos = datos.cantidadHuevos;
    }
    if (datos.observaciones !== undefined) {
      if (datos.observaciones.trim()) {
        updateData.observaciones = datos.observaciones.trim();
      } else {
        updateData.observaciones = null;
      }
    }

    await updateDoc(registroRef, updateData);
  } catch (error) {
    console.error('Error al actualizar registro de huevos:', error);
    throw error;
  }
};

/**
 * Eliminar un registro de producción de huevos
 */
export const eliminarRegistroHuevos = async (registroId: string): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const registroRef = doc(db, HUEVOS_COLLECTION, registroId);
    await deleteDoc(registroRef);
  } catch (error) {
    console.error('Error al eliminar registro de huevos:', error);
    throw error;
  }
};

/**
 * Eliminar un lote de gallinas ponedoras
 * Solo permite eliminar lotes que NO estén activos
 */
export const eliminarLotePonedora = async (id: string): Promise<void> => {
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
    console.error('Error al eliminar lote de ponedoras:', error);
    throw error;
  }
};

/**
 * Obtener todos los registros de producción de huevos del usuario (estructura nueva)
 */
export const obtenerTodosRegistrosHuevos = async (): Promise<HuevoRegistro[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    const q = query(
      collection(db, HUEVOS_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('fecha', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        loteId: data.loteId,
        fecha: data.fecha.toDate ? data.fecha.toDate() : new Date(data.fecha),
        cantidad: data.cantidadHuevos || data.cantidad || 0,
        cantidadVendida: data.cantidadVendida || 0,
      };
    });
  } catch (error) {
    console.error('Error al obtener todos los registros de huevos:', error);
    return [];
  }
};

/**
 * Obtener todos los registros de producción de huevos del usuario (estructura antigua - para compatibilidad)
 */
export const obtenerTodosRegistrosProduccion = async (): Promise<RegistroDiarioPonedora[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
    const q = query(
      collection(db, REGISTROS_COLLECTION),
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
      } as RegistroDiarioPonedora;
    });
  } catch (error) {
    console.error('Error al obtener todos los registros de producción:', error);
    return [];
  }
};

/**
 * Obtener registros de producción por lote (alias para compatibilidad)
 */
export const obtenerRegistrosProduccionPorLote = async (loteId: string): Promise<RegistroDiarioPonedora[]> => {
  return obtenerRegistrosDiarios(loteId);
};

/**
 * Suscribirse a los lotes de ponedoras
 */
export const subscribeToPonedoras = (callback: (lotes: LotePonedora[]) => void) => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('Usuario no autenticado, no se puede suscribir a ponedoras');
    callback([]);
    return () => {}; // Retornar función vacía si no hay usuario
  }

  const q = query(
    collection(db, LOTES_COLLECTION),
    where('createdBy', '==', userId),
    orderBy('fechaInicio', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const lotes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
        cantidadActual: data.cantidadActual,
        cantidadInicial: data.cantidadInicial,
        estado: data.estado,
        raza: data.raza,
        estadoSalud: data.estadoSalud,
        tipo: data.tipo as TipoAve,
        activo: data.activo,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        costo: data.costo,
        costoUnitario: data.costoUnitario
      } as LotePonedora;
    });
    
    console.log('🔄 Suscripción ponedoras: Actualizados', lotes.length, 'lotes');
    callback(lotes);
  }, (error) => {
    console.error('Error en suscripción a ponedoras:', error);
    callback([]); // En caso de error, retornar array vacío
  });
};



