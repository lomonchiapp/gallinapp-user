/**
 * Layout para el módulo de Engorde
 */

import { Stack } from 'expo-router';
import React from 'react';
import AppHeader from '../../../../src/components/layouts/AppHeader';
import { colors } from '../../../../src/constants/colors';

export default function EngordeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.engorde,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        header: () => (
          <AppHeader
            title="Pollos de Engorde"
            showDrawer={true}
            tintColor={colors.engorde}
          />
        ),
      }}
    />
  );
}

