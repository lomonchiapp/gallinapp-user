/**
 * Servicio de migración: Organization → Farm
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo migra datos, no lógica de negocio
 * - Open/Closed: Extensible para nuevas migraciones sin modificar código existente
 * - Dependency Inversion: Depende de abstracciones (repositorios)
 */

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  Transaction,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../components/config/firebase';
import { Collaborator, FarmRole } from '../../types/account';
import { DEFAULT_FARM_SETTINGS, Farm, SUBSCRIPTION_LIMITS, SubscriptionPlan, SubscriptionStatus } from '../../types/farm';
import { Organization } from '../../types/organization';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: MigrationError[];
  warnings: string[];
}

export interface MigrationError {
  organizationId: string;
  organizationName: string;
  error: string;
  details?: any;
}

/**
 * Servicio de migración de Organization a Farm
 * 
 * Migra:
 * 1. Organizations → Farms (con farmCode generado)
 * 2. OrganizationUsers → Collaborators
 * 3. Actualiza referencias en lotes y otros documentos
 */
export class OrganizationToFarmMigration {
  private readonly COLLECTIONS = {
    ORGANIZATIONS: 'organizations',
    FARMS: 'farms',
    ORGANIZATION_USERS: 'users', // Subcolección de organizations
    COLLABORATORS: 'collaborators',
    LOTES: 'lotes',
    USER_ORGANIZATIONS: 'user_organizations',
  };

