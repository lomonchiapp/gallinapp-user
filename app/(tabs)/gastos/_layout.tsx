/**
 * Layout para el módulo de Gastos
 */

import { Stack } from 'expo-router';
import React from 'react';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { colors } from '../../../src/constants/colors';

export default function GastosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.danger,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        header: () => (
          <AppHeader
            title="Gastos y Artículos"
            showDrawer={true}
            tintColor={colors.danger}
          />
        ),
      }}
    />
  );
}

