/**
 * Pantalla principal de configuración
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../../src/components/ui/Card';
import { colors } from '../../../src/constants/colors';
import { useAuthStore } from '../../../src/stores/authStore';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0) || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName || 'Usuario'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'OPERADOR'}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Configuración General</Text>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigateTo('/(modules)/settings/app-config')}
      >
        <Ionicons name="settings-outline" size={24} color={colors.primary} style={styles.menuIcon} />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Configuración de la Aplicación</Text>
          <Text style={styles.menuDescription}>Precios, valores predeterminados y más</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.lightGray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigateTo('/(modules)/settings/profile')}
      >
        <Ionicons name="person-outline" size={24} color={colors.primary} style={styles.menuIcon} />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Mi Perfil</Text>
          <Text style={styles.menuDescription}>Actualizar información de perfil</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.lightGray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigateTo('/(modules)/settings/change-password')}
      >
        <Ionicons name="lock-closed-outline" size={24} color={colors.primary} style={styles.menuIcon} />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Cambiar Contraseña</Text>
          <Text style={styles.menuDescription}>Actualizar contraseña de acceso</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.lightGray} />
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Acerca de</Text>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {}}
      >
        <Ionicons name="information-circle-outline" size={24} color={colors.primary} style={styles.menuIcon} />
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Acerca de Asoaves</Text>
          <Text style={styles.menuDescription}>Versión 1.0.0</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.lightGray} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.menuItem, styles.logoutItem]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={24} color={colors.danger} style={styles.menuIcon} />
        <View style={styles.menuContent}>
          <Text style={[styles.menuTitle, { color: colors.danger }]}>Cerrar Sesión</Text>
          <Text style={styles.menuDescription}>Salir de la aplicación</Text>
        </View>
      </TouchableOpacity>
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
    marginBottom: 24,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textMedium,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.primary + '20',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 14,
    color: colors.textMedium,
  },
  logoutItem: {
    marginTop: 24,
  },
});

