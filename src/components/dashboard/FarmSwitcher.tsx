/**
 * Switcher compacto de granjas para el header
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useAccountStore } from '../../stores/accountStore';
import { useFarmStore } from '../../stores/farmStore';
import { SubscriptionPlan } from '../../types/subscription';

interface FarmSwitcherProps {
  compact?: boolean;
  showPlan?: boolean;
}

export const FarmSwitcher: React.FC<FarmSwitcherProps> = ({
  compact = true,
  showPlan = false,
}) => {
  const { isDark, colors } = useTheme();
  const {
    farms,
    currentFarm,
    switchFarm,
    isLoading,
  } = useFarmStore();
  const { account } = useAccountStore();

  const [isOpen, setIsOpen] = useState(false);

  const handleFarmSwitch = async (farmId: string) => {
    if (farmId === currentFarm?.id) {
      setIsOpen(false);
      return;
    }

    try {
      await switchFarm(farmId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching farm:', error);
    }
  };

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return '#6B7280';
      case SubscriptionPlan.BASIC:
        return colors.primary[400];
      case SubscriptionPlan.PRO:
        return colors.primary[500];
      case SubscriptionPlan.ENTERPRISE:
        return '#8B5CF6';
      default:
        return colors.primary[400];
    }
  };

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return 'star-outline';
      case SubscriptionPlan.BASIC:
        return 'star-outline';
      case SubscriptionPlan.PRO:
        return 'star';
      case SubscriptionPlan.ENTERPRISE:
        return 'diamond';
      default:
        return 'star-outline';
    }
  };

  // Si no hay granja actual, mostrar badge con nombre de organización como fallback
  if (!currentFarm) {
    if (compact) {
      return (
        <View style={[styles.compactSwitcher, {
          backgroundColor: colors.background.tertiary,
          borderColor: colors.border.medium,
        }]}>
          <View style={styles.compactContent}>
            <Ionicons name="business" size={14} color={colors.text.secondary} />
            <Text style={[styles.compactText, { color: colors.text.secondary }]} numberOfLines={1}>
              Cargando...
            </Text>
          </View>
        </View>
      );
    }
    return null;
  }
  
  // Si solo hay una granja, mostrar badge simple sin switcher
  if (farms.length <= 1) {
    return (
      <View style={[styles.compactSwitcher, {
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.medium,
      }]}>
        <View style={styles.compactContent}>
          <Ionicons name="business" size={14} color={colors.primary[500]} />
          <Text style={[styles.compactText, { color: colors.text.primary }]} numberOfLines={1}>
            {currentFarm.name}
          </Text>
        </View>
    
      </View>
    );
  }

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[
            styles.compactSwitcher,
            {
              backgroundColor: colors.background.tertiary,
              borderColor: colors.border.medium,
            }
          ]}
          onPress={() => setIsOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.compactContent}>
            <Ionicons name="business" size={14} color={colors.primary[500]} />
            <Text style={[styles.compactText, { color: colors.text.primary }]} numberOfLines={1}>
              {currentFarm.name}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.text.secondary} />
          </View>
          
          {showPlan && account?.subscription && (
            <View style={[styles.compactPlanBadge, { backgroundColor: getPlanColor(account.subscription.plan) }]}>
              <Ionicons
                name={getPlanIcon(account.subscription.plan)}
                size={10}
                color={colors.text.inverse}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Modal para selección */}
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Cambiar Granja
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setIsOpen(false)}
                >
                  <Ionicons name="close" size={16} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.farmsList} showsVerticalScrollIndicator={false}>
                {farms.map(farm => (
                  <TouchableOpacity
                    key={farm.id}
                    style={[
                      styles.farmOption,
                      {
                        backgroundColor: farm.id === currentFarm?.id ? colors.primary[100] : colors.background.secondary,
                        borderColor: farm.id === currentFarm?.id ? colors.primary[500] : colors.border.light,
                      },
                    ]}
                    onPress={() => handleFarmSwitch(farm.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.farmOptionContent}>
                      <View style={styles.farmOptionLeft}>
                        <Ionicons name="business" size={16} color={colors.primary[500]} />
                        <View style={styles.farmOptionInfo}>
                          <Text style={[styles.farmOptionName, { color: colors.text.primary }]}>
                            {farm.name}
                          </Text>
                          {farm.farmInfo?.location && (
                            <Text style={[styles.farmOptionLocation, { color: colors.text.secondary }]}>
                              📍 {farm.farmInfo.location}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.farmOptionRight}>
                        {account?.subscription && (
                          <View style={[styles.farmPlanBadge, { backgroundColor: getPlanColor(account.subscription.plan) }]}>
                            <Text style={[styles.farmPlanText, { color: colors.text.inverse }]}>
                              {account.subscription.plan}
                            </Text>
                          </View>
                        )}
                        {farm.id === currentFarm?.id && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.fullSwitcher,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.medium,
        }
      ]}
      onPress={() => setIsOpen(true)}
      activeOpacity={0.8}
    >
      <View style={styles.fullContent}>
        <Ionicons name="business" size={20} color={colors.primary[500]} />
        <View style={styles.fullInfo}>
          <Text style={[styles.fullTitle, { color: colors.text.primary }]}>
            {currentFarm.name}
          </Text>
          <Text style={[styles.fullSubtitle, { color: colors.text.secondary }]}>
            {farms.length} granjas disponibles
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact Switcher
  compactSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight:50,
    marginTop:10,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    position: 'relative',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  compactText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
    flex: 1,
  },
  compactPlanBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Full Switcher
  fullSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  fullContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  fullInfo: {
    flex: 1,
  },
  fullTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  fullSubtitle: {
    fontSize: typography.sizes.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 350,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    maxHeight: '70%',
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Farm List
  farmsList: {
    maxHeight: 250,
  },
  farmOption: {
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
  },
  farmOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  farmOptionInfo: {
    flex: 1,
  },
  farmOptionName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1] / 2,
  },
  farmOptionLocation: {
    fontSize: typography.sizes.xs,
  },
  farmOptionRight: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  farmPlanBadge: {
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1] / 2,
    borderRadius: borderRadius.sm,
  },
  farmPlanText: {
    fontSize: 10,
    fontWeight: typography.weights.bold as '700',
  },
});
