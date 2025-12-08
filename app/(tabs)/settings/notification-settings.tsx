/**
 * Pantalla de configuración avanzada de notificaciones
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppHeader from '../../../src/components/layouts/AppHeader';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { colors } from '../../../src/constants/colors';
import { useNotificationsStore } from '../../../src/stores/notificationsStore';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationSettings,
  NotificationType,
} from '../../../src/types/notification';

export default function NotificationSettingsScreen() {
  const {
    settings,
    isLoadingSettings,
    settingsError,
    loadSettings,
    updateSettings,
    createDefaultSettings,
  } = useNotificationsStore();

  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<NotificationCategory | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<NotificationCategory>>(new Set());

  // Cargar configuración al montar
  useEffect(() => {
    loadSettings();
  }, []);

  // Sincronizar configuración local cuando se carga
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    } else if (!isLoadingSettings && !settings) {
      // Crear configuración por defecto si no existe
      createDefaultSettings().then((defaultSettings) => {
        setLocalSettings(defaultSettings);
      });
    }
  }, [settings, isLoadingSettings]);

  // Actualizar configuración general
  const updateGeneralSetting = (key: keyof NotificationSettings, value: any) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [key]: value,
    });
  };

  // Actualizar configuración de categoría
  const updateCategorySetting = (
    category: NotificationCategory,
    key: string,
    value: any
  ) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      categories: {
        ...localSettings.categories,
        [category]: {
          ...localSettings.categories[category],
          [key]: value,
        },
      },
    });
  };

  // Actualizar configuración de tipo específico
  const updateTypeSetting = (
    type: NotificationType,
    key: string,
    value: any
  ) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      types: {
        ...localSettings.types,
        [type]: {
          ...(localSettings.types[type] || {}),
          [key]: value,
        },
      },
    });
  };

  // Actualizar horarios de no molestar
  const updateQuietHours = (key: string, value: any) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      quietHours: {
        ...localSettings.quietHours,
        [key]: value,
      },
    });
  };

  // Guardar configuración
  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      Alert.alert('Éxito', 'Configuración de notificaciones guardada correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener nombre de categoría
  const getCategoryName = (category: NotificationCategory): string => {
    const names: Record<NotificationCategory, string> = {
      [NotificationCategory.PRODUCTION]: 'Producción',
      [NotificationCategory.FINANCIAL]: 'Financieras',
      [NotificationCategory.SYSTEM]: 'Sistema',
      [NotificationCategory.REMINDER]: 'Recordatorios',
      [NotificationCategory.EVENT]: 'Eventos',
      [NotificationCategory.CUSTOM]: 'Personalizadas',
    };
    return names[category];
  };

  // Obtener icono de categoría
  const getCategoryIcon = (category: NotificationCategory): string => {
    const icons: Record<NotificationCategory, string> = {
      [NotificationCategory.PRODUCTION]: 'egg',
      [NotificationCategory.FINANCIAL]: 'cash',
      [NotificationCategory.SYSTEM]: 'settings',
      [NotificationCategory.REMINDER]: 'alarm',
      [NotificationCategory.EVENT]: 'calendar',
      [NotificationCategory.CUSTOM]: 'notifications',
    };
    return icons[category];
  };

  // Obtener color de prioridad
  const getPriorityColor = (priority: NotificationPriority): string => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return colors.danger;
      case NotificationPriority.HIGH:
        return colors.warning;
      case NotificationPriority.MEDIUM:
        return colors.primary;
      case NotificationPriority.LOW:
        return colors.textMedium;
      default:
        return colors.textMedium;
    }
  };

  // Obtener nombre de prioridad
  const getPriorityName = (priority: NotificationPriority): string => {
    const names: Record<NotificationPriority, string> = {
      [NotificationPriority.LOW]: 'Baja',
      [NotificationPriority.MEDIUM]: 'Media',
      [NotificationPriority.HIGH]: 'Alta',
      [NotificationPriority.CRITICAL]: 'Crítica',
    };
    return names[priority];
  };

  if (isLoadingSettings || !localSettings) {
    return (
      <>
        <AppHeader
          title="Configuración de Notificaciones"
          showDrawer={true}
          tintColor={colors.primary}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando configuración...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title="Configuración de Notificaciones"
        showDrawer={true}
        tintColor={colors.primary}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {settingsError && (
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color={colors.danger} />
            <Text style={styles.errorText}>{settingsError}</Text>
          </Card>
        )}

        {/* Configuración General */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Configuración General</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activar Notificaciones</Text>
              <Text style={styles.settingDescription}>
                Habilitar o deshabilitar todas las notificaciones
              </Text>
            </View>
            <Switch
              value={localSettings.enabled}
              onValueChange={(value) => updateGeneralSetting('enabled', value)}
              trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
              thumbColor={localSettings.enabled ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notificaciones Push</Text>
              <Text style={styles.settingDescription}>
                Recibir notificaciones en el dispositivo
              </Text>
            </View>
            <Switch
              value={localSettings.pushEnabled && localSettings.enabled}
              onValueChange={(value) => updateGeneralSetting('pushEnabled', value)}
              trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
              thumbColor={localSettings.pushEnabled ? colors.primary : colors.white}
              disabled={!localSettings.enabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notificaciones por Email</Text>
              <Text style={styles.settingDescription}>
                Recibir notificaciones importantes por correo
              </Text>
            </View>
            <Switch
              value={localSettings.emailEnabled && localSettings.enabled}
              onValueChange={(value) => updateGeneralSetting('emailEnabled', value)}
              trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
              thumbColor={localSettings.emailEnabled ? colors.primary : colors.white}
              disabled={!localSettings.enabled}
            />
          </View>
        </Card>

        {/* Horarios de No Molestar */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Horarios de No Molestar</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activar Horarios</Text>
              <Text style={styles.settingDescription}>
                Silenciar notificaciones durante horas específicas
              </Text>
            </View>
            <Switch
              value={localSettings.quietHours.enabled}
              onValueChange={(value) => updateQuietHours('enabled', value)}
              trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
              thumbColor={localSettings.quietHours.enabled ? colors.primary : colors.white}
            />
          </View>

          {localSettings.quietHours.enabled && (
            <View style={styles.timeContainer}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Hora de Inicio</Text>
                <Input
                  value={localSettings.quietHours.startTime}
                  onChangeText={(value) => updateQuietHours('startTime', value)}
                  placeholder="22:00"
                  keyboardType="default"
                />
              </View>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Hora de Fin</Text>
                <Input
                  value={localSettings.quietHours.endTime}
                  onChangeText={(value) => updateQuietHours('endTime', value)}
                  placeholder="07:00"
                  keyboardType="default"
                />
              </View>
            </View>
          )}
        </Card>

        {/* Configuración por Categoría */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Configuración por Categoría</Text>

          {Object.values(NotificationCategory).map((category) => {
            const categorySettings = localSettings.categories[category];
            const isExpanded = expandedCategory === category;

            return (
              <View key={category} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() =>
                    setExpandedCategory(isExpanded ? null : category)
                  }
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Ionicons
                      name={getCategoryIcon(category) as any}
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.categoryName}>
                      {getCategoryName(category)}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMedium}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.categoryContent}>
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Activar</Text>
                        <Text style={styles.settingDescription}>
                          Recibir notificaciones de esta categoría
                        </Text>
                      </View>
                      <Switch
                        value={categorySettings.enabled}
                        onValueChange={(value) =>
                          updateCategorySetting(category, 'enabled', value)
                        }
                        trackColor={{
                          false: colors.lightGray,
                          true: colors.primary + '40',
                        }}
                        thumbColor={
                          categorySettings.enabled ? colors.primary : colors.white
                        }
                      />
                    </View>

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Push</Text>
                        <Text style={styles.settingDescription}>
                          Enviar notificaciones push
                        </Text>
                      </View>
                      <Switch
                        value={categorySettings.pushEnabled}
                        onValueChange={(value) =>
                          updateCategorySetting(category, 'pushEnabled', value)
                        }
                        trackColor={{
                          false: colors.lightGray,
                          true: colors.primary + '40',
                        }}
                        thumbColor={
                          categorySettings.pushEnabled
                            ? colors.primary
                            : colors.white
                        }
                        disabled={!categorySettings.enabled}
                      />
                    </View>

                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Email</Text>
                        <Text style={styles.settingDescription}>
                          Enviar notificaciones por correo
                        </Text>
                      </View>
                      <Switch
                        value={categorySettings.emailEnabled}
                        onValueChange={(value) =>
                          updateCategorySetting(category, 'emailEnabled', value)
                        }
                        trackColor={{
                          false: colors.lightGray,
                          true: colors.primary + '40',
                        }}
                        thumbColor={
                          categorySettings.emailEnabled
                            ? colors.primary
                            : colors.white
                        }
                        disabled={!categorySettings.enabled}
                      />
                    </View>

                    <View style={styles.priorityContainer}>
                      <Text style={styles.priorityLabel}>Prioridad</Text>
                      <View style={styles.priorityOptions}>
                        {Object.values(NotificationPriority).map((priority) => (
                          <TouchableOpacity
                            key={priority}
                            style={[
                              styles.priorityOption,
                              categorySettings.priority === priority &&
                                styles.priorityOptionSelected,
                              {
                                borderColor:
                                  categorySettings.priority === priority
                                    ? getPriorityColor(priority)
                                    : colors.veryLightGray,
                                backgroundColor:
                                  categorySettings.priority === priority
                                    ? getPriorityColor(priority) + '20'
                                    : colors.white,
                              },
                            ]}
                            onPress={() =>
                              updateCategorySetting(category, 'priority', priority)
                            }
                          >
                            <Text
                              style={[
                                styles.priorityOptionText,
                                categorySettings.priority === priority && {
                                  color: getPriorityColor(priority),
                                  fontWeight: 'bold',
                                },
                              ]}
                            >
                              {getPriorityName(priority)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </Card>

        {/* Botón Guardar */}
        <View style={styles.buttonContainer}>
          <Button
            title="Guardar Configuración"
            onPress={handleSave}
            loading={isSaving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMedium,
  },
  errorCard: {
    backgroundColor: colors.danger + '10',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    marginLeft: 8,
    flex: 1,
  },
  sectionCard: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textMedium,
  },
  timeContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.veryLightGray,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDark,
    marginLeft: 12,
  },
  categoryContent: {
    padding: 16,
    backgroundColor: colors.veryLightGray + '30',
  },
  priorityContainer: {
    marginTop: 16,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textDark,
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  priorityOptionSelected: {
    borderWidth: 2,
  },
  priorityOptionText: {
    fontSize: 14,
    color: colors.textDark,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    height: 50,
  },
});




