/**
 * Formulario de registro moderno - Gallinapp
 * Registro multi-tenant con creación de organización
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/designSystem';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type FieldKey = 'email' | 'password' | 'confirmPassword' | 'displayName';
type StepKey = 'intro' | 'contact' | 'security' | 'review';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
}

interface StepConfig {
  key: StepKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  helper?: string;
  fields?: Array<{
    key: FieldKey;
    label: string;
    placeholder: string;
    type?: 'text' | 'email' | 'password';
    helperText?: string;
    optional?: boolean;
  }>;
}

const steps: StepConfig[] = [
  {
    key: 'intro',
    title: 'Hola, ¿cómo te llamas?',
    description: 'Personalizaremos la experiencia con tu nombre.',
    icon: 'hand-left-outline',
    helper: 'Este nombre también aparecerá en reportes y tickets.',
    fields: [
      { key: 'displayName', label: 'Tu nombre', placeholder: 'Ana Restrepo' },
    ],
  },
  {
    key: 'contact',
    title: 'Tu correo de trabajo',
    description: 'Usaremos este correo para alertas y recuperación.',
    icon: 'mail-unread-outline',
    helper: 'Evita usar correos personales para mantener la seguridad.',
    fields: [
      { key: 'email', label: 'Correo de trabajo', placeholder: 'ana@granja.com', type: 'email' },
    ],
  },
  {
    key: 'security',
    title: 'Crea tu llave de acceso',
    description: 'Protegemos tus datos con buenas prácticas.',
    icon: 'shield-checkmark-outline',
    helper: 'Usa combinaciones robustas para mayor seguridad.',
    fields: [
      { key: 'password', label: 'Contraseña segura', placeholder: 'Mínimo 8 caracteres', type: 'password', helperText: 'Incluye mayúsculas, minúsculas y números' },
      { key: 'confirmPassword', label: 'Confirmar contraseña', placeholder: 'Repite la contraseña', type: 'password' },
    ],
  },
  {
    key: 'review',
    title: 'Listo para comenzar',
    description: 'Revisa rápido y acepta términos para continuar. Crearás tu granja al entrar a la app.',
    icon: 'rocket-outline',
  },
];

  const stepFieldMap: Record<StepKey, FieldKey[]> = {
    intro: ['displayName'],
    contact: ['email'],
    security: ['password', 'confirmPassword'],
    review: [],
  };

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  
  const progressAnim = useRef(new Animated.Value(1 / steps.length)).current;
  const stepFade = useRef(new Animated.Value(1)).current;
  
  const router = useRouter();
  const { registerUser, isLoading, error, clearError } = useMultiTenantAuthStore();

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / steps.length,
      duration: 450,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.timing(stepFade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(stepFade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [currentStep, progressAnim, stepFade]);

  const validateStep = (stepKey: StepKey): boolean => {
    const fields = stepFieldMap[stepKey];
    const newErrors: FormErrors = {};

    if (fields.includes('displayName')) {
      if (!formData.displayName) {
        newErrors.displayName = 'Nombre es requerido';
      } else if (formData.displayName.length < 2) {
        newErrors.displayName = 'Usa al menos 2 caracteres';
      }
    }

    if (fields.includes('email')) {
      if (!formData.email) {
        newErrors.email = 'Email es requerido';
      } else if (!isValidEmail(formData.email)) {
        newErrors.email = 'Email inválido';
      }
    }


    if (fields.includes('password')) {
      if (!formData.password) {
        newErrors.password = 'Contraseña requerida';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mínimo 8 caracteres';
      } else if (!isStrongPassword(formData.password)) {
        newErrors.password = 'Incluye mayúsculas, minúsculas y números';
      }
    }

    if (fields.includes('confirmPassword')) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors((prev) => {
      const cleaned = { ...prev };
      fields.forEach((field) => {
        delete cleaned[field];
      });
      return { ...cleaned, ...newErrors };
    });

    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    let firstInvalid: StepKey | null = null;
    const sequence: StepKey[] = ['intro', 'contact', 'organization', 'security'];

    sequence.forEach((step) => {
      const ok = validateStep(step);
      if (!ok && !firstInvalid) {
        firstInvalid = step;
      }
    });

    if (firstInvalid) {
      const idx = steps.findIndex((s) => s.key === firstInvalid);
      setCurrentStep(idx);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    const stepKey = steps[currentStep].key;
    const ok = validateStep(stepKey);
    if (!ok) return;

    if (currentStep === steps.length - 1) {
      handleRegister();
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleRegister = async () => {
    const valid = validateAll();
    if (!valid) return;

    if (!agreedToTerms) {
      Alert.alert('Términos y Privacidad', 'Debes aceptar los términos para continuar.');
      setCurrentStep(steps.findIndex((s) => s.key === 'review'));
      return;
    }

    try {
      await registerUser({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      });
      
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Al entrar a la app podrás crear tu primera granja.',
        [{ text: 'Comenzar', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error: any) {
      console.error('Error en registro:', error);
      Alert.alert('Error', error.message || 'No se pudo completar el registro. Por favor intenta nuevamente.');
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password: string) => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpper && hasLower && hasNumber;
  };

  const generateOrganizationSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const renderField = (field: StepConfig['fields'][number]) => {
    const isPassword = field.type === 'password';
    const value = formData[field.key];
    const fieldError = errors[field.key];

    const toggleVisibility = () => {
      if (field.key === 'password') {
        setShowPassword((prev) => !prev);
      }
      if (field.key === 'confirmPassword') {
        setShowConfirmPassword((prev) => !prev);
      }
    };

    const secureEntry = isPassword
      ? field.key === 'password'
        ? !showPassword
        : !showConfirmPassword
      : false;

    return (
      <View key={field.key} style={styles.fieldWrapper}>
        <View style={styles.inputWithToggle}>
          <Input
            label={field.label}
            value={value}
            onChangeText={(text) => updateFormData(field.key, text)}
            placeholder={field.placeholder}
            autoCapitalize={field.type === 'email' ? 'none' : 'words'}
            autoCorrect={field.type !== 'email'}
            keyboardType={field.type === 'email' ? 'email-address' : 'default'}
            secureTextEntry={secureEntry}
            error={fieldError}
            required={!field.optional}
            containerStyle={styles.inputContainer}
          />
          {isPassword && (
            <TouchableOpacity style={styles.passwordToggle} onPress={toggleVisibility}>
              <Ionicons
                name={secureEntry ? 'eye' : 'eye-off'}
                size={18}
                color={colors.neutral[500]}
              />
            </TouchableOpacity>
          )}
        </View>
        {field.helperText && !fieldError && (
          <Text style={styles.helperText}>{field.helperText}</Text>
        )}
      </View>
    );
  };

  const renderReview = () => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewRow}>
        <View style={styles.reviewIcon}>
          <Ionicons name="person-circle" size={18} color={colors.primary[600]} />
        </View>
        <View style={styles.reviewCopy}>
          <Text style={styles.reviewTitle}>{formData.displayName || 'Agrega tu nombre'}</Text>
          <Text style={styles.reviewSubtitle}>{formData.email || 'Agrega tu correo'}</Text>
        </View>
        <TouchableOpacity onPress={() => setCurrentStep(0)}>
          <Text style={styles.editLink}>Editar</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.termsContainer}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          {agreedToTerms && (
            <Ionicons name="checkmark" size={16} color={colors.primary[500]} />
          )}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          Acepto los <Text style={styles.termsLink}>Términos de Servicio</Text> y la{' '}
          <Text style={styles.termsLink}>Política de Privacidad</Text>.
        </Text>
      </View>
    </View>
  );

  const currentStepConfig = steps[currentStep];

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View>
          <Text style={styles.progressLabel}>Paso {currentStep + 1} de {steps.length}</Text>
          <Text style={styles.progressHint}>{currentStepConfig.title}</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressIndicator,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Animated.View
        style={[
          styles.stepCard,
          {
            opacity: stepFade,
            transform: [
              {
                translateY: stepFade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIcon}>
            <Ionicons name={currentStepConfig.icon} size={18} color={colors.primary[600]} />
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.title}>{currentStepConfig.title}</Text>
            <Text style={styles.subtitle}>{currentStepConfig.description}</Text>
            {currentStepConfig.helper && (
              <Text style={styles.stepHelper}>{currentStepConfig.helper}</Text>
            )}
          </View>
        </View>

        {currentStepConfig.fields?.map(renderField)}

        {currentStepConfig.key === 'review' && renderReview()}
      </Animated.View>

      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          >
            <Ionicons name="arrow-back" size={16} color={colors.neutral[700]} />
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>
        )}

        <Button
          title={
            currentStep === steps.length - 1
              ? isLoading ? 'Creando cuenta...' : 'Crear cuenta y empezar'
              : 'Siguiente'
          }
          onPress={handleNext}
          disabled={isLoading}
          loading={currentStep === steps.length - 1 && isLoading}
          fullWidth
          style={styles.nextButton}
        />
      </View>

      <View style={styles.loginSection}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={navigateToLogin}>
          <Text style={styles.loginLink}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    marginBottom: spacing[4],
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    fontWeight: typography.weights.medium,
  },
  progressHint: {
    fontSize: typography.sizes.base,
    color: colors.neutral[700],
    fontWeight: typography.weights.semibold,
    marginTop: spacing[1],
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: borderRadius.base,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  errorText: {
    color: colors.error[600],
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginLeft: spacing[2],
    flex: 1,
  },
  stepCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.base,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  stepTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  stepHelper: {
    marginTop: spacing[2],
    color: colors.neutral[600],
    fontSize: typography.sizes.xs,
  },
  fieldWrapper: {
    marginBottom: spacing[3],
  },
  inputWithToggle: {
    position: 'relative',
  },
  inputContainer: {
    marginBottom: spacing[1],
  },
  passwordToggle: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: spacing[1],
  },
  helperText: {
    color: colors.neutral[600],
    fontSize: typography.sizes.xs,
  },
  reviewCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  reviewIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  reviewCopy: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral[700],
    fontWeight: typography.weights.semibold,
  },
  reviewSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },
  editLink: {
    color: colors.primary[500],
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    lineHeight: typography.lineHeights.relaxed * typography.sizes.sm,
  },
  termsLink: {
    color: colors.primary[500],
    fontWeight: typography.weights.medium,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginRight: spacing[2],
    backgroundColor: colors.neutral[0],
  },
  backButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[700],
    marginLeft: spacing[1],
  },
  nextButton: {
    flex: 1,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  loginText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },
  loginLink: {
    fontSize: typography.sizes.sm,
    color: colors.primary[500],
    fontWeight: typography.weights.semibold,
  },
});

export default RegisterForm;