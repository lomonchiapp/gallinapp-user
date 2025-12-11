/**
 * Hook para gestión de organizaciones multi-tenant
 */

import { useState, useEffect, useCallback } from 'react';
import { Organization, OrganizationRole } from '../types/organization';
import { organizationService } from '../services/organization.service';
import { useAuthStore } from '../stores/authStore';

interface UseOrganizationReturn {
  // Estado
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  createOrganization: (data: {
    name: string;
    displayName: string;
    description?: string;
  }) => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (organizationId: string, updates: Partial<Organization>) => Promise<void>;
  inviteUser: (email: string, role: OrganizationRole) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  
  // Utilidades
  hasCurrentOrganization: boolean;
  canCreateOrganizations: boolean;
  canManageCurrentOrganization: boolean;
}

export const useOrganization = (): UseOrganizationReturn => {
  const { user, isAuthenticated } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga las organizaciones del usuario
   */
  const loadOrganizations = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [userOrgs, currentOrg] = await Promise.all([
        organizationService.getUserOrganizations(),
        organizationService.getCurrentOrganization()
      ]);

      setOrganizations(userOrgs);
      setCurrentOrganization(currentOrg);
    } catch (err: any) {
      console.error('Error cargando organizaciones:', err);
      setError(err.message || 'Error cargando organizaciones');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Crea una nueva organización
   */
  const createOrganization = useCallback(async (data: {
    name: string;
    displayName: string;
    description?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const newOrg = await organizationService.createOrganization(data);
      
      // Actualizar estado local
      setOrganizations(prev => [...prev, newOrg]);
      setCurrentOrganization(newOrg);
    } catch (err: any) {
      console.error('Error creando organización:', err);
      setError(err.message || 'Error creando organización');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cambia a otra organización
   */
  const switchOrganization = useCallback(async (organizationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await organizationService.switchOrganization(organizationId);
      
      // Buscar la organización en el estado local
      const org = organizations.find(o => o.id === organizationId);
      if (org) {
        setCurrentOrganization(org);
      } else {
        // Si no está en el estado local, recargar
        await loadOrganizations();
      }
    } catch (err: any) {
      console.error('Error cambiando organización:', err);
      setError(err.message || 'Error cambiando organización');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [organizations, loadOrganizations]);

  /**
   * Actualiza una organización
   */
  const updateOrganization = useCallback(async (organizationId: string, updates: Partial<Organization>) => {
    try {
      setIsLoading(true);
      setError(null);

      await organizationService.updateOrganization(organizationId, updates);
      
      // Actualizar estado local
      setOrganizations(prev =>
        prev.map(org =>
          org.id === organizationId
            ? { ...org, ...updates, updatedAt: new Date() }
            : org
        )
      );

      if (currentOrganization?.id === organizationId) {
        setCurrentOrganization(prev =>
          prev ? { ...prev, ...updates, updatedAt: new Date() } : prev
        );
      }
    } catch (err: any) {
      console.error('Error actualizando organización:', err);
      setError(err.message || 'Error actualizando organización');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  /**
   * Invita un usuario a la organización actual
   */
  const inviteUser = useCallback(async (email: string, role: OrganizationRole) => {
    if (!currentOrganization) {
      throw new Error('No hay una organización seleccionada');
    }

    try {
      setIsLoading(true);
      setError(null);

      await organizationService.inviteUser(currentOrganization.id, email, role);
    } catch (err: any) {
      console.error('Error invitando usuario:', err);
      setError(err.message || 'Error invitando usuario');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganization]);

  /**
   * Refresca la lista de organizaciones
   */
  const refreshOrganizations = useCallback(async () => {
    await loadOrganizations();
  }, [loadOrganizations]);

  // Cargar organizaciones cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && user) {
      loadOrganizations();
    } else {
      // Limpiar estado cuando el usuario se desautentica
      setOrganizations([]);
      setCurrentOrganization(null);
      setError(null);
    }
  }, [isAuthenticated, user, loadOrganizations]);

  // Valores computados
  const hasCurrentOrganization = currentOrganization !== null;
  const canCreateOrganizations = isAuthenticated && user !== null;
  const canManageCurrentOrganization = currentOrganization !== null && user !== null;

  return {
    // Estado
    organizations,
    currentOrganization,
    isLoading,
    error,
    
    // Acciones
    createOrganization,
    switchOrganization,
    updateOrganization,
    inviteUser,
    refreshOrganizations,
    
    // Utilidades
    hasCurrentOrganization,
    canCreateOrganizations,
    canManageCurrentOrganization
  };
};


