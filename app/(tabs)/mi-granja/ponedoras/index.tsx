/**
 * Pantalla de Ponedoras dentro de Mi Granja
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../../../src/constants/designSystem';
import EstadisticasTab from './estadisticas-tab';
import LotesTab from './lotes-tab';

export default function MiGranjaPonedoras() {
  const { colors: themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState<'lotes' | 'estadisticas'>('lotes');

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      {/* Mini Navigation Tabs entre Lotes y Estadísticas */}
      <View style={[styles.tabContainer, { backgroundColor: themeColors.background.secondary }]}>
        <View style={[styles.segmentedControl, { backgroundColor: themeColors.background.tertiary }]}>
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'lotes' && [styles.activeTab, { backgroundColor: themeColors.primary[500] }],
            ]}
            onPress={() => setActiveTab('lotes')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={activeTab === 'lotes' ? themeColors.text.inverse : themeColors.text.secondary} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'lotes' ? themeColors.text.inverse : themeColors.text.secondary }
            ]}>
              Lotes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab, 
              activeTab === 'estadisticas' && [styles.activeTab, { backgroundColor: themeColors.primary[500] }],
            ]}
            onPress={() => setActiveTab('estadisticas')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="analytics" 
              size={16} 
              color={activeTab === 'estadisticas' ? themeColors.text.inverse : themeColors.text.secondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'estadisticas' ? themeColors.text.inverse : themeColors.text.secondary }
            ]}>
              Estadísticas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'lotes' && <LotesTab />}
        {activeTab === 'estadisticas' && <EstadisticasTab />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Mini Tab Navigation
  tabContainer: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: spacing[1],
    ...shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.sm,
    gap: spacing[1],
  },
  activeTab: {
    ...shadows.sm,
  },
  tabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
  },
});

