/**
 * Componente de botón personalizado para Asoaves
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
import { colors } from '../../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
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
        buttonStyle.backgroundColor = colors.primary;
        break;
      case 'secondary':
        buttonStyle.backgroundColor = colors.secondary;
        break;
      case 'outline':
        buttonStyle.backgroundColor = 'transparent';
        buttonStyle.borderWidth = 1;
        buttonStyle.borderColor = colors.primary;
        break;
      case 'danger':
        buttonStyle.backgroundColor = colors.danger;
        break;
      case 'success':
        buttonStyle.backgroundColor = colors.success;
        break;
    }
    
    // Estilo según tamaño
    switch (size) {
      case 'small':
        buttonStyle.paddingVertical = 8;
        buttonStyle.paddingHorizontal = 16;
        break;
      case 'medium':
        buttonStyle.paddingVertical = 12;
        buttonStyle.paddingHorizontal = 24;
        break;
      case 'large':
        buttonStyle.paddingVertical = 16;
        buttonStyle.paddingHorizontal = 32;
        break;
    }
    
    // Ancho completo
    if (fullWidth) {
      buttonStyle.width = '100%';
    }
    
    // Estilo para botón deshabilitado
    if (disabled) {
      buttonStyle.opacity = 0.6;
    }
    
    return buttonStyle;
  };
  
  // Determinar estilo del texto según las propiedades
  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {};
    
    // Color del texto según variante
    switch (variant) {
      case 'outline':
        textStyleObj.color = colors.primary;
        break;
      default:
        textStyleObj.color = colors.white;
        break;
    }
    
    // Tamaño del texto según tamaño del botón
    switch (size) {
      case 'small':
        textStyleObj.fontSize = 14;
        break;
      case 'medium':
        textStyleObj.fontSize = 16;
        break;
      case 'large':
        textStyleObj.fontSize = 18;
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
          color={variant === 'outline' ? colors.primary : colors.white} 
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
});

export default Button;

