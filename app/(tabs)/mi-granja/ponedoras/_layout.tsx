/**
 * Layout para el módulo de Ponedoras dentro de Mi Granja
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function PonedorasLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="lotes-tab" />
      <Stack.Screen name="estadisticas-tab" />
      <Stack.Screen name="nuevo-lote" />
      <Stack.Screen name="editar-lote" />
      <Stack.Screen name="registrar-produccion" />
      <Stack.Screen name="registrar-muerte" />
      <Stack.Screen name="registros-huevos" />
      <Stack.Screen name="historial-registros-huevos" />
      <Stack.Screen name="historial-gastos" />
      <Stack.Screen name="dashboard-comparativo" />
      <Stack.Screen name="dashboard-costos-huevos" />
      <Stack.Screen name="detalles" />
    </Stack>
  );
}



