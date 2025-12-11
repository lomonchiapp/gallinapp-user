/**
 * Layout para Mi Granja con tab bar personalizado interno
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function MiGranjaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="ponedoras" options={{ headerShown: false }} />
      <Stack.Screen name="levantes" options={{ headerShown: false }} />
      <Stack.Screen name="engorde" options={{ headerShown: false }} />
    </Stack>
  );
}

