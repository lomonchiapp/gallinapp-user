/**
 * Pantalla principal del módulo de Levantes con tabs
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../src/constants/colors';
import EstadisticasTab from './estadisticas-tab';
import LotesTab from './lotes-tab';

export default function LevantesTabsScreen() {
  const [activeTab, setActiveTab] = useState<'lotes' | 'estadisticas'>('lotes');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pollos Levantes</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lotes' && styles.activeTab]}
          onPress={() => setActiveTab('lotes')}
        >
          <Ionicons 
            name="list" 
            size={20} 
            color={activeTab === 'lotes' ? colors.white : colors.textMedium} 
          />
          <Text style={[styles.tabText, activeTab === 'lotes' && styles.activeTabText]}>
            Lotes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'estadisticas' && styles.activeTab]}
          onPress={() => setActiveTab('estadisticas')}
        >
          <Ionicons 
            name="bar-chart" 
            size={20} 
            color={activeTab === 'estadisticas' ? colors.white : colors.textMedium} 
          />
          <Text style={[styles.tabText, activeTab === 'estadisticas' && styles.activeTabText]}>
            Estadísticas
          </Text>
        </TouchableOpacity>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  activeTab: {
    backgroundColor: colors.israelies,
    borderColor: colors.israelies,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMedium,
    marginLeft: 8,
  },
  activeTabText: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
});