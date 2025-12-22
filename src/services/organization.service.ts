/**
 * OrganizationService - Gestión de organizaciones multi-tenant
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { requireAuth } from './auth.service';
import { 
  Organization, 
  OrganizationUser, 
  OrganizationInvitation, 
  UserOrganizations,
  OrganizationRole,
  SubscriptionPlan,
  SubscriptionStatus,
  SUBSCRIPTION_LIMITS
} from '../types/organization';

class OrganizationService {
  private readonly COLLECTIONS = {
    ORGANIZATIONS: 'organizations',
    USER_ORGANIZATIONS: 'user_organizations',
    USERS: 'users',
    INVITATIONS: 'invitations'
  };

  /**
   * Crea una nueva organización
   */
  async createOrganization(data: {
    name: string;
    displayName: string;
    description?: string;
    businessInfo?: Partial<Organization['businessInfo']>;
  }): Promise<Organization> {
    const userId = requireAuth();
    const now = new Date();

    // Crear la organización con configuración por defecto
    const organizationData: Omit<Organization, 'id'> = {
      name: data.name,
      displayName: data.displayName,
      description: data.description || '',
      businessInfo: {
        nit: data.businessInfo?.nit || '',
        address: data.businessInfo?.address || '',
        phone: data.businessInfo?.phone || '',
        email: data.businessInfo?.email || '',
        website: data.businessInfo?.website || '',
        logo: data.businessInfo?.logo || ''
      },
      settings: {
        defaultEggPrice: 8.0,
        defaultChickenPricePerPound: 65.0,
        defaultLevantePricePerUnit: 150.0,
        eggsPerBox: 30,
        israeliGrowthDays: 45,
        engordeGrowthDays: 42,
        targetEngordeWeight: 4.5,
        acceptableMortalityRate: 5.0,
        invoiceSettings: {
          prefix: 'GAL',
          nextNumber: 1,
          format: '{prefix}-{number}',
          taxRate: 0,
          currency: 'DOP'
        },
        notifications: {
          alertsEnabled: true,
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        }
      },
      subscription: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE]
      },
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };

    return await runTransaction(db, async (transaction) => {
      // Crear organización
      const orgRef = doc(collection(db, this.COLLECTIONS.ORGANIZATIONS));
      const newOrg: Organization = { ...organizationData, id: orgRef.id };
      
      transaction.set(orgRef, {
        ...newOrg,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Añadir usuario como admin
      const userOrgRef = doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId);
      const userOrgData: UserOrganizations = {
        userId,
        organizations: {
          [orgRef.id]: {
            role: OrganizationRole.ADMIN,
            permissions: [], // Admin tiene todos los permisos
            isActive: true,
            joinedAt: now
          }
        },
        currentOrganization: orgRef.id,
        updatedAt: now
      };

      transaction.set(userOrgRef, {
        ...userOrgData,
        updatedAt: serverTimestamp()
      });

      // Crear usuario en la organización
      const orgUserRef = doc(collection(db, this.COLLECTIONS.ORGANIZATIONS, orgRef.id, 'users'));
      const orgUser: OrganizationUser = {
        id: orgUserRef.id,
        organizationId: orgRef.id,
        userId,
        email: '', // Se completará con datos del usuario
        displayName: '', // Se completará con datos del usuario
        role: OrganizationRole.ADMIN,
        permissions: [],
        isActive: true,
        joinedAt: now
      };

      transaction.set(orgUserRef, {
        ...orgUser,
        joinedAt: serverTimestamp()
      });

      // Actualizar el documento del usuario en la colección users
      const userRef = doc(db, this.COLLECTIONS.USERS, userId);
      const userDoc = await transaction.get(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        transaction.update(userRef, {
          currentOrganizationId: orgRef.id,
          [`organizations.${orgRef.id}`]: {
            role: OrganizationRole.ADMIN,
            joinedAt: now,
            isActive: true,
          },
        });
      }

      return newOrg;
    });
  }

  /**
   * Obtiene las organizaciones del usuario actual
   */
  async getUserOrganizations(): Promise<Organization[]> {
    const userId = requireAuth();
    
    const userOrgDoc = await getDoc(doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId));
    if (!userOrgDoc.exists()) {
      return [];
    }

    const userOrgs = userOrgDoc.data() as UserOrganizations;
    const organizationIds = Object.keys(userOrgs.organizations);

    if (organizationIds.length === 0) {
      return [];
    }

    // Obtener detalles de cada organización
    const organizations: Organization[] = [];
    for (const orgId of organizationIds) {
      const orgDoc = await getDoc(doc(db, this.COLLECTIONS.ORGANIZATIONS, orgId));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        organizations.push({
          ...orgData,
          id: orgDoc.id,
          createdAt: orgData.createdAt?.toDate() || new Date(),
          updatedAt: orgData.updatedAt?.toDate() || new Date(),
          subscription: {
            ...orgData.subscription,
            startDate: orgData.subscription.startDate?.toDate() || new Date(),
            endDate: orgData.subscription.endDate?.toDate()
          }
        } as Organization);
      }
    }

    return organizations;
  }

  /**
   * Obtiene una organización por ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    const userId = requireAuth();
    
    // Verificar acceso
    if (!await this.hasOrganizationAccess(userId, organizationId)) {
      throw new Error('No tienes acceso a esta organización');
    }

    const orgDoc = await getDoc(doc(db, this.COLLECTIONS.ORGANIZATIONS, organizationId));
    if (!orgDoc.exists()) {
      return null;
    }

    const orgData = orgDoc.data();
    return {
      ...orgData,
      id: orgDoc.id,
      createdAt: orgData.createdAt?.toDate() || new Date(),
      updatedAt: orgData.updatedAt?.toDate() || new Date(),
      subscription: {
        ...orgData.subscription,
        startDate: orgData.subscription.startDate?.toDate() || new Date(),
        endDate: orgData.subscription.endDate?.toDate()
      }
    } as Organization;
  }

  /**
   * Actualiza una organización
   */
  async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<void> {
    const userId = requireAuth();
    
    // Verificar permisos de administrador
    if (!await this.hasOrganizationRole(userId, organizationId, OrganizationRole.ADMIN)) {
      throw new Error('Solo los administradores pueden actualizar la organización');
    }

    const orgRef = doc(db, this.COLLECTIONS.ORGANIZATIONS, organizationId);
    await updateDoc(orgRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Invita un usuario a la organización
   */
  async inviteUser(organizationId: string, email: string, role: OrganizationRole): Promise<string> {
    const userId = requireAuth();
    
    // Verificar permisos
    if (!await this.canManageUsers(userId, organizationId)) {
      throw new Error('No tienes permisos para invitar usuarios');
    }

    // Crear invitación
    const invitation: Omit<OrganizationInvitation, 'id'> = {
      organizationId,
      organizationName: '', // Se completará
      email,
      role,
      permissions: [],
      invitedBy: userId,
      invitedByName: '', // Se completará
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      isAccepted: false,
      token: this.generateInvitationToken()
    };

    const invitationRef = await addDoc(collection(db, this.COLLECTIONS.INVITATIONS), {
      ...invitation,
      createdAt: serverTimestamp()
    });

    return invitationRef.id;
  }

  /**
   * Acepta una invitación
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    const userId = requireAuth();

    await runTransaction(db, async (transaction) => {
      // Obtener invitación
      const invitationRef = doc(db, this.COLLECTIONS.INVITATIONS, invitationId);
      const invitationDoc = await transaction.get(invitationRef);
      
      if (!invitationDoc.exists()) {
        throw new Error('Invitación no encontrada');
      }

      const invitation = invitationDoc.data() as OrganizationInvitation;
      
      if (invitation.isAccepted) {
        throw new Error('Esta invitación ya ha sido aceptada');
      }

      if (invitation.expiresAt.toDate() < new Date()) {
        throw new Error('Esta invitación ha expirado');
      }

      // Actualizar user_organizations
      const userOrgRef = doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId);
      const userOrgDoc = await transaction.get(userOrgRef);
      
      let userOrgData: UserOrganizations;
      if (userOrgDoc.exists()) {
        userOrgData = userOrgDoc.data() as UserOrganizations;
        userOrgData.organizations[invitation.organizationId] = {
          role: invitation.role,
          permissions: invitation.permissions,
          isActive: true,
          joinedAt: new Date()
        };
      } else {
        userOrgData = {
          userId,
          organizations: {
            [invitation.organizationId]: {
              role: invitation.role,
              permissions: invitation.permissions,
              isActive: true,
              joinedAt: new Date()
            }
          },
          currentOrganization: invitation.organizationId,
          updatedAt: new Date()
        };
      }

      transaction.set(userOrgRef, {
        ...userOrgData,
        updatedAt: serverTimestamp()
      });

      // Marcar invitación como aceptada
      transaction.update(invitationRef, {
        isAccepted: true,
        acceptedAt: serverTimestamp()
      });
    });
  }

  /**
   * Cambia la organización activa del usuario
   */
  async switchOrganization(organizationId: string): Promise<void> {
    const userId = requireAuth();
    
    if (!await this.hasOrganizationAccess(userId, organizationId)) {
      throw new Error('No tienes acceso a esta organización');
    }

    const userOrgRef = doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId);
    await updateDoc(userOrgRef, {
      currentOrganization: organizationId,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Obtiene la organización activa del usuario
   */
  async getCurrentOrganization(): Promise<Organization | null> {
    const userId = requireAuth();
    
    const userOrgDoc = await getDoc(doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId));
    if (!userOrgDoc.exists()) {
      return null;
    }

    const userOrgs = userOrgDoc.data() as UserOrganizations;
    if (!userOrgs.currentOrganization) {
      return null;
    }

    return await this.getOrganization(userOrgs.currentOrganization);
  }

  // Métodos de verificación de permisos
  private async hasOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
    const userOrgDoc = await getDoc(doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId));
    if (!userOrgDoc.exists()) return false;

    const userOrgs = userOrgDoc.data() as UserOrganizations;
    return organizationId in userOrgs.organizations && userOrgs.organizations[organizationId].isActive;
  }

  private async hasOrganizationRole(userId: string, organizationId: string, role: OrganizationRole): Promise<boolean> {
    if (!await this.hasOrganizationAccess(userId, organizationId)) return false;

    const userOrgDoc = await getDoc(doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId));
    const userOrgs = userOrgDoc.data() as UserOrganizations;
    const userRole = userOrgs.organizations[organizationId].role;

    // Jerarquía: ADMIN > MANAGER > OPERATOR > VIEWER
    const roleHierarchy = [OrganizationRole.VIEWER, OrganizationRole.OPERATOR, OrganizationRole.MANAGER, OrganizationRole.ADMIN];
    return roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf(role);
  }

  private async canManageUsers(userId: string, organizationId: string): Promise<boolean> {
    return await this.hasOrganizationRole(userId, organizationId, OrganizationRole.MANAGER);
  }

  private generateInvitationToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

export const organizationService = new OrganizationService();
export default organizationService;


