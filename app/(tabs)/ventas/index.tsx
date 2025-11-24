/**
 * Ventas - Pantalla principal con sub-tabs de Ventas y Facturas
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../../src/constants/colors';
import FacturasTab from './facturas-tab';
import VentasTab from './ventas-tab';

export default function VentasScreen() {
  const [activeTab, setActiveTab] = useState<'ventas' | 'facturas'>('ventas');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ventas' && styles.activeTab]}
          onPress={() => setActiveTab('ventas')}
        >
          <Ionicons 
            name="storefront-outline" 
            size={20} 
            color={activeTab === 'ventas' ? colors.white : colors.textMedium} 
          />
          <Text style={[styles.tabText, activeTab === 'ventas' && styles.activeTabText]}>
            Ventas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'facturas' && styles.activeTab]}
          onPress={() => setActiveTab('facturas')}
        >
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={activeTab === 'facturas' ? colors.white : colors.textMedium} 
          />
          <Text style={[styles.tabText, activeTab === 'facturas' && styles.activeTabText]}>
            Facturas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'ventas' && <VentasTab />}
        {activeTab === 'facturas' && <FacturasTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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

