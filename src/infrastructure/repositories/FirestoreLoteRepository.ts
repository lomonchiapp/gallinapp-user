/**
 * Infrastructure Repository: FirestoreLoteRepository
 * Implementación concreta del repositorio de lotes usando Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../components/config/firebase';
import { ILoteRepository, LoteQuery } from '../../domain/repositories/ILoteRepository';
import { Lote, TipoLote, EstadoLote } from '../../domain/entities/Lote';

export class FirestoreLoteRepository implements ILoteRepository {
  private readonly collectionName = 'lotes';

  async save(lote: Lote): Promise<void> {
    try {
      const loteData = this.entityToFirestore(lote);
      await addDoc(collection(db, this.collectionName), loteData);
    } catch (error) {
      console.error('Error guardando lote:', error);
      throw new Error('Error al guardar el lote');
    }
  }

  async findById(id: string, organizationId: string): Promise<Lote | null> {
    try {
      // Buscar por ID personalizado dentro de la organización
      const q = query(
        collection(db, this.collectionName),
        where('id', '==', id),
        where('organizationId', '==', organizationId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const docData = querySnapshot.docs[0].data();
      return this.firestoreToEntity(docData);
    } catch (error) {
      console.error('Error buscando lote por ID:', error);
      throw new Error('Error al buscar el lote');
    }
  }

  async update(lote: Lote): Promise<void> {
    try {
      // Buscar el documento por ID personalizado
      const q = query(
        collection(db, this.collectionName),
        where('id', '==', lote.id),
        where('organizationId', '==', lote.organizationId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Lote no encontrado para actualizar');
      }

      const docRef = querySnapshot.docs[0].ref;
      const updateData = this.entityToFirestore(lote);
      
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando lote:', error);
      throw new Error('Error al actualizar el lote');
    }
  }

  async delete(id: string, organizationId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('id', '==', id),
        where('organizationId', '==', organizationId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Lote no encontrado para eliminar');
      }

      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error eliminando lote:', error);
      throw new Error('Error al eliminar el lote');
    }
  }

  async findByOrganization(organizationId: string): Promise<Lote[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        orderBy('fechaInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.firestoreToEntity(doc.data()));
    } catch (error) {
      console.error('Error obteniendo lotes por organización:', error);
      throw new Error('Error al obtener los lotes');
    }
  }

  async findByOrganizationAndType(organizationId: string, tipo: TipoLote): Promise<Lote[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('tipo', '==', tipo),
        orderBy('fechaInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.firestoreToEntity(doc.data()));
    } catch (error) {
      console.error('Error obteniendo lotes por organización y tipo:', error);
      throw new Error('Error al obtener los lotes');
    }
  }

  async findByOrganizationAndState(organizationId: string, estado: EstadoLote): Promise<Lote[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('estado', '==', estado),
        orderBy('fechaInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.firestoreToEntity(doc.data()));
    } catch (error) {
      console.error('Error obteniendo lotes por organización y estado:', error);
      throw new Error('Error al obtener los lotes');
    }
  }

  async findActiveLotes(organizationId: string): Promise<Lote[]> {
    return this.findByOrganizationAndState(organizationId, EstadoLote.ACTIVO);
  }

  async findLotesByGalpon(organizationId: string, galponId: string): Promise<Lote[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('galponId', '==', galponId),
        orderBy('fechaInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.firestoreToEntity(doc.data()));
    } catch (error) {
      console.error('Error obteniendo lotes por galpón:', error);
      throw new Error('Error al obtener los lotes del galpón');
    }
  }

  async findLotesByDateRange(organizationId: string, fechaInicio: Date, fechaFin: Date): Promise<Lote[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('organizationId', '==', organizationId),
        where('fechaInicio', '>=', Timestamp.fromDate(fechaInicio)),
        where('fechaInicio', '<=', Timestamp.fromDate(fechaFin)),
        orderBy('fechaInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.firestoreToEntity(doc.data()));
    } catch (error) {
      console.error('Error obteniendo lotes por rango de fechas:', error);
      throw new Error('Error al obtener los lotes');
    }
  }

  async findAvailableForSale(organizationId: string): Promise<Lote[]> {
    try {
      const activeLotes = await this.findActiveLotes(organizationId);
      return activeLotes.filter(lote => lote.puedeSerVendido());
    } catch (error) {
      console.error('Error obteniendo lotes disponibles para venta:', error);
      throw new Error('Error al obtener los lotes disponibles');
    }
  }

  async countByOrganization(organizationId: string): Promise<number> {
    try {
      const lotes = await this.findByOrganization(organizationId);
      return lotes.length;
    } catch (error) {
      console.error('Error contando lotes por organización:', error);
      throw new Error('Error al contar los lotes');
    }
  }

  async countByOrganizationAndType(organizationId: string, tipo: TipoLote): Promise<number> {
    try {
      const lotes = await this.findByOrganizationAndType(organizationId, tipo);
      return lotes.length;
    } catch (error) {
      console.error('Error contando lotes por organización y tipo:', error);
      throw new Error('Error al contar los lotes');
    }
  }

  async updateQuantity(loteId: string, organizationId: string, newQuantity: number): Promise<void> {
    try {
      const lote = await this.findById(loteId, organizationId);
      if (!lote) {
        throw new Error('Lote no encontrado');
      }

      lote.cantidadActual = newQuantity;
      lote.updatedAt = new Date();
      
      await this.update(lote);
    } catch (error) {
      console.error('Error actualizando cantidad del lote:', error);
      throw new Error('Error al actualizar la cantidad');
    }
  }

  async markAsSold(loteId: string, organizationId: string): Promise<void> {
    try {
      const lote = await this.findById(loteId, organizationId);
      if (!lote) {
        throw new Error('Lote no encontrado');
      }

      lote.estado = EstadoLote.VENDIDO;
      lote.updatedAt = new Date();
      
      await this.update(lote);
    } catch (error) {
      console.error('Error marcando lote como vendido:', error);
      throw new Error('Error al marcar el lote como vendido');
    }
  }

  subscribeToLotes(organizationId: string, callback: (lotes: Lote[]) => void): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('organizationId', '==', organizationId),
      orderBy('fechaInicio', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      try {
        const lotes = querySnapshot.docs.map(doc => this.firestoreToEntity(doc.data()));
        callback(lotes);
      } catch (error) {
        console.error('Error en suscripción a lotes:', error);
        callback([]);
      }
    });
  }

  subscribeToLote(id: string, organizationId: string, callback: (lote: Lote | null) => void): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('id', '==', id),
      where('organizationId', '==', organizationId)
    );

    return onSnapshot(q, (querySnapshot) => {
      try {
        if (querySnapshot.empty) {
          callback(null);
          return;
        }

        const lote = this.firestoreToEntity(querySnapshot.docs[0].data());
        callback(lote);
      } catch (error) {
        console.error('Error en suscripción a lote:', error);
        callback(null);
      }
    });
  }

  // Métodos de conversión

  private entityToFirestore(lote: Lote): any {
    return {
      id: lote.id,
      organizationId: lote.organizationId,
      tipo: lote.tipo,
      nombre: lote.nombre,
      raza: lote.raza,
      fechaInicio: Timestamp.fromDate(lote.fechaInicio),
      fechaNacimiento: Timestamp.fromDate(lote.fechaNacimiento),
      cantidadInicial: lote.cantidadInicial,
      cantidadActual: lote.cantidadActual,
      estado: lote.estado,
      createdBy: lote.createdBy,
      createdAt: Timestamp.fromDate(lote.createdAt),
      updatedAt: Timestamp.fromDate(lote.updatedAt),
      galponId: lote.galponId,
      pesoPromedio: lote.pesoPromedio,
      observaciones: lote.observaciones,
    };
  }

  private firestoreToEntity(data: any): Lote {
    return new Lote(
      data.id,
      data.organizationId,
      data.tipo,
      data.nombre,
      data.raza,
      data.fechaInicio instanceof Timestamp ? data.fechaInicio.toDate() : new Date(data.fechaInicio),
      data.fechaNacimiento instanceof Timestamp ? data.fechaNacimiento.toDate() : new Date(data.fechaNacimiento),
      data.cantidadInicial,
      data.cantidadActual,
      data.estado,
      data.createdBy,
      data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      data.galponId,
      data.pesoPromedio,
      data.observaciones
    );
  }
}



