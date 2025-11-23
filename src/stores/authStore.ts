/**
 * Store para la autenticación usando Zustand con persistencia AsyncStorage
 * 
 * IMPORTANTE: Este store ahora depende directamente de Firebase Auth state.
 * Firebase Auth maneja la persistencia automáticamente con AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { auth } from '../components/config/firebase';
import {
  AppUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword
} from '../services/auth.service';
import { UserRole } from '../types/enums';

interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  authInitialized: boolean; // Indica si Firebase Auth ya inicializó
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  initializeAuthState: () => () => void; // Inicializar listener de Firebase Auth
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      error: null,
      isAuthenticated: false,
      authInitialized: false,
  
      login: async (email: string, password: string) => {
        console.log('🏪 AuthStore: Iniciando login...');
        set({ isLoading: true, error: null });
        try {
          const user = await loginUser(email, password);
          console.log('🏪 AuthStore: Login exitoso');
          
          // Firebase Auth ya actualizó el estado, solo actualizamos nuestro store
          set({ 
            user, 
            isLoading: false, 
            isAuthenticated: true,
            error: null
          });
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
          set({ 
            user, 
            isLoading: false, 
            isAuthenticated: true,
            error: null
          });
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
          // Firebase Auth ya actualizó el estado, solo limpiamos nuestro store
          set({ 
            user: null, 
            isLoading: false, 
            isAuthenticated: false, 
            error: null 
          });
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
  
      clearError: () => set({ error: null }),

      /**
       * Inicializar listener de Firebase Auth
       * Este listener se ejecuta cuando:
       * 1. La app inicia (Firebase Auth restaura la sesión desde AsyncStorage)
       * 2. El usuario hace login
       * 3. El usuario hace logout
       * 4. El token expira
       */
      initializeAuthState: () => {
        console.log('🔄 AuthStore: Inicializando listener de Firebase Auth...');
        
        // Verificar si ya hay un usuario autenticado (sesión persistida)
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log('✅ AuthStore: Usuario encontrado en Firebase Auth:', currentUser.email);
          // Cargar datos del usuario desde Firestore
          getCurrentUser().then((appUser) => {
            if (appUser) {
              set({ 
                user: appUser,
                isAuthenticated: true,
                isLoading: false,
                authInitialized: true,
                error: null
              });
            } else {
              set({ 
                user: null,
                isAuthenticated: false,
                isLoading: false,
                authInitialized: true,
                error: null
              });
            }
          }).catch((error) => {
            console.error('❌ Error al cargar usuario:', error);
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              authInitialized: true,
              error: null
            });
          });
        } else {
          console.log('🚪 AuthStore: No hay usuario autenticado');
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            authInitialized: true,
            error: null
          });
        }

        // Suscribirse a cambios en el estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
          console.log('🔥 Firebase Auth State Changed:', {
            hasUser: !!firebaseUser,
            userEmail: firebaseUser?.email,
            currentAuthState: get().isAuthenticated
          });

          if (firebaseUser) {
            // Usuario autenticado
            try {
              console.log('✅ AuthStore: Usuario autenticado, cargando datos...');
              const appUser = await getCurrentUser();
              
              if (appUser) {
                set({ 
                  user: appUser,
                  isAuthenticated: true,
                  isLoading: false,
                  authInitialized: true,
                  error: null
                });
                console.log('✅ AuthStore: Usuario cargado exitosamente');
              } else {
                console.warn('⚠️ AuthStore: Usuario de Firebase Auth no encontrado en Firestore');
                set({ 
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  authInitialized: true,
                  error: 'Usuario no encontrado en el sistema'
                });
              }
            } catch (error) {
              console.error('❌ AuthStore: Error al cargar usuario:', error);
              set({ 
                user: null,
                isAuthenticated: false,
                isLoading: false,
                authInitialized: true,
                error: 'Error al cargar los datos del usuario'
              });
            }
          } else {
            // Usuario no autenticado
            console.log('🚪 AuthStore: Usuario cerrado sesión');
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              authInitialized: true,
              error: null
            });
          }
        });

        return unsubscribe;
      }
    }),
    {
      name: 'auth-storage',
      version: 3, // Incrementar versión para migración
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir datos básicos, no el estado de carga
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // No persistir isLoading, error, ni authInitialized
      }),
      // Migración de versiones anteriores
      migrate: (persistedState: any, version) => {
        if (version < 3) {
          // Limpiar datos antiguos si es necesario
          return {
            user: persistedState?.user || null,
            isAuthenticated: persistedState?.isAuthenticated || false,
          };
        }
        return persistedState;
      },
    }
  )
);
