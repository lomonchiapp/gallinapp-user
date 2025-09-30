import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { Galpon } from '../types/galpon';
import { getCurrentUserId } from './auth.service';

const GALPONES_COLLECTION = 'galpones';

const normalizarGalpon = (id: string, data: any): Galpon => ({
  id,
  nombre: data.nombre,
  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
  updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
});

export const suscribirseAGalpones = (
  callback: (galpones: Galpon[]) => void,
  onError?: (error: unknown) => void
) => {
  const userId = getCurrentUserId();
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, GALPONES_COLLECTION),
    where('createdBy', '==', userId),
    orderBy('nombre', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const galpones = snapshot.docs.map((docSnap) => normalizarGalpon(docSnap.id, docSnap.data()));
      callback(galpones);
    },
    (error) => {
      console.error('Error en suscripción a galpones:', error);
      onError?.(error);
      callback([]);
    }
  );
};

export const galponesService = {
  async obtenerGalpones(): Promise<Galpon[]> {
    const userId = getCurrentUserId();
    if (!userId) return [];

    const q = query(
      collection(db, GALPONES_COLLECTION),
      where('createdBy', '==', userId),
      orderBy('nombre', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => normalizarGalpon(docSnap.id, docSnap.data()));
  },

  async crearGalpon(datos: { nombre: string }): Promise<Galpon> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const nuevo = {
      nombre: datos.nombre,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, GALPONES_COLLECTION), nuevo);
    return normalizarGalpon(docRef.id, {
      ...nuevo,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async actualizarGalpon(id: string, datos: { nombre: string }): Promise<void> {
    const galponRef = doc(db, GALPONES_COLLECTION, id);
    await updateDoc(galponRef, {
      nombre: datos.nombre,
      updatedAt: serverTimestamp(),
    });
  },

  async eliminarGalpon(id: string): Promise<void> {
    const galponRef = doc(db, GALPONES_COLLECTION, id);
    await deleteDoc(galponRef);
  },
};
