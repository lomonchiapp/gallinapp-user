/**
 * Layout principal de la aplicación - Gallinapp
 * Drawer solo disponible cuando el usuario está autenticado
 */

import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../components/theme-provider';
import '../src/components/config/firebase';
import AuthGuard from '../src/components/layouts/AuthGuard';
import CustomDrawerContent from './_drawer';

function DrawerContent() {
  const { isDark, colors: themeColors } = useTheme();
  
  return (
    <AuthGuard>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ route }) => {
          const isAuthRoute = route.name === 'auth';
          return {
            headerShown: false,
            drawerStyle: {
              backgroundColor: themeColors.background.primary,
            },
            drawerActiveTintColor: themeColors.primary[500],
            drawerInactiveTintColor: themeColors.text.secondary,
            drawerType: 'slide',
            // Deshabilitar completamente el drawer en rutas de autenticación
            swipeEnabled: !isAuthRoute,
            swipeEdgeWidth: isAuthRoute ? 0 : 50,
            drawerItemStyle: isAuthRoute ? { display: 'none' } : undefined,
          };
        }}
      >
          {/* Rutas de autenticación - Drawer completamente deshabilitado */}
          <Drawer.Screen
            name="auth"
            options={{
              title: 'Autenticación',
              headerShown: false,
              drawerItemStyle: { display: 'none' },
              swipeEnabled: false,
            }}
          />
          
          {/* Rutas autenticadas - Drawer habilitado */}
          <Drawer.Screen
            name="(tabs)"
            options={{
              title: 'Inicio',
              headerShown: false,
              drawerLabel: 'Inicio',
            }}
          />
          <Drawer.Screen
            name="historial-mortalidad"
            options={{
              title: 'Historial de Mortalidad',
              headerShown: false,
              drawerLabel: 'Historial de Mortalidad',
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              title: 'Mi Perfil',
              headerShown: false,
              drawerLabel: 'Mi Perfil',
            }}
          />
          <Drawer.Screen
            name="notifications"
            options={{
              title: 'Notificaciones',
              headerShown: false,
              drawerLabel: 'Notificaciones',
            }}
          />
          <Drawer.Screen
            name="modal"
            options={{
              presentation: 'modal',
              headerShown: false,
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer>
      </AuthGuard>
    );
}

function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar style="auto" />
        <DrawerContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default RootLayout;