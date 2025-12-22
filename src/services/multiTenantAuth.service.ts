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
   * Registra un nuevo usuario sin crear organización
   * La organización/granja se creará cuando el usuario entre a la app por primera vez
   */
  async registerUser(data: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<MultiTenantUser> {
    const { email, password, displayName } = data;

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

      // Crear usuario en transacción
      const user = await runTransaction(db, async (transaction) => {
        const userId = firebaseUser.uid;
        const now = new Date();

        // Crear perfil de usuario SIN organización
        const userRef = doc(db, this.COLLECTIONS.USERS, userId);
        const user: MultiTenantUser = {
          uid: userId,
          email: email,
          displayName: displayName,
          photoURL: firebaseUser.photoURL || undefined,
          globalRole: UserRole.OPERADOR, // No ADMIN por defecto
          lastLogin: now,
          createdAt: now,
          // NO asignar currentOrganizationId ni organizations - se hará cuando cree su primera granja
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

        // Crear documento de organizaciones del usuario vacío
        // Se completará cuando cree su primera granja
        const userOrgRef = doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId);
        const userOrganizations: UserOrganizations = {
          userId,
          organizations: {},
          // NO asignar currentOrganization - se hará cuando cree su primera granja
          updatedAt: now,
        };

        const userOrgData = this.removeUndefinedFields({
          ...userOrganizations,
          updatedAt: serverTimestamp(),
        });

        transaction.set(userOrgRef, userOrgData);

        return user;
      });

      console.log('✅ Usuario registrado exitosamente (sin organización)');
      return user;
    } catch (error: any) {
      console.error('❌ Error en registro:', error);
      throw new Error(error.message || 'Error al registrar usuario');
    }
  }

  /**
   * @deprecated Usar registerUser() en su lugar. La organización se crea cuando el usuario crea su primera granja.
   */
  async registerWithOrganization(data: {
    email: string;
    password: string;
    displayName: string;
    organizationName: string;
    organizationDisplayName: string;
  }): Promise<{ user: MultiTenantUser; organization: Organization }> {
    console.warn('⚠️ registerWithOrganization está deprecado. Usa registerUser() y crea la organización después.');
    // Por compatibilidad, crear usuario primero y luego organización
    const user = await this.registerUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });
    
    // Crear organización después
    const organization = await organizationService.createOrganization({
      name: data.organizationName,
      displayName: data.organizationDisplayName,
    });
    
    return { user, organization };
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

      // Crear perfil de usuario SIN organización
      // La organización se creará cuando el usuario cree su primera granja
      const userRef = doc(db, this.COLLECTIONS.USERS, userId);
      const user: MultiTenantUser = {
        uid: userId,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || undefined,
        globalRole: UserRole.OPERADOR, // No ADMIN por defecto
        lastLogin: now,
        createdAt: now,
        // NO asignar currentOrganizationId ni organizations - se hará cuando cree su primera granja
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

      // Crear documento de organizaciones del usuario vacío
      const userOrgRef = doc(db, this.COLLECTIONS.USER_ORGANIZATIONS, userId);
      const userOrganizations: UserOrganizations = {
        userId,
        organizations: {},
        // NO asignar currentOrganization - se hará cuando cree su primera granja
        updatedAt: now,
      };

      const userOrgData = this.removeUndefinedFields({
        ...userOrganizations,
        updatedAt: serverTimestamp(),
      });

      transaction.set(userOrgRef, userOrgData);

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
