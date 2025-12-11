/**
 * Servicio Resolver: Resuelve organizationId/farmId
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo resuelve IDs, no lógica de negocio
 * - Open/Closed: Extensible para nuevos tipos de resolución
 * 
 * Durante la migración, los documentos pueden tener:
 * - organizationId (antiguo)
 * - farmId (nuevo)
 * - Ambos (durante transición)
 * 
 * Este servicio resuelve el ID correcto basado en el contexto actual
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../components/config/firebase';
import { useFarmStore } from '../../stores/farmStore';
import { useOrganizationStore } from '../../stores/organizationStore';

export class FarmIdResolver {
  /**
   * Resuelve el ID de farm/organization actual
   * Prioriza farmId sobre organizationId
   */
  static getCurrentFarmId(): string | null {
    // 1. Intentar obtener farmId del farmStore (Single Source of Truth)
    const { currentFarm } = useFarmStore.getState();
    if (currentFarm?.id) {
      return currentFarm.id;
    }

    // 2. Intentar obtener organizationId del organizationStore (compatibilidad)
    const { currentOrganization } = useOrganizationStore.getState();
    if (currentOrganization?.id) {
      return currentOrganization.id;
    }

    return null;
  }

  /**
   * Resuelve farmId desde un documento que puede tener organizationId o farmId
   */
  static async resolveFarmIdFromDocument(
    documentId: string,
    collectionName: string
  ): Promise<string | null> {
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      
      // Priorizar farmId (nuevo)
      if (data.farmId) {
        return data.farmId;
      }
      
      // Usar organizationId como fallback (compatibilidad)
      if (data.organizationId) {
        return data.organizationId;
      }

      return null;
    } catch (error) {
      console.error('Error resolviendo farmId:', error);
      return null;
    }
  }

  /**
   * Normaliza un ID: si es organizationId, intenta obtener el farmId correspondiente
   */
  static async normalizeToFarmId(id: string): Promise<string> {
    // Verificar si es un farmId válido
    try {
      const farmRef = doc(db, 'farms', id);
      const farmDoc = await getDoc(farmRef);
      
      if (farmDoc.exists()) {
        return id; // Ya es un farmId válido
      }
    } catch {
      // Continuar con verificación de Organization
    }

    // Verificar si es un organizationId y tiene farm correspondiente
    try {
      const orgRef = doc(db, 'organizations', id);
      const orgDoc = await getDoc(orgRef);
      
      if (orgDoc.exists()) {
        // Verificar si existe una farm con el mismo ID (migrada)
        const farmRef = doc(db, 'farms', id);
        const farmDoc = await getDoc(farmRef);
        
        if (farmDoc.exists()) {
          return id; // La farm tiene el mismo ID que la organization
        }
      }
    } catch {
      // Continuar
    }

    // Si no se puede normalizar, retornar el ID original
    // (será tratado como farmId en el nuevo sistema)
    return id;
  }

  /**
   * Obtiene todos los IDs válidos (farmId y organizationId) para consultas
   * Útil para queries que necesitan buscar en ambos sistemas durante la migración
   */
  static async getValidFarmIds(): Promise<string[]> {
    const ids: string[] = [];
    
    // Obtener farmIds del farmStore
    const { farms } = useFarmStore.getState();
    farms.forEach(farm => {
      if (farm.id) ids.push(farm.id);
    });

    // Obtener organizationIds del organizationStore (si no están ya como farms)
    const { organizations } = useOrganizationStore.getState();
    organizations.forEach(org => {
      if (org.id && !ids.includes(org.id)) {
        ids.push(org.id);
      }
    });

    return ids;
  }
}


