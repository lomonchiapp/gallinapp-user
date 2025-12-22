/**
 * Wrapper para pantallas con transiciones animadas
 */

import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../components/theme-provider';

interface ScreenWrapperProps {
  children: React.ReactNode;
  transitionType?: 'slide' | 'fade' | 'scale' | 'bounce';
  enableTransitions?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  transitionType = 'slide',
  enableTransitions = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const bounceAnim = useRef(new Animated.Value(0.8)).current;
  
  // Estado de foco
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      
      if (!enableTransitions) {
        // Sin animaciones, valores directos
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
        scaleAnim.setValue(1);
        bounceAnim.setValue(1);
        return;
      }

      // Animación de entrada
      const animations: Animated.CompositeAnimation[] = [];

      switch (transitionType) {
        case 'slide':
          animations.push(
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 65,
              friction: 8,
              useNativeDriver: true,
            })
          );
          break;

        case 'fade':
          animations.push(
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            })
          );
          break;

        case 'scale':
          animations.push(
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 60,
              friction: 6,
              useNativeDriver: true,
            })
          );
          break;

        case 'bounce':
          animations.push(
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.spring(bounceAnim, {
                toValue: 1.05,
                tension: 100,
                friction: 3,
                useNativeDriver: true,
              }),
              Animated.spring(bounceAnim, {
                toValue: 1,
                tension: 80,
                friction: 5,
                useNativeDriver: true,
              }),
            ])
          );
          break;
      }

      Animated.parallel(animations).start();

      return () => {
        setIsFocused(false);
        
        if (!enableTransitions) return;

        // Animación de salida rápida
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -20,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      };
    }, [transitionType, enableTransitions])
  );

  const getTransformStyle = () => {
    if (!enableTransitions) return {};

    switch (transitionType) {
      case 'slide':
        return {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.98, 1],
            }) },
          ],
        };

      case 'fade':
        return {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        };

      case 'scale':
        return {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        };

      case 'bounce':
        return {
          opacity: fadeAnim,
          transform: [{ scale: bounceAnim }],
        };

      default:
        return {
          opacity: fadeAnim,
        };
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          backgroundColor: colors.background.primary,
          paddingTop: insets.top,
        },
        getTransformStyle(),
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});



