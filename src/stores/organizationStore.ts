/**
 * Organization Store - Estado global para gestión multi-tenant
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Organization, OrganizationRole } from '../types/organization';
import { organizationService } from '../services/organization.service';

interface OrganizationState {
  // Estado
  organizations: Organization[];
  currentOrganization: Organization | null;
  userRole: OrganizationRole | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  loadOrganizations: () => Promise<void>;
  createOrganization: (data: {
    name: string;
    displayName: string;
    description?: string;
  }) => Promise<Organization>;
  switchOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (organizationId: string, updates: Partial<Organization>) => Promise<void>;
  inviteUser: (email: string, role: OrganizationRole) => Promise<string>;
  clearError: () => void;
  reset: () => void;
  
  // Getters
  getCurrentOrganizationId: () => string | null;
  hasPermission: (resource: string, action: string) => boolean;
  canManageOrganization: () => boolean;
}

const initialState = {
  organizations: [],
  currentOrganization: null,
  userRole: null,
  isLoading: false,
  error: null,
};

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadOrganizations: async () => {
        try {
          set({ isLoading: true, error: null });

          const [organizations, currentOrganization] = await Promise.all([
            organizationService.getUserOrganizations(),
            organizationService.getCurrentOrganization()
          ]);

          // Determinar el rol del usuario en la organización actual
          let userRole: OrganizationRole | null = null;
          if (currentOrganization) {
            // TODO: Obtener rol del usuario desde el servicio
            userRole = OrganizationRole.ADMIN; // Placeholder
          }

          set({
            organizations,
            currentOrganization,
            userRole,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Error cargando organizaciones:', error);
          set({
            isLoading: false,
            error: error.message || 'Error cargando organizaciones'
          });
        }
      },

      createOrganization: async (data) => {
        try {
          set({ isLoading: true, error: null });

          const newOrganization = await organizationService.createOrganization(data);
          
          set((state) => ({
            organizations: [...state.organizations, newOrganization],
            currentOrganization: newOrganization,
            userRole: OrganizationRole.ADMIN, // Creador es admin
            isLoading: false,
            error: null
          }));

          return newOrganization;
        } catch (error: any) {
          console.error('Error creando organización:', error);
          set({
            isLoading: false,
            error: error.message || 'Error creando organización'
          });
          throw error;
        }
      },

      switchOrganization: async (organizationId: string) => {
        try {
          set({ isLoading: true, error: null });

          await organizationService.switchOrganization(organizationId);
          
          const organization = get().organizations.find(org => org.id === organizationId);
          
          if (organization) {
            set({
              currentOrganization: organization,
              userRole: OrganizationRole.ADMIN, // TODO: Obtener rol real
              isLoading: false,
              error: null
            });
          } else {
            // Recargar si no está en el estado local
            await get().loadOrganizations();
          }
        } catch (error: any) {
          console.error('Error cambiando organización:', error);
          set({
            isLoading: false,
            error: error.message || 'Error cambiando organización'
          });
          throw error;
        }
      },

      updateOrganization: async (organizationId: string, updates: Partial<Organization>) => {
        try {
          set({ isLoading: true, error: null });

          await organizationService.updateOrganization(organizationId, updates);
          
          set((state) => ({
            organizations: state.organizations.map(org =>
              org.id === organizationId
                ? { ...org, ...updates, updatedAt: new Date() }
                : org
            ),
            currentOrganization: state.currentOrganization?.id === organizationId
              ? { ...state.currentOrganization, ...updates, updatedAt: new Date() }
              : state.currentOrganization,
            isLoading: false,
            error: null
          }));
        } catch (error: any) {
          console.error('Error actualizando organización:', error);
          set({
            isLoading: false,
            error: error.message || 'Error actualizando organización'
          });
          throw error;
        }
      },

      inviteUser: async (email: string, role: OrganizationRole) => {
        try {
          set({ isLoading: true, error: null });

          const currentOrg = get().currentOrganization;
          if (!currentOrg) {
            throw new Error('No hay una organización seleccionada');
          }

          const invitationId = await organizationService.inviteUser(currentOrg.id, email, role);
          
          set({ isLoading: false, error: null });
          return invitationId;
        } catch (error: any) {
          console.error('Error invitando usuario:', error);
          set({
            isLoading: false,
            error: error.message || 'Error invitando usuario'
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },

      // Getters
      getCurrentOrganizationId: () => {
        return get().currentOrganization?.id || null;
      },

      hasPermission: (resource: string, action: string) => {
        const { userRole, currentOrganization } = get();
        
        if (!currentOrganization || !userRole) return false;

        // Jerarquía de roles simple
        switch (userRole) {
          case OrganizationRole.ADMIN:
            return true; // Admin puede todo
          case OrganizationRole.MANAGER:
            return action !== 'delete' || resource !== 'organization';
          case OrganizationRole.OPERATOR:
            return action === 'read' || action === 'create';
          case OrganizationRole.VIEWER:
            return action === 'read';
          default:
            return false;
        }
      },

      canManageOrganization: () => {
        const { userRole } = get();
        return userRole === OrganizationRole.ADMIN || userRole === OrganizationRole.MANAGER;
      },
    }),
    {
      name: 'organization-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Solo persistir datos básicos
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        userRole: state.userRole,
        // No persistir organizations (se recargan), ni estados de loading/error
      }),
    }
  )
);


