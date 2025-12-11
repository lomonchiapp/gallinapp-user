/**
 * Layout para el módulo de Configuración
 * Usamos AppHeader personalizado, así que ocultamos el header por defecto
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Usamos AppHeader personalizado
      }}
    />
  );
}

