/**
 * Componente de botón personalizado para Gallinapp
 * Estilo moderno con soporte para fondos claros y oscuros
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/designSystem';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  // Determinar estilos según las propiedades
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {};
    
    // Estilo según variante
    switch (variant) {
      case 'primary':
        buttonStyle.backgroundColor = colors.primary[500];
        buttonStyle = { ...buttonStyle, ...shadows.md };
        break;
      case 'secondary':
        buttonStyle.backgroundColor = colors.secondary[500];
        buttonStyle = { ...buttonStyle, ...shadows.md };
        break;
      case 'outline':
        buttonStyle.backgroundColor = 'transparent';
        buttonStyle.borderWidth = 2;
        buttonStyle.borderColor = 'rgba(255, 255, 255, 0.5)';
        break;
      case 'glass':
        buttonStyle.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        buttonStyle.borderWidth = 1.5;
        buttonStyle.borderColor = 'rgba(255, 255, 255, 0.8)';
        buttonStyle = { ...buttonStyle, ...shadows.lg };
        break;
      case 'danger':
        buttonStyle.backgroundColor = colors.error[500];
        buttonStyle = { ...buttonStyle, ...shadows.md };
        break;
      case 'success':
        buttonStyle.backgroundColor = colors.success[500];
        buttonStyle = { ...buttonStyle, ...shadows.md };
        break;
    }
    
    // Estilo según tamaño
    switch (size) {
      case 'small':
        buttonStyle.paddingVertical = spacing[2];
        buttonStyle.paddingHorizontal = spacing[4];
        break;
      case 'medium':
        buttonStyle.paddingVertical = spacing[3];
        buttonStyle.paddingHorizontal = spacing[6];
        break;
      case 'large':
        buttonStyle.paddingVertical = spacing[4];
        buttonStyle.paddingHorizontal = spacing[8];
        break;
    }
    
    // Ancho completo
    if (fullWidth) {
      buttonStyle.width = '100%';
    }
    
    // Estilo para botón deshabilitado
    if (disabled) {
      buttonStyle.opacity = 0.5;
    }
    
    return buttonStyle;
  };
  
  // Determinar estilo del texto según las propiedades
  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {};
    
    // Color del texto según variante
    switch (variant) {
      case 'outline':
        textStyleObj.color = colors.neutral[0];
        break;
      case 'glass':
        textStyleObj.color = colors.primary[600];
        break;
      default:
        textStyleObj.color = colors.neutral[0];
        break;
    }
    
    // Tamaño del texto según tamaño del botón
    switch (size) {
      case 'small':
        textStyleObj.fontSize = typography.sizes.sm;
        break;
      case 'medium':
        textStyleObj.fontSize = typography.sizes.base;
        break;
      case 'large':
        textStyleObj.fontSize = typography.sizes.lg;
        break;
    }
    
    return textStyleObj;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'glass' ? colors.primary[500] : colors.neutral[0]} 
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: typography.weights.bold,
  },
});

export default Button;

