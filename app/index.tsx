/**
 * Pantalla de inicio - Redirige automáticamente a la pantalla correcta
 */

import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';

export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Mostrar spinner mientras se carga
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A3D62" />
      </View>
    );
  }

  // Redirigir según el estado de autenticación
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/auth/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});
