/**
 * Componente Input personalizado para Gallinapp
 * Estilo moderno glassmorphism para fondos oscuros y claros
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../constants/designSystem';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  required?: boolean;
  helperText?: string;
  variant?: 'light' | 'dark'; // Para adaptar a diferentes fondos
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  required = false,
  helperText,
  variant,
  ...rest
}) => {
  // Detectar si estamos en una pantalla oscura o clara
  const colorScheme = useColorScheme();
  const isDark = variant === 'dark' || (variant === undefined && colorScheme === 'dark');
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[
            styles.label,
            isDark ? styles.labelDark : styles.labelLight,
            labelStyle
          ]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <TextInput
        style={[
          styles.input,
          isDark ? styles.inputDark : styles.inputLight,
          error ? (isDark ? styles.inputErrorDark : styles.inputErrorLight) : {},
          inputStyle,
        ]}
        placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : colors.neutral[400]}
        {...rest}
      />
      
      {helperText && !error && (
        <Text style={[
          styles.helperText,
          isDark ? styles.helperTextDark : styles.helperTextLight
        ]}>
          {helperText}
        </Text>
      )}
      
      {error && (
        <Text style={[
          styles.errorText,
          isDark ? styles.errorTextDark : styles.errorTextLight
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    width: '100%',
  },
  labelContainer: {
    marginBottom: spacing[2],
    flexDirection: 'row',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  labelLight: {
    color: colors.neutral[700],
  },
  labelDark: {
    color: colors.neutral[0],
  },
  required: {
    color: colors.error[400],
  },
  input: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
  },
  inputLight: {
    backgroundColor: colors.neutral[0],
    borderColor: colors.neutral[300],
    color: colors.neutral[900],
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    color: colors.neutral[0],
  },
  inputErrorLight: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  inputErrorDark: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
    fontWeight: typography.weights.medium,
  },
  errorTextLight: {
    color: colors.error[600],
  },
  errorTextDark: {
    color: colors.error[300],
  },
  helperText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
  },
  helperTextLight: {
    color: colors.neutral[600],
  },
  helperTextDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default Input;

