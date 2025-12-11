/**
 * Layout para el módulo de Israelíes
 */

import { Stack } from 'expo-router';
import React from 'react';
import AppHeader from '../../../../src/components/layouts/AppHeader';
import { colors } from '../../../../src/constants/colors';

export default function IsraeliesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.secondary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        header: () => (
          <AppHeader
            showProfile={false}
            showLogo={true}
          showDrawer={true}
            tintColor={colors.secondary}
          />
        ),
      }}
    />
  );
}

