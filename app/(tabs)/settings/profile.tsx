/**
 * Pantalla de perfil de usuario
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useAuthStore } from '../../../src/stores/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Función para actualizar el perfil (a implementar)
  const handleUpdateProfile = async () => {
    setIsLoading(true);
    
    try {
      // Aquí iría la lógica para actualizar el perfil
      // Por ahora solo mostramos un mensaje
      setTimeout(() => {
        setIsLoading(false);
        setIsEditing(false);
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={18} color={colors.white} />
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
                    setDisplayName(user?.displayName || '');
                    setIsEditing(false);
                  }}
                  variant="outline"
                  style={styles.editButton}
                />
                <Button
                  title="Guardar"
                  onPress={handleUpdateProfile}
                  loading={isLoading}
                  style={styles.editButton}
                />
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{user?.displayName || 'Usuario'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role || 'OPERADOR'}</Text>
              </View>
            </>
          )}
        </View>
      </Card>
      
      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Acciones de Cuenta</Text>
        
        <Button
          title="Cambiar Contraseña"
          onPress={handleChangePassword}
          variant="outline"
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
          icon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.actionIcon} />}
        />
        
        <Button
          title="Cerrar Sesión"
          onPress={handleLogout}
          variant="danger"
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
          icon={<Ionicons name="log-out-outline" size={20} color={colors.white} style={styles.actionIcon} />}
        />
      </Card>
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
  },
  profileCard: {
    marginBottom: 16,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.textMedium,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  roleText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  editForm: {
    width: '100%',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionsCard: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 12,
  },
  actionButtonText: {
    textAlign: 'left',
  },
  actionIcon: {
    marginRight: 10,
  },
});

