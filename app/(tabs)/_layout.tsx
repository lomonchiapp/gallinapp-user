/**
 * Layout para las pestañas principales
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import AppHeader from '../../src/components/layouts/AppHeader';
import { colors } from '../../src/constants/colors';

export default function TabLayout() {
  const router = useRouter();
  
  return (
    <Tabs
        screenOptions={({ route }) => ({
          header: () => {
            if (route.name === 'index') {
              return (
                <AppHeader 
                  showDrawer={true}
                  showLogo={true}
                  tintColor={colors.primary}
                />
              );
            }
            return undefined;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.lightGray,
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.veryLightGray,
          },
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            header: () => (
              <AppHeader 
                showDrawer={true}
                showLogo={true}
                tintColor={colors.primary}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="ponedoras"
          options={{
            headerShown: false,
            title: 'Ponedoras',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="egg" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="levantes"
          options={{
            headerShown: false,
            title: 'Levantes',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" size={size} color={color} />
            ),
            headerTitle: 'Pollos Levantes',
          }}
        />
        <Tabs.Screen
          name="engorde"
          options={{
            headerShown: false,
            title: 'Engorde',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="fast-food" size={size} color={color} />
            ),
            headerTitle: 'Pollos de Engorde',
          }}
        />
        <Tabs.Screen
          name="gastos"
          options={{
            headerShown: false,
            title: 'Gastos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash" size={size} color={color} />
            ),
            headerTitle: 'Gestión de Gastos',
          }}
        />
        <Tabs.Screen
          name="facturacion"
          options={{
            headerShown: false,
            title: 'Facturación',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt" size={size} color={color} />
            ),
            headerTitle: 'Sistema de Facturación',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
<Tabs.Screen
          name="perfil"
          options={{
            href: null,
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}