  /**
   * Migra todas las organizaciones a farms
   */
  async migrateAll(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Obtener todas las organizaciones activas
      const organizationsQuery = query(
        collection(db, this.COLLECTIONS.ORGANIZATIONS),
        where('isActive', '==', true)
      );
      
      const organizationsSnapshot = await getDocs(organizationsQuery);
      const organizations = organizationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Organization[];

      console.log(`🔄 Iniciando migración de ${organizations.length} organizaciones...`);

      // Migrar cada organización
      for (const org of organizations) {
        try {
          await this.migrateOrganization(org);
          result.migratedCount++;
          console.log(`✅ Migrada: ${org.name} (${org.id})`);
        } catch (error: any) {
          result.success = false;
          result.errors.push({
            organizationId: org.id,
            organizationName: org.name,
            error: error.message,
            details: error,
          });
          console.error(`❌ Error migrando ${org.name}:`, error);
        }
      }

      console.log(`✅ Migración completada: ${result.migratedCount}/${organizations.length} exitosas`);
      
      return result;
    } catch (error: any) {
      result.success = false;
      result.errors.push({
        organizationId: 'ALL',
        organizationName: 'Todas las organizaciones',
        error: error.message,
        details: error,
      });
      return result;
    }
  }

  /**
   * Migra una organización específica a farm
   */
  async migrateOrganization(organization: Organization): Promise<Farm> {
    return await runTransaction(db, async (transaction) => {
      // Verificar si ya existe una farm con este ID
      const existingFarmRef = doc(db, this.COLLECTIONS.FARMS, organization.id);
      const existingFarmDoc = await transaction.get(existingFarmRef);
      
      if (existingFarmDoc.exists()) {
        throw new Error(`Farm con ID ${organization.id} ya existe`);
      }

      // Generar farmCode único
      const farmCode = await this.generateUniqueFarmCodeInTransaction(transaction);

      // Convertir Organization → Farm
      const farm: Omit<Farm, 'id'> = {
        name: organization.name,
        displayName: organization.displayName,
        description: organization.description,
        farmCode,
        farmInfo: {
          location: organization.businessInfo?.address,
          address: organization.businessInfo?.address,
          phone: organization.businessInfo?.phone,
          email: organization.businessInfo?.email,
          logo: organization.businessInfo?.logo,
        },
        settings: {
          ...DEFAULT_FARM_SETTINGS,
          // Preservar configuración existente
          defaultEggPrice: organization.settings.defaultEggPrice,
          defaultChickenPricePerPound: organization.settings.defaultChickenPricePerPound,
          defaultLevantePricePerUnit: organization.settings.defaultLevantePricePerUnit,
          eggsPerBox: organization.settings.eggsPerBox,
          israeliGrowthDays: organization.settings.israeliGrowthDays,
          engordeGrowthDays: organization.settings.engordeGrowthDays,
          targetEngordeWeight: organization.settings.targetEngordeWeight,
          acceptableMortalityRate: organization.settings.acceptableMortalityRate,
          invoiceSettings: organization.settings.invoiceSettings,
          notifications: organization.settings.notifications,
        },
        subscription: {
          plan: this.mapSubscriptionPlan(organization.subscription.plan),
          status: this.mapSubscriptionStatus(organization.subscription.status),
          startDate: organization.subscription.startDate,
          endDate: organization.subscription.endDate,
          limits: this.mapSubscriptionLimits(organization.subscription.limits),
          stripeCustomerId: organization.subscription.stripeCustomerId,
          stripeSubscriptionId: organization.subscription.stripeSubscriptionId,
        },
        ownerId: organization.createdBy,
        createdAt: organization.createdAt,
        updatedAt: new Date(),
        isActive: organization.isActive,
      };

      // Crear farm
      transaction.set(existingFarmRef, {
        ...farm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Migrar usuarios de la organización → colaboradores
      await this.migrateOrganizationUsers(organization.id, transaction);

      return { ...farm, id: organization.id } as Farm;
    });
  }

  /**
   * Migra usuarios de organización a colaboradores
   */
  private async migrateOrganizationUsers(
    organizationId: string,
    transaction: Transaction
  ): Promise<void> {
    // Obtener usuarios de la organización
    const orgUsersQuery = query(
      collection(db, this.COLLECTIONS.ORGANIZATIONS, organizationId, this.COLLECTIONS.ORGANIZATION_USERS)
    );
    
    const orgUsersSnapshot = await getDocs(orgUsersQuery);
    
    for (const userDoc of orgUsersSnapshot.docs) {
      const orgUser = userDoc.data();
      
      // Convertir OrganizationRole → FarmRole
      const farmRole = this.mapOrganizationRoleToFarmRole(orgUser.role);
      
      // Crear colaborador
      const collaboratorRef = doc(collection(db, this.COLLECTIONS.COLLABORATORS));
      const collaborator: Omit<Collaborator, 'id'> = {
        farmId: organizationId, // Mismo ID que la farm
        accountId: orgUser.userId,
        email: orgUser.email || '',
        displayName: orgUser.displayName || '',
        role: farmRole,
        permissions: [], // Se asignarán según el rol
        joinedAt: orgUser.joinedAt || new Date(),
        lastActiveAt: orgUser.lastActiveAt,
        invitedBy: orgUser.invitedBy || 'system',
        isActive: orgUser.isActive !== false,
      };

      transaction.set(collaboratorRef, {
        ...collaborator,
        joinedAt: serverTimestamp(),
      });
    }
  }

  /**
   * Actualiza referencias de organizationId → farmId en documentos relacionados
   */
  async updateReferences(organizationId: string, farmId: string): Promise<void> {
    const batch = writeBatch(db);

    // Actualizar lotes
    const lotesQuery = query(
      collection(db, this.COLLECTIONS.LOTES),
      where('organizationId', '==', organizationId)
    );
    
    const lotesSnapshot = await getDocs(lotesQuery);
    lotesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        organizationId: farmId, // Mantener ambos por compatibilidad temporal
        farmId: farmId,
      });
    });

    // TODO: Actualizar otras colecciones (ventas, gastos, etc.)
    
    await batch.commit();
  }

  /**
   * Genera un farmCode único dentro de una transacción
   */
  private async generateUniqueFarmCodeInTransaction(
    transaction: Transaction,
    maxAttempts = 10
  ): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const code = this.generateFarmCode();
      
      // Verificar unicidad en la transacción
      const farmsQuery = query(
        collection(db, this.COLLECTIONS.FARMS),
        where('farmCode', '==', code)
      );
      
      const snapshot = await getDocs(farmsQuery);
      if (snapshot.empty) {
        return code;
      }
    }
    
    throw new Error('No se pudo generar un farmCode único después de múltiples intentos');
  }

  private generateFarmCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Mapea SubscriptionPlan de Organization a Farm
   */
  private mapSubscriptionPlan(plan: string): SubscriptionPlan {
    const planMap: Record<string, SubscriptionPlan> = {
      'free': SubscriptionPlan.FREE,
      'basic': SubscriptionPlan.BASIC,
      'pro': SubscriptionPlan.PRO,
      'enterprise': SubscriptionPlan.ENTERPRISE,
    };
    
    return planMap[plan.toLowerCase()] || SubscriptionPlan.FREE;
  }

  /**
   * Mapea SubscriptionStatus de Organization a Farm
   */
  private mapSubscriptionStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      'active': SubscriptionStatus.ACTIVE,
      'inactive': SubscriptionStatus.INACTIVE,
      'cancelled': SubscriptionStatus.CANCELLED,
      'past_due': SubscriptionStatus.PAST_DUE,
      'trialing': SubscriptionStatus.TRIALING,
    };
    
    return statusMap[status.toLowerCase()] || SubscriptionStatus.INACTIVE;
  }

  /**
   * Mapea SubscriptionLimits de Organization a Farm
   */
  private mapSubscriptionLimits(limits: any): typeof SUBSCRIPTION_LIMITS[SubscriptionPlan] {
    return {
      maxLotes: limits.maxLotes || 0,
      maxCollaborators: limits.maxUsers || 1, // maxUsers → maxCollaborators
      maxStorage: limits.maxStorage || 0,
      maxTransactions: limits.maxTransactions || 0,
      features: {
        analytics: limits.features?.analytics || false,
        exports: limits.features?.exports || false,
        apiAccess: limits.features?.apiAccess || false,
        customReports: limits.features?.customReports || false,
        multiLocation: limits.features?.multiLocation || false,
        integrations: limits.features?.integrations || false,
        advancedAlerts: limits.features?.advancedAlerts || false,
      },
    };
  }

  /**
   * Mapea OrganizationRole → FarmRole
   */
  private mapOrganizationRoleToFarmRole(role: string): FarmRole {
    const roleMap: Record<string, FarmRole> = {
      'admin': FarmRole.OWNER, // Admin → Owner (el creador)
      'manager': FarmRole.ADMIN,
      'operator': FarmRole.MANAGER,
      'viewer': FarmRole.VIEWER,
    };
    
    return roleMap[role.toLowerCase()] || FarmRole.VIEWER;
  }
}

// Instancia singleton
export const organizationToFarmMigration = new OrganizationToFarmMigration();
