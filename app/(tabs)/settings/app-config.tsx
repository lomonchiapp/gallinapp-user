/**
 * Pantalla de configuración de la aplicación y gestión de usuarios
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import {
    createUserByAdmin,
    deleteUserByAdmin,
    generateTemporaryPassword,
    getAllUsers,
    updateUserByAdmin
} from '../../../src/services/users.service';
import { useAppConfigStore } from '../../../src/stores/appConfigStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { User, UserRole } from '../../../src/types';

export default function AppSettingsScreen() {
  const { config, isLoading, error, cargarConfiguracion, actualizarConfig } = useAppConfigStore();
  const { user } = useAuthStore();
  
  // Estados para configuración de precios
  const [precioHuevo, setPrecioHuevo] = useState('');
  const [precioLibraEngorde, setPrecioLibraEngorde] = useState('');
  const [precioUnidadIsraeli, setPrecioUnidadIsraeli] = useState('');
  const [diasCrecimientoIsraeli, setDiasCrecimientoIsraeli] = useState('');
  const [diasCrecimientoEngorde, setDiasCrecimientoEngorde] = useState('');
  const [pesoObjetivoEngorde, setPesoObjetivoEngorde] = useState('');
  const [tasaMortalidadAceptable, setTasaMortalidadAceptable] = useState('');
  
  // Estados para gestión de usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'users'>('config');
  
  // Estados del formulario de usuario
  const [userForm, setUserForm] = useState({
    email: '',
    displayName: '',
    role: UserRole.OPERADOR,
    password: ''
  });
  
  // Cargar configuración al montar el componente
  useEffect(() => {
    cargarConfiguracion();
    if (user?.role === UserRole.ADMIN) {
      loadUsers();
    }
  }, [user]);
  
  // Cargar usuarios (solo para admins)
  const loadUsers = async () => {
    if (user?.role !== UserRole.ADMIN) return;
    
    setLoadingUsers(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Abrir modal para crear usuario
  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      displayName: '',
      role: UserRole.OPERADOR,
      password: generateTemporaryPassword()
    });
    setShowUserModal(true);
  };
  
  // Abrir modal para editar usuario
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      password: ''
    });
    setShowUserModal(true);
  };
  
  // Guardar usuario (crear o editar)
  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Editar usuario existente
        await updateUserByAdmin(editingUser.uid, {
          displayName: userForm.displayName,
          role: userForm.role
        });
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        if (!userForm.email || !userForm.displayName || !userForm.password) {
          Alert.alert('Error', 'Todos los campos son obligatorios');
          return;
        }
        
        await createUserByAdmin(
          userForm.email,
          userForm.password,
          userForm.displayName,
          userForm.role
        );
        
        Alert.alert(
          'Usuario Creado',
          `Usuario creado exitosamente.\n\nEmail: ${userForm.email}\nContraseña temporal: ${userForm.password}\n\nEl usuario deberá cambiar su contraseña en el primer inicio de sesión.`,
          [{ text: 'OK' }]
        );
      }
      
      setShowUserModal(false);
      loadUsers(); // Recargar lista de usuarios
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar el usuario');
    }
  };
  
  // Eliminar usuario
  const handleDeleteUser = (userToDelete: User) => {
    if (userToDelete.uid === user?.uid) {
      Alert.alert('Error', 'No puedes eliminar tu propio usuario');
      return;
    }
    
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar al usuario "${userToDelete.displayName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserByAdmin(userToDelete.uid);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers(); // Recargar lista de usuarios
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          }
        }
      ]
    );
  };
  
  // Actualizar estados locales cuando se carga la configuración
  useEffect(() => {
    if (config) {
      setPrecioHuevo(config.precioHuevo.toString());
      setPrecioLibraEngorde(config.precioLibraEngorde.toString());
      setPrecioUnidadIsraeli(config.precioUnidadIsraeli.toString());
      setDiasCrecimientoIsraeli(config.diasCrecimientoIsraeli.toString());
      setDiasCrecimientoEngorde(config.diasCrecimientoEngorde.toString());
      setPesoObjetivoEngorde(config.pesoObjetivoEngorde.toString());
      setTasaMortalidadAceptable(config.tasaMortalidadAceptable.toString());
    }
  }, [config]);
  
  // Manejar guardado de configuración
  const handleSaveSettings = async () => {
    try {
      // Validar que todos los campos sean números válidos
      const settings = {
        precioHuevo: parseFloat(precioHuevo),
        precioLibraEngorde: parseFloat(precioLibraEngorde),
        precioUnidadIsraeli: parseFloat(precioUnidadIsraeli),
        diasCrecimientoIsraeli: parseInt(diasCrecimientoIsraeli),
        diasCrecimientoEngorde: parseInt(diasCrecimientoEngorde),
        pesoObjetivoEngorde: parseFloat(pesoObjetivoEngorde),
        tasaMortalidadAceptable: parseFloat(tasaMortalidadAceptable),
      };
      
      // Verificar que todos los valores sean números válidos
      for (const [key, value] of Object.entries(settings)) {
        if (isNaN(value) || value < 0) {
          Alert.alert('Error', `El valor para ${key} no es válido`);
          return;
        }
      }
      
      await actualizarConfig(settings);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };
  
  if (isLoading && !config) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración del Sistema</Text>
        {user?.role === UserRole.ADMIN && (
          <Text style={styles.subtitle}>Panel de Administrador</Text>
        )}
      </View>
      
      {error && (
        <Card style={styles.errorCard}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}
      
      {/* Pestañas (solo mostrar si es admin) */}
      {user?.role === UserRole.ADMIN && (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'config' && styles.activeTab]}
            onPress={() => setActiveTab('config')}
          >
            <Ionicons name="settings-outline" size={20} color={activeTab === 'config' ? colors.primary : colors.textMedium} />
            <Text style={[styles.tabText, activeTab === 'config' && styles.activeTabText]}>
              Configuración
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'users' && styles.activeTab]}
            onPress={() => setActiveTab('users')}
          >
            <Ionicons name="people-outline" size={20} color={activeTab === 'users' ? colors.primary : colors.textMedium} />
            <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
              Usuarios
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Contenido de Configuración */}
      {activeTab === 'config' && (
        <>
          <Card style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Precios</Text>
        
        <View style={styles.inputGroup}>
          <Input
            label="Precio por Huevo ($)"
            value={precioHuevo}
            onChangeText={setPrecioHuevo}
            keyboardType="numeric"
            placeholder="0.00"
            required
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Input
            label="Precio por Libra de Pollo de Engorde ($)"
            value={precioLibraEngorde}
            onChangeText={setPrecioLibraEngorde}
            keyboardType="numeric"
            placeholder="0.00"
            required
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Input
            label="Precio por Unidad de Pollo Israelí ($)"
            value={precioUnidadIsraeli}
            onChangeText={setPrecioUnidadIsraeli}
            keyboardType="numeric"
            placeholder="0.00"
            required
          />
        </View>
      </Card>
      
      <Card style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Parámetros de Producción</Text>
        
        <View style={styles.inputGroup}>
          <Input
            label="Días de Crecimiento para Pollos Israelíes"
            value={diasCrecimientoIsraeli}
            onChangeText={setDiasCrecimientoIsraeli}
            keyboardType="numeric"
            placeholder="0"
            required
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Input
            label="Días de Crecimiento para Pollos de Engorde"
            value={diasCrecimientoEngorde}
            onChangeText={setDiasCrecimientoEngorde}
            keyboardType="numeric"
            placeholder="0"
            required
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Input
            label="Peso Objetivo para Pollos de Engorde (libras)"
            value={pesoObjetivoEngorde}
            onChangeText={setPesoObjetivoEngorde}
            keyboardType="numeric"
            placeholder="0.00"
            required
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Input
            label="Tasa de Mortalidad Aceptable (%)"
            value={tasaMortalidadAceptable}
            onChangeText={setTasaMortalidadAceptable}
            keyboardType="numeric"
            placeholder="0.00"
            required
          />
        </View>
      </Card>
      
          <View style={styles.buttonContainer}>
            <Button
              title="Guardar Configuración"
              onPress={handleSaveSettings}
              loading={isLoading}
              style={styles.saveButton}
            />
          </View>
        </>
      )}
      
      {/* Contenido de Gestión de Usuarios */}
      {activeTab === 'users' && user?.role === UserRole.ADMIN && (
        <>
          <View style={styles.usersHeader}>
            <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
            <Button
              title="Nuevo Usuario"
              onPress={handleCreateUser}
              size="small"
              style={styles.newUserButton}
            />
          </View>
          
          {loadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : (
            <Card style={styles.usersCard}>
              {users.length === 0 ? (
                <View style={styles.emptyUsers}>
                  <Ionicons name="people-outline" size={48} color={colors.textLight} />
                  <Text style={styles.emptyUsersText}>No hay usuarios registrados</Text>
                </View>
              ) : (
                users.map((userItem) => (
                  <View key={userItem.uid} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <View style={styles.userAvatar}>
                        <Ionicons 
                          name="person" 
                          size={24} 
                          color={userItem.role === UserRole.ADMIN ? colors.warning : colors.primary} 
                        />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{userItem.displayName}</Text>
                        <Text style={styles.userEmail}>{userItem.email}</Text>
                        <View style={styles.userRoleBadge}>
                          <Text style={[
                            styles.userRoleText,
                            { color: userItem.role === UserRole.ADMIN ? colors.warning : colors.primary }
                          ]}>
                            {userItem.role === UserRole.ADMIN ? 'Administrador' : 'Operador'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.userActions}>
                      <TouchableOpacity
                        style={styles.userActionButton}
                        onPress={() => handleEditUser(userItem)}
                      >
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      
                      {userItem.uid !== user.uid && (
                        <TouchableOpacity
                          style={[styles.userActionButton, styles.deleteButton]}
                          onPress={() => handleDeleteUser(userItem)}
                        >
                          <Ionicons name="trash" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </Card>
          )}
        </>
      )}
      
      {/* Modal para crear/editar usuario */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Input
                  label="Nombre Completo"
                  value={userForm.displayName}
                  onChangeText={(text) => setUserForm(prev => ({ ...prev, displayName: text }))}
                  placeholder="Ej: Juan Pérez"
                  required
                />
              </View>
              
              {!editingUser && (
                <View style={styles.inputGroup}>
                  <Input
                    label="Correo Electrónico"
                    value={userForm.email}
                    onChangeText={(text) => setUserForm(prev => ({ ...prev, email: text }))}
                    placeholder="usuario@ejemplo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                  />
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rol de Usuario</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      userForm.role === UserRole.OPERADOR && styles.roleOptionSelected
                    ]}
                    onPress={() => setUserForm(prev => ({ ...prev, role: UserRole.OPERADOR }))}
                  >
                    <Ionicons 
                      name="person" 
                      size={20} 
                      color={userForm.role === UserRole.OPERADOR ? colors.white : colors.primary} 
                    />
                    <Text style={[
                      styles.roleOptionText,
                      userForm.role === UserRole.OPERADOR && styles.roleOptionTextSelected
                    ]}>
                      Operador
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      userForm.role === UserRole.ADMIN && styles.roleOptionSelected
                    ]}
                    onPress={() => setUserForm(prev => ({ ...prev, role: UserRole.ADMIN }))}
                  >
                    <Ionicons 
                      name="shield-checkmark" 
                      size={20} 
                      color={userForm.role === UserRole.ADMIN ? colors.white : colors.warning} 
                    />
                    <Text style={[
                      styles.roleOptionText,
                      userForm.role === UserRole.ADMIN && styles.roleOptionTextSelected
                    ]}>
                      Administrador
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {!editingUser && (
                <View style={styles.inputGroup}>
                  <View style={styles.passwordContainer}>
                    <Input
                      label="Contraseña Temporal"
                      value={userForm.password}
                      onChangeText={(text) => setUserForm(prev => ({ ...prev, password: text }))}
                      placeholder="Contraseña temporal"
                      secureTextEntry
                      required
                    />
                    <TouchableOpacity
                      style={styles.generatePasswordButton}
                      onPress={() => setUserForm(prev => ({ ...prev, password: generateTemporaryPassword() }))}
                    >
                      <Ionicons name="refresh" size={20} color={colors.primary} />
                      <Text style={styles.generatePasswordText}>Generar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.passwordHint}>
                    El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setShowUserModal(false)}
                style={styles.modalButton}
              />
              <Button
                title={editingUser ? 'Actualizar' : 'Crear Usuario'}
                onPress={handleSaveUser}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMedium,
  },
  
  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMedium,
  },
  
  // Error Card
  errorCard: {
    backgroundColor: colors.danger + '10',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    marginLeft: 8,
    flex: 1,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
  },
  activeTabText: {
    color: colors.white,
  },
  
  // Settings Card
  settingsCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  saveButton: {
    height: 50,
  },
  
  // Users Section
  usersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newUserButton: {
    minWidth: 120,
  },
  usersCard: {
    padding: 16,
  },
  emptyUsers: {
    alignItems: 'center',
    padding: 40,
  },
  emptyUsersText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMedium,
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.veryLightGray,
    borderRadius: 12,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 4,
  },
  userRoleBadge: {
    alignSelf: 'flex-start',
  },
  userRoleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.white,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: colors.danger + '10',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    backgroundColor: colors.white,
  },
  roleOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleOptionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
  },
  roleOptionTextSelected: {
    color: colors.white,
  },
  passwordContainer: {
    position: 'relative',
  },
  generatePasswordButton: {
    position: 'absolute',
    right: 8,
    top: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 6,
  },
  generatePasswordText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  passwordHint: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

