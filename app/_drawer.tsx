/**
 * Drawer personalizado para la aplicación
 */

import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../src/constants/colors';
import { useAuthStore } from '../src/stores/authStore';

export default function CustomDrawerContent(props: any) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/images/icon-white.png')}
          style={styles.logo}
        />
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role || 'Sin Rol Asignado'}</Text>
        </View>
        <Text style={styles.welcomeText}>
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
          label="Gallinas Ponedoras"
          icon={({ color, size }) => (
            <Ionicons name="egg" size={size} color={colors.ponedoras} />
          )}
          onPress={() => router.push('/(tabs)/ponedoras')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Pollos de Levante"
          icon={({ color, size }) => (
            <Ionicons name="nutrition" size={size} color={colors.success} />
          )}
          onPress={() => router.push('/(tabs)/levantes')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Pollos de Engorde"
          icon={({ color, size }) => (
            <Ionicons name="fast-food" size={size} color={colors.warning} />
          )}
          onPress={() => router.push('/(tabs)/engorde')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Gastos y Artículos"
          icon={({ color, size }) => (
            <Ionicons name="cash" size={size} color={colors.danger} />
          )}
          onPress={() => router.push('/(tabs)/gastos')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Galpones"
          icon={({ color, size }) => (
            <Ionicons name="business" size={size} color={colors.secondary} />
          )}
          onPress={() => router.push('/(tabs)/facturacion/galpones')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Ventas"
          icon={({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          )}
          onPress={() => router.push('/(tabs)/ventas')}
          labelStyle={styles.menuItemText}
        />

        <View style={styles.separator} />

        <DrawerItem
          label="Historial de Mortalidad"
          icon={({ color, size }) => (
            <Ionicons name="trending-down" size={size} color={colors.primary} />
          )}
          onPress={() => router.push('/historial-mortalidad')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Mi Perfil"
          icon={({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          )}
          onPress={() => router.push('/profile')}
          labelStyle={styles.menuItemText}
        />

        <DrawerItem
          label="Configuración"
          icon={({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          )}
          onPress={() => router.push('/(tabs)/settings')}
          labelStyle={styles.menuItemText}
        />

        <View style={styles.separator} />

        <DrawerItem
          label="Cerrar Sesión"
          icon={({ color, size }) => (
            <Ionicons name="log-out" size={size} color={colors.error} />
          )}
          onPress={handleLogout}
          labelStyle={[styles.menuItemText, styles.logoutText]}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  roleBadge: {
    position: 'absolute',
    backgroundColor: colors.accent,
    top: 0,
    right: 0,

    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  roleText: {
    color: colors.primary,
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
    color: colors.white,
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
    color: colors.textDark,
  },
  separator: {
    height: 1,
    backgroundColor: colors.veryLightGray,
    marginVertical: 10,
    marginHorizontal: 16,
  },
  logoutText: {
    color: colors.error,
  },
});

