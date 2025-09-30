/**
 * Layout para el módulo de Ponedoras
 */

import { Stack } from 'expo-router';
import React from 'react';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { colors } from '../../../src/constants/colors';

export default function PonedorasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.ponedoras,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        header: () => (
          <AppHeader
            title="Gallinas Ponedoras"
            showDrawer={true}
            tintColor={colors.ponedoras}
          />
        ),
      }}
    />
  );
}

