/**
 * Drawer personalizado para la aplicación
 */

import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router, useSegments } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../components/theme-provider';
import { useAuthStore } from '../src/stores/authStore';

export default function CustomDrawerContent(props: any) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { isDark, colors: themeColors } = useTheme();
  const segments = useSegments();
  
  // Si no está autenticado o está en rutas de auth, no mostrar drawer
  const isAuthRoute = segments[0] === 'auth';
  
  if (!isAuthenticated || isAuthRoute) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <DrawerContentScrollView 
      {...props} 
      style={[styles.container, { backgroundColor: themeColors.background.primary }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.header, { backgroundColor: themeColors.primary[500] }]}>
        <Image
          source={require('../assets/images/icon-white.png')}
          style={styles.logo}
        />
        <View style={[styles.roleBadge, { backgroundColor: themeColors.primary[100] }]}>
          <Text style={[styles.roleText, { color: themeColors.primary[700] }]}>
            {user?.role || 'Sin Rol Asignado'}
          </Text>
        </View>
        <Text style={[styles.welcomeText, { color: themeColors.text.inverse }]}>
          Bienvenido, {user?.displayName || 'Usuario'}
        </Text>
      </View>

      <View style={styles.menuContainer}>
        <DrawerItem
          label="Inicio"
          icon={({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          )}
          onPress={() => router.push('/(tabs)')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Mi Granja"
          icon={({ color, size }) => (
            <Ionicons name="business" size={size} color={themeColors.primary[500]} />
          )}
          onPress={() => router.push('/(tabs)/mi-granja')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <DrawerItem
          label="Gastos y Artículos"
          icon={({ color, size }) => (
            <Ionicons name="cash" size={size} color={themeColors.error[500]} />
          )}
          onPress={() => router.push('/(tabs)/gastos')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <DrawerItem
          label="Galpones"
          icon={({ color, size }) => (
            <Ionicons name="business" size={size} color={themeColors.secondary[500]} />
          )}
          onPress={() => router.push('/(tabs)/facturacion/galpones')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <DrawerItem
          label="Ventas"
          icon={({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          )}
          onPress={() => router.push('/(tabs)/ventas')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <View style={[styles.separator, { backgroundColor: themeColors.border.light }]} />

        <DrawerItem
          label="Historial de Mortalidad"
          icon={({ color, size }) => (
            <Ionicons name="trending-down" size={size} color={themeColors.primary[500]} />
          )}
          onPress={() => router.push('/historial-mortalidad')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <DrawerItem
          label="Mi Perfil"
          icon={({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          )}
          onPress={() => router.push('/profile')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <DrawerItem
          label="Configuración"
          icon={({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          )}
          onPress={() => router.push('/(tabs)/settings')}
          labelStyle={[styles.menuItemText, { color: themeColors.text.primary }]}
        />

        <View style={[styles.separator, { backgroundColor: themeColors.border.light }]} />

        <DrawerItem
          label="Cerrar Sesión"
          icon={({ color, size }) => (
            <Ionicons name="log-out" size={size} color={themeColors.error[500]} />
          )}
          onPress={handleLogout}
          labelStyle={[styles.menuItemText, styles.logoutText, { color: themeColors.error[500] }]}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleText: {
    fontWeight: '500',
    fontSize: 12,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  logoutText: {
    // El color se aplica dinámicamente
  },
});

