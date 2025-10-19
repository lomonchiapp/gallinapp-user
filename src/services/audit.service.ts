/**
 * Servicio de auditoría para rastrear cambios críticos
 */

import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { getCurrentUserId } from './auth.service';

export interface AuditEntry {
  id: string;
  entityType: 'lote' | 'factura' | 'venta' | 'gasto' | 'mortalidad' | 'peso' | 'configuracion';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'sell' | 'buy' | 'transfer';
  userId: string;
  userEmail?: string;
  timestamp: Date;
  before?: any;
  after?: any;
  metadata: {
    ip?: string;
    userAgent?: string;
    reason?: string;
    cantidad?: number;
    precio?: number;
    clienteId?: string;
    facturaId?: string;
    [key: string]: any;
  };
}

const AUDIT_COLLECTION = 'audit_log';

class AuditService {
  /**
   * Registra una entrada de auditoría
   */
  async logAction(entry: Omit<AuditEntry, 'id' | 'userId' | 'timestamp'>): Promise<void> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('No se puede registrar auditoría: usuario no autenticado');
        return;
      }

      const auditEntry: Omit<AuditEntry, 'id'> = {
        ...entry,
        userId,
        timestamp: new Date(),
      };

      await addDoc(collection(db, AUDIT_COLLECTION), auditEntry);
      
      console.log(`📝 Audit log: ${entry.action} ${entry.entityType} ${entry.entityId}`);
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
      // No lanzar error para no interrumpir operaciones principales
    }
  }

  /**
   * Registra creación de entidad
   */
  async logCreate(
    entityType: AuditEntry['entityType'],
    entityId: string,
    data: any,
    metadata?: AuditEntry['metadata']
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      action: 'create',
      after: data,
      metadata: metadata || {},
    });
  }

  /**
   * Registra actualización de entidad
   */
  async logUpdate(
    entityType: AuditEntry['entityType'],
    entityId: string,
    before: any,
    after: any,
    metadata?: AuditEntry['metadata']
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      action: 'update',
      before,
      after,
      metadata: metadata || {},
    });
  }

  /**
   * Registra eliminación de entidad
   */
  async logDelete(
    entityType: AuditEntry['entityType'],
    entityId: string,
    data: any,
    metadata?: AuditEntry['metadata']
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      action: 'delete',
      before: data,
      metadata: metadata || {},
    });
  }

  /**
   * Registra venta
   */
  async logSell(
    entityType: AuditEntry['entityType'],
    entityId: string,
    cantidad: number,
    precio: number,
    clienteId: string,
    facturaId: string,
    metadata?: AuditEntry['metadata']
  ): Promise<void> {
    await this.logAction({
      entityType,
      entityId,
      action: 'sell',
      metadata: {
        cantidad,
        precio,
        clienteId,
        facturaId,
        ...metadata,
      },
    });
  }

  /**
   * Obtiene historial de auditoría para una entidad
   */
  async getAuditHistory(
    entityType: AuditEntry['entityType'],
    entityId: string,
    limitCount: number = 50
  ): Promise<AuditEntry[]> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        collection(db, AUDIT_COLLECTION),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: AuditEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AuditEntry);
      });

      return entries;
    } catch (error) {
      console.error('Error al obtener historial de auditoría:', error);
      return [];
    }
  }

  /**
   * Obtiene auditoría por usuario
   */
  async getUserAuditHistory(
    limitCount: number = 100
  ): Promise<AuditEntry[]> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        collection(db, AUDIT_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const entries: AuditEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AuditEntry);
      });

      return entries;
    } catch (error) {
      console.error('Error al obtener auditoría del usuario:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async getAuditStats(): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActions: AuditEntry[];
  }> {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const q = query(
        collection(db, AUDIT_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(1000) // Últimas 1000 acciones
      );

      const querySnapshot = await getDocs(q);
      const entries: AuditEntry[] = [];
      const actionsByType: Record<string, number> = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entry = {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as AuditEntry;

        entries.push(entry);
        
        const key = `${entry.entityType}_${entry.action}`;
        actionsByType[key] = (actionsByType[key] || 0) + 1;
      });

      return {
        totalActions: entries.length,
        actionsByType,
        recentActions: entries.slice(0, 20), // Últimas 20 acciones
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de auditoría:', error);
      return {
        totalActions: 0,
        actionsByType: {},
        recentActions: [],
      };
    }
  }
}

export const auditService = new AuditService();












