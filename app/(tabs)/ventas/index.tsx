/**
 * Ventas - Pantalla principal con sub-tabs de Ventas y Facturas
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../../src/constants/colors';
import { spacing, typography } from '../../../src/constants/designSystem';
import { useAccountStore } from '../../../src/stores/accountStore';
import { SubscriptionPlan } from '../../../src/types/subscription';
import { UpgradePlanSheet } from '../../../src/components/ui/UpgradePlanSheet';
import FacturasTab from './facturas-tab';
import VentasTab from './ventas-tab';

export default function VentasScreen() {
  const [activeTab, setActiveTab] = useState<'ventas' | 'facturas'>('ventas');
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const { account } = useAccountStore();
  
  const userPlan = account?.subscription?.plan || SubscriptionPlan.FREE;
  const hasProAccess = userPlan === SubscriptionPlan.PRO || userPlan === SubscriptionPlan.ENTERPRISE;

  // Verificar plan al montar
  useEffect(() => {
    if (!hasProAccess) {
      setShowUpgradeSheet(true);
    }
  }, [hasProAccess]);

  // Función para manejar intentos de acceso a tabs
  const handleTabPress = (tab: 'ventas' | 'facturas') => {
    if (!hasProAccess) {
      // Siempre mostrar el sheet si no tienen acceso Pro
      setShowUpgradeSheet(true);
      return;
    }
    setActiveTab(tab);
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ventas' && hasProAccess && styles.activeTab]}
            onPress={() => handleTabPress('ventas')}
          >
            <Ionicons 
              name="storefront-outline" 
              size={20} 
              color={activeTab === 'ventas' && hasProAccess ? colors.white : colors.textMedium} 
            />
            <Text style={[styles.tabText, activeTab === 'ventas' && hasProAccess && styles.activeTabText]}>
              Ventas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'facturas' && hasProAccess && styles.activeTab]}
            onPress={() => handleTabPress('facturas')}
          >
            <Ionicons 
              name="receipt-outline" 
              size={20} 
              color={activeTab === 'facturas' && hasProAccess ? colors.white : colors.textMedium} 
            />
            <Text style={[styles.tabText, activeTab === 'facturas' && hasProAccess && styles.activeTabText]}>
              Facturas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {hasProAccess ? (
          <View style={styles.content}>
            {activeTab === 'ventas' && <VentasTab />}
            {activeTab === 'facturas' && <FacturasTab />}
          </View>
        ) : (
          <View style={styles.lockedContent}>
            <Ionicons name="lock-closed" size={64} color={colors.textMedium} />
            <Text style={styles.lockedText}>
              Necesitas el plan Pro para acceder a Ventas
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Upgrade Plan Sheet */}
      <UpgradePlanSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        requiredPlan={SubscriptionPlan.PRO}
        featureName="Ventas"
      />
    </>
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
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  lockedText: {
    fontSize: typography.sizes.base,
    color: colors.textMedium,
    marginTop: spacing[4],
    textAlign: 'center',
  },
});

