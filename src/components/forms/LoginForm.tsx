/**
 * Formulario de inicio de sesión moderno - Gallinapp
 * Soporte multi-tenant con Google OAuth
 */

import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/designSystem';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Completar la sesión de autenticación web
WebBrowser.maybeCompleteAuthSession();

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoading, error, clearError } = useMultiTenantAuthStore();

  // Configurar Google OAuth
  // Usar variables de entorno o valores por defecto del app.config.js
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "58539992128-orbman05sk0j6qjspo32femr44ervmq0.apps.googleusercontent.com";
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: googleClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleClientId,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || googleClientId,
  });

  // Manejar respuesta de Google Auth
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuthResponse(response);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert(
        'Error',
        response.error?.message || 'Error al autenticar con Google'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);
  
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos Requeridos', 'Por favor ingrese email y contraseña');
      return;
    }
    
    if (!isValidEmail(email)) {
      Alert.alert('Email Inválido', 'Por favor ingrese un email válido');
      return;
    }
    
    try {
      await signIn(email, password);
      // La navegación se maneja automáticamente por el AuthGuard
    } catch (error: any) {
      // Los errores ya se manejan en el store
      console.error('Error en login:', error);
    }
  };

  const handleComingSoon = (provider: string) => {
    Alert.alert('Próximamente', `Muy pronto podrás iniciar sesión con ${provider}.`);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      
      if (!request) {
        Alert.alert(
          'Error de Configuración',
          'Google OAuth no está configurado. Por favor configura las credenciales de Google en las variables de entorno.'
        );
        setIsGoogleLoading(false);
        return;
      }

      // Iniciar el flujo de autenticación de Google
      const result = await promptAsync();
      
      // Si el usuario cancela, no hacer nada
      if (result.type === 'dismiss') {
        setIsGoogleLoading(false);
      }
      // La respuesta 'success' y 'error' se manejan en el useEffect
    } catch (error: any) {
      console.error('Error iniciando Google Login:', error);
      setIsGoogleLoading(false);
      Alert.alert(
        'Error', 
        error.message || 'Error al iniciar sesión con Google. Por favor intenta de nuevo.'
      );
    }
  };

  const handleGoogleAuthResponse = async (authResponse: any) => {
    try {
      setIsGoogleLoading(true);
      
      // Obtener el ID token de la respuesta
      const idToken = authResponse.params?.id_token;
      
      if (!idToken) {
        throw new Error('No se recibió el token de Google');
      }

      // Llamar al servicio de autenticación con el token
      await signInWithGoogle(idToken);
      // La navegación se maneja automáticamente por el AuthGuard
    } catch (error: any) {
      console.error('Error procesando respuesta de Google:', error);
      Alert.alert(
        'Error', 
        error.message || 'Error al procesar la autenticación de Google'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register');
  };

  const navigateToForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Limpiar error al montar el componente
  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);
  
  return (
    <View style={styles.container}>
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Login Form */}
      <View style={styles.formSection}>
        <Input
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={error && !isValidEmail(email) ? 'Email inválido' : undefined}
          required
          variant="dark"
          containerStyle={styles.inputContainer}
        />
        
        <View style={styles.passwordContainer}>
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña segura"
            secureTextEntry={!showPassword}
            required
            variant="dark"
            containerStyle={styles.inputContainer}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.neutral[0]} 
            />
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity 
          onPress={navigateToForgotPassword}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgotPasswordText}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Login Buttons */}
      <View style={styles.buttonsSection}>
        <Button
          title={isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          onPress={handleEmailLogin}
          disabled={isLoading || !email || !password}
          loading={isLoading}
          variant="glass"
          fullWidth
          style={styles.loginButton}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o inicia con</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Login Section */}
      <View style={styles.socialSection}>
        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={[
              styles.socialButton,
              styles.socialButtonHighlight,
              styles.socialButtonSpacer,
              (!request || isGoogleLoading || isLoading) && styles.socialButtonDisabled
            ]}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading || !request}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={colors.primary[600]} size="small" />
            ) : (
              <>
                <Ionicons 
                  name="logo-google" 
                  size={18} 
                  color={request ? colors.primary[600] : colors.neutral[400]} 
                />
                <Text style={[
                  styles.socialButtonText,
                  styles.socialButtonTextHighlight,
                  !request && styles.socialButtonTextDisabled
                ]}>
                  {request ? 'Google' : 'Google (sin credenciales)'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleComingSoon('Apple')}
          >
            <Ionicons name="logo-apple" size={18} color={colors.neutral[0]} />
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Register CTA */}
      <View style={styles.registerCard}>
        <Text style={styles.registerCardTitle}>¿Nuevo en Gallinapp?</Text>
        <Button
          title="Crear cuenta"
          onPress={navigateToRegister}
          variant="outline"
          fullWidth
          style={styles.registerButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[5],
  },
  errorText: {
    color: colors.neutral[0],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing[2],
    flex: 1,
  },
  socialSection: {
    marginBottom: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    marginRight: spacing[2],
  },
  socialButtonSpacer: {
    marginRight: spacing[2],
  },
  socialButtonHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  socialButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[0],
    marginLeft: spacing[1],
  },
  socialButtonTextHighlight: {
    color: colors.primary[600],
  },
  socialButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: typography.weights.medium,
    marginHorizontal: spacing[3],
  },
  formSection: {
    marginBottom: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing[3],
    top: '65%',
    transform: [{ translateY: -10 }],
    padding: spacing[1],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.base,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing[2],
  },
  forgotPasswordText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[0],
    fontWeight: typography.weights.semibold,
    textDecorationLine: 'underline',
  },
  buttonsSection: {
    marginBottom: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  loginButton: {
    marginBottom: spacing[2],
  },
  registerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: spacing[4],
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  registerCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[0],
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 0,
  },
});

export default LoginForm;

