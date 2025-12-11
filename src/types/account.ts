/**
 * Tipos para Account (perfil de usuario) separado de autenticación
 */

import { Subscription } from './subscription';

export interface Account {
  uid: string; // Mismo que Firebase Auth uid
  email: string;
  displayName: string;
  photoURL?: string | null;
  
  // Información del perfil y configuraciones de apariencia del usuario
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    
    // Configuraciones de apariencia y preferencias del usuario
    appearance: {
      theme: 'light' | 'dark' | 'system'; // Tema preferido
      fontSize: 'small' | 'medium' | 'large'; // Tamaño de fuente
      compactMode: boolean; // Modo compacto de UI
    };
    
    // Configuraciones regionales del usuario
    preferences: {
      timezone: string;
      language: string;
      dateFormat: string; // Formato de fecha preferido
      currency: string; // Moneda preferida para visualización
    };
    
    // Notificaciones del usuario (preferencias personales)
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  
  // Suscripción del usuario (no de la granja)
  subscription: Subscription;
  
  // Granjas asociadas
  farms: FarmAccess[];
  currentFarmId?: string; // Granja actualmente seleccionada
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface FarmAccess {
  farmId: string;
  farmName: string;
  role: FarmRole;
  permissions: FarmPermission[];
  joinedAt: Date;
  lastAccessAt?: Date;
  isActive: boolean;
}

export enum FarmRole {
  OWNER = 'OWNER',       // Propietario - control total
  ADMIN = 'ADMIN',       // Administrador - gestión completa
  MANAGER = 'MANAGER',   // Gerente - operaciones diarias
  VIEWER = 'VIEWER'      // Solo lectura
}

export interface FarmPermission {
  resource: FarmResource;
  actions: FarmAction[];
  conditions?: Record<string, any>; // Condiciones específicas (ej: solo ciertos lotes)
}

export enum FarmResource {
  LOTES = 'lotes',
  PONEDORAS = 'ponedoras',
  LEVANTES = 'levantes', 
  ENGORDE = 'engorde',
  GASTOS = 'gastos',
  VENTAS = 'ventas',
  REPORTES = 'reportes',
  CONFIGURACION = 'configuracion',
  COLABORADORES = 'colaboradores',
}

export enum FarmAction {
  CREATE = 'create',
  READ = 'read',  
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Para recursos especiales como colaboradores
}

// Permisos por defecto para cada rol
export const DEFAULT_FARM_PERMISSIONS: Record<FarmRole, FarmPermission[]> = {
  [FarmRole.OWNER]: [
    // Owner tiene acceso completo a todo
    {
      resource: FarmResource.LOTES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.PONEDORAS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.LEVANTES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.ENGORDE,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.GASTOS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.VENTAS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.REPORTES,
      actions: [FarmAction.READ, FarmAction.CREATE],
    },
    {
      resource: FarmResource.CONFIGURACION,
      actions: [FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.COLABORADORES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE, FarmAction.MANAGE],
    },
  ],
  
  [FarmRole.ADMIN]: [
    // Admin tiene acceso completo excepto gestión de otros admins
    {
      resource: FarmResource.LOTES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.PONEDORAS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.LEVANTES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.ENGORDE,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.GASTOS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.VENTAS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE, FarmAction.DELETE],
    },
    {
      resource: FarmResource.REPORTES,
      actions: [FarmAction.READ, FarmAction.CREATE],
    },
    {
      resource: FarmResource.CONFIGURACION,
      actions: [FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.COLABORADORES,
      actions: [FarmAction.READ, FarmAction.MANAGE],
    },
  ],
  
  [FarmRole.MANAGER]: [
    // Manager puede gestionar operaciones pero no configuración crítica
    {
      resource: FarmResource.LOTES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.PONEDORAS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.LEVANTES,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.ENGORDE,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.GASTOS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.VENTAS,
      actions: [FarmAction.CREATE, FarmAction.READ, FarmAction.UPDATE],
    },
    {
      resource: FarmResource.REPORTES,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.COLABORADORES,
      actions: [FarmAction.READ],
    },
  ],
  
  [FarmRole.VIEWER]: [
    // Viewer solo lectura
    {
      resource: FarmResource.LOTES,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.PONEDORAS,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.LEVANTES,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.ENGORDE,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.GASTOS,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.VENTAS,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.REPORTES,
      actions: [FarmAction.READ],
    },
    {
      resource: FarmResource.COLABORADORES,
      actions: [FarmAction.READ],
    },
  ],
};
