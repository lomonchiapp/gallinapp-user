/**
 * Pantalla de perfil de usuario - Versión unificada y mejorada
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';
import { useAuthStore } from '../../../src/stores/authStore';
import { useMultiTenantAuthStore } from '../../../src/stores/multiTenantAuthStore';

export default function ProfileScreen() {
  const { user, logout, updateProfile, isLoading } = useAuthStore();
  const { user: multiTenantUser } = useMultiTenantAuthStore();
  const { colors, isDark } = useTheme();
  
  const displayUser = multiTenantUser || user;
  const [displayName, setDisplayName] = useState(displayUser?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  
  // Actualizar displayName cuando cambie el usuario
  useEffect(() => {
    setDisplayName(displayUser?.displayName || '');
  }, [displayUser?.displayName]);
  
  // Función para actualizar el perfil
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    
    try {
      await updateProfile(displayName.trim());
      setIsEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro que desea cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          onPress: () => logout(),
          style: 'destructive',
        },
      ]
    );
  };
  
  const handleChangePassword = () => {
    router.push('/(modules)/settings/change-password');
  };
  
  return (
    <ScreenWrapper transitionType="fade">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppHeader
          variant="fixed"
          enableBlur={false}
          showFarmSwitcher={false}
          showThemeToggle={true}
          showBack={true}
          onBackPress={() => router.back()}
          title1="Perfil"
          title2={displayUser?.displayName || 'Usuario'}
        />
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Card de Perfil */}
          <Card style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary[500] }]}>
                <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                  {displayUser?.displayName?.charAt(0) || displayUser?.email?.charAt(0) || 'U'}
                </Text>
              </View>
              {!isEditing && (
                <TouchableOpacity 
                  style={[styles.editAvatarButton, { backgroundColor: colors.primary[500] }]}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="pencil" size={18} color={colors.text.inverse} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              {isEditing ? (
                <View style={styles.editForm}>
                  <Input
                    label="Nombre"
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Tu nombre"
                  />
                  
                  <View style={styles.editActions}>
                    <Button
                      title="Cancelar"
                      onPress={() => {
                        setDisplayName(displayUser?.displayName || '');
                        setIsEditing(false);
                      }}
                      variant="outline"
                      style={styles.editActionButton}
                    />
                    <Button
                      title="Guardar"
                      onPress={handleUpdateProfile}
                      loading={isLoading}
                      style={styles.editActionButton}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={[styles.profileName, { color: colors.text.primary }]}>
                    {displayUser?.displayName || 'Usuario'}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
                    {displayUser?.email}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: colors.primary[100] }]}>
                    <Text style={[styles.roleText, { color: colors.primary[500] }]}>
                      {user?.role || 'OPERADOR'}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Información Personal */}
          <Card style={styles.infoCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Información Personal
            </Text>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                  Nombre
                </Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {displayUser?.displayName || 'No especificado'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                  Correo Electrónico
                </Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {displayUser?.email}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="call-outline" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                  Teléfono
                </Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {(user as any)?.phoneNumber || 'No especificado'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="shield-outline" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                  Rol
                </Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {user?.role || 'OPERADOR'}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: colors.primary[100] }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
                  Fecha de Registro
                </Text>
                <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : 'No disponible'}
                </Text>
              </View>
            </View>
          </Card>
          
          {/* Acciones de Cuenta */}
          <Card style={styles.actionsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Acciones de Cuenta
            </Text>
            
            <Button
              title="Cambiar Contraseña"
              onPress={handleChangePassword}
              variant="outline"
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
              icon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary[500]} style={styles.actionIcon} />}
            />
            
            <Button
              title="Cerrar Sesión"
              onPress={handleLogout}
              variant="danger"
              style={styles.actionButton}
              textStyle={styles.actionButtonText}
              icon={<Ionicons name="log-out-outline" size={20} color={colors.text.inverse} style={styles.actionIcon} />}
            />
          </Card>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileCard: {
    marginBottom: spacing[4],
    padding: spacing[5],
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: typography.weights.bold as '700',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  profileEmail: {
    fontSize: typography.sizes.base,
    marginBottom: spacing[3],
  },
  roleBadge: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontWeight: typography.weights.semibold as '600',
    fontSize: typography.sizes.sm,
  },
  editForm: {
    width: '100%',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    gap: spacing[2],
  },
  editActionButton: {
    flex: 1,
  },
  infoCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    marginBottom: spacing[1] / 2,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
  },
  actionsCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[4],
  },
  actionButton: {
    marginBottom: spacing[3],
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: spacing[3],
  },
  actionButtonText: {
    textAlign: 'left',
  },
  actionIcon: {
    marginRight: spacing[2],
  },
});

