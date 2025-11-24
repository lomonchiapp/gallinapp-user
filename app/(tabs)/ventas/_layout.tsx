/**
 * Layout para el tab de ventas
 */

import { Stack } from 'expo-router';
import React from 'react';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { colors } from '../../../src/constants/colors';

export default function VentasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        header: () => (
          <AppHeader
            title="Ventas"
            showDrawer={true}
            tintColor={colors.primary}
          />
        ),
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Ventas',
        }} 
      />
      <Stack.Screen 
        name="nueva" 
        options={{ 
          title: 'Nueva Venta',
          headerShown: true,
          header: undefined, // Usar header nativo
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Detalle de Venta',
        }} 
      />
      <Stack.Screen 
        name="historial" 
        options={{ 
          title: 'Historial de Ventas',
        }} 
      />
    </Stack>
  );
}
