/**
 * Sub Tab Bar compacto para secciones como Mi Granja
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { EngordeIcon } from '../ui/icons/EngordeIcon';
import { LevanteIcon } from '../ui/icons/LevanteIcon';
import { PonedoraIcon } from '../ui/icons/PonedoraIcon';

interface SubTabItem {
  name: string;
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconFocused?: keyof typeof Ionicons.glyphMap;
  customIcon?: 'engorde' | 'levante' | 'ponedora';
  onPress: () => void;
}

interface SubTabBarProps {
  activeTab: string | null;
  tabs: SubTabItem[];
  isVisible: boolean;
  animateOnMount?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SubTabBar: React.FC<SubTabBarProps> = ({
  activeTab,
  tabs,
  isVisible,
  animateOnMount = false,
}) => {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animaciones
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  
  const tabWidth = screenWidth / tabs.length;
  const activeIndex = activeTab ? tabs.findIndex(tab => tab.name === activeTab) : -1;

  // Calcular la altura del tab bar principal (45px + padding bottom)
  const mainTabBarHeight = 45 + (Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 8);
  const subTabBarHeight = 45;
  
  // Crear valor animado para translateY - inicialmente fuera de pantalla (abajo)
  const translateYAnim = useRef(new Animated.Value(animateOnMount ? subTabBarHeight : 0)).current;
  
  // Animación inicial de entrada desde abajo
  useEffect(() => {
    if (animateOnMount && isVisible) {
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateOnMount]);
  
  // Animar la posición translateY y opacidad cuando cambia la visibilidad
  useEffect(() => {
    if (!animateOnMount) {
      Animated.parallel([
        Animated.spring(translateYAnim, {
          toValue: isVisible ? 0 : subTabBarHeight,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: isVisible ? 1 : 0,
          duration: isVisible ? 300 : 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, translateYAnim, animateOnMount]);

  // Animar el indicador al cambiar de tab (solo si hay un tab activo)
  useEffect(() => {
    if (activeIndex >= 0 && activeTab) {
      const targetPosition = activeIndex * tabWidth;
      
      Animated.spring(indicatorAnim, {
        toValue: targetPosition,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      // Si no hay tab activo, ocultar el indicador
      indicatorAnim.setValue(-100);
    }
  }, [activeIndex, tabWidth, activeTab]);
  
  if (!isVisible) return null;

  // Función para renderizar el icono personalizado
  const renderCustomIcon = (iconType: 'engorde' | 'levante' | 'ponedora' | undefined, isActive: boolean) => {
    const iconColor = isActive ? colors.text.inverse : colors.primary[100];
    const iconSize = 24; // Iconos más grandes

    switch (iconType) {
      case 'engorde':
        return <EngordeIcon width={iconSize} height={iconSize} fill={iconColor} />;
      case 'levante':
        return <LevanteIcon width={iconSize} height={iconSize} fill={iconColor} />;
      case 'ponedora':
        return <PonedoraIcon width={iconSize} height={iconSize} fill={iconColor} />;
      default:
        return null;
    }
  };

  // Calcular la posición bottom: altura de la tab principal (45px) + safe area bottom + 50px de espacio
  const bottomPosition = mainTabBarHeight - 95;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.primary[500],
          opacity: opacityAnim,
          bottom: bottomPosition,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      {/* Indicador deslizante */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.text.inverse,
            transform: [
              { translateX: indicatorAnim },
              { translateX: (tabWidth - 50) / 2 },
            ],
          },
        ]}
      />

      {/* Sub Tabs */}
      {tabs.map((tab, index) => {
        const isActive = activeTab !== null && tab.name === activeTab;

        return (
          <TouchableOpacity
            key={tab.name}
            style={[
              styles.tab,
              isActive && styles.tabActive,
            ]}
            onPress={tab.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {tab.customIcon ? (
                renderCustomIcon(tab.customIcon, isActive)
              ) : (
                <Ionicons
                  name={isActive && tab.iconFocused ? tab.iconFocused : (tab.icon || 'ellipse-outline')}
                  size={24}
                  color={isActive ? colors.text.inverse : colors.primary[100]}
                  style={styles.tabIcon}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.text.inverse : colors.primary[100],
                    fontWeight: isActive ? typography.weights.bold as '700' : typography.weights.medium as '500',
                  },
                ]}
              >
                {tab.title}
              </Text>
            </View>

            {/* Pulse sutil para tab activo */}
            {isActive && (
              <View style={[styles.activePulse, { backgroundColor: colors.primary[300] }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom:13,
    paddingHorizontal: spacing[2],
    position: 'absolute',
    left: spacing[2],
    right: spacing[2],
    zIndex: 1000,
    minHeight: 60,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    ...shadows.lg,
  },
  indicator: {
    position: 'absolute',
    bottom: spacing[2],
    width: 50,
    height: 4,
    borderRadius: borderRadius.full,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[1],
    position: 'relative',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing[1],
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  tabIcon: {
    marginBottom: 0,
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  activePulse: {
    position: 'absolute',
    top: spacing[1],
    width: 60,
    height: 40,
    borderRadius: borderRadius.lg,
    opacity: 0.15,
    zIndex: 0,
  },
});
