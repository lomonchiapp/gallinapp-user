/**
 * Componente Input personalizado para Asoaves
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
} from 'react-native';
import { colors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  required?: boolean;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  required = false,
  helperText,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}
      
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : {},
          inputStyle,
        ]}
        placeholderTextColor={colors.lightGray}
        {...rest}
      />
      
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelContainer: {
    marginBottom: 6,
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    color: colors.textDark,
    fontWeight: '500',
  },
  required: {
    color: colors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textDark,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: colors.textLight,
    fontSize: 14,
    marginTop: 4,
  },
});

export default Input;

