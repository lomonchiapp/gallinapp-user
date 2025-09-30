/**
 * Formulario de registro
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
import { UserRole } from '../../types';

export const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const handleRegister = async () => {
    // Validaciones básicas
    if (!email || !password || !confirmPassword || !displayName) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      await register(email, password, displayName, UserRole.OPERADOR);
      // La navegación se maneja en el componente AuthGuard
    } catch (error) {
      // Los errores se manejan en el store
    }
  };
  
  const handleLogin = () => {
    router.push('/auth/login');
  };
  
  // Limpiar error al montar el componente
  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Ingrese su nombre"
        />
      </View>
      
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
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Ingrese su contraseña"
          secureTextEntry
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirmar Contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirme su contraseña"
          secureTextEntry
        />
      </View>
      
      <TouchableOpacity 
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.registerButtonText}>Registrarse</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>¿Ya tiene una cuenta? </Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginLink}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
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
  registerButton: {
    backgroundColor: '#0A3D62',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default RegisterForm;

