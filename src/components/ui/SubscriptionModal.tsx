/**
 * SubscriptionModal - Modal para gestión de suscripciones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../constants/designSystem';
import { Button } from './Button';
import { Card } from './Card';
import { SubscriptionBadge } from './SubscriptionBadge';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionPlan, SUBSCRIPTION_LIMITS } from '../../types/organization';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  initialPlan?: SubscriptionPlan;
}

interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

interface PlanOption {
  plan: SubscriptionPlan;
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  initialPlan,
}) => {
  const {
    subscriptionInfo,
    isLoading,
    purchaseSubscription,
    restorePurchases,
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    initialPlan || SubscriptionPlan.BASIC
  );
  const [isPurchasing, setIsPurchasing] = useState(false);

  const planOptions: PlanOption[] = [
    {
      plan: SubscriptionPlan.FREE,
      name: 'Gratuito',
      price: '$0',
      description: 'Perfecto para empezar',
      features: [
        { name: '1 lote máximo', included: true },
        { name: '1 usuario', included: true },
        { name: 'Funciones básicas', included: true },
        { name: 'Soporte por email', included: true },
        { name: 'Reportes básicos', included: true },
        { name: 'Analytics avanzados', included: false },
        { name: 'Exportación de datos', included: false },
        { name: 'Múltiples ubicaciones', included: false },
      ],
    },
    {
      plan: SubscriptionPlan.BASIC,
      name: 'Básico',
      price: '$19.99/mes',
      description: 'Para granjas pequeñas',
      popular: true,
      features: [
        { name: '5 lotes máximo', included: true },
        { name: '3 usuarios', included: true },
        { name: 'Funciones completas', included: true },
        { name: 'Soporte prioritario', included: true },
        { name: 'Reportes completos', included: true },
        { name: 'Analytics avanzados', included: true },
        { name: 'Exportación de datos', included: true },
        { name: 'Múltiples ubicaciones', included: false },
      ],
    },
    {
      plan: SubscriptionPlan.PRO,
      name: 'Profesional',
      price: '$49.99/mes',
      description: 'Para granjas medianas',
      features: [
        { name: '50 lotes máximo', included: true },
        { name: '10 usuarios', included: true },
        { name: 'Funciones avanzadas', included: true },
        { name: 'Soporte 24/7', included: true },
        { name: 'Reportes personalizados', included: true },
        { name: 'Analytics completos', included: true, highlight: true },
        { name: 'API de integración', included: true, highlight: true },
        { name: 'Múltiples ubicaciones', included: true, highlight: true },
      ],
    },
    {
      plan: SubscriptionPlan.ENTERPRISE,
      name: 'Empresarial',
      price: '$99.99/mes',
      description: 'Para granjas grandes',
      features: [
        { name: 'Lotes ilimitados', included: true },
        { name: 'Usuarios ilimitados', included: true },
        { name: 'Funciones empresariales', included: true },
        { name: 'Gerente de cuenta dedicado', included: true },
        { name: 'Reportes ejecutivos', included: true },
        { name: 'Todas las integraciones', included: true, highlight: true },
        { name: 'Personalización completa', included: true, highlight: true },
        { name: 'SLA garantizado', included: true, highlight: true },
      ],
    },
  ];

  const handlePurchase = async () => {
    if (selectedPlan === SubscriptionPlan.FREE) {
      Alert.alert('Plan Gratuito', 'Ya tienes acceso al plan gratuito.');
      return;
    }

    try {
      setIsPurchasing(true);
      const success = await purchaseSubscription(selectedPlan);
      
      if (success) {
        Alert.alert(
          '¡Suscripción Exitosa!',
          `Has sido suscrito al plan ${planOptions.find(p => p.plan === selectedPlan)?.name}.`,
          [{ text: 'Genial', onPress: onClose }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar la suscripción.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      const success = await restorePurchases();
      
      if (success) {
        Alert.alert('Compras Restauradas', 'Tus compras han sido restauradas exitosamente.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudieron restaurar las compras.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderPlanCard = (planOption: PlanOption) => {
    const isCurrentPlan = subscriptionInfo?.plan === planOption.plan;
    const isSelected = selectedPlan === planOption.plan;
    
    return (
      <TouchableOpacity
        key={planOption.plan}
        onPress={() => setSelectedPlan(planOption.plan)}
        style={[
          styles.planCard,
          isSelected && styles.selectedPlan,
          isCurrentPlan && styles.currentPlan,
        ]}
      >
        <View style={styles.planHeader}>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{planOption.name}</Text>
            <Text style={styles.planPrice}>{planOption.price}</Text>
            <Text style={styles.planDescription}>{planOption.description}</Text>
          </View>
          
          {planOption.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
          
          {isCurrentPlan && (
            <View style={styles.currentBadge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success[500]} />
              <Text style={styles.currentText}>Actual</Text>
            </View>
          )}
        </View>
        
        <View style={styles.featuresContainer}>
          {planOption.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons
                name={feature.included ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={feature.included ? colors.success[500] : colors.neutral[300]}
              />
              <Text
                style={[
                  styles.featureText,
                  !feature.included && styles.featureDisabled,
                  feature.highlight && styles.featureHighlight,
                ]}
              >
                {feature.name}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Planes de Suscripción</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>

          {subscriptionInfo && (
            <View style={styles.currentSubscription}>
              <Text style={styles.sectionTitle}>Plan Actual</Text>
              <SubscriptionBadge 
                plan={subscriptionInfo.plan}
                status={subscriptionInfo.status}
                showUpgradeButton={false}
              />
            </View>
          )}

          <ScrollView style={styles.plansContainer} showsVerticalScrollIndicator={false}>
            {planOptions.map(renderPlanCard)}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.buttonRow}>
              <Button
                title="Restaurar Compras"
                variant="outline"
                onPress={handleRestore}
                disabled={isPurchasing}
                style={styles.restoreButton}
              />
              
              <Button
                title={
                  selectedPlan === SubscriptionPlan.FREE
                    ? 'Plan Gratuito'
                    : isPurchasing
                    ? 'Comprando...'
                    : `Suscribirse a ${planOptions.find(p => p.plan === selectedPlan)?.name}`
                }
                onPress={handlePurchase}
                disabled={isPurchasing || isLoading}
                style={styles.purchaseButton}
              />
            </View>
            
            <Text style={styles.disclaimer}>
              Los precios pueden variar según tu región. Las suscripciones se renuevan automáticamente.
            </Text>
          </View>

          {isPurchasing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Procesando compra...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.xl,
    width: '90%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
  },
  closeButton: {
    padding: spacing[2],
  },
  currentSubscription: {
    padding: spacing[4],
    backgroundColor: colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.neutral[600],
    marginBottom: spacing[2],
  },
  plansContainer: {
    maxHeight: 400,
    padding: spacing[4],
  },
  planCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  selectedPlan: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  currentPlan: {
    borderColor: colors.success[500],
    backgroundColor: colors.success[50],
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.neutral[700],
    marginBottom: spacing[1],
  },
  planPrice: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  planDescription: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[500],
  },
  popularBadge: {
    backgroundColor: colors.secondary[500],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.base,
  },
  popularText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.neutral[0],
    textTransform: 'uppercase',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.success[500],
    marginLeft: spacing[1],
  },
  featuresContainer: {
    gap: spacing[2],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
    marginLeft: spacing[2],
    flex: 1,
  },
  featureDisabled: {
    color: colors.neutral[400],
    textDecorationLine: 'line-through',
  },
  featureHighlight: {
    fontWeight: typography.weights.semibold,
    color: colors.primary[600],
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  restoreButton: {
    flex: 1,
  },
  purchaseButton: {
    flex: 2,
  },
  disclaimer: {
    fontSize: typography.sizes.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: typography.lineHeights.normal * typography.sizes.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.neutral[600],
    marginTop: spacing[2],
  },
});



