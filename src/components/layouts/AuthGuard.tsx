/**
 * Componente para proteger rutas que requieren autenticación
 */

import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, loadUser, initializeAuthListener } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  // Determinar si la ruta actual es una ruta de autenticación
  const isAuthGroup = segments[0] === 'auth';
  
  useEffect(() => {
    // Inicializar listener de Firebase Auth
    console.log('🔄 AuthGuard: Inicializando listener de Firebase Auth...');
    const unsubscribe = initializeAuthListener();
    
    // También cargar usuario inicial (por si acaso)
    loadUser();
    
    return () => {
      console.log('🔄 AuthGuard: Limpiando listener de Firebase Auth...');
      unsubscribe();
    };
  }, [loadUser, initializeAuthListener]);
  
  
  useEffect(() => {
    if (isLoading) return;
    
    // Usar setTimeout para evitar el error de navegación antes del montaje
    const timer = setTimeout(() => {
      if (!isAuthenticated && !isAuthGroup) {
        // Redirigir a login si no está autenticado y no está en una ruta de auth
        router.replace('/auth/login');
      } else if (isAuthenticated && isAuthGroup) {
        // Redirigir al dashboard si está autenticado y está en una ruta de auth
        router.replace('/(tabs)');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, isAuthGroup, router]);
  
  // Mostrar spinner mientras se carga
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A3D62" />
      </View>
    );
  }
  
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthGuard;

