/**
 * Multi-Tenant Authentication Service
 * Extiende el servicio de autenticación para soporte multi-tenant
 */

import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile as updateFirebaseProfile,
    UserCredential,
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { auth, db } from '../components/config/firebase';
import { UserRole } from '../types/enums';
import {
    Organization,
    OrganizationRole,
    SUBSCRIPTION_LIMITS,
    SubscriptionPlan,
    SubscriptionStatus,
    UserOrganizations
} from '../types/organization';

// Extender AppUser con información multi-tenant
export interface MultiTenantUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Información global (compatibilidad)
  globalRole: UserRole;
  lastLogin: Date;
  createdAt: Date;
  
  // Información multi-tenant
  currentOrganizationId?: string;
  organizations: {
    [organizationId: string]: {
      role: OrganizationRole;
      joinedAt: Date;
      isActive: boolean;
    };
  };
  
  // Preferencias del usuario
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

class MultiTenantAuthService {
  private readonly COLLECTIONS = {
    USERS: 'users',
    USER_ORGANIZATIONS: 'user_organizations',
    ORGANIZATIONS: 'organizations',
  };

  /**
   * Elimina campos undefined de un objeto para compatibilidad con Firestore
   */
  private removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Registra un nuevo usuario y crea su primera organización
   */
  async registerWithOrganization(data: {
    email: string;
    password: string;
    displayName: string;
    organizationName: string;
    organizationDisplayName: string;
  }): Promise<{ user: MultiTenantUser; organization: Organization }> {
    const { email, password, displayName, organizationName, organizationDisplayName } = data;

    try {
      // Crear usuario en Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const firebaseUser = userCredential.user;
      
      // Actualizar perfil en Firebase Auth
      await updateFirebaseProfile(firebaseUser, {
        displayName,
      });

      // Crear usuario y organización en transacción
      const result = await runTransaction(db, async (transaction) => {
        const userId = firebaseUser.uid;
        const now = new Date();

        // Crear organización - usar collection() para obtener referencia correcta
        const orgRef = doc(collection(db, this.COLLECTIONS.ORGANIZATIONS));
        const organization: Organization = {
          id: orgRef.id,
          name: organizationName,
          displayName: organizationDisplayName,
          description: '',
          businessInfo: {
            nit: '',
            address: '',
            phone: '',
            email: email,
            website: '',
            logo: '',
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
              currency: 'DOP',
            },
            notifications: {
              alertsEnabled: true,
              emailNotifications: true,
              smsNotifications: false,
              pushNotifications: true,
            },
          },
          subscription: {
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.ACTIVE,
            startDate: now,
            limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE],
          },
          createdBy: userId,
          createdAt: now,
          updatedAt: now,
          isActive: true,
        };

        // Limpiar campos undefined antes de guardar en Firestore
        const orgData = this.removeUndefinedFields({
          ...organization,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.set(orgRef, orgData);

        // Crear perfil de usuario
        const userRef = doc(db, this.COLLECTIONS.USERS, userId);
        const user: MultiTenantUser = {
          uid: userId,
          email: email,
          displayName: displayName,
          photoURL: firebaseUser.photoURL || undefined,
          globalRole: UserRole.ADMIN,
          lastLogin: now,
          createdAt: now,
          currentOrganizationId: organization.id,
          organizations: {
            [organization.id]: {
              role: OrganizationRole.ADMIN,
              joinedAt: now,
              isActive: true,
            },
          },
          preferences: {
            theme: 'auto',
            language: 'es',
            notifications: {
              email: true,
              push: true,
              sms: false,
            },
          },
        };

        // Limpiar campos undefined antes de guardar en Firestore
        const userData = this.removeUndefinedFields({
          ...user,
          lastLogin: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        transaction.set(userRef, userData);

        // Crear documento de organizaciones del usuario
        const userOrgRef = doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId);
        const userOrganizations: UserOrganizations = {
          userId,
          organizations: {
            [organization.id]: {
              role: OrganizationRole.ADMIN,
              permissions: [],
              isActive: true,
              joinedAt: now,
            },
          },
          currentOrganization: organization.id,
          updatedAt: now,
        };

        // Limpiar campos undefined antes de guardar en Firestore
        const userOrgData = this.removeUndefinedFields({
          ...userOrganizations,
          updatedAt: serverTimestamp(),
        });

        transaction.set(userOrgRef, userOrgData);

        return { user, organization };
      });

      console.log('✅ Usuario y organización creados exitosamente');
      return result;
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      throw new Error(error.message || 'Error al registrar usuario');
    }
  }

  /**
   * Inicia sesión con email y contraseña
   */
  async signIn(email: string, password: string): Promise<MultiTenantUser> {
    try {
      console.log('🔐 Iniciando sesión multi-tenant...');
      
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const firebaseUser = userCredential.user;
      
      // Obtener datos completos del usuario
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Error al obtener datos del usuario después del login');
      }

      // Actualizar última conexión
      await updateDoc(doc(db, this.COLLECTIONS.USERS, firebaseUser.uid), {
        lastLogin: serverTimestamp(),
      });

      console.log('✅ Sesión iniciada exitosamente');
      return user;
    } catch (error: any) {
      console.error('❌ Error en login:', error);
      throw new Error(error.message || 'Error al iniciar sesión');
    }
  }

