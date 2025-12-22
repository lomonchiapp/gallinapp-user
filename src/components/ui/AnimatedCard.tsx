/**
 * AnimatedCard - Componente de tarjeta con animaciones fluidas
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { colors, shadows, spacing, borderRadius } from '../../constants/designSystem';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  animationType?: 'fadeIn' | 'slideUp' | 'scale' | 'bounce';
  delay?: number;
  duration?: number;
  disabled?: boolean;
  elevation?: 'sm' | 'base' | 'md' | 'lg';
}

const { height: screenHeight } = Dimensions.get('window');

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  style,
  animationType = 'fadeIn',
  delay = 0,
  duration = 300,
  disabled = false,
  elevation = 'sm',
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const animation = createEntranceAnimation();
    
    const timer = setTimeout(() => {
      animation.start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const createEntranceAnimation = () => {
    switch (animationType) {
      case 'slideUp':
        animatedValue.setValue(50);
        return Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
        ]);
      
      case 'scale':
        scaleValue.setValue(0.8);
        return Animated.parallel([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]);
      
      case 'bounce':
        return Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration * 0.6,
            useNativeDriver: true,
          }),
          Animated.spring(scaleValue, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]);
      
      default: // fadeIn
        return Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        });
    }
  };

  const handlePressIn = () => {
    if (disabled || !onPress) return;
    
    setIsPressed(true);
    Animated.spring(scaleValue, {
      toValue: 0.98,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || !onPress) return;
    
    setIsPressed(false);
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 300,
      friction: 20,
      useNativeDriver: true,
    }).start();
  };

  const getTransform = () => {
    switch (animationType) {
      case 'slideUp':
        return [
          {
            translateY: animatedValue,
          },
          {
            scale: scaleValue,
          },
        ];
      
      case 'scale':
      case 'bounce':
        return [
          {
            scale: Animated.multiply(scaleValue, animatedValue),
          },
        ];
      
      default:
        return [
          {
            scale: scaleValue,
          },
        ];
    }
  };

  const getOpacity = () => {
    if (animationType === 'scale' || animationType === 'bounce') {
      return animatedValue;
    }
    return animationType === 'fadeIn' ? animatedValue : 1;
  };

  const getShadowStyle = () => {
    switch (elevation) {
      case 'sm':
        return shadows.sm;
      case 'md':
        return shadows.md;
      case 'lg':
        return shadows.lg;
      default:
        return shadows.base;
    }
  };

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.card,
            getShadowStyle(),
            {
              opacity: getOpacity(),
              transform: getTransform(),
            },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        getShadowStyle(),
        {
          opacity: getOpacity(),
          transform: getTransform(),
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginVertical: spacing[2],
  },
});



