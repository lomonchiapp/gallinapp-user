/**
 * Layout de tabs con transiciones animadas entre pantallas
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../components/theme-provider';
import { AnimatedTabBar } from './AnimatedTabBar';
import { ScreenTransition } from './ScreenTransition';

interface TabScreen {
  name: string;
  title: string;
  icon: string;
  iconFocused?: string;
  component: React.ComponentType;
  href?: string;
}

interface AnimatedTabLayoutProps {
  screens: TabScreen[];
  initialRouteName?: string;
}

export const AnimatedTabLayout: React.FC<AnimatedTabLayoutProps> = ({
  screens,
  initialRouteName,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const visibleScreens = screens.filter(screen => screen.href !== null);
  const [activeIndex, setActiveIndex] = useState(
    initialRouteName 
      ? visibleScreens.findIndex(screen => screen.name === initialRouteName)
      : 0
  );

  // Crear el objeto state simulando el state de React Navigation
  const state = {
    index: activeIndex,
    routes: visibleScreens.map(screen => ({ name: screen.name, key: screen.name })),
  };

  // Crear descriptors simulando React Navigation
  const descriptors = visibleScreens.reduce((acc, screen, index) => {
    acc[screen.name] = {
      options: {
        title: screen.title,
        tabBarIcon: screen.icon,
        tabBarAccessibilityLabel: `${screen.title} tab`,
        tabBarTestID: `${screen.name}-tab`,
      },
    };
    return acc;
  }, {} as any);

  // Navegación simulada
  const navigation = {
    navigate: (routeName: string) => {
      const index = visibleScreens.findIndex(screen => screen.name === routeName);
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    emit: ({ type, target, canPreventDefault }: any) => {
      // Simular eventos de navegación
      console.log(`Navigation event: ${type} to ${target}`);
      return { defaultPrevented: false };
    },
  };

  const getTransitionType = (fromIndex: number, toIndex: number) => {
    if (Math.abs(fromIndex - toIndex) === 1) {
      return 'slide';
    } else if (Math.abs(fromIndex - toIndex) === 2) {
      return 'scale';
    } else {
      return 'flip';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Contenedor de pantallas con transiciones */}
      <View style={styles.screensContainer}>
        {visibleScreens.map((screen, index) => {
          const Screen = screen.component;
          const transitionType = activeIndex !== index 
            ? getTransitionType(activeIndex, index) 
            : 'slide';

          return (
            <ScreenTransition
              key={screen.name}
              isActive={index === activeIndex}
              transitionType={transitionType}
              duration={350}
            >
              <Screen />
            </ScreenTransition>
          );
        })}
      </View>

      {/* Tab Bar animado */}
      <AnimatedTabBar
        state={state}
        descriptors={descriptors}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screensContainer: {
    flex: 1,
    position: 'relative',
  },
});


