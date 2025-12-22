/**
 * Tab Bar personalizado estilo iOS para navegación interna
 * Usado dentro de "Mi Granja" para navegar entre ponedoras/levantes/engorde
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';

interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

interface CustomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string, route: string) => void;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const { colors: themeColors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.secondary }]}>
      <View style={[styles.tabBar, { backgroundColor: themeColors.background.tertiary }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && [
                  styles.activeTab,
                  {
                    backgroundColor: themeColors.primary[500],
                  },
                ],
              ]}
              onPress={() => onTabPress(tab.key, tab.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={
                  isActive ? themeColors.text.inverse : themeColors.text.secondary
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? themeColors.text.inverse
                      : themeColors.text.secondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing[1],
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  activeTab: {
    ...shadows.sm,
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    letterSpacing: -0.2,
  },
});




