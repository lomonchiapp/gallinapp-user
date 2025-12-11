/**
 * Header moderno del Dashboard con farm switcher y controles avanzados
 * Basado en DashboardHeader para mantener consistencia
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { FarmSwitcher } from '../../components/dashboard/FarmSwitcher';
import { borderRadius, shadows, spacing, typography } from '../../constants/designSystem';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuthStore } from '../../stores/authStore';
import { useFarmStore } from '../../stores/farmStore';
import { useMultiTenantAuthStore } from '../../stores/multiTenantAuthStore';
import { useOrganizationStore } from '../../stores/organizationStore';
import { NotificationIconBadge } from '../ui/NotificationBadge';

interface AppHeaderProps {
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
  variant?: 'floating' | 'fixed';
  enableBlur?: boolean;
  showFarmSwitcher?: boolean;
  showDate?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  showThemeToggle?: boolean;
  showUserIcon?: boolean; // Mostrar icono de usuario
  showNotificationsIcon?: boolean; // Mostrar icono de notificaciones
  title?: string; // Deprecated: usar title1 y title2
  title1?: string;
  title2?: string;
  showFarmButton?: boolean; // Botón grande con shed.png
  showFarmSettings?: boolean; // Botón grande con settings.png
  // Botón de editar/guardar genérico para formularios
  showEditButton?: boolean; // Mostrar botón de editar/guardar
  onSave?: () => void; // Callback cuando se presiona guardar
  onCancel?: () => void; // Callback cuando se cancela (opcional)
  isSaving?: boolean; // Estado de guardado para mostrar loading
}

export default function AppHeader({
  isEditMode = false,
  onToggleEditMode,
  variant = 'fixed',
  enableBlur = false,
  showFarmSwitcher = true,
  showDate = false,
  showBack = false,
  onBackPress,
  showThemeToggle = true,
  showUserIcon = true,
  showNotificationsIcon = true,
  title,
  title1,
  title2,
  showFarmButton = false,
  showFarmSettings = false,
  showEditButton = false,
  onSave,
  onCancel,
  isSaving = false,
}: AppHeaderProps) {
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
        
        {/* Título y botón back en la misma fila */}
        <View style={styles.titleRow}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onBackPress) {
                  onBackPress();
                } else {
                  router.back();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            {(title1 || title) && (
              <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
                {title1 || title}
              </Text>
            )}
            {title2 && (
              <Text style={[styles.title2, { color: colors.primary[500] }]}>
                {title2}
              </Text>
            )}
            {showDate && (
              <Text style={[styles.dateText, { color: colors.text.secondary }]}>
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            )}
          </View>
        </View>
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
          
          {/* Botón de editar para dashboard (reordenar componentes) */}
          {!showEditButton && onToggleEditMode && (
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
          )}

          {showNotificationsIcon && (
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
          )}

          {showUserIcon && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background.tertiary }]}
              onPress={() => router.push('/(tabs)/settings/profile')}
            >
              <Ionicons name="person-circle-outline" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Botones grandes con imágenes */}
        <View style={styles.largeButtonsContainer}>
          {showFarmButton && (
            <View style={styles.largeButtonContainer}>
              <TouchableOpacity
                style={[styles.largeButton, { backgroundColor: colors.background.tertiary }]}
                onPress={() => {
                  setShowShedTooltip(false);
                  router.push('/(tabs)/mi-granja');
                }}
              >
                <Image 
                  source={require('../../../assets/shed.png')} 
                  style={styles.largeButtonIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              
              {showShedTooltip && (
                <Animated.View
                  style={[
                    styles.largeButtonTooltip,
                    {
                      backgroundColor: colors.primary[500],
                      opacity: fadeAnim,
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text 
                    style={[styles.largeButtonTooltipText, { color: colors.text.inverse }]}
                  >
                    Acceder a mi Granja
                  </Text>
                  <View style={[styles.largeButtonTooltipArrow, { borderRightColor: colors.primary[500] }]} />
                </Animated.View>
              )}
            </View>
          )}

          {showFarmSettings && (
            <TouchableOpacity
              style={[styles.largeButton, { backgroundColor: colors.background.tertiary }]}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Image 
                source={require('../../../assets/settings.png')} 
                style={styles.largeButtonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* Botón de editar/guardar genérico para formularios */}
          {showEditButton && (
            <>
              {isEditMode ? (
                <>
                  {onCancel && (
                    <TouchableOpacity
                      style={[
                        styles.editFormButtonIcon,
                        {
                          borderColor: colors.border.light,
                          backgroundColor: 'transparent',
                        }
                      ]}
                      onPress={onCancel}
                      disabled={isSaving}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.editFormButtonIcon,
                      {
                        borderColor: colors.primary[500],
                        backgroundColor: colors.primary[500],
                      },
                      isSaving && { opacity: 0.6 }
                    ]}
                    onPress={onSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.text.inverse}
                      />
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.editFormButton,
                    {
                      borderColor: colors.primary[500],
                      backgroundColor: 'transparent',
                    }
                  ]}
                  onPress={onToggleEditMode}
                >
                  <Ionicons
                    name="create-outline"
                    size={16}
                    color={colors.primary[500]}
                  />
                  <Text style={[styles.editFormButtonText, { color: colors.primary[500] }]}>
                    Editar
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );

  if (variant === 'floating' && enableBlur) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
        </BlurView>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[
        styles.container, 
        { 
          backgroundColor: colors.background.primary, 
          marginTop: negativeMarginTop,
          paddingTop: topPadding 
        }
      ]}>
        {renderContent()}
      </View>
    </>
  );
}

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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  titleContainer: {
    flex: 1,
    paddingTop: spacing[2],
  },
  welcomeText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  title2: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semibold as '600',
  },
  dateText: {
    fontSize: typography.sizes.base,
  },

  // Actions
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1],
  },
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
  editFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    borderWidth: 2,
    gap: spacing[1],
    ...shadows.sm,
  },
  editFormButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  editFormButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...shadows.sm,
  },
  // Botones grandes con imágenes
  largeButtonsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    alignItems: 'flex-end',
  },
  largeButtonContainer: {
    position: 'relative',
  },
  largeButton: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  largeButtonIcon: {
    width: 50,
    height: 50,
  },
  largeButtonTooltip: {
    position: 'absolute',
    right: 80,
    top: '50%',
    marginTop: -15,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    ...shadows.lg,
    zIndex: 1000,
    minWidth: 160,
  },
  largeButtonTooltipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
    flexShrink: 0,
    includeFontPadding: false,
    textAlign: 'left',
  },
  largeButtonTooltipArrow: {
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
});
