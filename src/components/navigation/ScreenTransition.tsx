/**
 * Componente para manejar transiciones animadas entre pantallas
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  isActive: boolean;
  transitionType?: 'slide' | 'fade' | 'scale' | 'flip';
  duration?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  isActive,
  transitionType = 'slide',
  duration = 300,
}) => {
  // Animaciones
  const translateX = useRef(new Animated.Value(isActive ? 0 : screenWidth)).current;
  const opacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.8)).current;
  const rotateY = useRef(new Animated.Value(isActive ? 0 : 90)).current;

  useEffect(() => {
    if (isActive) {
      // Pantalla se vuelve activa
      const animations: Animated.CompositeAnimation[] = [];

      switch (transitionType) {
        case 'slide':
          animations.push(
            Animated.spring(translateX, {
              toValue: 0,
              tension: 65,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: duration * 0.8,
              useNativeDriver: true,
            })
          );
          break;

        case 'fade':
          animations.push(
            Animated.timing(opacity, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            })
          );
          break;

        case 'scale':
          animations.push(
            Animated.spring(scale, {
              toValue: 1,
              tension: 60,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: duration * 0.6,
              useNativeDriver: true,
            })
          );
          break;

        case 'flip':
          animations.push(
            Animated.spring(rotateY, {
              toValue: 0,
              tension: 45,
              friction: 6,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: duration * 0.7,
              useNativeDriver: true,
            })
          );
          break;
      }

      Animated.parallel(animations).start();
    } else {
      // Pantalla se vuelve inactiva
      const animations: Animated.CompositeAnimation[] = [];

      switch (transitionType) {
        case 'slide':
          animations.push(
            Animated.timing(translateX, {
              toValue: -screenWidth * 0.3,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.5,
              useNativeDriver: true,
            })
          );
          break;

        case 'fade':
          animations.push(
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.6,
              useNativeDriver: true,
            })
          );
          break;

        case 'scale':
          animations.push(
            Animated.timing(scale, {
              toValue: 0.9,
              duration: duration * 0.6,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            })
          );
          break;

        case 'flip':
          animations.push(
            Animated.timing(rotateY, {
              toValue: -90,
              duration: duration * 0.6,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.5,
              useNativeDriver: true,
            })
          );
          break;
      }

      Animated.parallel(animations).start();
    }
  }, [isActive, transitionType, duration]);

  const getTransformStyle = () => {
    switch (transitionType) {
      case 'slide':
        return [
          { translateX },
          { scale: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }) },
        ];

      case 'fade':
        return [
          { scale: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0.98, 1],
          }) },
        ];

      case 'scale':
        return [{ scale }];

      case 'flip':
        return [
          { 
            rotateY: rotateY.interpolate({
              inputRange: [0, 90],
              outputRange: ['0deg', '90deg'],
            })
          },
          { scale: opacity.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }) },
        ];

      default:
        return [];
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: getTransformStyle(),
        },
      ]}
      pointerEvents={isActive ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});


