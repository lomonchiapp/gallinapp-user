/**
 * Servicios para el módulo de pollos de levante
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
    EdadRegistro,
    EstadoLote,
    Gasto,
    LoteLevante,
    RegistroMortalidad,
    TipoAve
} from '../types';
import { calculateAgeInDays, calculateDaysDifference } from '../utils/dateUtils';
import { getCurrentUserId } from './auth.service';

// Colecciones
const LOTES_COLLECTION = 'lotesLevantes';
const REGISTROS_PESO_COLLECTION = 'registrosPeso';
const REGISTROS_EDAD_COLLECTION = 'registrosEdad';
const GASTOS_COLLECTION = 'gastos';
const MORTALIDAD_COLLECTION = 'mortalidad';

// Interfaces específicas para levantes
export interface EstadisticasLoteLevante {
    loteId: string;
    edadActual: number;
    diasTranscurridos: number;
    mortalidadTotal: number;
    mortalidadPorcentaje: number;
    gastoTotal: number;
    gastoPromedioPorAve: number;
    pesoEstimado?: number; // Basado en la edad
}

export interface FiltroLoteLevante {
    estado?: EstadoLote;
    fechaInicioDesde?: Date;
    fechaInicioHasta?: Date;
    raza?: string;
}

export interface IngresoLevante {
    id: string;
    loteId: string;
    tipo: 'VENTA_POLLOS' | 'OTRO';
    descripcion: string;
    cantidad: number; // número de pollos vendidos
    precioUnitario: number;
    total: number;
    fecha: Date;
    comprobante?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Crear un nuevo lote de pollos israelíes
 */
export const crearLoteLevante = async (lote: Omit<LoteLevante, 'id'>): Promise<LoteLevante> => {
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
        
        await updateDoc(docRef, {
            id: docRef.id,
            ...lote,
            createdBy: userId,
        });

        // Si el lote tiene un costo inicial, registrarlo como gasto
        if (lote.costo && lote.costo > 0) {
            console.log('💰 Registrando costo inicial del lote como gasto:', lote.costo);
            const { CategoriaGasto } = await import('../types/enums');
            await registrarGastoLevante({
                loteId: docRef.id,
                articuloId: 'costo-inicial',
                articuloNombre: 'Costo Inicial del Lote',
                cantidad: lote.cantidadInicial,
                precioUnitario: lote.costoUnitario || (lote.costo / lote.cantidadInicial),
                total: lote.costo,
                fecha: lote.fechaInicio,
                categoria: CategoriaGasto.OTHER,
                descripcion: `Costo inicial de compra de ${lote.cantidadInicial} pollitos de levante`
            });
        }

        return {
            id: docRef.id,
            ...lote,
            galponId: lote.galponId,
            createdBy: userId,
        };

        
    } catch (error) {
        console.error('Error al crear lote levante:', error);
        throw error;
    }
};

/**
 * Actualizar un lote israelí existente
 */
export const actualizarLoteLevante = async (id: string, lote: Partial<LoteLevante>): Promise<void> => {
    try {
        const loteRef = doc(db, LOTES_COLLECTION, id);
        
        await updateDoc(loteRef, {
            ...lote,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error al actualizar lote levante:', error);
        throw error;
    }
};

/**
 * Finalizar un lote israelí
 */
export const finalizarLoteLevante = async (id: string): Promise<void> => {
    try {
        const loteRef = doc(db, LOTES_COLLECTION, id);
        
        await updateDoc(loteRef, {
            activo: false,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error al finalizar lote levante:', error);
        throw error;
    }
};

/**
 * Eliminar un lote de pollos levantes
 */
export const eliminarLoteLevante = async (id: string): Promise<void> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const loteRef = doc(db, LOTES_COLLECTION, id);
        await deleteDoc(loteRef);
    } catch (error) {
        console.error('Error al eliminar lote de levantes:', error);
        throw error;
    }
};

/**
 * Obtener un lote israelí por ID
 */
export const obtenerLoteLevante = async (id: string): Promise<LoteLevante | null> => {
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
            fechaInicio: loteData.fechaInicio?.toDate ? loteData.fechaInicio.toDate() : new Date(loteData.fechaInicio),
            fechaNacimiento: loteData.fechaNacimiento?.toDate ? loteData.fechaNacimiento.toDate() : new Date(loteData.fechaNacimiento)
        } as LoteLevante;
    } catch (error) {
        console.error('Error al obtener lote levante:', error);
        throw error;
    }
};

