/**
 * Layout para las pestañas principales con transiciones animadas
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '../../components/theme-provider';
import { AnimatedTabBar } from '../../src/components/navigation/AnimatedTabBar';
import { useFarmStore } from '../../src/stores/farmStore';

export default function TabLayout() {
  const { isDark, colors: themeColors } = useTheme();
  const { currentFarm, farms } = useFarmStore();
  
  // Ocultar tabs si no hay granja
  const hasFarm = currentFarm !== null || farms.length > 0;
  
  return (
    <>
      {/* Asegurar que el StatusBar sea visible */}
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.background.primary}
        translucent={false}
      />
      
      <Tabs
        tabBar={hasFarm ? (props) => <AnimatedTabBar {...props} /> : () => null}
        screenOptions={{
          headerShown: false,
          tabBarStyle: hasFarm ? {} : { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mi-granja"
          options={{
            headerShown: false,
            title: 'Mi Granja',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business" size={size} color={color} />
            ),
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
          }}
        />
        <Tabs.Screen
          name="ventas"
          options={{
            headerShown: false,
            title: 'Ventas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="facturacion"
          options={{
            href: null,
            headerShown: false,
            title: 'Facturas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null,
            headerShown: false,
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
            headerShown: false,
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}