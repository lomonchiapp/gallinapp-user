/**
 * Pantalla principal de configuración con tabs
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { shadows, spacing, typography } from '../../../src/constants/designSystem';
import { useAuthStore } from '../../../src/stores/authStore';
import { useFarmStore } from '../../../src/stores/farmStore';
import { SettingsCategory } from '../../../src/types/settings';

type SettingsTab = 'personal' | 'farm' | 'account';

interface SettingsOption {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  category: SettingsCategory;
  route?: string;
  onPress?: () => void;
  requiresFarm?: boolean;
  isPro?: boolean;
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const { currentFarm } = useFarmStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('personal');

  const handleLogout = () => {
    logout();
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  // Definir opciones de configuración por tab
  const settingsOptions: Record<SettingsTab, SettingsOption[]> = {
    personal: [
      {
        id: 'profile',
        icon: 'person-outline',
        title: 'Perfil',
        description: 'Información personal y foto de perfil',
        category: SettingsCategory.PROFILE,
        route: '/(tabs)/settings/profile',
      },
      {
        id: 'appearance',
        icon: 'color-palette-outline',
        title: 'Apariencia',
        description: 'Tema, tamaño de fuente y modo compacto',
        category: SettingsCategory.APPEARANCE,
        route: '/(tabs)/settings/appearance',
      },
      {
        id: 'notifications',
        icon: 'notifications-outline',
        title: 'Notificaciones',
        description: 'Preferencias de notificaciones personales',
        category: SettingsCategory.NOTIFICATIONS,
        route: '/(tabs)/settings/notifications',
      },
      {
        id: 'regional',
        icon: 'globe-outline',
        title: 'Regional',
        description: 'Idioma, zona horaria y formato de fecha',
        category: SettingsCategory.REGIONAL,
        route: '/(tabs)/settings/regional',
      },
    ],
    
    farm: [
      {
        id: 'farm-info',
        icon: 'business-outline',
        title: 'Información General',
        description: 'Nombre, ubicación y datos de la granja',
        category: SettingsCategory.FARM_GENERAL,
        route: '/(tabs)/settings/farm-info',
        requiresFarm: true,
      },
      {
        id: 'farm-pricing',
        icon: 'cash-outline',
        title: 'Precios',
        description: 'Precios de huevos, pollos y otros productos',
        category: SettingsCategory.FARM_PRICING,
        route: '/(tabs)/settings/farm-pricing',
        requiresFarm: true,
      },
      {
        id: 'farm-production',
        icon: 'analytics-outline',
        title: 'Producción',
        description: 'Parámetros de producción y crecimiento',
        category: SettingsCategory.FARM_PRODUCTION,
        route: '/(tabs)/settings/farm-production',
        requiresFarm: true,
      },
      {
        id: 'farm-invoicing',
        icon: 'receipt-outline',
        title: 'Ventas y Facturación',
        description: 'Configuración profesional de ventas y facturación',
        category: SettingsCategory.FARM_INVOICING,
        route: '/(tabs)/settings/farm-invoicing',
        requiresFarm: true,
        isPro: true,
      },
      {
        id: 'farm-alerts',
        icon: 'alert-circle-outline',
        title: 'Alertas',
        description: 'Notificaciones y umbral de alertas',
        category: SettingsCategory.FARM_ALERTS,
        route: '/(tabs)/settings/farm-alerts',
        requiresFarm: true,
      },
      {
        id: 'collaborators',
        icon: 'people-outline',
        title: 'Colaboradores',
        description: 'Invitar y gestionar colaboradores de la granja',
        category: SettingsCategory.FARM_GENERAL,
        route: '/(tabs)/settings/colaboradores',
        requiresFarm: true,
      },
    ],
    
    account: [
      {
        id: 'subscription',
        icon: 'card-outline',
        title: 'Suscripción',
        description: 'Plan actual y métodos de pago',
        category: SettingsCategory.ACCOUNT,
        route: '/(tabs)/settings/subscription',
      },
      {
        id: 'security',
        icon: 'shield-checkmark-outline',
        title: 'Seguridad',
        description: 'Contraseña y autenticación',
        category: SettingsCategory.SECURITY,
        route: '/(tabs)/settings/security',
      },
    ],
  };

  const renderSettingsOption = (option: SettingsOption) => {
    const isDisabled = option.requiresFarm && !currentFarm;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.menuItem,
          { backgroundColor: colors.background.secondary },
          isDisabled && styles.menuItemDisabled,
        ]}
        onPress={() => !isDisabled && (option.route ? navigateTo(option.route) : option.onPress?.())}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: colors.primary[100] }]}>
          <Ionicons name={option.icon} size={24} color={isDisabled ? colors.text.tertiary : colors.primary[500]} />
        </View>
        <View style={styles.menuContent}>
          <View style={styles.menuTitleRow}>
            <Text style={[styles.menuTitle, { color: isDisabled ? colors.text.tertiary : colors.text.primary }]}>
              {option.title}
            </Text>
            {option.isPro && (
              <View style={[styles.proBadge, { backgroundColor: colors.primary[500] }]}>
                <Text style={[styles.proBadgeText, { color: colors.text.inverse }]}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.menuDescription, { color: colors.text.secondary }]}>
            {option.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    );
  };

  const renderTab = (tab: SettingsTab, label: string, icon: keyof typeof Ionicons.glyphMap) => {
    const isActive = activeTab === tab;
    
    return (
      <TouchableOpacity
        key={tab}
        style={[
          styles.tab,
          { backgroundColor: isActive ? colors.primary[500] : colors.background.secondary },
        ]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? colors.text.inverse : colors.text.secondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? colors.text.inverse : colors.text.secondary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenWrapper transitionType="fade">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <AppHeader
          title1="Configuración"
          variant="floating"
          showBack={true}
          onBackPress={() => router.back()}
          showThemeToggle={true}
          enableBlur={true}
          showFarmSettings={false}
          showFarmButton={true}
        />

        {/* Tabs de Configuración */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.border.light }]}>
          {renderTab('personal', 'Personal', 'person')}
          {renderTab('farm', 'Granja', 'business')}
          {renderTab('account', 'Cuenta', 'card')}
        </View>

        {/* Contenido según el tab activo */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Card de información de cuenta (solo en tab personal/perfil) - Arriba de las opciones */}
          {activeTab === 'personal' && (
            <Card style={StyleSheet.flatten([styles.profileCard, shadows.md, { backgroundColor: colors.background.secondary }]) as ViewStyle}>
              <View style={styles.profileHeader}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.primary[500] }]}>
                  <Text style={[styles.avatarText, { color: colors.text.inverse }]}>
                    {user?.displayName?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.text.primary }]}>
                    {user?.displayName || 'Usuario'}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
                    {user?.email}
                  </Text>
                  {currentFarm && (
                    <View style={[styles.farmBadge, { backgroundColor: colors.primary[100] }]}>
                      <Ionicons name="business" size={12} color={colors.primary[500]} />
                      <Text style={[styles.farmBadgeText, { color: colors.primary[500] }]}>
                        {currentFarm.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}

          {/* Card de información de la granja (solo en tab farm) */}
          {activeTab === 'farm' && currentFarm && (
            <Card style={StyleSheet.flatten([styles.infoCard, shadows.md, { backgroundColor: colors.background.secondary }]) as ViewStyle}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="business" size={24} color={colors.primary[500]} />
                <Text style={[styles.infoCardTitle, { color: colors.text.primary }]}>
                  Información de la Granja
                </Text>
              </View>
              <View style={styles.infoCardContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={20} color={colors.text.secondary} />
                  <View style={styles.infoRowContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Nombre</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      {currentFarm.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
                  <View style={styles.infoRowContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Propietario</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      {currentFarm.ownerId === user?.uid ? user?.displayName || 'Tú' : 'Usuario'}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={20} color={colors.text.secondary} />
                  <View style={styles.infoRowContent}>
                    <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>Moneda</Text>
                    <Text style={[styles.infoValue, { color: colors.text.primary }]}>
                      {currentFarm.settings?.invoiceSettings?.currency || 'DOP'}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          {!currentFarm && activeTab === 'farm' && (
            <View style={styles.noFarmContainer}>
              <Ionicons name="business-outline" size={64} color={colors.text.tertiary} />
              <Text style={[styles.noFarmText, { color: colors.text.secondary }]}>
                No hay granja seleccionada
              </Text>
              <Text style={[styles.noFarmHint, { color: colors.text.tertiary }]}>
                Crea o selecciona una granja para configurarla
              </Text>
            </View>
          )}

          {(currentFarm || activeTab !== 'farm') && settingsOptions[activeTab].map(renderSettingsOption)}

          {/* Cerrar Sesión (solo en tab Personal) */}
          {activeTab === 'personal' && (
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem, { backgroundColor: colors.background.secondary }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.error[50] }]}>
                <Ionicons name="log-out-outline" size={24} color={colors.error[500]} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.error[500] }]}>
                  Cerrar Sesión
                </Text>
                <Text style={[styles.menuDescription, { color: colors.text.secondary }]}>
                  Salir de la aplicación
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  profileCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  infoCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  infoCardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  infoCardContent: {
    gap: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  infoRowContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  infoValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  avatarText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  profileEmail: {
    fontSize: typography.sizes.base,
    marginBottom: spacing[2],
  },
  farmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    gap: spacing[1],
  },
  farmBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold as '600',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: 8,
    gap: spacing[2],
  },
  tabLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  
  // Opciones
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: 12,
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  menuTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  proBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
    letterSpacing: 0.5,
  },
  menuDescription: {
    fontSize: typography.sizes.sm,
  },
  logoutItem: {
    marginTop: spacing[4],
  },
  
  // No Farm
  noFarmContainer: {
    alignItems: 'center',
    padding: spacing[8],
  },
  noFarmText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as '600',
    marginTop: spacing[4],
    textAlign: 'center',
  },
  noFarmHint: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