/**
 * Obtener todos los lotes israelíes con filtros opcionales
 */
export const obtenerLotesLevantes = async (): Promise<LoteLevante[]> => {
    try {
        console.log('🔍 Obteniendo lotes levantes...');
        const userId = getCurrentUserId();
        if (!userId) {
            console.log('⚠️ Usuario no autenticado, retornando array vacío');
            return [];
        }
        
        console.log('👤 Usuario ID:', userId);
        
        let constraints = [where('userId', '==', userId)];
        
        const q = query(
            collection(db, LOTES_COLLECTION),
            ...constraints,
            orderBy('fechaInicio', 'desc')
        );
        
        console.log('📡 Ejecutando consulta a Firestore...');
        const querySnapshot = await getDocs(q);
        console.log('📋 Documentos encontrados:', querySnapshot.size);
        
        if (querySnapshot.empty) {
            console.log('📝 No se encontraron lotes israelíes');
            return [];
        }
        
        const lotes = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fechaInicio: data.fechaInicio?.toDate ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
                fechaNacimiento: data.fechaNacimiento?.toDate ? data.fechaNacimiento.toDate() : new Date(data.fechaNacimiento)
            } as LoteLevante;
        });
        
        console.log('✅ Lotes levantes procesados:', lotes.length);
        return lotes;
    } catch (error) {
        console.error('❌ Error al obtener lotes levantes:', error);
        return [];
    }
};

/**
 * Registrar edad de pollos israelíes
 */
export const registrarEdadLevante = async (registro: Omit<EdadRegistro, 'id'>): Promise<EdadRegistro> => {
    try {
        const registroData = {
            ...registro,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, REGISTROS_EDAD_COLLECTION), registroData);
        
        return {
            id: docRef.id,
            ...registro
        };
    } catch (error) {
        console.error('Error al registrar edad levante:', error);
        throw error;
    }
};

/**
 * Obtener registros de edad de un lote levante
 */
export const obtenerRegistrosEdad = async (loteId: string): Promise<EdadRegistro[]> => {
    try {
        const q = query(
            collection(db, REGISTROS_EDAD_COLLECTION),
            where('loteId', '==', loteId),
            orderBy('fecha', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fecha: data.fecha.toDate()
            } as EdadRegistro;
        });
    } catch (error) {
        console.error('Error al obtener registros de edad:', error);
        throw error;
    }
};

/**
 * Registrar gasto para un lote israelí
 */
export const registrarGastoLevante = async (gasto: Omit<Gasto, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>): Promise<Gasto> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('Usuario no autenticado');
        
        const gastoData = {
            ...gasto,
            tipoLote: TipoAve.POLLO_LEVANTE,
            createdBy: userId,
            createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, GASTOS_COLLECTION), gastoData);
        
        return {
            id: docRef.id,
            ...gasto,
            tipoLote: TipoAve.POLLO_LEVANTE,
            createdBy: userId,
            createdAt: new Date()
        };
    } catch (error) {
        console.error('Error al registrar gasto levante:', error);
        throw error;
    }
};

/**
 * Obtener gastos de un lote levante
 */
export const obtenerGastosLevante = async (loteId: string): Promise<Gasto[]> => {
    try {
        const q = query(
            collection(db, GASTOS_COLLECTION),
            where('loteId', '==', loteId),
            where('tipoLote', '==', TipoAve.POLLO_LEVANTE),
            orderBy('fecha', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fecha: data.fecha.toDate(),
                createdAt: data.createdAt.toDate()
            } as Gasto;
        });
    } catch (error) {
        console.error('Error al obtener gastos levantes:', error);
        throw error;
    }
};

/**
 * Registrar mortalidad para un lote levante
 */
export const registrarMortalidadLevante = async (mortalidad: Omit<RegistroMortalidad, 'id' | 'tipoLote' | 'createdBy' | 'createdAt'>): Promise<RegistroMortalidad> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('Usuario no autenticado');
        
        const mortalidadData = {
            ...mortalidad,
            tipoLote: TipoAve.POLLO_LEVANTE,
            createdBy: userId,
            createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, MORTALIDAD_COLLECTION), mortalidadData);
        
        return {
            id: docRef.id,
            ...mortalidad,
            tipoLote: TipoAve.POLLO_LEVANTE,
            createdBy: userId,
            createdAt: new Date()
        };
    } catch (error) {
        console.error('Error al registrar mortalidad levante:', error);
        throw error;
    }
};

