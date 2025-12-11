/**
 * Widget para mostrar la granja actual y cambiar entre granjas
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useAccountStore } from '../../stores/accountStore';
import { useFarmStore } from '../../stores/farmStore';
import { getPlanColor, getPlanIcon } from '../../utils/farmUtils';

interface CurrentFarmWidgetProps {
  style?: any;
  showSwitcher?: boolean;
  ponedorasActivas?: number;
  engordeActivos?: number;
  levantesActivos?: number;
}

export const CurrentFarmWidget: React.FC<CurrentFarmWidgetProps> = ({
  style,
  showSwitcher = true,
  ponedorasActivas = 0,
  engordeActivos = 0,
  levantesActivos = 0,
}) => {
  const { account } = useAccountStore();
  const {
    farms,
    currentFarm,
    loadFarms,
    switchFarm,
    isLoading,
  } = useFarmStore();

  const [showFarmSelector, setShowFarmSelector] = useState(false);
  const { colors, isDark } = useTheme();

  const handleFarmSwitch = async (farmId: string) => {
    if (farmId === currentFarm?.id) {
      setShowFarmSelector(false);
      return;
    }

    try {
      await switchFarm(farmId);
      setShowFarmSelector(false);
      Alert.alert(
        'Granja cambiada',
        `Ahora estás gestionando: ${farms.find(f => f.id === farmId)?.name}`
      );
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cambiar de granja');
    }
  };


  const renderFarmSelector = () => (
    <Modal
      visible={showFarmSelector}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFarmSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Seleccionar Granja
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.background.tertiary }]}
              onPress={() => setShowFarmSelector(false)}
            >
              <Ionicons name="close" size={20} color={colors.text.primary} />
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
                  <View style={styles.farmOptionHeader}>
                    <View style={styles.farmInfo}>
                      <Text style={[styles.farmOptionName, { color: colors.text.primary }]}>
                        {farm.name}
                      </Text>
                      {farm.description && (
                        <Text style={[styles.farmOptionDescription, { color: colors.text.secondary }]}>
                          {farm.description}
                        </Text>
                      )}
                      {farm.farmInfo?.location && (
                        <View style={styles.farmLocation}>
                          <Ionicons name="location" size={12} color={colors.text.tertiary} />
                          <Text style={[styles.farmLocationText, { color: colors.text.tertiary }]}>
                            {farm.farmInfo.location}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.farmMeta}>
                      {account?.subscription && (
                        <View style={[styles.farmPlanBadge, { backgroundColor: getPlanColor(account.subscription.plan, colors) }]}>
                          <Ionicons
                            name={getPlanIcon(account.subscription.plan)}
                            size={12}
                            color={colors.text.inverse}
                          />
                          <Text style={[styles.farmPlanText, { color: colors.text.inverse }]}>
                            {account.subscription.plan}
                          </Text>
                        </View>
                      )}

                      {farm.id === currentFarm?.id && (
                        <View style={[styles.currentBadge, { backgroundColor: colors.primary[500] }]}>
                          <Text style={[styles.currentText, { color: colors.text.inverse }]}>
                            Actual
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {farm.id === currentFarm?.id && (
                  <View style={styles.activeIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (!currentFarm) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }, style]}>
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Cargando información de la granja...
        </Text>
      </View>
    );
  }

  // Colores del degradado para dark y light mode
  const gradientColors = isDark 
    ? ['#1e3a5f', '#2d4a7a', '#345DAD', '#4a6bb8'] as const // Azules más oscuros para dark mode
    : ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6'] as const; // Azules claros para light mode

  return (
    <>
      <View style={[styles.container, style]}>
        {/* Degradado de fondo */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Header con título y botón de cambio */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: isDark ? colors.text.primary : '#1e3a5f' }]}>
                Estás Manejando la Granja:
              </Text>
              <Text style={[styles.farmName, { color: isDark ? colors.primary[300] : '#1565C0' }]}>
                {currentFarm.name}
              </Text>
            </View>

            {/* Mostrar botón aunque solo haya una finca para incentivar creación */}
            {showSwitcher && (
              <TouchableOpacity
                style={[
                  styles.switchButtonLarge, 
                  { 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : colors.primary[500],
                  }
                ]}
                onPress={() => {
                  if (farms.length > 1) {
                    setShowFarmSelector(true);
                  } else {
                    Alert.alert(
                      'Crear Nueva Finca',
                      '¿Te gustaría crear otra finca? Las suscripciones avanzadas permiten gestionar múltiples fincas.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { 
                          text: 'Ver Planes', 
                          onPress: () => {
                            // Aquí podrías navegar a la página de planes
                            console.log('Navegar a planes');
                          }
                        }
                      ]
                    );
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={farms.length > 1 ? "swap-horizontal" : "add-circle-outline"} 
                  size={24} 
                  color={isDark ? colors.text.primary : colors.primary[500]} 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Detalles de lotes - Tres columnas */}
          <View style={styles.lotesStats}>
            <View style={styles.loteStatItem}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Ionicons name="egg" size={20} color={isDark ? '#FFD700' : '#F57C00'} />
              </View>
              <View style={styles.loteStatContent}>
                <Text style={[styles.loteStatNumber, { color: isDark ? colors.text.primary : '#1e3a5f' }]}>
                  {ponedorasActivas}
                </Text>
                <Text style={[styles.loteStatLabel, { color: isDark ? colors.text.secondary : '#546E7A' }]}>
                  Lotes Ponedoras
                </Text>
              </View>
            </View>
            
            <View style={[styles.loteStatDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)' }]} />
            
            <View style={styles.loteStatItem}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Ionicons name="leaf" size={20} color={isDark ? '#81C784' : '#388E3C'} />
              </View>
              <View style={styles.loteStatContent}>
                <Text style={[styles.loteStatNumber, { color: isDark ? colors.text.primary : '#1e3a5f' }]}>
                  {levantesActivos}
                </Text>
                <Text style={[styles.loteStatLabel, { color: isDark ? colors.text.secondary : '#546E7A' }]}>
                  Lotes Levante
                </Text>
              </View>
            </View>

            <View style={[styles.loteStatDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)' }]} />
            
            <View style={styles.loteStatItem}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Ionicons name="fitness" size={20} color={isDark ? '#FF8A65' : '#D84315'} />
              </View>
              <View style={styles.loteStatContent}>
                <Text style={[styles.loteStatNumber, { color: isDark ? colors.text.primary : '#1e3a5f' }]}>
                  {engordeActivos}
                </Text>
                <Text style={[styles.loteStatLabel, { color: isDark ? colors.text.secondary : '#546E7A' }]}>
                  Lotes Engorde
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Farm Selector Modal */}
      {renderFarmSelector()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  gradient: {
    padding: spacing[4],
  },
  loadingText: {
    textAlign: 'center',
    fontSize: typography.sizes.base,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
    marginBottom: spacing[1],
  },
  switchButtonLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },

  // Farm Name
  farmName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
  },

  // Lotes Stats
  lotesStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  loteStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loteStatContent: {
    flex: 1,
  },
  loteStatNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  loteStatLabel: {
    fontSize: typography.sizes.xs,
  },
  loteStatDivider: {
    width: 1,
    height: 40,
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
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    maxHeight: '80%',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Farm List
  farmsList: {
    maxHeight: 300,
  },
  farmOption: {
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    position: 'relative',
  },
  farmOptionContent: {
    flex: 1,
  },
  farmOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  farmInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  farmOptionName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  farmOptionDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
    lineHeight: typography.sizes.sm * 1.3,
  },
  farmMeta: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  farmPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1] / 2,
    borderRadius: borderRadius.sm,
    gap: spacing[1] / 2,
  },
  farmPlanText: {
    fontSize: 10,
    fontWeight: typography.weights.bold as '700',
  },
  currentBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: borderRadius.sm,
  },
  currentText: {
    fontSize: 10,
    fontWeight: typography.weights.bold as '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  farmLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  farmLocationText: {
    fontSize: typography.sizes.xs,
  },
});
