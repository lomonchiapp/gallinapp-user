/**
 * Layout para el módulo de Configuración
 */

import { DrawerToggleButton } from '@react-navigation/drawer';
import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '../../../src/constants/colors';

export default function SettingsLayout() {
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
        headerLeft: () => <DrawerToggleButton tintColor={colors.primary} />,
        headerTitle: 'Configuración',
      }}
    />
  );
}

