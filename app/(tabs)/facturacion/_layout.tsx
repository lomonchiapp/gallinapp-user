/**
 * Layout para el stack de facturación
 */

import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { colors } from '../../../src/constants/colors';

export default function FacturacionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="clientes"
        options={{
          headerShown: true,
          header: () => (
            <AppHeader
              title="Gestión de Clientes"
              showBack
              tintColor={colors.primary}
            />
          ),
        }}
      />
      <Stack.Screen
        name="productos"
        options={{
          headerShown: true,
          header: () => (
            <AppHeader
              title="Inventario de Lotes y Aves"
              showBack
              tintColor={colors.primary}
            />
          ),
        }}
      />
      <Stack.Screen
        name="galpones"
        options={{
          headerShown: true,
          header: () => (
            <AppHeader
              title="Galpones"
              showBack
              tintColor={colors.primary}
            />
          ),
        }}
      />
      <Stack.Screen
        name="reportes"
        options={{
          headerShown: true,
          header: () => (
            <AppHeader
              title="Reportes de Ventas"
              showBack
              tintColor={colors.primary}
            />
          ),
        }}
      />
      <Stack.Screen
        name="todas"
        options={{
          headerShown: true,
          header: () => (
            <AppHeader
              title="Todas las Facturas"
              showBack
              tintColor={colors.primary}
            />
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  headerActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
});








