/**
 * SubscriptionBadge - Muestra el estado de suscripción
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { SubscriptionPlan, SubscriptionStatus } from '../../types/organization';

interface SubscriptionBadgeProps {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  onPress?: () => void;
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  plan,
  status,
  onPress,
  showUpgradeButton = true,
  compact = false,
}) => {
  const getPlanColor = (planType: SubscriptionPlan) => {
    switch (planType) {
      case SubscriptionPlan.FREE:
        return colors.gray;
      case SubscriptionPlan.BASIC:
        return colors.primary;
      case SubscriptionPlan.PRO:
        return colors.success;
      case SubscriptionPlan.ENTERPRISE:
        return colors.warning;
      default:
        return colors.gray;
    }
  };

  const getStatusColor = (statusType: SubscriptionStatus) => {
    switch (statusType) {
      case SubscriptionStatus.ACTIVE:
        return colors.success;
      case SubscriptionStatus.TRIALING:
        return colors.primary;
      case SubscriptionStatus.PAST_DUE:
        return colors.warning;
      case SubscriptionStatus.CANCELLED:
      case SubscriptionStatus.INACTIVE:
        return colors.danger;
      default:
        return colors.gray;
    }
  };

  const getStatusIcon = (statusType: SubscriptionStatus) => {
    switch (statusType) {
      case SubscriptionStatus.ACTIVE:
        return 'checkmark-circle';
      case SubscriptionStatus.TRIALING:
        return 'time';
      case SubscriptionStatus.PAST_DUE:
        return 'warning';
      case SubscriptionStatus.CANCELLED:
      case SubscriptionStatus.INACTIVE:
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getPlanDisplayName = (planType: SubscriptionPlan) => {
    switch (planType) {
      case SubscriptionPlan.FREE:
        return 'Gratuito';
      case SubscriptionPlan.BASIC:
        return 'Básico';
      case SubscriptionPlan.PRO:
        return 'Profesional';
      case SubscriptionPlan.ENTERPRISE:
        return 'Empresarial';
      default:
        return plan.toUpperCase();
    }
  };

  const getStatusDisplayName = (statusType: SubscriptionStatus) => {
    switch (statusType) {
      case SubscriptionStatus.ACTIVE:
        return 'Activo';
      case SubscriptionStatus.TRIALING:
        return 'Prueba';
      case SubscriptionStatus.PAST_DUE:
        return 'Vencido';
      case SubscriptionStatus.CANCELLED:
        return 'Cancelado';
      case SubscriptionStatus.INACTIVE:
        return 'Inactivo';
      default:
        return status;
    }
  };

  const planColor = getPlanColor(plan);
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactBadge, { backgroundColor: planColor + '20' }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <Text style={[styles.compactText, { color: planColor }]}>
          {getPlanDisplayName(plan)}
        </Text>
        <Ionicons
          name={statusIcon}
          size={14}
          color={statusColor}
          style={styles.compactIcon}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { borderColor: planColor }]}>
        <View style={styles.planSection}>
          <Text style={[styles.planText, { color: planColor }]}>
            Plan {getPlanDisplayName(plan)}
          </Text>
        </View>
        
        <View style={styles.statusSection}>
          <Ionicons
            name={statusIcon}
            size={16}
            color={statusColor}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusDisplayName(status)}
          </Text>
        </View>
      </View>

      {showUpgradeButton && plan === SubscriptionPlan.FREE && onPress && (
        <TouchableOpacity style={styles.upgradeButton} onPress={onPress}>
          <Ionicons name="arrow-up-circle" size={16} color={colors.primary} />
          <Text style={styles.upgradeText}>Mejorar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.white,
  },
  planSection: {
    marginRight: 8,
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.lightGray,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.lightBlue,
  },
  upgradeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  compactIcon: {
    marginLeft: 4,
  },
});