/**
 * Obtener registros de mortalidad de un lote levante
 */
export const obtenerMortalidadLevante = async (loteId: string): Promise<RegistroMortalidad[]> => {
    try {
        const q = query(
            collection(db, MORTALIDAD_COLLECTION),
            where('loteId', '==', loteId),
            where('tipoLote', '==', TipoAve.POLLO_LEVANTE),
            orderBy('fecha', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                fecha: data.fecha.toDate(),
                createdAt: data.createdAt.toDate()
            } as RegistroMortalidad;
        });
    } catch (error) {
        console.error('Error al obtener mortalidad levante:', error);
        throw error;
    }
};

/**
 * Registrar venta de pollos levantes
 */
export const registrarVentaLevante = async (venta: Omit<IngresoLevante, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<IngresoLevante> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) throw new Error('Usuario no autenticado');
        
        const ventaData = {
            ...venta,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'ventasLevantes'), ventaData);
        
        return {
            id: docRef.id,
            ...venta,
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    } catch (error) {
        console.error('Error al registrar venta levante:', error);
        throw error;
    }
};

/**
 * Obtener ventas de un lote levante
 */
export const obtenerVentasLevante = async (loteId: string): Promise<IngresoLevante[]> => {
    try {
        const q = query(
            collection(db, 'ventasLevantes'),
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
            } as IngresoLevante;
        });
    } catch (error) {
        console.error('Error al obtener ventas levantes:', error);
        throw error;
    }
};

/**
 * Calcular estadísticas de un lote levante
 */
export const calcularEstadisticasLoteLevante = async (loteId: string): Promise<EstadisticasLoteLevante> => {
    try {
        // Obtener lote
        const lote = await obtenerLoteLevante(loteId);
        if (!lote) throw new Error('Lote no encontrado');
        
        // Calcular días transcurridos de forma segura
        const diasTranscurridos = calculateDaysDifference(lote.fechaInicio);
        // Calcular edad actual en días de forma segura
        const edadActual = calculateAgeInDays(lote.fechaNacimiento);
        
        // Obtener registros de mortalidad
        const mortalidad = await obtenerMortalidadLevante(loteId);
        const mortalidadTotal = mortalidad.reduce((total, registro) => total + registro.cantidad, 0);
        const mortalidadPorcentaje = lote.cantidadActual > 0 ? (mortalidadTotal / lote.cantidadActual) * 100 : 0;
        
        // Obtener gastos
        const gastos = await obtenerGastosLevante(loteId);
        const gastoTotal = gastos.reduce((total, gasto) => total + gasto.total, 0);
        const gastoPromedioPorAve = lote.cantidadActual > 0 ? gastoTotal / lote.cantidadActual : 0;
        
        // Calcular peso estimado basado en la edad (aproximación)
        const pesoEstimado = calcularPesoEstimado(edadActual);
        
        return {
            loteId,
            edadActual,
            diasTranscurridos,
            mortalidadTotal,
            mortalidadPorcentaje,
            gastoTotal,
            gastoPromedioPorAve,
            pesoEstimado
        };
    } catch (error) {
        console.error('Error al calcular estadísticas levantes:', error);
        throw error;
    }
};

/**
 * Suscribirse a los lotes de levante
 */
export const subscribeToLevantes = (callback: (lotes: LoteLevante[]) => void) => {
    const q = query(collection(db, LOTES_COLLECTION));
    return onSnapshot(q, (snapshot) => {
        const lotes = snapshot.docs.map(doc => doc.data() as LoteLevante);
        callback(lotes);
    });
};

/**
 * Calcular peso estimado basado en la edad (aproximación para pollos de levante)
 */
const calcularPesoEstimado = (edadEnDias: number): number => {
    // Curva de crecimiento aproximada para pollos de levante
    // Estas son aproximaciones y pueden variar según la raza específica
    if (edadEnDias <= 7) return 0.15; // 150g
    if (edadEnDias <= 14) return 0.35; // 350g
    if (edadEnDias <= 21) return 0.65; // 650g
    if (edadEnDias <= 28) return 1.0;  // 1kg
    if (edadEnDias <= 35) return 1.4;  // 1.4kg
    if (edadEnDias <= 42) return 1.8;  // 1.8kg
    if (edadEnDias <= 49) return 2.2;  // 2.2kg
    if (edadEnDias <= 56) return 2.6;  // 2.6kg
    return 2.8; // Peso máximo aproximado
};
