/**
 * Header moderno del Dashboard con farm switcher y controles avanzados
 * Basado en AppHeader pero optimizado para el dashboard principal
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../components/theme-provider';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuthStore } from '../../stores/authStore';
import { useFarmStore } from '../../stores/farmStore';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { NotificationIconBadge } from '../ui/NotificationBadge';
import { FarmSwitcher } from './FarmSwitcher';

interface DashboardHeaderProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  variant?: 'floating' | 'fixed';
  enableBlur?: boolean;
  showFarmSwitcher?: boolean;
  showThemeToggle?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isEditMode,
  onToggleEditMode,
  variant = 'fixed',
  enableBlur = false,
  showFarmSwitcher = true,
  showThemeToggle = true,
}) => {
  const { isDark, colors, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { currentOrganization } = useOrganizationStore();
  const { user } = useMultiTenantAuthStore();
  const { isAuthenticated } = useAuthStore();
  // Solo usar notificaciones si está autenticado
  const notificationsHook = isAuthenticated ? useNotifications() : { unreadCount: 0 };
  const unreadCount = notificationsHook.unreadCount;
  const { currentFarm, farms } = useFarmStore();
  const [showShedTooltip, setShowShedTooltip] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  // Animación del tooltip
  useEffect(() => {
    if (showShedTooltip) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Ocultar después de 4 segundos
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -10,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowShedTooltip(false);
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showShedTooltip]);

  const organizationName = currentOrganization?.displayName || currentFarm?.name || 'Mi Granja';
  const userName = user?.displayName || 'Usuario';

  const topPadding = Math.max(insets.top, 8);
  const negativeMarginTop = -insets.top; // Margen negativo para extender detrás del StatusBar

  const renderContent = () => (
    <View style={styles.content}>
      {/* Información de Organización y Granja */}
      <View style={styles.organizationInfo}>
        {/* Farm Switcher o botón para crear granja */}
        {showFarmSwitcher && (
          <View style={styles.farmSwitcherContainer}>
            {currentFarm ? (
              <FarmSwitcher compact={true} showPlan={true} />
            ) : (
              <TouchableOpacity
                style={[styles.createFarmButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => router.push('/(tabs)/mi-granja')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={16} color={colors.text.inverse} />
                <Text style={[styles.createFarmButtonText, { color: colors.text.inverse }]}>
                  Crear Granja
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
          Bienvenido, {userName}
        </Text>
        
        <Text style={[styles.dateText, { color: colors.text.secondary }]}>
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <View style={styles.actionsTop}>
          {showThemeToggle && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background.tertiary }]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.background.tertiary },
              isEditMode && { backgroundColor: colors.primary[500] }
            ]}
            onPress={onToggleEditMode}
          >
            <Ionicons
              name={isEditMode ? 'checkmark' : 'create-outline'}
              size={18}
              color={isEditMode ? colors.text.inverse : colors.text.primary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.tertiary }]}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings-outline" size={18} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.background.tertiary }]}
            onPress={() => router.push('/notifications')}
          >
            <NotificationIconBadge 
              count={isAuthenticated ? unreadCount : 0}
              color={colors.primary[500]}
            >
              <Ionicons 
                name={unreadCount > 0 ? "notifications" : "notifications-outline"} 
                size={18} 
                color={colors.text.primary} 
              />
            </NotificationIconBadge>
          </TouchableOpacity>
        </View>
        
        <View style={styles.shedContainer}>
          <TouchableOpacity
            style={[styles.shedButton, { backgroundColor: colors.background.tertiary }]}
            onPress={() => {
              setShowShedTooltip(false);
              router.push('/(tabs)/mi-granja');
            }}
          >
            <Image 
              source={require('../../../assets/shed.png')} 
              style={styles.shedIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {showShedTooltip && (
            <Animated.View
              style={[
                styles.shedTooltip,
                {
                  backgroundColor: colors.primary[500],
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            >
              <Text style={[styles.shedTooltipText, { color: colors.text.inverse }]}>
                Acceder a mi Granja
              </Text>
              <View style={[styles.shedTooltipArrow, { borderRightColor: colors.primary[500] }]} />
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );

  if (variant === 'floating' && enableBlur) {
    return (
      <BlurView
        intensity={Platform.OS === 'ios' ? 100 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.container,
          styles.floatingContainer,
          { 
            marginTop: negativeMarginTop,
            paddingTop: topPadding 
          }
        ]}
      >
        {renderContent()}
        {isEditMode && (
          <View style={[styles.editModeBanner, { backgroundColor: colors.background.tertiary }]}>
            <Ionicons name="information-circle" size={16} color={colors.primary[500]} />
            <Text style={[styles.editModeText, { color: colors.text.primary }]}>
              Modo edición: Arrastra los componentes para reordenarlos
            </Text>
          </View>
        )}
      </BlurView>
    );
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background.primary, 
        marginTop: negativeMarginTop,
        paddingTop: topPadding 
      }
    ]}>
      {renderContent()}
      
      {/* Indicador de modo edición */}
      {isEditMode && (
        <View style={[styles.editModeBanner, { backgroundColor: colors.background.secondary }]}>
          <Ionicons name="information-circle" size={16} color={colors.primary[500]} />
          <Text style={[styles.editModeText, { color: colors.text.primary }]}>
            Modo edición: Arrastra los componentes para reordenarlos
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    minHeight: 100, // Altura mínima para el header
    borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  floatingContainer: {
    width: '100%',
    borderRadius: 0, // Sin bordes redondeados para full width
    borderBottomWidth: 0,
    ...shadows.lg,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  // Organization Info
  organizationInfo: {
    flex: 1,
  },
  farmSwitcherContainer: {
    marginBottom: spacing[2],
  },
  welcomeText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  dateText: {
    fontSize: typography.sizes.base,
  },

  // Actions
  actions: {
    flexDirection: 'column',
    gap: spacing[2],
    alignItems: 'flex-end',
  },
  actionsTop: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  shedButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  shedIcon: {
    width: 50,
    height: 50,
  },
  shedContainer: {
    position: 'relative',
  },
  shedTooltip: {
    position: 'absolute',
    right: 80,
    top: '50%',
    marginTop: -15,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    ...shadows.lg,
  },
  shedTooltipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  shedTooltipArrow: {
    position: 'absolute',
    right: -6,
    top: '50%',
    marginTop: -6,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  createFarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[2],
    ...shadows.sm,
  },
  createFarmButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as '700',
  },

  // Edit Mode Banner
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[3],
    ...shadows.sm,
  },
  editModeText: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing[2],
    flex: 1,
  },
});

