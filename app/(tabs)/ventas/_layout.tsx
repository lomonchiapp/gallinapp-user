/**
 * Layout para el tab de ventas
 */

import { Stack } from 'expo-router';

export default function VentasLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Ventas',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="nueva" 
        options={{ 
          title: 'Nueva Venta',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Detalle de Venta',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="historial" 
        options={{ 
          title: 'Historial de Ventas',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
