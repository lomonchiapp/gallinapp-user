/**
 * Servicio para gestión de granjas y colaboradores
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../components/config/firebase';
import { FarmAccess, FarmRole } from '../types/account';
import { AccessRequestStatus, Collaborator, FarmAccessRequest } from '../types/collaborator';
import { DEFAULT_FARM_SETTINGS, Farm, SUBSCRIPTION_LIMITS, SubscriptionPlan } from '../types/farm';

/**
 * Elimina campos con valor undefined de un objeto recursivamente
 * Firebase no acepta valores undefined, así que los filtramos antes de enviar
 */
const removeUndefinedFields = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item));
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefinedFields(obj[key]);
      }
    }
    return cleaned;
  }
  
  return obj;
};

// === GESTIÓN DE GRANJAS ===

export const createFarm = async (name: string, ownerId: string): Promise<Farm> => {
  try {
    console.log('🏢 FarmService: Creando granja:', name);
    
    // Generar farmCode único
    const farmCode = await generateUniqueFarmCode();
    
    const farmData: Omit<Farm, 'id'> = {
      name: name.trim(),
      farmCode,
      farmInfo: {},
      settings: DEFAULT_FARM_SETTINGS,
      subscription: {
        plan: SubscriptionPlan.FREE,
        status: 'trialing' as any,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días trial
        limits: SUBSCRIPTION_LIMITS[SubscriptionPlan.FREE],
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    // Crear granja en Firestore
    const docRef = await addDoc(collection(db, 'farms'), {
      ...farmData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Crear colaborador owner automáticamente
    await createCollaborator({
      farmId: docRef.id,
      accountId: ownerId,
      role: FarmRole.OWNER,
      invitedBy: 'system',
    });

    const createdFarm: Farm = {
      ...farmData,
      id: docRef.id,
    };

    console.log('✅ Granja creada con código:', farmCode);
    return createdFarm;
  } catch (error: any) {
    console.error('❌ Error creating farm:', error);
    throw new Error('Error al crear la granja: ' + error.message);
  }
};

export const loadUserFarms = async (accountId: string): Promise<Farm[]> => {
  try {
    console.log('🏢 FarmService: Cargando granjas para account:', accountId);
    
    // Obtener granjas donde el usuario es owner
    const ownedFarmsQuery = query(
      collection(db, 'farms'),
      where('ownerId', '==', accountId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    // Obtener granjas donde el usuario es colaborador
    const collaboratorQuery = query(
      collection(db, 'collaborators'),
      where('accountId', '==', accountId),
      where('isActive', '==', true)
    );
    
    const [ownedFarmsSnapshot, collaboratorSnapshot] = await Promise.all([
      getDocs(ownedFarmsQuery),
      getDocs(collaboratorQuery)
    ]);

    const ownedFarms = ownedFarmsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Asegurar que settings exista con valores por defecto
        settings: data.settings || DEFAULT_FARM_SETTINGS,
      } as Farm;
    });

    // Obtener granjas donde es colaborador
    const collaboratorFarmIds = collaboratorSnapshot.docs.map(doc => doc.data().farmId);
    const collaboratorFarms: Farm[] = [];
    
    for (const farmId of collaboratorFarmIds) {
      const farmDoc = await getDoc(doc(db, 'farms', farmId));
      if (farmDoc.exists()) {
        const data = farmDoc.data();
        collaboratorFarms.push({
          id: farmDoc.id,
          ...data,
          // Asegurar que settings exista con valores por defecto
          settings: data.settings || DEFAULT_FARM_SETTINGS,
        } as Farm);
      }
    }

    // Combinar y deduplicar
    const allFarms = [...ownedFarms];
    for (const collaboratorFarm of collaboratorFarms) {
      if (!allFarms.some(f => f.id === collaboratorFarm.id)) {
        allFarms.push(collaboratorFarm);
      }
    }

    console.log(`✅ Cargadas ${allFarms.length} granjas`);
    return allFarms;
  } catch (error: any) {
    console.error('❌ Error loading farms:', error);
    throw new Error('Error al cargar granjas: ' + error.message);
  }
};

export const updateFarm = async (farmId: string, updates: Partial<Farm>): Promise<void> => {
  try {
    const farmRef = doc(db, 'farms', farmId);
    // Eliminar campos undefined antes de enviar a Firebase
    const cleanedUpdates = removeUndefinedFields({
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    await updateDoc(farmRef, cleanedUpdates);
    
    console.log('✅ Granja actualizada');
  } catch (error: any) {
    console.error('❌ Error updating farm:', error);
    throw new Error('Error al actualizar granja: ' + error.message);
  }
};

export const deleteFarm = async (farmId: string): Promise<void> => {
  try {
    // Usar batch para eliminar granja y todos sus colaboradores
    const batch = writeBatch(db);
    
    // Marcar granja como inactiva
    const farmRef = doc(db, 'farms', farmId);
    batch.update(farmRef, { isActive: false, updatedAt: serverTimestamp() });
    
    // Marcar colaboradores como inactivos
    const collaboratorsQuery = query(
      collection(db, 'collaborators'),
      where('farmId', '==', farmId)
    );
    const collaboratorsSnapshot = await getDocs(collaboratorsQuery);
    
    collaboratorsSnapshot.docs.forEach(collaboratorDoc => {
      batch.update(collaboratorDoc.ref, { isActive: false });
    });

    await batch.commit();
    console.log('✅ Granja eliminada (marcada como inactiva)');
  } catch (error: any) {
    console.error('❌ Error deleting farm:', error);
    throw new Error('Error al eliminar granja: ' + error.message);
  }
};

// === GESTIÓN DE COLABORADORES ===

export const loadFarmCollaborators = async (farmId: string): Promise<Collaborator[]> => {
  try {
    const collaboratorsQuery = query(
      collection(db, 'collaborators'),
      where('farmId', '==', farmId),
      where('isActive', '==', true),
      orderBy('joinedAt', 'asc')
    );

    const snapshot = await getDocs(collaboratorsQuery);
    const collaborators = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Collaborator[];

    return collaborators;
  } catch (error: any) {
    console.error('❌ Error loading collaborators:', error);
    throw new Error('Error al cargar colaboradores: ' + error.message);
  }
};

export const createCollaborator = async (collaboratorData: {
  farmId: string;
  accountId: string;
  role: FarmRole;
  invitedBy: string;
  email?: string;
  displayName?: string;
}): Promise<Collaborator> => {
  try {
    const newCollaborator: Omit<Collaborator, 'id'> = {
      ...collaboratorData,
      email: collaboratorData.email || '',
      displayName: collaboratorData.displayName || 'Usuario',
      permissions: [], // TODO: Asignar permisos según rol
      joinedAt: new Date(),
      isActive: true,
    };

    const docRef = await addDoc(collection(db, 'collaborators'), {
      ...newCollaborator,
      joinedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      ...newCollaborator,
    };
  } catch (error: any) {
    console.error('❌ Error creating collaborator:', error);
    throw new Error('Error al crear colaborador: ' + error.message);
  }
};

// === SISTEMA DE FARMCODE ===

export const generateUniqueFarmCode = async (): Promise<string> => {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const code = generateFarmCode();
    const isUnique = await isFarmCodeUnique(code);
    
    if (isUnique) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('No se pudo generar un código único de granja');
};

const generateFarmCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const isFarmCodeUnique = async (farmCode: string): Promise<boolean> => {
  try {
    const farmQuery = query(
      collection(db, 'farms'),
      where('farmCode', '==', farmCode),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(farmQuery);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking farmCode uniqueness:', error);
    return false;
  }
};

export const validateFarmCode = async (farmCode: string): Promise<{ valid: boolean; farm?: Partial<Farm> }> => {
  try {
    const farmQuery = query(
      collection(db, 'farms'),
      where('farmCode', '==', farmCode.toUpperCase()),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(farmQuery);
    
    if (snapshot.empty) {
      return { valid: false };
    }
    
    const farmDoc = snapshot.docs[0];
    const farmData = farmDoc.data() as Farm;
    
    return {
      valid: true,
      farm: {
        id: farmDoc.id,
        name: farmData.name,
        description: farmData.description,
        farmCode: farmData.farmCode,
        location: farmData.farmInfo?.location,
      },
    };
  } catch (error: any) {
    console.error('❌ Error validating farmCode:', error);
    return { valid: false };
  }
};

// === SOLICITUDES DE ACCESO ===

export const createAccessRequest = async (
  farmCode: string, 
  requesterId: string, 
  requesterEmail: string,
  requesterDisplayName: string,
  requestedRole: FarmRole = FarmRole.VIEWER,
  message?: string
): Promise<FarmAccessRequest> => {
  try {
    // Validar farmCode
    const validation = await validateFarmCode(farmCode);
    if (!validation.valid || !validation.farm?.id) {
      throw new Error('Código de granja inválido');
    }

    // Verificar que no existe una solicitud pendiente del mismo usuario
    const existingRequestQuery = query(
      collection(db, 'accessRequests'),
      where('farmId', '==', validation.farm.id),
      where('requesterId', '==', requesterId),
      where('status', '==', AccessRequestStatus.PENDING)
    );
    
    const existingSnapshot = await getDocs(existingRequestQuery);
    if (!existingSnapshot.empty) {
      throw new Error('Ya tienes una solicitud pendiente para esta granja');
    }

    const requestData: Omit<FarmAccessRequest, 'id'> = {
      farmId: validation.farm.id,
      farmCode: farmCode.toUpperCase(),
      requesterId,
      requesterEmail,
      requesterDisplayName,
      requestedRole,
      message,
      status: AccessRequestStatus.PENDING,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    };

    const docRef = await addDoc(collection(db, 'accessRequests'), {
      ...requestData,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      id: docRef.id,
      ...requestData,
    };
  } catch (error: any) {
    console.error('❌ Error creating access request:', error);
    throw new Error('Error al crear solicitud: ' + error.message);
  }
};

export const loadFarmAccessRequests = async (farmId: string): Promise<FarmAccessRequest[]> => {
  try {
    const requestsQuery = query(
      collection(db, 'accessRequests'),
      where('farmId', '==', farmId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(requestsQuery);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as FarmAccessRequest[];

    return requests;
  } catch (error: any) {
    console.error('❌ Error loading access requests:', error);
    throw new Error('Error al cargar solicitudes: ' + error.message);
  }
};

export const approveAccessRequest = async (requestId: string, approverId: string): Promise<Collaborator> => {
  try {
    // Obtener la solicitud
    const requestDoc = await getDoc(doc(db, 'accessRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Solicitud no encontrada');
    }

    const request = requestDoc.data() as FarmAccessRequest;
    
    // Crear colaborador
    const collaborator = await createCollaborator({
      farmId: request.farmId,
      accountId: request.requesterId,
      email: request.requesterEmail,
      displayName: request.requesterDisplayName,
      role: request.requestedRole,
      invitedBy: approverId,
    });

    // Actualizar solicitud como aprobada
    await updateDoc(requestDoc.ref, {
      status: AccessRequestStatus.APPROVED,
      reviewedAt: serverTimestamp(),
      reviewedBy: approverId,
    });

    console.log('✅ Solicitud aprobada, colaborador agregado');
    return collaborator;
  } catch (error: any) {
    console.error('❌ Error approving access request:', error);
    throw new Error('Error al aprobar solicitud: ' + error.message);
  }
};

export const rejectAccessRequest = async (
  requestId: string, 
  reviewerId: string, 
  reason?: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'accessRequests', requestId);
    await updateDoc(requestRef, {
      status: AccessRequestStatus.REJECTED,
      reviewedAt: serverTimestamp(),
      reviewedBy: reviewerId,
      response: reason,
    });

    console.log('✅ Solicitud rechazada');
  } catch (error: any) {
    console.error('❌ Error rejecting access request:', error);
    throw new Error('Error al rechazar solicitud: ' + error.message);
  }
};

// === UTILIDADES ===

export const checkUserNeedsOnboarding = async (accountId: string): Promise<boolean> => {
  try {
    // Verificar si el usuario tiene acceso a alguna granja
    const [ownedFarms, collaborations] = await Promise.all([
      getDocs(query(
        collection(db, 'farms'),
        where('ownerId', '==', accountId),
        where('isActive', '==', true)
      )),
      getDocs(query(
        collection(db, 'collaborators'),
        where('accountId', '==', accountId),
        where('isActive', '==', true)
      ))
    ]);

    const hasOwnedFarms = !ownedFarms.empty;
    const hasCollaborations = !collaborations.empty;

    return !hasOwnedFarms && !hasCollaborations;
  } catch (error: any) {
    console.error('❌ Error checking onboarding status:', error);
    return true; // Si hay error, mostrar onboarding por seguridad
  }
};

export const getUserFarmAccess = async (accountId: string): Promise<FarmAccess[]> => {
  try {
    // Cargar colaboraciones del usuario
    const collaboratorQuery = query(
      collection(db, 'collaborators'),
      where('accountId', '==', accountId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(collaboratorQuery);
    const collaborations = snapshot.docs.map(doc => doc.data()) as Collaborator[];

    // Convertir a FarmAccess
    const farmAccess: FarmAccess[] = [];
    
    for (const collaboration of collaborations) {
      // Obtener nombre de la granja
      const farmDoc = await getDoc(doc(db, 'farms', collaboration.farmId));
      if (farmDoc.exists()) {
        const farmData = farmDoc.data() as Farm;
        
        farmAccess.push({
          farmId: collaboration.farmId,
          farmName: farmData.name,
          role: collaboration.role,
          permissions: collaboration.permissions,
          joinedAt: collaboration.joinedAt,
          lastAccessAt: collaboration.lastActiveAt,
          isActive: collaboration.isActive,
        });
      }
    }

    return farmAccess;
  } catch (error: any) {
    console.error('❌ Error getting farm access:', error);
    throw new Error('Error al obtener accesos a granjas: ' + error.message);
  }
};

// === BÚSQUEDA DE USUARIOS ===

export interface UserSearchResult {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  isAlreadyCollaborator?: boolean;
}

/**
 * Busca usuarios por email en la colección de accounts
 */
export const searchUserByEmail = async (email: string, farmId: string): Promise<UserSearchResult | null> => {
  try {
    // Buscar en la colección de accounts
    const accountsQuery = query(
      collection(db, 'accounts'),
      where('email', '==', email.toLowerCase().trim()),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(accountsQuery);
    
    if (snapshot.empty) {
      return null;
    }

    const accountDoc = snapshot.docs[0];
    const accountData = accountDoc.data();

    // Verificar si ya es colaborador de esta granja
    const collaboratorQuery = query(
      collection(db, 'collaborators'),
      where('farmId', '==', farmId),
      where('accountId', '==', accountDoc.id),
      where('isActive', '==', true)
    );

    const collaboratorSnapshot = await getDocs(collaboratorQuery);
    const isAlreadyCollaborator = !collaboratorSnapshot.empty;

    return {
      uid: accountDoc.id,
      email: accountData.email,
      displayName: accountData.displayName || accountData.email,
      photoURL: accountData.photoURL || null,
      isAlreadyCollaborator,
    };
  } catch (error: any) {
    console.error('❌ Error searching user by email:', error);
    throw new Error('Error al buscar usuario: ' + error.message);
  }
};

/**
 * Invita un usuario existente a la granja por email
 */
export const inviteUserByEmail = async (
  farmId: string,
  userEmail: string,
  role: FarmRole,
  invitedBy: string
): Promise<Collaborator> => {
  try {
    // Buscar el usuario
    const userResult = await searchUserByEmail(userEmail, farmId);
    
    if (!userResult) {
      throw new Error('Usuario no encontrado. El usuario debe estar registrado en la aplicación.');
    }

    if (userResult.isAlreadyCollaborator) {
      throw new Error('Este usuario ya es colaborador de la granja');
    }

    // Crear colaborador
    const collaborator = await createCollaborator({
      farmId,
      accountId: userResult.uid,
      email: userResult.email,
      displayName: userResult.displayName,
      role,
      invitedBy,
    });

    console.log('✅ Usuario invitado exitosamente:', userEmail);
    return collaborator;
  } catch (error: any) {
    console.error('❌ Error inviting user by email:', error);
    throw error;
  }
};

/**
 * Actualiza el rol de un colaborador
 */
export const updateCollaboratorRole = async (
  farmId: string,
  collaboratorId: string,
  newRole: FarmRole
): Promise<void> => {
  try {
    const collaboratorRef = doc(db, 'collaborators', collaboratorId);
    
    // Verificar que el colaborador pertenece a la granja
    const collaboratorDoc = await getDoc(collaboratorRef);
    if (!collaboratorDoc.exists()) {
      throw new Error('Colaborador no encontrado');
    }

    const collaboratorData = collaboratorDoc.data() as Collaborator;
    if (collaboratorData.farmId !== farmId) {
      throw new Error('El colaborador no pertenece a esta granja');
    }

    await updateDoc(collaboratorRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Rol de colaborador actualizado');
  } catch (error: any) {
    console.error('❌ Error updating collaborator role:', error);
    throw new Error('Error al actualizar rol: ' + error.message);
  }
};

/**
 * Elimina un colaborador de la granja
 */
export const removeCollaborator = async (
  farmId: string,
  collaboratorId: string
): Promise<void> => {
  try {
    const collaboratorRef = doc(db, 'collaborators', collaboratorId);
    
    // Verificar que el colaborador pertenece a la granja
    const collaboratorDoc = await getDoc(collaboratorRef);
    if (!collaboratorDoc.exists()) {
      throw new Error('Colaborador no encontrado');
    }

    const collaboratorData = collaboratorDoc.data() as Collaborator;
    if (collaboratorData.farmId !== farmId) {
      throw new Error('El colaborador no pertenece a esta granja');
    }

    // Marcar como inactivo en lugar de eliminar
    await updateDoc(collaboratorRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Colaborador eliminado');
  } catch (error: any) {
    console.error('❌ Error removing collaborator:', error);
    throw new Error('Error al eliminar colaborador: ' + error.message);
  }
};