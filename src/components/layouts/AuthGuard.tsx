/**
 * Componente para proteger rutas que requieren autenticación
 * 
 * Este componente:
 * 1. Inicializa el listener de Firebase Auth
 * 2. Espera a que Firebase Auth confirme si hay sesión persistida
 * 3. Redirige a login si no hay usuario autenticado
 * 4. Redirige al dashboard si está autenticado y está en rutas de auth
 * 5. Inicializa appConfig cuando el usuario está autenticado
 */

import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { inicializarConfiguracion } from '../../services/appConfig.service';
import { useAuthStore } from '../../stores/authStore';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, authInitialized, initializeAuthState } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  // Determinar si la ruta actual es una ruta de autenticación
  const isAuthGroup = segments[0] === 'auth';
  
  // Inicializar listener de Firebase Auth (solo una vez)
  useEffect(() => {
    console.log('🔄 AuthGuard: Inicializando listener de Firebase Auth...');
    const unsubscribe = initializeAuthState();
    
    return () => {
      console.log('🔕 AuthGuard: Limpiando listener de Firebase Auth...');
      unsubscribe();
    };
  }, []); // Solo ejecutar una vez al montar
  
  // Inicializar configuración de la app cuando el usuario está autenticado
  useEffect(() => {
    if (isAuthenticated && authInitialized && !isLoading) {
      console.log('⚙️ AuthGuard: Usuario autenticado, inicializando appConfig...');
      const unsubscribeConfig = inicializarConfiguracion();
      
      return () => {
        console.log('🔕 AuthGuard: Limpiando suscripción de appConfig...');
        unsubscribeConfig();
      };
    }
  }, [isAuthenticated, authInitialized, isLoading]);
  
  // Navegación basada en estado de autenticación
  useEffect(() => {
    // Esperar a que Firebase Auth inicialice
    if (!authInitialized || isLoading) {
      return;
    }
    
    // Usar setTimeout para evitar el error de navegación antes del montaje
    const timer = setTimeout(() => {
      if (!isAuthenticated && !isAuthGroup) {
        // Redirigir a login si no está autenticado y no está en una ruta de auth
        console.log('🚪 AuthGuard: Redirigiendo a login...');
        router.replace('/auth/login');
      } else if (isAuthenticated && isAuthGroup) {
        // Redirigir al dashboard si está autenticado y está en una ruta de auth
        console.log('✅ AuthGuard: Redirigiendo al dashboard...');
        router.replace('/(tabs)');
      }
    }, 100); // Pequeño delay para asegurar que el router está listo

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, authInitialized, isAuthGroup, router]);
  
  // Mostrar spinner mientras se inicializa Firebase Auth
  if (!authInitialized || isLoading) {
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
    backgroundColor: '#fff',
  },
});

export default AuthGuard;
