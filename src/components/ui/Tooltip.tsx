/**
 * Componente Tooltip reutilizable con animación automática
 * Aparece automáticamente al montar y desaparece después de unos segundos
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';

interface TooltipProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  autoHideDuration?: number; // Duración en ms antes de ocultar automáticamente
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode; // Elemento al que se ancla el tooltip
}

export const Tooltip: React.FC<TooltipProps> = ({
  message,
  visible,
  onClose,
  autoHideDuration = 4000,
  position = 'bottom',
  children,
}) => {
  const { colors: themeColors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-ocultar después de la duración especificada
      if (autoHideDuration > 0) {
        timeoutRef.current = setTimeout(() => {
          handleClose();
        }, autoHideDuration);
      }
    } else {
      // Animación de salida
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, autoHideDuration]);

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return { bottom: 60, alignSelf: 'center' };
      case 'bottom':
        return { top: 60, alignSelf: 'center' };
      case 'left':
        return { right: 60, alignSelf: 'center' };
      case 'right':
        return { left: 60, alignSelf: 'center' };
      default:
        return { top: 60, alignSelf: 'center' };
    }
  };

  const getArrowStyle = () => {
    switch (position) {
      case 'top':
        return {
          bottom: -6,
          borderTopColor: themeColors.background.primary,
          borderBottomWidth: 0,
        };
      case 'bottom':
        return {
          top: -6,
          borderBottomColor: themeColors.background.primary,
          borderTopWidth: 0,
        };
      case 'left':
        return {
          right: -6,
          borderLeftColor: themeColors.background.primary,
          borderRightWidth: 0,
        };
      case 'right':
        return {
          left: -6,
          borderRightColor: themeColors.background.primary,
          borderLeftWidth: 0,
        };
      default:
        return {
          top: -6,
          borderBottomColor: themeColors.background.primary,
          borderTopWidth: 0,
        };
    }
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      {
        translateY: position === 'top' ? slideAnim : position === 'bottom' ? slideAnim : 0,
      },
      {
        translateX: position === 'left' ? slideAnim : position === 'right' ? slideAnim : 0,
      },
    ],
  };

  return (
    <View style={styles.container}>
      {children}
      <Animated.View
        style={[
          styles.tooltip,
          getPositionStyle(),
          animatedStyle,
          {
            backgroundColor: themeColors.background.primary,
            borderColor: themeColors.border.medium,
          },
        ]}
      >
        <View
          style={[
            styles.arrow,
            getArrowStyle(),
            {
              borderColor: themeColors.border.medium,
            },
          ]}
        />
        <View style={styles.content}>
          <Text style={[styles.message, { color: themeColors.text.primary }]}>
            {message}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={14} color={themeColors.text.secondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 1000,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 120,
    maxWidth: 250,
    ...shadows.lg,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderWidth: 6,
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
    marginRight: spacing[2],
  },
  closeButton: {
    padding: spacing[1],
  },
});

