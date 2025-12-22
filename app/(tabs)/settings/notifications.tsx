/**
 * Pantalla de Configuración de Notificaciones Personales
 * Permite al usuario configurar sus preferencias de notificaciones
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, shadows, spacing, typography } from '../../../src/constants/designSystem';
import { getUserSettings, updateUserSettings } from '../../../src/services/settings/user-settings.service';
import { useAuthStore } from '../../../src/stores/authStore';
import { DEFAULT_USER_SETTINGS } from '../../../src/types/settings';
import { showErrorAlert } from '../../../src/utils/alert.service';

interface NotificationPreferences {
  enabled: boolean;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  categories: {
    production: boolean;
    financial: boolean;
    alerts: boolean;
    farm: boolean;
    collaboration: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para preferencias
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: DEFAULT_USER_SETTINGS.notifications.enabled,
    channels: { ...DEFAULT_USER_SETTINGS.notifications.channels },
    categories: { ...DEFAULT_USER_SETTINGS.notifications.categories },
    quietHours: { ...DEFAULT_USER_SETTINGS.notifications.quietHours },
  });

  // Cargar preferencias al montar
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const userSettings = await getUserSettings(user.uid);
        if (userSettings.notifications) {
          setPreferences({
            enabled: userSettings.notifications.enabled,
            channels: { ...userSettings.notifications.channels },
            categories: { ...userSettings.notifications.categories },
            quietHours: { ...userSettings.notifications.quietHours },
          });
        }
      } catch (error: any) {
        console.error('Error cargando preferencias:', error);
        showErrorAlert('Error', 'No se pudieron cargar las preferencias');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Función helper para guardar en Firestore
  const saveToFirestore = async (updates: Partial<NotificationPreferences>) => {
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      await updateUserSettings(user.uid, {
        notifications: {
          ...preferences,
          ...updates,
        },
      });
    } catch (error: any) {
      console.error('Error guardando preferencias:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar las preferencias');
      throw error; // Re-lanzar para que el componente pueda revertir el cambio
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGeneral = async () => {
    const newValue = !preferences.enabled;
    setPreferences({ ...preferences, enabled: newValue });
    
    try {
      await saveToFirestore({ enabled: newValue });
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferences({ ...preferences, enabled: !newValue });
    }
  };

  const toggleChannel = async (channel: keyof NotificationPreferences['channels']) => {
    const newValue = !preferences.channels[channel];
    const updatedChannels = { ...preferences.channels, [channel]: newValue };
    setPreferences({
      ...preferences,
      channels: updatedChannels,
    });
    
    try {
      await saveToFirestore({ channels: updatedChannels });
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferences({
        ...preferences,
        channels: { ...preferences.channels, [channel]: !newValue },
      });
    }
  };

  const toggleCategory = async (category: keyof NotificationPreferences['categories']) => {
    const newValue = !preferences.categories[category];
    const updatedCategories = { ...preferences.categories, [category]: newValue };
    setPreferences({
      ...preferences,
      categories: updatedCategories,
    });
    
    try {
      await saveToFirestore({ categories: updatedCategories });
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferences({
        ...preferences,
        categories: { ...preferences.categories, [category]: !newValue },
      });
    }
  };

  const toggleQuietHours = async () => {
    const newValue = !preferences.quietHours.enabled;
    setPreferences({
      ...preferences,
      quietHours: { ...preferences.quietHours, enabled: newValue },
    });
    
    try {
      await saveToFirestore({ quietHours: { ...preferences.quietHours, enabled: newValue } });
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferences({
        ...preferences,
        quietHours: { ...preferences.quietHours, enabled: !newValue },
      });
    }
  };

  const updateQuietHoursTime = async (field: 'startTime' | 'endTime', value: string) => {
    // Validar formato de hora
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(value)) {
      showErrorAlert('Error', 'Las horas deben estar en formato HH:mm (ej: 22:00)');
      return;
    }

    const updatedQuietHours = { ...preferences.quietHours, [field]: value };
    setPreferences({
      ...preferences,
      quietHours: updatedQuietHours,
    });
    
    try {
      await saveToFirestore({ quietHours: updatedQuietHours });
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferences({
        ...preferences,
        quietHours: { ...preferences.quietHours, [field]: preferences.quietHours[field] },
      });
    }
  };

  const categories = [
    {
      id: 'production' as const,
      name: 'Producción',
      description: 'Producción de huevos, peso de lotes, etc.',
      icon: 'egg',
      color: colors.primary[500],
    },
    {
      id: 'financial' as const,
      name: 'Financieras',
      description: 'Ventas, gastos, pagos pendientes',
      icon: 'cash',
      color: colors.success[500],
    },
    {
      id: 'alerts' as const,
      name: 'Alertas Críticas',
      description: 'Mortalidad alta, producción baja, etc.',
      icon: 'warning',
      color: colors.error[500],
    },
    {
      id: 'farm' as const,
      name: 'Granja',
      description: 'Actualizaciones de la granja',
      icon: 'business',
      color: colors.warning[500],
    },
    {
      id: 'collaboration' as const,
      name: 'Colaboración',
      description: 'Invitaciones, permisos, accesos',
      icon: 'people',
      color: colors.primary[400],
    },
    {
      id: 'system' as const,
      name: 'Sistema',
      description: 'Actualizaciones, mantenimiento',
      icon: 'settings',
      color: colors.text.secondary,
    },
  ];

  const renderCategory = (category: typeof categories[0]) => (
    <View
      key={category.id}
      style={[
        styles.categoryItem,
        {
          backgroundColor: colors.background.secondary,
          borderColor: preferences.categories[category.id] ? category.color : colors.border.light,
        },
      ]}
    >
      <View style={styles.categoryContent}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon as any} size={24} color={category.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: colors.text.primary }]}>
            {category.name}
          </Text>
          <Text style={[styles.categoryDescription, { color: colors.text.secondary }]}>
            {category.description}
          </Text>
        </View>
        <Switch
          value={preferences.categories[category.id] && preferences.enabled}
          onValueChange={() => preferences.enabled && toggleCategory(category.id)}
          disabled={!preferences.enabled || isSaving}
          trackColor={{ false: colors.border.light, true: category.color }}
          thumbColor={colors.background.primary}
        />
      </View>
    </View>
  );

  if (!user) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <AppHeader
            variant="fixed"
            enableBlur={false}
            showFarmSwitcher={false}
            showThemeToggle={false}
            showBack={true}
            onBackPress={() => router.back()}
            title1="Notificaciones"
            subtitle="Configuraciones del sistema"
            showEditButton={false}
          />
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No hay usuario autenticado
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (isLoading) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <AppHeader
            variant="fixed"
            enableBlur={false}
            showFarmSwitcher={false}
            showThemeToggle={false}
            showBack={true}
            onBackPress={() => router.back()}
            title1="Notificaciones"
            subtitle="Configuraciones del sistema"
            showEditButton={false}
          />
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color={colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              Cargando preferencias...
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper transitionType="fade">
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppHeader
          variant="fixed"
          enableBlur={false}
          showFarmSwitcher={false}
          showThemeToggle={false}
          showBack={true}
          onBackPress={() => router.back()}
          title1="Notificaciones"
          title2="Preferencias Personales"
          subtitle="Configuraciones del sistema"
          showEditButton={false}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Información */}
          <Card style={[styles.card, { backgroundColor: colors.primary[50] }]}>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.primary[600] }]}>
                  Configuración Personal
                </Text>
                <Text style={[styles.infoText, { color: colors.primary[500] }]}>
                  Estas preferencias se aplican a todas las granjas que accedes. 
                  Los administradores de cada granja configuran qué alertas están activas.
                </Text>
              </View>
            </View>
          </Card>

          {/* Configuración General */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Configuración General
              </Text>
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <View style={[styles.switchIcon, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="notifications" size={20} color={colors.primary[500]} />
                  </View>
                  <View style={styles.switchInfo}>
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Activar Notificaciones
                    </Text>
                    <Text style={[styles.switchDescription, { color: colors.text.secondary }]}>
                      Habilitar o deshabilitar todas las notificaciones
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.enabled}
                  onValueChange={toggleGeneral}
                  disabled={isSaving}
                  trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>
            </View>
          </Card>

          {/* Canales de Notificación */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="send" size={24} color={colors.success[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Canales de Notificación
              </Text>
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <View style={[styles.switchIcon, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="phone-portrait" size={20} color={colors.primary[500]} />
                  </View>
                  <View style={styles.switchInfo}>
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Notificaciones Push
                    </Text>
                    <Text style={[styles.switchDescription, { color: colors.text.secondary }]}>
                      Recibir notificaciones en tu dispositivo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.channels.push && preferences.enabled}
                  onValueChange={() => preferences.enabled && toggleChannel('push')}
                  disabled={!preferences.enabled || isSaving}
                  trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>

              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <View style={[styles.switchIcon, { backgroundColor: colors.success[100] }]}>
                    <Ionicons name="mail" size={20} color={colors.success[500]} />
                  </View>
                  <View style={styles.switchInfo}>
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Notificaciones por Email
                    </Text>
                    <Text style={[styles.switchDescription, { color: colors.text.secondary }]}>
                      Recibir notificaciones importantes por correo
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.channels.email && preferences.enabled}
                  onValueChange={() => preferences.enabled && toggleChannel('email')}
                  disabled={!preferences.enabled || isSaving}
                  trackColor={{ false: colors.border.light, true: colors.success[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>

              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <View style={[styles.switchIcon, { backgroundColor: colors.warning[100] }]}>
                    <Ionicons name="chatbubble" size={20} color={colors.warning[500]} />
                  </View>
                  <View style={styles.switchInfo}>
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Notificaciones por SMS
                    </Text>
                    <Text style={[styles.switchDescription, { color: colors.text.secondary }]}>
                      Recibir notificaciones críticas por mensaje de texto
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.channels.sms && preferences.enabled}
                  onValueChange={() => preferences.enabled && toggleChannel('sms')}
                  disabled={!preferences.enabled || isSaving}
                  trackColor={{ false: colors.border.light, true: colors.warning[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>
            </View>
          </Card>

          {/* Categorías de Notificaciones */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list" size={24} color={colors.warning[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Categorías de Notificaciones
              </Text>
            </View>

            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Elige qué tipos de notificaciones quieres recibir
            </Text>

            <View style={styles.categoriesList}>
              {categories.map(renderCategory)}
            </View>
          </Card>

          {/* Horarios de No Molestar */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="moon" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Horarios de No Molestar
              </Text>
            </View>

            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <View style={[styles.switchIcon, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="moon" size={20} color={colors.primary[500]} />
                  </View>
                  <View style={styles.switchInfo}>
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Activar Horarios
                    </Text>
                    <Text style={[styles.switchDescription, { color: colors.text.secondary }]}>
                      Silenciar notificaciones durante horas específicas
                    </Text>
                  </View>
                </View>
                <Switch
                  value={preferences.quietHours.enabled && preferences.enabled}
                  onValueChange={() => preferences.enabled && toggleQuietHours()}
                  disabled={!preferences.enabled || isSaving}
                  trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>
            </View>

            {preferences.quietHours.enabled && (
              <View style={styles.timePickerContainer}>
                <View style={styles.timePickerItem}>
                  <Text style={[styles.timePickerLabel, { color: colors.text.primary }]}>
                    Hora de Inicio
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    value={preferences.quietHours.startTime}
                    onChangeText={(value) => updateQuietHoursTime('startTime', value)}
                    placeholder="22:00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="default"
                    editable={!isSaving}
                  />
                </View>

                <View style={styles.timePickerItem}>
                  <Text style={[styles.timePickerLabel, { color: colors.text.primary }]}>
                    Hora de Fin
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        borderColor: colors.border.light,
                      },
                    ]}
                    value={preferences.quietHours.endTime}
                    onChangeText={(value) => updateQuietHoursTime('endTime', value)}
                    placeholder="07:00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="default"
                    editable={!isSaving}
                  />
                </View>
              </View>
            )}
          </Card>

          {/* Resumen */}
          <Card style={[styles.card, { backgroundColor: colors.success[50] }]}>
            <View style={styles.summaryContainer}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success[500]} />
              <View style={styles.summaryContent}>
                <Text style={[styles.summaryTitle, { color: colors.success[600] }]}>
                  {Object.values(preferences.categories).filter(Boolean).length} categorías activas
                </Text>
                <Text style={[styles.summaryText, { color: colors.success[500] }]}>
                  Recibirás notificaciones según tus preferencias configuradas
                </Text>
              </View>
            </View>
          </Card>
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
  card: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    marginTop: spacing[4],
  },
  // Info
  infoContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[2],
  },
  infoText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  // Switches
  switchContainer: {
    gap: spacing[2],
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  switchItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  switchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1] / 2,
  },
  switchDescription: {
    fontSize: typography.sizes.sm,
  },
  // Categories
  categoriesList: {
    gap: spacing[3],
  },
  categoryItem: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing[3],
    ...shadows.sm,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  categoryDescription: {
    fontSize: typography.sizes.sm,
  },
  // Time Picker
  timePickerContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
  timePickerItem: {
    flex: 1,
  },
  timePickerLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[2],
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  // Summary
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  summaryText: {
    fontSize: typography.sizes.sm,
  },
});

