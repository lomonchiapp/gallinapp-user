/**
 * Layout principal de la aplicación
 */

import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '../components/theme-provider';
import '../src/components/config/firebase'; // Importamos la configuración de Firebase ya inicializada
import AuthGuard from '../src/components/layouts/AuthGuard';
import CustomDrawerContent from './_drawer';

function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? 'dark' : 'light'}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthGuard>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              backgroundColor: '#fff',
            },
          }}
        >
          <Drawer.Screen
            name="(tabs)"
            options={{
              title: 'Inicio',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="historial-mortalidad"
            options={{
              title: 'Historial de Mortalidad',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="profile"
            options={{
              title: 'Mi Perfil',
              headerShown: false,
            }}
          />
          <Drawer.Screen
            name="settings"
            options={{
              title: 'Configuración',
              headerShown: false,
            }}
          />
        </Drawer>
      </AuthGuard>
    </ThemeProvider>
  );
}

export default RootLayout;