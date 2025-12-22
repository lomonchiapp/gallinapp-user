/**
 * Multi-Tenant Auth Store - Estado global para autenticación multi-tenant
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../components/config/firebase';
import { 
  multiTenantAuthService, 
  MultiTenantUser 
} from '../services/multiTenantAuth.service';
import { Organization, OrganizationRole } from '../types/organization';

interface MultiTenantAuthState {
  // Estado de autenticación
  user: MultiTenantUser | null;
  currentOrganization: Organization | null;
  isLoading: boolean;
  isAuthInitialized: boolean;
  error: string | null;
  
  // Acciones de autenticación
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  registerUser: (data: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;
  registerWithOrganization: (data: {
    email: string;
    password: string;
    displayName: string;
    organizationName: string;
    organizationDisplayName: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Acciones de organización
  switchOrganization: (organizationId: string) => Promise<void>;
  loadCurrentOrganization: () => Promise<void>;
  
  // Acciones de preferencias
  updatePreferences: (preferences: Partial<MultiTenantUser['preferences']>) => Promise<void>;
  
  // Utilidades
  clearError: () => void;
  reset: () => void;
  initializeAuthState: () => () => void;
  
  // Getters
  getCurrentUserId: () => string | null;
  getCurrentOrganizationId: () => string | null;
  getUserRole: (organizationId?: string) => OrganizationRole | null;
  hasOrganizationAccess: (organizationId: string) => boolean;
  canManageOrganization: (organizationId?: string) => boolean;
}

const initialState = {
  user: null,
  currentOrganization: null,
  isLoading: false,
  isAuthInitialized: false,
  error: null,
};

export const useMultiTenantAuthStore = create<MultiTenantAuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === ACCIONES DE AUTENTICACIÓN ===

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await multiTenantAuthService.signIn(email, password);
          
          set({ 
            user, 
            isLoading: false,
            error: null 
          });

          // Cargar organización actual si existe
          if (user.currentOrganizationId) {
            await get().loadCurrentOrganization();
          }
        } catch (error: any) {
          console.error('Error en signIn:', error);
          set({
            isLoading: false,
            error: error.message || 'Error al iniciar sesión'
          });
          throw error;
        }
      },

      signInWithGoogle: async (idToken: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await multiTenantAuthService.signInWithGoogle(idToken);
          
          set({ 
            user, 
            isLoading: false,
            error: null 
          });

          // Cargar organización actual
          if (user.currentOrganizationId) {
            await get().loadCurrentOrganization();
          }
        } catch (error: any) {
          console.error('Error en signInWithGoogle:', error);
          set({
            isLoading: false,
            error: error.message || 'Error al iniciar sesión con Google'
          });
          throw error;
        }
      },

      registerUser: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const user = await multiTenantAuthService.registerUser(data);
          
          set({ 
            user, 
            currentOrganization: null, // No hay organización aún
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          console.error('Error en registerUser:', error);
          set({
            isLoading: false,
            error: error.message || 'Error al registrar usuario'
          });
          throw error;
        }
      },

      registerWithOrganization: async (data) => {
        try {
          set({ isLoading: true, error: null });
          
          const { user, organization } = await multiTenantAuthService.registerWithOrganization(data);
          
          set({ 
            user, 
            currentOrganization: organization,
            isLoading: false,
            error: null 
          });
        } catch (error: any) {
          console.error('Error en registerWithOrganization:', error);
          set({
            isLoading: false,
            error: error.message || 'Error al registrar usuario'
          });
          throw error;
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });
          
          await multiTenantAuthService.signOut();
          
          get().reset();
        } catch (error: any) {
          console.error('Error en signOut:', error);
          set({
            isLoading: false,
            error: error.message || 'Error al cerrar sesión'
          });
        }
      },

      // === ACCIONES DE ORGANIZACIÓN ===

      switchOrganization: async (organizationId: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await multiTenantAuthService.switchOrganization(organizationId);
          
          // Actualizar usuario local
          const user = get().user;
          if (user) {
            const updatedUser = {
              ...user,
              currentOrganizationId: organizationId
            };
            set({ user: updatedUser });
          }
          
          // Cargar nueva organización
          await get().loadCurrentOrganization();
          
          set({ isLoading: false, error: null });
        } catch (error: any) {
          console.error('Error en switchOrganization:', error);
          set({
            isLoading: false,
            error: error.message || 'Error al cambiar organización'
          });
          throw error;
        }
      },

      loadCurrentOrganization: async () => {
        try {
          const user = get().user;
          if (!user?.currentOrganizationId) {
            set({ currentOrganization: null });
            return;
          }

          // TODO: Implementar servicio para cargar organización
          // const organization = await organizationService.getOrganization(user.currentOrganizationId);
          // set({ currentOrganization: organization });
          
          console.log('TODO: Implementar carga de organización actual');
        } catch (error: any) {
          console.error('Error cargando organización actual:', error);
          set({ error: error.message });
        }
      },

      // === ACCIONES DE PREFERENCIAS ===

      updatePreferences: async (preferences) => {
        try {
          set({ isLoading: true, error: null });
          
          await multiTenantAuthService.updatePreferences(preferences);
          
          // Actualizar usuario local
          const user = get().user;
          if (user) {
            const updatedUser = {
              ...user,
              preferences: { ...user.preferences, ...preferences }
            };
            set({ user: updatedUser });
          }
          
          set({ isLoading: false, error: null });
        } catch (error: any) {
          console.error('Error actualizando preferencias:', error);
          set({
            isLoading: false,
            error: error.message || 'Error actualizando preferencias'
          });
          throw error;
        }
      },

      // === UTILIDADES ===

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          ...initialState,
          isAuthInitialized: true // Mantener inicializado
        });
      },

      initializeAuthState: () => {
        console.log('🔄 Inicializando estado de autenticación multi-tenant...');
        
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
          if (firebaseUser) {
            console.log('✅ Usuario autenticado detectado:', firebaseUser.email);
            
            try {
              const user = await multiTenantAuthService.getCurrentUser();
              
              if (user) {
                set({ 
                  user,
                  isAuthInitialized: true,
                  isLoading: false,
                  error: null
                });

                // Cargar organización actual
                if (user.currentOrganizationId) {
                  await get().loadCurrentOrganization();
                }
              } else {
                console.warn('Usuario de Firebase existe pero no en Firestore');
                set({
                  user: null,
                  currentOrganization: null,
                  isAuthInitialized: true,
                  isLoading: false,
                  error: null
                });
              }
            } catch (error) {
              console.error('Error cargando usuario:', error);
              set({
                user: null,
                currentOrganization: null,
                isAuthInitialized: true,
                isLoading: false,
                error: 'Error cargando datos del usuario'
              });
            }
          } else {
            console.log('🚪 Usuario no autenticado');
            set({
              user: null,
              currentOrganization: null,
              isAuthInitialized: true,
              isLoading: false,
              error: null
            });
          }
        });

        return unsubscribe;
      },

      // === GETTERS ===

      getCurrentUserId: () => {
        return get().user?.uid || null;
      },

      getCurrentOrganizationId: () => {
        return get().user?.currentOrganizationId || null;
      },

      getUserRole: (organizationId?: string) => {
        const user = get().user;
        if (!user) return null;

        const orgId = organizationId || user.currentOrganizationId;
        if (!orgId || !user.organizations[orgId]) return null;

        return user.organizations[orgId].role;
      },

      hasOrganizationAccess: (organizationId: string) => {
        const user = get().user;
        return user?.organizations[organizationId]?.isActive || false;
      },

      canManageOrganization: (organizationId?: string) => {
        const role = get().getUserRole(organizationId);
        return role === OrganizationRole.ADMIN || role === OrganizationRole.MANAGER;
      },
    }),
    {
      name: 'multi-tenant-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      // Solo persistir datos esenciales
      partialize: (state) => ({
        user: state.user,
        currentOrganization: state.currentOrganization,
        // No persistir estados temporales como isLoading, error
      }),
      // Migración para versiones futuras
      migrate: (persistedState: any, version: number) => {
        if (version < 1) {
          return {
            user: null,
            currentOrganization: null,
          };
        }
        return persistedState;
      },
    }
  )
);


