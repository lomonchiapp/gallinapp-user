/**
 * Formulario de recuperación de contraseña - Gallinapp
 */

import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../components/config/firebase';
import { colors, spacing, borderRadius, typography } from '../../constants/designSystem';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSendReset = async () => {
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      
      Alert.alert(
        'Email Enviado',
        'Hemos enviado un enlace de recuperación a tu correo electrónico. Revisa tu bandeja de entrada y spam.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let errorMessage = 'Error al enviar el email de recuperación';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No encontramos una cuenta con este email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success[500]} />
          </View>
          
          <Text style={styles.successTitle}>¡Email Enviado!</Text>
          <Text style={styles.successMessage}>
            Hemos enviado las instrucciones de recuperación a:
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          
          <Text style={styles.instructionsText}>
            Revisa tu bandeja de entrada y spam. El enlace expira en 24 horas.
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <Button
            title="Reenviar Email"
            variant="outline"
            onPress={() => {
              setEmailSent(false);
              handleSendReset();
            }}
            disabled={isLoading}
            style={styles.resendButton}
          />
          
          <Button
            title="Volver al Login"
            onPress={navigateToLogin}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recuperar Contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña
        </Text>
      </View>
      
      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Form */}
      <View style={styles.formSection}>
        <Input
          label="Correo Electrónico"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError(null);
          }}
          placeholder="tu@empresa.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          required
          containerStyle={styles.inputContainer}
        />
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title={isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          onPress={handleSendReset}
          disabled={isLoading || !email}
          loading={isLoading}
          fullWidth
          style={styles.sendButton}
        />

        <TouchableOpacity 
          onPress={navigateToLogin}
          style={styles.backToLogin}
        >
          <Ionicons name="arrow-back" size={16} color={colors.primary[500]} />
          <Text style={styles.backToLoginText}>Volver al login</Text>
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
        <Text style={styles.helpText}>
          Si no recibes el email en unos minutos, revisa tu carpeta de spam o contáctanos.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: borderRadius.base,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  errorText: {
    color: colors.error[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing[2],
    flex: 1,
  },
  formSection: {
    marginBottom: spacing[6],
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  actionsContainer: {
    marginBottom: spacing[6],
  },
  sendButton: {
    marginBottom: spacing[4],
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
  },
  backToLoginText: {
    fontSize: typography.sizes.sm,
    color: colors.primary[500],
    fontWeight: typography.weights.medium,
    marginLeft: spacing[1],
  },
  helpSection: {
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  helpText: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.xs,
  },
  
  // Success State Styles
  successContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  successIcon: {
    marginBottom: spacing[4],
  },
  successTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.success[600],
    marginBottom: spacing[2],
  },
  successMessage: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emailText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral[700],
    marginBottom: spacing[4],
  },
  instructionsText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  resendButton: {
    marginBottom: spacing[3],
  },
  backButton: {
    // No additional styles needed
  },
});

export default ForgotPasswordForm;