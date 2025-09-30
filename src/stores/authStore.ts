/**
 * Store para la autenticación usando Zustand con persistencia AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    registerUser,
    resetPassword
} from '../services/auth.service';
import { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  clearPersistedData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    console.log('🏪 AuthStore: Iniciando login...');
    set({ isLoading: true, error: null });
    try {
      const user = await loginUser(email, password);
      console.log('🏪 AuthStore: Login exitoso, actualizando estado:', user);
      set({ user, isLoading: false, isAuthenticated: true });
      console.log('🏪 AuthStore: Estado actualizado correctamente');
    } catch (error: any) {
      console.error('🏪 AuthStore: Error en login:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Error al iniciar sesión',
        isAuthenticated: false 
      });
    }
  },
  
  register: async (email: string, password: string, displayName: string, role = UserRole.OPERADOR) => {
    set({ isLoading: true, error: null });
    try {
      const user = await registerUser(email, password, displayName, role);
      set({ user, isLoading: false, isAuthenticated: true });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al registrar usuario',
        isAuthenticated: false 
      });
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      await logoutUser();
      // Limpiar también los datos persistentes
      set({ user: null, isLoading: false, isAuthenticated: false, error: null });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Error al cerrar sesión'
      });
    }
  },
  
  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await resetPassword(email);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        isLoading: false, 
        error: error.message || 'Error al restablecer contraseña' 
      });
    }
  },
  
  loadUser: async () => {
    console.log('🏪 AuthStore: Cargando usuario...');
    set({ isLoading: true });
    try {
      // Con persistencia, el estado ya debería estar disponible
      // Pero verificamos con el servicio de autenticación para confirmar
      const user = await getCurrentUser();
      console.log('🏪 AuthStore: Usuario cargado:', user);

      // El estado persistente ya tiene los valores correctos
      // Solo actualizamos si hay una diferencia
      const currentUser = get().user;
      if (!currentUser && user) {
        set({
          user,
          isLoading: false,
          isAuthenticated: true
        });
      } else if (currentUser && !user) {
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      } else {
        set({ isLoading: false });
      }

      console.log('🏪 AuthStore: Estado de carga actualizado, isAuthenticated:', !!user);
    } catch (error: any) {
      console.error('🏪 AuthStore: Error al cargar usuario:', error);
      set({
        user: null,
        isLoading: false,
        error: error.message || 'Error al cargar usuario',
        isAuthenticated: false
      });
    }
  },
  
      clearError: () => set({ error: null }),

      clearPersistedData: () => {
        console.log('🏪 AuthStore: Limpiando datos persistentes...');
        set({ user: null, isAuthenticated: false, error: null });
      }
    }),
    {
      name: 'auth-storage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        error: state.error,
      }),
      migrate: (persistedState: any) => {
        try {
          const state = persistedState as AuthState;
          if (state?.user && state.user.lastLogin) {
            const last = state.user.lastLogin as unknown as string;
            if (typeof last === 'string') {
              state.user = { ...state.user, lastLogin: new Date(last) };
            }
          }
          return state;
        } catch {
          return persistedState as AuthState;
        }
      },
    }
  )
);