  /**
   * Inicia sesión con Google
   */
  async signInWithGoogle(idToken: string): Promise<MultiTenantUser> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const firebaseUser = userCredential.user;

      // Verificar si es nuevo usuario
      const userDoc = await getDoc(doc(db, this.COLLECTIONS.USERS, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Crear usuario automáticamente con organización personal
        return await this.createUserFromProvider(firebaseUser);
      }

      // Usuario existente - obtener datos
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Error al obtener datos del usuario');
      }

      // Actualizar última conexión
      await updateDoc(doc(db, this.COLLECTIONS.USERS, firebaseUser.uid), {
        lastLogin: serverTimestamp(),
      });

      return user;
    } catch (error: any) {
      console.error('❌ Error en login con Google:', error);
      throw error;
    }
  }

  /**
   * Crea un usuario desde un proveedor OAuth
   */
  private async createUserFromProvider(firebaseUser: any): Promise<MultiTenantUser> {
    const result = await runTransaction(db, async (transaction) => {
      const userId = firebaseUser.uid;
      const now = new Date();

      // Crear organización personal - usar collection() para obtener referencia correcta
      const orgRef = doc(collection(db, this.COLLECTIONS.ORGANIZATIONS));
      const orgName = `${firebaseUser.displayName || 'Mi'} Granja`;
      
      const organization: Organization = {
        id: orgRef.id,
        name: orgName.toLowerCase().replace(/\s+/g, '-'),
        displayName: orgName,
        description: 'Organización personal',
        businessInfo: {
          email: firebaseUser.email || '',
          nit: '',
          address: '',
          phone: '',
          website: '',
          logo: firebaseUser.photoURL || '',
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
            currency: 'DOP',
          },
          notifications: {
            alertsEnabled: true,
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
          },
        },
        subscription: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE],
        },
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      };

      transaction.set(orgRef, {
        ...organization,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Crear perfil de usuario
      const userRef = doc(db, this.COLLECTIONS.USERS, userId);
      const user: MultiTenantUser = {
        uid: userId,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        globalRole: UserRole.ADMIN,
        lastLogin: now,
        createdAt: now,
        currentOrganizationId: organization.id,
        organizations: {
          [organization.id]: {
            role: OrganizationRole.ADMIN,
            joinedAt: now,
            isActive: true,
          },
        },
        preferences: {
          theme: 'auto',
          language: 'es',
          notifications: {
            email: true,
            push: true,
            sms: false,
          },
        },
      };

      // Limpiar campos undefined antes de guardar en Firestore
      const userData = this.removeUndefinedFields({
        ...user,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      transaction.set(userRef, userData);

      return user;
    });

    return result;
  }

  /**
   * Obtiene el usuario actual con información multi-tenant
   */
  async getCurrentUser(): Promise<MultiTenantUser | null> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;

      const userDoc = await getDoc(doc(db, this.COLLECTIONS.USERS, firebaseUser.uid));
      if (!userDoc.exists()) return null;

      const userData = userDoc.data();
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: userData.displayName || '',
        photoURL: userData.photoURL,
        globalRole: userData.globalRole || UserRole.OPERADOR,
        lastLogin: userData.lastLogin?.toDate() || new Date(),
        createdAt: userData.createdAt?.toDate() || new Date(),
        currentOrganizationId: userData.currentOrganizationId,
        organizations: userData.organizations || {},
        preferences: userData.preferences || {
          theme: 'auto',
          language: 'es',
          notifications: { email: true, push: true, sms: false },
        },
      };
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }

  /**
   * Cambia la organización activa del usuario
   */
  async switchOrganization(organizationId: string): Promise<void> {
    const userId = this.requireAuth();
    
    await updateDoc(doc(db, this.COLLECTIONS.USERS, userId), {
      currentOrganizationId: organizationId,
    });

    await updateDoc(doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId), {
      currentOrganization: organizationId,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Actualiza las preferencias del usuario
   */
  async updatePreferences(preferences: Partial<MultiTenantUser['preferences']>): Promise<void> {
    const userId = this.requireAuth();
    
    await updateDoc(doc(db, this.COLLECTIONS.USERS, userId), {
      preferences,
    });
  }

  /**
   * Cierra sesión
   */
  async signOut(): Promise<void> {
    await signOut(auth);
  }

  /**
   * Verifica autenticación y devuelve user ID
   */
  private requireAuth(): string {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    return user.uid;
  }
}

export const multiTenantAuthService = new MultiTenantAuthService();
export default multiTenantAuthService;
