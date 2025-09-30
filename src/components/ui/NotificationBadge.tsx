/**
 * Badge de notificaciones para mostrar contador de no leídas
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  showZero?: boolean;
  style?: any;
}

export default function NotificationBadge({
  count,
  maxCount = 99,
  size = 'medium',
  color = colors.danger,
  textColor = colors.white,
  showZero = false,
  style,
}: NotificationBadgeProps) {
  // No mostrar si count es 0 y showZero es false
  if (count === 0 && !showZero) {
    return null;
  }

  // Determinar el texto a mostrar
  const displayText = count > maxCount ? `${maxCount}+` : count.toString();

  // Obtener estilos basados en el tamaño
  const getBadgeStyles = () => {
    switch (size) {
      case 'small':
        return {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
        };
      case 'large':
        return {
          minWidth: 28,
          height: 28,
          borderRadius: 14,
          paddingHorizontal: 8,
        };
      default: // medium
        return {
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          paddingHorizontal: 6,
        };
    }
  };

  const getTextStyles = () => {
    switch (size) {
      case 'small':
        return { fontSize: 10, fontWeight: 'bold' as const };
      case 'large':
        return { fontSize: 14, fontWeight: 'bold' as const };
      default: // medium
        return { fontSize: 12, fontWeight: 'bold' as const };
    }
  };

  const badgeStyles = getBadgeStyles();
  const textStyles = getTextStyles();

  return (
    <View
      style={[
        styles.badge,
        badgeStyles,
        { backgroundColor: color },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          textStyles,
          { color: textColor },
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  text: {
    textAlign: 'center',
    lineHeight: undefined, // Permite que el texto se centre verticalmente
  },
});

// Componente wrapper para usar con iconos
interface NotificationIconBadgeProps extends NotificationBadgeProps {
  children: React.ReactNode;
}

export function NotificationIconBadge({
  children,
  count,
  ...badgeProps
}: NotificationIconBadgeProps) {
  return (
    <View style={styles.iconContainer}>
      {children}
      <NotificationBadge count={count} {...badgeProps} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
});

// Merge los estilos
Object.assign(styles, iconStyles);










