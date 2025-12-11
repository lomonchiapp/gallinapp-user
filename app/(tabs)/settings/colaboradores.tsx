/**
 * Página de gestión de colaboradores
 * Permite invitar colaboradores por email o generar link de invitación
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, shadows, spacing, typography } from '../../../src/constants/designSystem';
import { FarmRole } from '../../../src/types/account';
import { Collaborator } from '../../../src/types/collaborator';
import {
  approveAccessRequest,
  inviteUserByEmail,
  loadFarmAccessRequests,
  loadFarmCollaborators,
  rejectAccessRequest,
  removeCollaborator as removeCollaboratorService,
  searchUserByEmail,
  updateCollaboratorRole as updateCollaboratorRoleService,
} from '../../../src/services/farm.service';
import { useAuthStore } from '../../../src/stores/authStore';
import { useFarmStore } from '../../../src/stores/farmStore';
import { AccessRequestStatus } from '../../../src/types/collaborator';

type InviteMethod = 'email' | 'link';

export default function ColaboradoresScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { currentFarm, loadCollaborators, removeCollaborator, updateCollaboratorRole } = useFarmStore();
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteMethod, setInviteMethod] = useState<InviteMethod>('email');
  
  // Estado para invitación por email
  const [emailSearch, setEmailSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [userFound, setUserFound] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<FarmRole>(FarmRole.VIEWER);
  const [inviting, setInviting] = useState(false);
  
  // Estado para link de invitación
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentFarm?.id]);

  const loadData = async () => {
    if (!currentFarm) return;
    
    setLoading(true);
    try {
      const [collabs, requests] = await Promise.all([
        loadFarmCollaborators(currentFarm.id),
        loadFarmAccessRequests(currentFarm.id),
      ]);
      
      setCollaborators(collabs);
      setAccessRequests(requests.filter(r => r.status === AccessRequestStatus.PENDING));
      
      // Generar link de invitación
      const link = generateInviteLink(currentFarm.farmCode);
      setInviteLink(link);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar los colaboradores');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = (farmCode: string): string => {
    // En producción, esto sería una URL real de la app
    const baseUrl = 'https://gallinapp.com/invite';
    return `${baseUrl}?code=${farmCode}`;
  };

  const handleSearchUser = async () => {
    if (!currentFarm || !emailSearch.trim()) return;
    
    setSearching(true);
    setUserFound(null);
    
    try {
      const result = await searchUserByEmail(emailSearch.trim(), currentFarm.id);
      
      if (!result) {
        Alert.alert(
          'Usuario no encontrado',
          'El usuario debe estar registrado en la aplicación. Puedes generar un link de invitación para que se registre primero.'
        );
        return;
      }
      
      if (result.isAlreadyCollaborator) {
        Alert.alert('Ya es colaborador', 'Este usuario ya es colaborador de la granja');
        return;
      }
      
      setUserFound(result);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al buscar usuario');
    } finally {
      setSearching(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!currentFarm || !userFound || !user?.uid) return;
    
    setInviting(true);
    try {
      await inviteUserByEmail(
        currentFarm.id,
        userFound.email,
        selectedRole,
        user.uid
      );
      
      Alert.alert('Éxito', 'Colaborador invitado exitosamente');
      setEmailSearch('');
      setUserFound(null);
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al invitar colaborador');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      Clipboard.setString(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo copiar el link');
    }
  };

  const handleShareLink = async () => {
    try {
      const message = `¡Únete a mi granja ${currentFarm?.name} en Gallinapp! Usa este código: ${currentFarm?.farmCode}\n\nO descarga la app y usa este link: ${inviteLink}`;
      await Linking.openURL(`mailto:?subject=Invitación a ${currentFarm?.name}&body=${encodeURIComponent(message)}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el cliente de correo');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!user?.uid) return;
    
    try {
      await approveAccessRequest(requestId, user.uid);
      Alert.alert('Éxito', 'Solicitud aprobada');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al aprobar solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!user?.uid) return;
    
    Alert.alert(
      'Rechazar solicitud',
      '¿Estás seguro de que deseas rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectAccessRequest(requestId, user.uid);
              Alert.alert('Éxito', 'Solicitud rechazada');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al rechazar solicitud');
            }
          },
        },
      ]
    );
  };

  const handleRemoveCollaborator = async (collaboratorId: string, collaboratorName: string) => {
    if (!currentFarm) return;
    
    Alert.alert(
      'Eliminar colaborador',
      `¿Estás seguro de que deseas eliminar a ${collaboratorName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeCollaboratorService(currentFarm.id, collaboratorId);
              await loadData();
              Alert.alert('Éxito', 'Colaborador eliminado');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al eliminar colaborador');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (collaboratorId: string, newRole: FarmRole) => {
    if (!currentFarm) return;
    
    try {
      await updateCollaboratorRoleService(currentFarm.id, collaboratorId, newRole);
      await loadData();
      Alert.alert('Éxito', 'Rol actualizado');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar rol');
    }
  };

  const getRoleColor = (role: FarmRole) => {
    switch (role) {
      case FarmRole.OWNER:
        return isDark ? '#FFD700' : '#F57C00';
      case FarmRole.ADMIN:
        return isDark ? '#EF4444' : '#D32F2F';
      case FarmRole.MANAGER:
        return isDark ? '#3B82F6' : '#1976D2';
      case FarmRole.VIEWER:
        return isDark ? '#6B7280' : '#757575';
      default:
        return colors.text.secondary;
    }
  };

  const getRoleLabel = (role: FarmRole) => {
    switch (role) {
      case FarmRole.OWNER:
        return 'Propietario';
      case FarmRole.ADMIN:
        return 'Administrador';
      case FarmRole.MANAGER:
        return 'Gerente';
      case FarmRole.VIEWER:
        return 'Solo Lectura';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <AppHeader title="Colaboradores" showBack />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            Cargando colaboradores...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!currentFarm) {
    return (
      <ScreenWrapper>
        <AppHeader title="Colaboradores" showBack />
        <View style={[styles.emptyContainer, { backgroundColor: colors.background.primary }]}>
          <Ionicons name="business-outline" size={64} color={colors.text.secondary} />
          <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
            No hay granja seleccionada
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <AppHeader title="Colaboradores" showBack />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Código de invitación */}
        <Card style={styles.farmCodeCard}>
          <View style={styles.farmCodeHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.1)' }]}>
              <Ionicons name="key-outline" size={24} color={isDark ? '#66BB6A' : '#2E7D32'} />
            </View>
            <View style={styles.farmCodeInfo}>
              <Text style={[styles.farmCodeLabel, { color: colors.text.secondary }]}>
                Código de Invitación
              </Text>
              <Text style={[styles.farmCodeValue, { color: colors.text.primary }]}>
                {currentFarm.farmCode}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(currentFarm.farmCode);
                Alert.alert('Copiado', 'Código copiado al portapapeles');
              }}
              style={[styles.copyButton, { backgroundColor: colors.primary[500] }]}
            >
              <Ionicons name="copy-outline" size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Métodos de invitación */}
        <Card style={styles.inviteCard}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Invitar Colaborador
          </Text>
          
          <View style={styles.methodTabs}>
            <TouchableOpacity
              style={[
                styles.methodTab,
                inviteMethod === 'email' && { backgroundColor: colors.primary[500] },
              ]}
              onPress={() => setInviteMethod('email')}
            >
              <Text
                style={[
                  styles.methodTabText,
                  { color: inviteMethod === 'email' ? colors.text.inverse : colors.text.primary },
                ]}
              >
                Por Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.methodTab,
                inviteMethod === 'link' && { backgroundColor: colors.primary[500] },
              ]}
              onPress={() => setInviteMethod('link')}
            >
              <Text
                style={[
                  styles.methodTabText,
                  { color: inviteMethod === 'link' ? colors.text.inverse : colors.text.primary },
                ]}
              >
                Generar Link
              </Text>
            </TouchableOpacity>
          </View>

          {inviteMethod === 'email' ? (
            <View style={styles.emailInvite}>
              <View style={styles.searchContainer}>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    },
                  ]}
                  placeholder="Buscar por correo electrónico"
                  placeholderTextColor={colors.text.secondary}
                  value={emailSearch}
                  onChangeText={setEmailSearch}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.primary[500] }]}
                  onPress={handleSearchUser}
                  disabled={searching || !emailSearch.trim()}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color={colors.text.inverse} />
                  ) : (
                    <Ionicons name="search" size={20} color={colors.text.inverse} />
                  )}
                </TouchableOpacity>
              </View>

              {userFound && (
                <View style={[styles.userFoundCard, { backgroundColor: colors.background.secondary }]}>
                  <View style={styles.userFoundInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={[styles.userAvatarText, { color: colors.text.inverse }]}>
                        {userFound.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: colors.text.primary }]}>
                        {userFound.displayName}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.text.secondary }]}>
                        {userFound.email}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roleSelector}>
                    <Text style={[styles.roleLabel, { color: colors.text.primary }]}>
                      Seleccionar Rol:
                    </Text>
                    <View style={styles.roleOptions}>
                      {[FarmRole.VIEWER, FarmRole.MANAGER, FarmRole.ADMIN].map((role) => (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.roleOption,
                            {
                              backgroundColor:
                                selectedRole === role ? colors.primary[500] : colors.background.tertiary,
                              borderColor:
                                selectedRole === role ? colors.primary[500] : colors.border.light,
                            },
                          ]}
                          onPress={() => setSelectedRole(role)}
                        >
                          <Text
                            style={[
                              styles.roleOptionText,
                              {
                                color:
                                  selectedRole === role ? colors.text.inverse : colors.text.primary,
                              },
                            ]}
                          >
                            {getRoleLabel(role)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.inviteButton, { backgroundColor: isDark ? '#66BB6A' : '#2E7D32' }]}
                    onPress={handleInviteByEmail}
                    disabled={inviting}
                  >
                    {inviting ? (
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                      <>
                        <Ionicons name="person-add" size={20} color={colors.text.inverse} />
                        <Text style={[styles.inviteButtonText, { color: colors.text.inverse }]}>
                          Invitar Colaborador
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.linkInvite}>
              <Text style={[styles.linkDescription, { color: colors.text.secondary }]}>
                Comparte este link para invitar a nuevos usuarios. Si no tienen la app, podrán descargarla y usar el código de invitación.
              </Text>
              
              <View style={[styles.linkContainer, { backgroundColor: colors.background.secondary }]}>
                <Text style={[styles.linkText, { color: colors.text.primary }]} numberOfLines={1}>
                  {inviteLink}
                </Text>
                <TouchableOpacity
                  onPress={handleCopyLink}
                  style={[styles.copyLinkButton, { backgroundColor: colors.primary[500] }]}
                >
                  {linkCopied ? (
                    <Ionicons name="checkmark" size={20} color={colors.text.inverse} />
                  ) : (
                    <Ionicons name="copy-outline" size={20} color={colors.text.inverse} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: colors.primary[500] }]}
                onPress={handleShareLink}
              >
                <Ionicons name="share-outline" size={20} color={colors.text.inverse} />
                <Text style={[styles.shareButtonText, { color: colors.text.inverse }]}>
                  Compartir por Email
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Solicitudes pendientes */}
        {accessRequests.length > 0 && (
          <Card style={styles.requestsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Solicitudes Pendientes ({accessRequests.length})
            </Text>
            {accessRequests.map((request) => (
              <View
                key={request.id}
                style={[styles.requestItem, { backgroundColor: colors.background.secondary }]}
              >
                <View style={styles.requestInfo}>
                  <Text style={[styles.requestName, { color: colors.text.primary }]}>
                    {request.requesterDisplayName}
                  </Text>
                  <Text style={[styles.requestEmail, { color: colors.text.secondary }]}>
                    {request.requesterEmail}
                  </Text>
                  <Text style={[styles.requestRole, { color: getRoleColor(request.requestedRole) }]}>
                    Solicita rol: {getRoleLabel(request.requestedRole)}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={[styles.approveButton, { backgroundColor: isDark ? '#66BB6A' : '#2E7D32' }]}
                    onPress={() => handleApproveRequest(request.id)}
                  >
                    <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rejectButton, { backgroundColor: isDark ? '#EF4444' : '#D32F2F' }]}
                    onPress={() => handleRejectRequest(request.id)}
                  >
                    <Ionicons name="close" size={18} color={colors.text.inverse} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Lista de colaboradores */}
        <Card style={styles.collaboratorsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            Colaboradores ({collaborators.length})
          </Text>
          {collaborators.length === 0 ? (
            <View style={styles.emptyCollaborators}>
              <Ionicons name="people-outline" size={48} color={colors.text.secondary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No hay colaboradores aún
              </Text>
            </View>
          ) : (
            collaborators.map((collaborator) => (
              <View
                key={collaborator.id}
                style={[styles.collaboratorItem, { backgroundColor: colors.background.secondary }]}
              >
                <View style={styles.collaboratorInfo}>
                  <View style={styles.collaboratorAvatar}>
                    <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                      {collaborator.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.collaboratorDetails}>
                    <Text style={[styles.collaboratorName, { color: colors.text.primary }]}>
                      {collaborator.displayName}
                    </Text>
                    <Text style={[styles.collaboratorEmail, { color: colors.text.secondary }]}>
                      {collaborator.email}
                    </Text>
                    <View style={styles.collaboratorMeta}>
                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: getRoleColor(collaborator.role) + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.roleBadgeText, { color: getRoleColor(collaborator.role) }]}
                        >
                          {getRoleLabel(collaborator.role)}
                        </Text>
                      </View>
                      <Text style={[styles.joinedDate, { color: colors.text.tertiary }]}>
                        Se unió {new Date(collaborator.joinedAt).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                  </View>
                </View>
                {collaborator.role !== FarmRole.OWNER && (
                  <View style={styles.collaboratorActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary[500] }]}
                      onPress={() => {
                        // Mostrar selector de rol
                        Alert.alert(
                          'Cambiar Rol',
                          `Selecciona el nuevo rol para ${collaborator.displayName}`,
                          [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Solo Lectura',
                              onPress: () => handleChangeRole(collaborator.id, FarmRole.VIEWER),
                            },
                            {
                              text: 'Gerente',
                              onPress: () => handleChangeRole(collaborator.id, FarmRole.MANAGER),
                            },
                            {
                              text: 'Administrador',
                              onPress: () => handleChangeRole(collaborator.id, FarmRole.ADMIN),
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="person-outline" size={18} color={colors.text.inverse} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: isDark ? '#EF4444' : '#D32F2F' }]}
                      onPress={() => handleRemoveCollaborator(collaborator.id, collaborator.displayName)}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.text.inverse} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.sizes.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  emptyText: {
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  farmCodeCard: {
    marginBottom: spacing[4],
  },
  farmCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmCodeInfo: {
    flex: 1,
  },
  farmCodeLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    marginBottom: spacing[1],
  },
  farmCodeValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    fontFamily: 'monospace',
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[4],
  },
  methodTabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  methodTab: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  methodTabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  emailInvite: {
    gap: spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    fontSize: typography.sizes.base,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userFoundCard: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[3],
  },
  userFoundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#345DAD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
  },
  roleSelector: {
    gap: spacing[2],
  },
  roleLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
  },
  roleOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleOptionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as '500',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  inviteButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  linkInvite: {
    gap: spacing[3],
  },
  linkDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  linkText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: 'monospace',
  },
  copyLinkButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  shareButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  requestsCard: {
    marginBottom: spacing[4],
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  requestEmail: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  requestRole: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  approveButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collaboratorsCard: {
    marginBottom: spacing[4],
  },
  emptyCollaborators: {
    alignItems: 'center',
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  collaboratorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  collaboratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  collaboratorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#345DAD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  collaboratorEmail: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  collaboratorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  roleBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: borderRadius.sm,
  },
  roleBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
  },
  joinedDate: {
    fontSize: typography.sizes.xs,
  },
  collaboratorActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

