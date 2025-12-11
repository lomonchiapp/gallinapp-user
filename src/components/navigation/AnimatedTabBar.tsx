/**
 * Tab Bar animado con indicador cuadrado redondeado
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useAccountStore } from '../../stores/accountStore';
import { SubscriptionPlan } from '../../types/subscription';
import { GranjaIcon } from '../ui/icons/GranjaIcon';

interface TabItem {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused?: keyof typeof Ionicons.glyphMap;
}

interface AnimatedTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { account } = useAccountStore();
  const userPlan = account?.subscription?.plan || SubscriptionPlan.FREE;
  
  // Animación del cuadro activo
  const indicatorAnimation = useRef(new Animated.Value(0)).current;
  
  // Configuración de tabs
  const tabItems: TabItem[] = [
    { name: 'index', title: 'Inicio', icon: 'home-outline', iconFocused: 'home' },
    { name: 'mi-granja', title: 'Mi Granja', icon: 'business-outline', iconFocused: 'business' },
    { name: 'gastos', title: 'Gastos', icon: 'cash-outline', iconFocused: 'cash' },
    { name: 'ventas', title: 'Ventas', icon: 'storefront-outline', iconFocused: 'storefront' },
  ];

  const visibleTabs = tabItems.filter(item => 
    state.routes.some((route: any) => route.name === item.name)
  );

  const tabWidth = screenWidth / visibleTabs.length;
  const indicatorWidth = 80;
  const centerOffset = (tabWidth - indicatorWidth) / 2;

  // Animar el cuadro al cambiar de tab
  useEffect(() => {
    const targetPosition = state.index * tabWidth + centerOffset;
    
    Animated.spring(indicatorAnimation, {
      toValue: targetPosition,
      tension: 45,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, centerOffset]);

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: colors.background.primary,
        borderTopColor: colors.border.light,
        paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 8,
      }
    ]}>
      {/* Cuadro indicador del tab activo */}
      <Animated.View
        style={[
          styles.activeIndicator,
          {
            backgroundColor: colors.primary[500],
            transform: [{ translateX: indicatorAnimation }],
          },
        ]}
      />

      {/* Tabs */}
      {visibleTabs.map((tabItem, index) => {
        const route = state.routes.find((r: any) => r.name === tabItem.name);
        if (!route) return null;

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={tabItem.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <View style={styles.iconWrapper}>
                {tabItem.name === 'mi-granja' ? (
                  <GranjaIcon
                    width={20}
                    height={20}
                    fill={isFocused ? colors.text.inverse : colors.text.secondary}
                  />
                ) : (
                  <Ionicons
                    name={isFocused && tabItem.iconFocused ? tabItem.iconFocused : tabItem.icon}
                    size={20}
                    color={isFocused ? colors.text.inverse : colors.text.secondary}
                    style={styles.tabIcon}
                  />
                )}
                {tabItem.name === 'ventas' && userPlan !== SubscriptionPlan.PRO && userPlan !== SubscriptionPlan.ENTERPRISE && (
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.proBadge}
                  >
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.tabLabelContainer}>
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isFocused ? colors.text.inverse : colors.text.secondary,
                      fontWeight: isFocused ? typography.weights.bold as '700' : typography.weights.medium as '500',
                    },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tabItem.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing[1],
    position: 'relative',
    ...shadows.lg,
  },
  activeIndicator: {
    position: 'absolute',
    top: spacing[1],
    width: 80,
    height: 50,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    position: 'relative',
    minHeight: 45,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    maxWidth: 75,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: spacing[1] / 2,
  },
  tabIcon: {
    marginBottom: 0,
  },
  tabLabelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    letterSpacing: -0.1,
    textAlign: 'center',
    maxWidth: 75,
  },
  proBadge: {
    position: 'absolute',
    top: -5,
    right: -14,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: typography.weights.bold as '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
