/**
 * Store para gestión de Account (perfil de usuario)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Account, FarmAccess } from '../types/account';
import { DEFAULT_SUBSCRIPTION } from '../types/subscription';

interface AccountState {
  account: Account | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  loadAccount: (uid: string) => Promise<void>;
  createAccount: (uid: string, email: string, displayName: string) => Promise<Account>;
  updateAccount: (updates: Partial<Account>) => Promise<void>;
  addFarmAccess: (farmAccess: FarmAccess) => Promise<void>;
  removeFarmAccess: (farmId: string) => Promise<void>;
  switchCurrentFarm: (farmId: string) => Promise<void>;
  updateProfile: (profileUpdates: Partial<Account['profile']>) => Promise<void>;
  
  // Getters
  getCurrentFarmAccess: () => FarmAccess | null;
  getFarmAccess: (farmId: string) => FarmAccess | null;
  hasAccessToFarm: (farmId: string) => boolean;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      account: null,
      isLoading: false,
      error: null,

      loadAccount: async (uid: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('👤 AccountStore: Cargando account para UID:', uid);
          
          // TODO: Implementar carga desde Firebase
          // Por ahora simular account
          const mockAccount: Account = {
            uid,
            email: 'user@example.com',
            displayName: 'Usuario Ejemplo',
            profile: {
              appearance: {
                theme: 'system',
                fontSize: 'medium',
                compactMode: false,
              },
              preferences: {
                timezone: 'America/Santo_Domingo',
                language: 'es',
                dateFormat: 'DD/MM/YYYY',
                currency: 'DOP',
              },
              notifications: {
                email: true,
                push: true,
                sms: false,
              },
            },
            subscription: DEFAULT_SUBSCRIPTION,
            farms: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          };

          set({ account: mockAccount, isLoading: false });
        } catch (error: any) {
          console.error('❌ Error loading account:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      createAccount: async (uid: string, email: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('👤 AccountStore: Creando nuevo account');
          
          const newAccount: Account = {
            uid,
            email,
            displayName,
            profile: {
              appearance: {
                theme: 'system',
                fontSize: 'medium',
                compactMode: false,
              },
              preferences: {
                timezone: 'America/Santo_Domingo',
                language: 'es',
                dateFormat: 'DD/MM/YYYY',
                currency: 'DOP',
              },
              notifications: {
                email: true,
                push: true,
                sms: false,
              },
            },
            subscription: DEFAULT_SUBSCRIPTION,
            farms: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
          };

          // TODO: Guardar en Firebase
          set({ account: newAccount, isLoading: false });
          return newAccount;
        } catch (error: any) {
          console.error('❌ Error creating account:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      updateAccount: async (updates: Partial<Account>) => {
        try {
          const currentAccount = get().account;
          if (!currentAccount) throw new Error('No account found');

          const updatedAccount = {
            ...currentAccount,
            ...updates,
            updatedAt: new Date(),
          };

          // TODO: Actualizar en Firebase
          set({ account: updatedAccount });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      addFarmAccess: async (farmAccess: FarmAccess) => {
        try {
          const currentAccount = get().account;
          if (!currentAccount) throw new Error('No account found');

          const updatedFarms = [...currentAccount.farms, farmAccess];
          const updatedAccount = {
            ...currentAccount,
            farms: updatedFarms,
            currentFarmId: farmAccess.farmId, // Hacer la nueva granja la activa
            updatedAt: new Date(),
          };

          set({ account: updatedAccount });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      removeFarmAccess: async (farmId: string) => {
        try {
          const currentAccount = get().account;
          if (!currentAccount) throw new Error('No account found');

          const updatedFarms = currentAccount.farms.filter(f => f.farmId !== farmId);
          const newCurrentFarmId = currentAccount.currentFarmId === farmId
            ? (updatedFarms[0]?.farmId || undefined)
            : currentAccount.currentFarmId;

          const updatedAccount = {
            ...currentAccount,
            farms: updatedFarms,
            currentFarmId: newCurrentFarmId,
            updatedAt: new Date(),
          };

          set({ account: updatedAccount });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      switchCurrentFarm: async (farmId: string) => {
        try {
          const currentAccount = get().account;
          if (!currentAccount) throw new Error('No account found');

          if (!currentAccount.farms.some(f => f.farmId === farmId)) {
            throw new Error('No tienes acceso a esta granja');
          }

          const updatedAccount = {
            ...currentAccount,
            currentFarmId: farmId,
            updatedAt: new Date(),
          };

          set({ account: updatedAccount });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      updateProfile: async (profileUpdates: Partial<Account['profile']>) => {
        try {
          const currentAccount = get().account;
          if (!currentAccount) throw new Error('No account found');

          const updatedAccount = {
            ...currentAccount,
            profile: {
              ...currentAccount.profile,
              ...profileUpdates,
            },
            updatedAt: new Date(),
          };

          set({ account: updatedAccount });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      // === GETTERS ===

      getCurrentFarmAccess: () => {
        const account = get().account;
        if (!account || !account.currentFarmId) return null;
        return account.farms.find(f => f.farmId === account.currentFarmId) || null;
      },

      getFarmAccess: (farmId: string) => {
        const account = get().account;
        if (!account) return null;
        return account.farms.find(f => f.farmId === farmId) || null;
      },

      hasAccessToFarm: (farmId: string) => {
        return !!get().getFarmAccess(farmId);
      },
    }),
    {
      name: 'account-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
