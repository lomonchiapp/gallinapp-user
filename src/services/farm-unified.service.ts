/**
 * Servicio Unificado: Farm como Single Source of Truth
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Gestiona Farms como única fuente de verdad
 * - Open/Closed: Extensible sin modificar código existente
 * - Dependency Inversion: Depende de abstracciones (repositorios)
 * 
 * Este servicio asegura que Farm sea la única fuente de verdad,
 * mientras mantiene compatibilidad con Organization durante la migración
 */

import { useAuthStore } from '../stores/authStore';
import { useMultiTenantAuthStore } from '../stores/multiTenantAuthStore';
import { Farm } from '../types/farm';
import { OrganizationFarmAdapter } from './compatibility/organization-farm.adapter';
import { createFarm, deleteFarm, loadUserFarms, updateFarm } from './farm.service';
import { organizationService } from './organization.service';

/**
 * Servicio unificado que garantiza Farm como Single Source of Truth
 * 
 * Estrategia:
 * 1. Intentar obtener Farms primero (fuente de verdad)
 * 2. Si no hay Farms, intentar obtener Organizations y adaptarlas
 * 3. Si hay Organizations sin migrar, sugerir migración
 */
export class FarmUnifiedService {
  /**
   * Obtiene todas las farms del usuario (Single Source of Truth)
   * Si hay Organizations sin migrar, las adapta temporalmente
   */
  async getUserFarms(): Promise<Farm[]> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // 1. Intentar cargar Farms (fuente de verdad)
      const farms = await loadUserFarms(userId);
      
      if (farms.length > 0) {
        return farms; // Farms encontradas, usar como fuente de verdad
      }

      // 2. Si no hay Farms, intentar obtener Organizations y adaptarlas
      const organizations = await organizationService.getUserOrganizations();
      
      if (organizations.length > 0) {
        // Adaptar Organizations → Farms temporalmente
        const adaptedFarms = organizations.map(org => 
          OrganizationFarmAdapter.organizationToFarm(org)
        );
        
        console.warn('⚠️ Usando Organizations adaptadas como Farms. Considere migrar a Farms.');
        return adaptedFarms;
      }

      return []; // No hay ni Farms ni Organizations
    } catch (error: any) {
      console.error('Error obteniendo farms:', error);
      throw error;
    }
  }

  /**
   * Obtiene la farm actual del usuario
   */
  async getCurrentFarm(): Promise<Farm | null> {
    const farms = await this.getUserFarms();
    return farms[0] || null; // Por ahora, retornar la primera
  }

  /**
   * Crea una nueva farm (Single Source of Truth)
   * Si hay una Organization activa, la migra automáticamente
   */
  async createFarm(name: string, ownerId: string): Promise<Farm> {
    // Verificar si hay una Organization activa que debería migrarse
    try {
      const currentOrg = await organizationService.getCurrentOrganization();
      
      if (currentOrg) {
        console.log('🔄 Organization encontrada, migrando a Farm...');
        // Migrar Organization → Farm
        const { organizationToFarmMigration } = await import('./migration/organization-to-farm.migration');
        return await organizationToFarmMigration.migrateOrganization(currentOrg);
      }
    } catch (error) {
      // Si no hay Organization, continuar con creación normal
      console.log('No hay Organization para migrar, creando nueva Farm');
    }

    // Crear nueva Farm
    return await createFarm(name, ownerId);
  }

  /**
   * Actualiza una farm
   */
  async updateFarm(farmId: string, updates: Partial<Farm>): Promise<void> {
    return await updateFarm(farmId, updates);
  }

  /**
   * Elimina una farm (marca como inactiva)
   */
  async deleteFarm(farmId: string): Promise<void> {
    return await deleteFarm(farmId);
  }

  /**
   * Obtiene el ID del usuario actual
   */
  private getCurrentUserId(): string | null {
    const multiTenantState = useMultiTenantAuthStore.getState();
    const authState = useAuthStore.getState();
    
    return multiTenantState.user?.uid || authState.user?.uid || null;
  }

  /**
   * Verifica si hay Organizations sin migrar
   */
  async hasUnmigratedOrganizations(): Promise<boolean> {
    try {
      const organizations = await organizationService.getUserOrganizations();
      const farms = await this.getUserFarms();
      
      // Si hay Organizations pero no Farms, hay datos sin migrar
      return organizations.length > 0 && farms.length === 0;
    } catch {
      return false;
    }
  }

  /**
   * Migra todas las Organizations a Farms
   */
  async migrateAllOrganizations(): Promise<void> {
    const { organizationToFarmMigration } = await import('./migration/organization-to-farm.migration');
    const result = await organizationToFarmMigration.migrateAll();
    
    if (!result.success) {
      throw new Error(`Error en migración: ${result.errors.map(e => e.error).join(', ')}`);
    }
    
    console.log(`✅ Migradas ${result.migratedCount} organizaciones a farms`);
  }
}

// Instancia singleton
export const farmUnifiedService = new FarmUnifiedService();



