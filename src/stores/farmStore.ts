/**
 * Store principal para granjas multi-tenant (Farm = Organization)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { farmUnifiedService } from '../services/farm-unified.service';
import { FarmRole } from '../types/account';
import {
  AccessRequestStatus,
  Collaborator,
  FarmAccessRequest,
  FarmCollaboratorSummary
} from '../types/collaborator';
import { DEFAULT_FARM_SETTINGS, Farm } from '../types/farm';
import {
  SUBSCRIPTION_LIMITS,
  SubscriptionLimits,
  SubscriptionPlan
} from '../types/subscription';
import { useAuthStore } from './authStore';
import { useMultiTenantAuthStore } from './multiTenantAuthStore';

interface FarmState {
  // Estado actual
  farms: Farm[];
  currentFarm: Farm | null;
  collaborators: Collaborator[];
  accessRequests: FarmAccessRequest[];
  
  // Estado de carga
  isLoading: boolean;
  isCreatingFarm: boolean;
  isProcessingRequest: boolean;
  error: string | null;
  
  // Acciones principales de granjas
  loadUserFarms: (accountId: string) => Promise<void>;
  loadFarms: () => Promise<void>; // Alias que obtiene userId automáticamente
  createFarm: (name: string, ownerId: string) => Promise<Farm>;
  switchFarm: (farmId: string) => Promise<void>;
  updateFarm: (farmId: string, updates: Partial<Farm>) => Promise<void>;
  deleteFarm: (farmId: string) => Promise<void>;
  
  // Acciones de colaboradores
  loadCollaborators: (farmId: string) => Promise<void>;
  removeCollaborator: (farmId: string, collaboratorId: string) => Promise<void>;
  updateCollaboratorRole: (farmId: string, collaboratorId: string, newRole: FarmRole) => Promise<void>;
  
  // Acciones de solicitudes de acceso
  loadAccessRequests: (farmId: string) => Promise<void>;
  requestFarmAccess: (farmCode: string, requesterId: string, requesterEmail: string, requestedRole?: FarmRole) => Promise<void>;
  approveAccessRequest: (requestId: string, approverId: string) => Promise<void>;
  rejectAccessRequest: (requestId: string, reviewerId: string, reason?: string) => Promise<void>;
  cancelAccessRequest: (requestId: string) => Promise<void>;
  
  // Utilidades
  generateFarmCode: () => string;
  validateFarmCode: (farmCode: string) => Promise<{ valid: boolean; farm?: Partial<Farm> }>;
  getCurrentFarmLimits: () => SubscriptionLimits;
  getCollaboratorSummary: (farmId: string) => FarmCollaboratorSummary;
  canAddCollaborator: (farmId: string) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  
  // Estado de onboarding
  needsOnboarding: (accountId: string) => Promise<boolean>;
}

export const useFarmStore = create<FarmState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    farms: [],
    currentFarm: null,
    collaborators: [],
    accessRequests: [],
    isLoading: false,
    isCreatingFarm: false,
    isProcessingRequest: false,
    error: null,

    // === ACCIONES DE GRANJAS ===

    loadUserFarms: async (accountId: string) => {
      set({ isLoading: true, error: null });
      try {
        console.log('🏢 FarmStore: Cargando granjas para account:', accountId);
        
        // Usar servicio unificado (Single Source of Truth)
        const farms = await farmUnifiedService.getUserFarms();

        const currentFarm = farms[0] || null;
        set({ 
          farms, 
          currentFarm,
          isLoading: false 
        });

        // Cargar colaboradores de la granja actual
        if (currentFarm) {
          await get().loadCollaborators(currentFarm.id);
          await get().loadAccessRequests(currentFarm.id);
        }
      } catch (error: any) {
        console.error('❌ Error loading farms:', error);
        set({ error: error.message, isLoading: false });
      }
    },

    loadFarms: async () => {
      // Obtener userId de los stores de autenticación
      const authState = useAuthStore.getState();
      const multiTenantState = useMultiTenantAuthStore.getState();
      
      const userId = multiTenantState.user?.uid || authState.user?.uid;
      
      if (!userId) {
        console.warn('⚠️ No se encontró userId para cargar granjas');
        set({ error: 'Usuario no autenticado', isLoading: false });
        return;
      }

      await get().loadUserFarms(userId);
    },

    createFarm: async (name: string, ownerId: string) => {
      set({ isCreatingFarm: true, error: null });
      try {
        console.log('🏢 FarmStore: Creando nueva granja:', name);
        
        const farmCode = get().generateFarmCode();
        const newFarm: Farm = {
          id: `farm_${Date.now()}`, // TODO: Usar Firebase auto-ID
          name: name.trim(),
          farmCode,
          farmInfo: {},
          settings: DEFAULT_FARM_SETTINGS,
          subscription: {
            plan: SubscriptionPlan.FREE, // Plan gratuito inicial
            status: 'trialing' as any,
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días de prueba
            limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE],
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          ownerId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };

        // TODO: Guardar en Firebase
        const updatedFarms = [...get().farms, newFarm];
        set({
          farms: updatedFarms,
          currentFarm: newFarm,
          isCreatingFarm: false,
        });

        console.log('✅ Granja creada exitosamente:', newFarm.farmCode);
        return newFarm;
      } catch (error: any) {
        console.error('❌ Error creating farm:', error);
        set({ error: error.message, isCreatingFarm: false });
        throw error;
      }
    },

    switchFarm: async (farmId: string) => {
      const farm = get().farms.find(f => f.id === farmId);
      if (farm) {
        set({ currentFarm: farm });
        
        // Cargar datos específicos de la granja
        await get().loadCollaborators(farmId);
        await get().loadAccessRequests(farmId);
        
        console.log('🔄 Switched to farm:', farm.name);
      }
    },

    updateFarm: async (farmId: string, updates: Partial<Farm>) => {
      try {
        // Actualizar en Firebase
        await farmUnifiedService.updateFarm(farmId, updates);
        
        // Actualizar estado local
        const updatedFarms = get().farms.map(farm =>
          farm.id === farmId 
            ? { ...farm, ...updates, updatedAt: new Date() }
            : farm
        );
        
        const updatedCurrentFarm = get().currentFarm?.id === farmId
          ? { ...get().currentFarm!, ...updates, updatedAt: new Date() }
          : get().currentFarm;

        set({ 
          farms: updatedFarms,
          currentFarm: updatedCurrentFarm,
        });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    deleteFarm: async (farmId: string) => {
      try {
        // TODO: Implementar eliminación en Firebase
        const updatedFarms = get().farms.filter(f => f.id !== farmId);
        const newCurrentFarm = get().currentFarm?.id === farmId 
          ? (updatedFarms[0] || null)
          : get().currentFarm;

        set({
          farms: updatedFarms,
          currentFarm: newCurrentFarm,
          collaborators: get().currentFarm?.id === farmId ? [] : get().collaborators,
          accessRequests: get().currentFarm?.id === farmId ? [] : get().accessRequests,
        });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    // === ACCIONES DE COLABORADORES ===

    loadCollaborators: async (farmId: string) => {
      try {
        // TODO: Implementar carga desde Firebase
        // Simular datos por ahora
        const mockCollaborators: Collaborator[] = [
          {
            id: '1',
            farmId,
            accountId: 'owner123',
            email: 'owner@granja.com',
            displayName: 'Propietario Principal',
            role: FarmRole.OWNER,
            permissions: [], // Owner tiene todos los permisos
            joinedAt: new Date('2020-01-15'),
            lastActiveAt: new Date(),
            invitedBy: 'system',
            isActive: true,
          },
          {
            id: '2',
            farmId,
            accountId: 'admin456',
            email: 'admin@granja.com',
            displayName: 'Administrador Juan',
            role: FarmRole.ADMIN,
            permissions: [],
            joinedAt: new Date('2023-06-10'),
            lastActiveAt: new Date(),
            invitedBy: 'owner123',
            isActive: true,
          },
        ];

        set({ collaborators: mockCollaborators });
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    removeCollaborator: async (farmId: string, collaboratorId: string) => {
      try {
        // TODO: Implementar eliminación en Firebase
        const updatedCollaborators = get().collaborators.filter(c => c.id !== collaboratorId);
        set({ collaborators: updatedCollaborators });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    updateCollaboratorRole: async (farmId: string, collaboratorId: string, newRole: FarmRole) => {
      try {
        // TODO: Implementar actualización en Firebase
        const updatedCollaborators = get().collaborators.map(collaborator =>
          collaborator.id === collaboratorId
            ? { ...collaborator, role: newRole }
            : collaborator
        );
        set({ collaborators: updatedCollaborators });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    // === ACCIONES DE SOLICITUDES DE ACCESO ===

    loadAccessRequests: async (farmId: string) => {
      try {
        // TODO: Implementar carga desde Firebase
        // Simular solicitudes pendientes
        const mockRequests: FarmAccessRequest[] = [
          {
            id: '1',
            farmId,
            farmCode: 'FRM-2025',
            requesterId: 'user789',
            requesterEmail: 'colaborador@email.com',
            requesterDisplayName: 'María González',
            requestedRole: FarmRole.VIEWER,
            message: 'Hola, me gustaría colaborar en la gestión de la granja.',
            status: AccessRequestStatus.PENDING,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        ];

        set({ accessRequests: mockRequests });
      } catch (error: any) {
        set({ error: error.message });
      }
    },

    requestFarmAccess: async (farmCode: string, requesterId: string, requesterEmail: string, requestedRole = FarmRole.VIEWER) => {
      set({ isProcessingRequest: true, error: null });
      try {
        // Validar farmCode
        const validation = await get().validateFarmCode(farmCode);
        if (!validation.valid || !validation.farm) {
          throw new Error('Código de granja inválido o no encontrado');
        }

        // TODO: Crear solicitud en Firebase
        const newRequest: FarmAccessRequest = {
          id: `req_${Date.now()}`,
          farmId: validation.farm.id!,
          farmCode,
          requesterId,
          requesterEmail,
          requesterDisplayName: 'Usuario Solicitante', // TODO: Obtener desde account
          requestedRole,
          status: AccessRequestStatus.PENDING,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        // Agregar a las solicitudes locales si es la granja actual
        if (validation.farm.id === get().currentFarm?.id) {
          set({ 
            accessRequests: [...get().accessRequests, newRequest],
            isProcessingRequest: false 
          });
        } else {
          set({ isProcessingRequest: false });
        }

        console.log('✅ Solicitud de acceso creada para granja:', validation.farm.name);
      } catch (error: any) {
        console.error('❌ Error requesting farm access:', error);
        set({ error: error.message, isProcessingRequest: false });
        throw error;
      }
    },

    approveAccessRequest: async (requestId: string, approverId: string) => {
      try {
        const request = get().accessRequests.find(r => r.id === requestId);
        if (!request) throw new Error('Solicitud no encontrada');

        // TODO: Actualizar en Firebase y crear colaborador
        
        // Crear nuevo colaborador
        const newCollaborator: Collaborator = {
          id: `col_${Date.now()}`,
          farmId: request.farmId,
          accountId: request.requesterId,
          email: request.requesterEmail,
          displayName: request.requesterDisplayName,
          role: request.requestedRole,
          permissions: [], // TODO: Asignar permisos según rol
          joinedAt: new Date(),
          invitedBy: approverId,
          isActive: true,
        };

        // Actualizar solicitud como aprobada
        const updatedRequests = get().accessRequests.map(req =>
          req.id === requestId
            ? { ...req, status: AccessRequestStatus.APPROVED, reviewedAt: new Date(), reviewedBy: approverId }
            : req
        );

        set({
          collaborators: [...get().collaborators, newCollaborator],
          accessRequests: updatedRequests,
        });

        console.log('✅ Solicitud aprobada, colaborador agregado');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    rejectAccessRequest: async (requestId: string, reviewerId: string, reason?: string) => {
      try {
        const updatedRequests = get().accessRequests.map(req =>
          req.id === requestId
            ? { 
                ...req, 
                status: AccessRequestStatus.REJECTED, 
                reviewedAt: new Date(), 
                reviewedBy: reviewerId,
                response: reason 
              }
            : req
        );

        set({ accessRequests: updatedRequests });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    cancelAccessRequest: async (requestId: string) => {
      try {
        const updatedRequests = get().accessRequests.map(req =>
          req.id === requestId
            ? { ...req, status: AccessRequestStatus.CANCELLED }
            : req
        );

        set({ accessRequests: updatedRequests });
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },

    // === UTILIDADES ===

    generateFarmCode: () => {
      // Generar código único de 8 caracteres
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

    validateFarmCode: async (farmCode: string) => {
      try {
        // TODO: Implementar validación en Firebase
        // Por ahora simular validación
        const allFarms = get().farms;
        const farm = allFarms.find(f => f.farmCode === farmCode && f.isActive);
        
        return {
          valid: !!farm,
          farm: farm ? {
            id: farm.id,
            name: farm.name,
            description: farm.description,
            location: farm.farmInfo.location,
          } : undefined,
        };
      } catch (error: any) {
        return { valid: false };
      }
    },

    getCurrentFarmLimits: () => {
      // Los límites vienen del account, no de la farm
      // TODO: Obtener del accountStore cuando esté implementado
      return SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE];
    },

    getCollaboratorSummary: (farmId: string) => {
      const collaborators = get().collaborators.filter(c => c.farmId === farmId && c.isActive);
      // Los límites vienen del account, no de la farm
      // TODO: Obtener del accountStore cuando esté implementado
      const limits = SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE];
      
      const collaboratorsByRole = collaborators.reduce((acc, collaborator) => {
        acc[collaborator.role] = (acc[collaborator.role] || 0) + 1;
        return acc;
      }, {} as Record<FarmRole, number>);

      return {
        farmId,
        totalCollaborators: collaborators.length,
        collaboratorsByRole,
        pendingRequests: get().accessRequests.filter(r => r.farmId === farmId && r.status === AccessRequestStatus.PENDING).length,
        isAtLimit: limits.maxCollaborators !== -1 && collaborators.length >= limits.maxCollaborators,
        limit: limits.maxCollaborators,
      };
    },

    canAddCollaborator: (farmId: string) => {
      const summary = get().getCollaboratorSummary(farmId);
      return !summary.isAtLimit;
    },

    hasPermission: (resource: string, action: string) => {
      // TODO: Implementar lógica de permisos basada en el rol del usuario actual
      return true; // Por ahora permitir todo
    },

    needsOnboarding: async (accountId: string) => {
      try {
        // Verificar si el usuario tiene acceso a alguna granja
        await get().loadUserFarms(accountId);
        const farms = get().farms;
        return farms.length === 0;
      } catch (error) {
        return true; // Si hay error, mostrar onboarding
      }
    },
  }))
);