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
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, shadows, spacing, typography } from '../../../src/constants/designSystem';
import { DEFAULT_USER_SETTINGS } from '../../../src/types/settings';
import { showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';
import { useAuthStore } from '../../../src/stores/authStore';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para preferencias
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: DEFAULT_USER_SETTINGS.notifications.enabled,
    channels: { ...DEFAULT_USER_SETTINGS.notifications.channels },
    categories: { ...DEFAULT_USER_SETTINGS.notifications.categories },
    quietHours: { ...DEFAULT_USER_SETTINGS.notifications.quietHours },
  });

  // Cargar preferencias al montar (aquí se conectaría con un servicio real)
  useEffect(() => {
    // TODO: Cargar preferencias del usuario desde Firebase/Store
    // Por ahora usamos valores por defecto
  }, [user]);

  const handleSave = async () => {
    // Validaciones
    if (preferences.quietHours.enabled) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(preferences.quietHours.startTime) || !timeRegex.test(preferences.quietHours.endTime)) {
        showErrorAlert('Error', 'Las horas deben estar en formato HH:mm (ej: 22:00)');
        return;
      }
    }

    setIsSaving(true);
    try {
      // TODO: Guardar en Firebase/Store
      // await updateUserSettings(user.uid, { notifications: preferences });
      
      setIsEditing(false);
      showSuccessAlert('Éxito', 'Preferencias de notificaciones actualizadas correctamente');
    } catch (error: any) {
      console.error('Error guardando preferencias:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar las preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setPreferences({
      enabled: DEFAULT_USER_SETTINGS.notifications.enabled,
      channels: { ...DEFAULT_USER_SETTINGS.notifications.channels },
      categories: { ...DEFAULT_USER_SETTINGS.notifications.categories },
      quietHours: { ...DEFAULT_USER_SETTINGS.notifications.quietHours },
    });
    setIsEditing(false);
  };

  const toggleGeneral = () => {
    setPreferences({ ...preferences, enabled: !preferences.enabled });
  };

  const toggleChannel = (channel: keyof NotificationPreferences['channels']) => {
    setPreferences({
      ...preferences,
      channels: { ...preferences.channels, [channel]: !preferences.channels[channel] },
    });
  };

  const toggleCategory = (category: keyof NotificationPreferences['categories']) => {
    setPreferences({
      ...preferences,
      categories: { ...preferences.categories, [category]: !preferences.categories[category] },
    });
  };

  const toggleQuietHours = () => {
    setPreferences({
      ...preferences,
      quietHours: { ...preferences.quietHours, enabled: !preferences.quietHours.enabled },
    });
  };

  const updateQuietHoursTime = (field: 'startTime' | 'endTime', value: string) => {
    setPreferences({
      ...preferences,
      quietHours: { ...preferences.quietHours, [field]: value },
    });
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
          onValueChange={() => isEditing && toggleCategory(category.id)}
          disabled={!isEditing || !preferences.enabled}
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
          showEditButton={true}
          isEditMode={isEditing}
          onToggleEditMode={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
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
                  onValueChange={() => isEditing && toggleGeneral()}
                  disabled={!isEditing}
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
                  onValueChange={() => isEditing && toggleChannel('push')}
                  disabled={!isEditing || !preferences.enabled}
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
                  onValueChange={() => isEditing && toggleChannel('email')}
                  disabled={!isEditing || !preferences.enabled}
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
                  onValueChange={() => isEditing && toggleChannel('sms')}
                  disabled={!isEditing || !preferences.enabled}
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
                  onValueChange={() => isEditing && toggleQuietHours()}
                  disabled={!isEditing || !preferences.enabled}
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
                    onChangeText={(value) => isEditing && updateQuietHoursTime('startTime', value)}
                    placeholder="22:00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="default"
                    editable={isEditing}
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
                    onChangeText={(value) => isEditing && updateQuietHoursTime('endTime', value)}
                    placeholder="07:00"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="default"
                    editable={isEditing}
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

