/**
 * Componente Card para Asoaves
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  // Determinar estilos según las propiedades
  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {};
    
    // Estilo según variante
    switch (variant) {
      case 'default':
        cardStyle.backgroundColor = colors.white;
        cardStyle.borderRadius = 8;
        cardStyle.shadowColor = colors.black;
        cardStyle.shadowOffset = { width: 0, height: 2 };
        cardStyle.shadowOpacity = 0.1;
        cardStyle.shadowRadius = 4;
        cardStyle.elevation = 2;
        break;
      case 'outlined':
        cardStyle.backgroundColor = colors.white;
        cardStyle.borderRadius = 8;
        cardStyle.borderWidth = 1;
        cardStyle.borderColor = colors.veryLightGray;
        break;
      case 'elevated':
        cardStyle.backgroundColor = colors.white;
        cardStyle.borderRadius = 8;
        cardStyle.shadowColor = colors.black;
        cardStyle.shadowOffset = { width: 0, height: 4 };
        cardStyle.shadowOpacity = 0.2;
        cardStyle.shadowRadius = 8;
        cardStyle.elevation = 5;
        break;
    }
    
    // Estilo según padding
    switch (padding) {
      case 'none':
        cardStyle.padding = 0;
        break;
      case 'small':
        cardStyle.padding = 8;
        break;
      case 'medium':
        cardStyle.padding = 16;
        break;
      case 'large':
        cardStyle.padding = 24;
        break;
    }
    
    return cardStyle;
  };
  
  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginVertical: 8,
  },
});

export default Card;

