/**
 * Formulario de recuperación de contraseña
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingrese su correo electrónico');
      return;
    }
    
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (error) {
      // Los errores se manejan en el store
    }
  };
  
  const handleBackToLogin = () => {
    router.push('/auth/login');
  };
  
  // Limpiar error al montar el componente
  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, []);
  
  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Correo Enviado</Text>
        <Text style={styles.message}>
          Se ha enviado un correo electrónico a {email} con instrucciones para restablecer su contraseña.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToLogin}
        >
          <Text style={styles.backButtonText}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Contraseña</Text>
      
      <Text style={styles.subtitle}>
        Ingrese su correo electrónico y le enviaremos instrucciones para restablecer su contraseña.
      </Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Ingrese su correo"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <TouchableOpacity 
        style={styles.resetButton}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resetButtonText}>Enviar Instrucciones</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backToLoginButton}
        onPress={handleBackToLogin}
      >
        <Text style={styles.backToLoginText}>Volver a Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#0A3D62',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginButton: {
    padding: 10,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#0066cc',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#0A3D62',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default ForgotPasswordForm;

