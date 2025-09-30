/**
 * Layout para las pantallas de autenticación
 */

import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function AuthLayout() {
  return (
          
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'white' },
        }}
      />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logo: {
    width: 200,
    height: 100,
  },
});

