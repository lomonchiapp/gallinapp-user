/**
 * Tipos para colaboradores y sistema de acceso por farmCode
 */

import { FarmPermission, FarmRole } from './account';

export interface Collaborator {
  id: string;
  farmId: string;
  accountId: string; // UID del account del colaborador
  email: string;
  displayName: string;
  role: FarmRole;
  permissions: FarmPermission[];
  
  // Metadata de acceso
  joinedAt: Date;
  lastActiveAt?: Date;
  invitedBy: string; // UID del usuario que aprobó el acceso
  isActive: boolean;
  
  // Información adicional
  notes?: string; // Notas del owner/admin sobre el colaborador
}

export interface FarmAccessRequest {
  id: string;
  farmId: string;
  farmCode: string; // Código usado para solicitar acceso
  
  // Información del solicitante
  requesterId: string; // UID del account que solicita acceso
  requesterEmail: string;
  requesterDisplayName: string;
  
  // Configuración de la solicitud
  requestedRole: FarmRole; // Rol que solicita (default: VIEWER)
  message?: string; // Mensaje opcional del solicitante
  
  // Estado de la solicitud
  status: AccessRequestStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // UID del usuario que revisó
  response?: string; // Mensaje de respuesta del revisor
  expiresAt: Date; // Las solicitudes expiran después de 7 días
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',     // Esperando revisión
  APPROVED = 'APPROVED',   // Aprobada - colaborador agregado
  REJECTED = 'REJECTED',   // Rechazada
  EXPIRED = 'EXPIRED',     // Expiró sin revisión
  CANCELLED = 'CANCELLED'  // Cancelada por el solicitante
}

// Helper types para gestión
export interface FarmCollaboratorSummary {
  farmId: string;
  totalCollaborators: number;
  collaboratorsByRole: Record<FarmRole, number>;
  pendingRequests: number;
  isAtLimit: boolean;
  limit: number;
}

export interface AccessRequestNotification {
  id: string;
  farmId: string;
  farmName: string;
  requestId: string;
  requesterName: string;
  requesterEmail: string;
  createdAt: Date;
  isRead: boolean;
}

// Utilidades para validación
export const FARM_ROLE_HIERARCHY: Record<FarmRole, number> = {
  [FarmRole.VIEWER]: 1,
  [FarmRole.MANAGER]: 2,
  [FarmRole.ADMIN]: 3,
  [FarmRole.OWNER]: 4,
};

export const FARM_ROLE_DESCRIPTIONS: Record<FarmRole, string> = {
  [FarmRole.OWNER]: 'Control total de la granja y gestión de colaboradores',
  [FarmRole.ADMIN]: 'Gestión completa de operaciones y algunos colaboradores',
  [FarmRole.MANAGER]: 'Gestión de lotes y operaciones diarias',
  [FarmRole.VIEWER]: 'Solo visualización de datos sin edición',
};

// Funciones de utilidad
export const canUserApproveRole = (userRole: FarmRole, requestedRole: FarmRole): boolean => {
  // Un usuario solo puede aprobar roles inferiores al suyo
  return FARM_ROLE_HIERARCHY[userRole] > FARM_ROLE_HIERARCHY[requestedRole];
};

export const canUserManageCollaborator = (userRole: FarmRole, targetRole: FarmRole): boolean => {
  // Un usuario puede gestionar colaboradores con roles inferiores
  return FARM_ROLE_HIERARCHY[userRole] > FARM_ROLE_HIERARCHY[targetRole];
};


