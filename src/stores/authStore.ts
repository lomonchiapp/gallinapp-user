/**
 * Store para la autenticación usando Zustand con persistencia AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
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
  hasHydrated: boolean; // Nuevo: indica si el store ha cargado desde AsyncStorage
  
  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  clearPersistedData: () => void;
  setHasHydrated: (value: boolean) => void; // Nuevo
  initializeAuthListener: () => () => void; // Nuevo: Firebase Auth Listener
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true, // Cambiado: inicia en true hasta que se hidrate
      error: null,
      isAuthenticated: false,
      hasHydrated: false, // Nuevo
  
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
    
    // No procesar hasta que el store esté hidratado
    const state = get();
    if (!state.hasHydrated) {
      console.log('⏳ AuthStore: Esperando hidratación...');
      return;
    }
    
    // Primero revisar si ya tenemos usuario persistido
    const persistedUser = state.user;
    const persistedIsAuthenticated = state.isAuthenticated;
    
    if (persistedUser && persistedIsAuthenticated) {
      console.log('✅ Usuario persistido encontrado:', persistedUser.email);
      // Validar con Firebase en segundo plano
      getCurrentUser().then((user) => {
        if (user) {
          console.log('✅ Usuario validado con Firebase');
          // Actualizar con datos frescos de Firebase
          set({
            user,
            isLoading: false,
            isAuthenticated: true
          });
        } else {
          console.warn('⚠️ Usuario persistido pero no en Firebase - limpiando sesión');
          set({
            user: null,
            isLoading: false,
            isAuthenticated: false
          });
        }
      }).catch((error) => {
        console.error('❌ Error validando usuario:', error);
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      });
      
      // Mientras tanto, mostrar datos persistidos
      set({ isLoading: false });
      return;
    }
    
    // Si no hay datos persistidos, intentar obtener de Firebase
    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      console.log('🏪 AuthStore: Usuario cargado desde Firebase:', user);

      if (user) {
        set({
          user,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
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
      },

      setHasHydrated: (value: boolean) => {
        set({ hasHydrated: value });
      },

      // Firebase Auth Listener
      initializeAuthListener: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          const state = get();
          
          // No procesar cambios hasta que el store esté hidratado
          if (!state.hasHydrated) {
            console.log('⏳ AuthListener: Esperando hidratación...');
            return;
          }

          console.log('🔥 Firebase Auth State Changed:', {
            hasUser: !!firebaseUser,
            userEmail: firebaseUser?.email,
            currentAuthState: state.isAuthenticated
          });

          if (firebaseUser) {
            // Usuario autenticado en Firebase
            try {
              // Solo actualizar si no tenemos el usuario o es diferente
              if (!state.user || state.user.uid !== firebaseUser.uid) {
                console.log('🔄 AuthListener: Cargando usuario desde Firebase...');
                const user = await getCurrentUser();
                
                if (user) {
                  console.log('✅ AuthListener: Usuario cargado exitosamente');
                  set({ 
                    user, 
                    isAuthenticated: true, 
                    isLoading: false,
                    error: null
                  });
                } else {
                  // Usuario existe en Firebase pero no en nuestro sistema
                  console.warn('⚠️ AuthListener: Usuario no encontrado en nuestro sistema');
                  set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isLoading: false,
                    error: 'Usuario no registrado en el sistema'
                  });
                }
              } else {
                // Usuario ya está cargado, solo actualizar loading
                console.log('✅ AuthListener: Usuario ya cargado');
                set({ isLoading: false });
              }
            } catch (error) {
              console.error('❌ AuthListener: Error al cargar usuario:', error);
              set({ 
                user: null, 
                isAuthenticated: false, 
                isLoading: false,
                error: 'Error al cargar los datos del usuario'
              });
            }
          } else {
            // No hay usuario autenticado
            console.log('🚪 AuthListener: Usuario cerrado sesión');
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              error: null
            });
          }
        });

        return unsubscribe;
      }
    }),
    {
      name: 'auth-storage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Configuración para mejorar la hidratación
      onRehydrateStorage: (state) => {
        console.log('🔄 [AuthStore] Iniciando hidratación desde AsyncStorage...');
        return (state, error) => {
          if (error) {
            console.error('❌ [AuthStore] Error durante la hidratación:', error);
          } else {
            console.log('✅ [AuthStore] Hidratación completada:', {
              hasUser: !!state?.user,
              isAuthenticated: state?.isAuthenticated,
              userEmail: state?.user?.email
            });
          }
          // Marcar como hidratado
          state?.setHasHydrated(true);
        };
      },
      // Configurar qué propiedades persistir
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // No persistir isLoading, error, ni hasHydrated
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

