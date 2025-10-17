/**
 * Modal para configuración de notificaciones
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors } from '../../constants/colors';
import {
    NotificationCategory,
    NotificationPriority,
    NotificationSettings,
} from '../../types/notification';
import Button from './Button';

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: NotificationSettings | null;
  onSave: (settings: Partial<NotificationSettings>) => Promise<void>;
}

export default function NotificationSettingsModal({
  visible,
  onClose,
  settings,
  onSave,
}: NotificationSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        enabled: settings.enabled,
        pushEnabled: settings.pushEnabled,
        emailEnabled: settings.emailEnabled,
        categories: { ...settings.categories },
        quietHours: { ...settings.quietHours },
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(localSettings);
      onClose();
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateGeneralSetting = (key: keyof NotificationSettings, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateCategorySetting = (
    category: NotificationCategory,
    key: string,
    value: any
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories?.[category],
          [key]: value,
        },
      },
    }));
  };

  const updateQuietHours = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [key]: value,
      },
    }));
  };

  const getCategoryDisplayName = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.PRODUCTION:
        return 'Producción';
      case NotificationCategory.FINANCIAL:
        return 'Finanzas';
      case NotificationCategory.SYSTEM:
        return 'Sistema';
      case NotificationCategory.REMINDER:
        return 'Recordatorios';
      case NotificationCategory.EVENT:
        return 'Eventos';
      case NotificationCategory.CUSTOM:
        return 'Personalizadas';
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.PRODUCTION:
        return 'analytics';
      case NotificationCategory.FINANCIAL:
        return 'cash';
      case NotificationCategory.SYSTEM:
        return 'settings';
      case NotificationCategory.REMINDER:
        return 'time';
      case NotificationCategory.EVENT:
        return 'calendar';
      case NotificationCategory.CUSTOM:
        return 'star';
      default:
        return 'notifications';
    }
  };

  const getPriorityDisplayName = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'Crítica';
      case NotificationPriority.HIGH:
        return 'Alta';
      case NotificationPriority.MEDIUM:
        return 'Media';
      case NotificationPriority.LOW:
        return 'Baja';
      default:
        return priority;
    }
  };

  const getPriorityColor = (priority: NotificationPriority) => {
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.title}>Configuración de Notificaciones</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Configuración General */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificaciones Habilitadas</Text>
                <Text style={styles.settingDescription}>
                  Activar o desactivar todas las notificaciones
                </Text>
              </View>
              <Switch
                value={localSettings.enabled ?? true}
                onValueChange={(value) => updateGeneralSetting('enabled', value)}
                trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                thumbColor={localSettings.enabled ? colors.primary : colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Recibir notificaciones push en el dispositivo
                </Text>
              </View>
              <Switch
                value={localSettings.pushEnabled ?? true}
                onValueChange={(value) => updateGeneralSetting('pushEnabled', value)}
                trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                thumbColor={localSettings.pushEnabled ? colors.primary : colors.white}
                disabled={!localSettings.enabled}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Notificaciones por Email</Text>
                <Text style={styles.settingDescription}>
                  Recibir notificaciones importantes por correo electrónico
                </Text>
              </View>
              <Switch
                value={localSettings.emailEnabled ?? false}
                onValueChange={(value) => updateGeneralSetting('emailEnabled', value)}
                trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                thumbColor={localSettings.emailEnabled ? colors.primary : colors.white}
                disabled={!localSettings.enabled}
              />
            </View>
          </View>

          {/* Configuración por Categoría */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Por Categoría</Text>
            {Object.values(NotificationCategory).map((category) => {
              const categorySettings = localSettings.categories?.[category];
              return (
                <View key={category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryTitleContainer}>
                      <Ionicons 
                        name={getCategoryIcon(category) as any} 
                        size={20} 
                        color={colors.primary} 
                      />
                      <Text style={styles.categoryTitle}>
                        {getCategoryDisplayName(category)}
                      </Text>
                    </View>
                    <Switch
                      value={categorySettings?.enabled ?? true}
                      onValueChange={(value) => 
                        updateCategorySetting(category, 'enabled', value)
                      }
                      trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                      thumbColor={categorySettings?.enabled ? colors.primary : colors.white}
                      disabled={!localSettings.enabled}
                    />
                  </View>

                  {categorySettings?.enabled && (
                    <View style={styles.categorySettings}>
                      <View style={styles.categorySubSetting}>
                        <Text style={styles.categorySubLabel}>Push Notifications</Text>
                        <Switch
                          value={categorySettings?.pushEnabled ?? true}
                          onValueChange={(value) => 
                            updateCategorySetting(category, 'pushEnabled', value)
                          }
                          trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                          thumbColor={categorySettings?.pushEnabled ? colors.primary : colors.white}
                          disabled={!localSettings.pushEnabled}
                        />
                      </View>

                      <View style={styles.categorySubSetting}>
                        <Text style={styles.categorySubLabel}>Email</Text>
                        <Switch
                          value={categorySettings?.emailEnabled ?? false}
                          onValueChange={(value) => 
                            updateCategorySetting(category, 'emailEnabled', value)
                          }
                          trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                          thumbColor={categorySettings?.emailEnabled ? colors.primary : colors.white}
                          disabled={!localSettings.emailEnabled}
                        />
                      </View>

                      <View style={styles.priorityContainer}>
                        <Text style={styles.categorySubLabel}>Prioridad Mínima</Text>
                        <View style={styles.priorityButtons}>
                          {Object.values(NotificationPriority).reverse().map((priority) => (
                            <TouchableOpacity
                              key={priority}
                              style={[
                                styles.priorityButton,
                                categorySettings?.priority === priority && styles.selectedPriority,
                                { borderColor: getPriorityColor(priority) },
                              ]}
                              onPress={() => 
                                updateCategorySetting(category, 'priority', priority)
                              }
                            >
                              <Text
                                style={[
                                  styles.priorityButtonText,
                                  categorySettings?.priority === priority && 
                                  { color: getPriorityColor(priority) },
                                ]}
                              >
                                {getPriorityDisplayName(priority)}
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
          </View>

          {/* Horarios de No Molestar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>No Molestar</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Activar Horarios de Silencio</Text>
                <Text style={styles.settingDescription}>
                  No recibir notificaciones push durante ciertas horas
                </Text>
              </View>
              <Switch
                value={localSettings.quietHours?.enabled ?? false}
                onValueChange={(value) => updateQuietHours('enabled', value)}
                trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
                thumbColor={localSettings.quietHours?.enabled ? colors.primary : colors.white}
                disabled={!localSettings.enabled || !localSettings.pushEnabled}
              />
            </View>

            {localSettings.quietHours?.enabled && (
              <View style={styles.quietHoursSettings}>
                <View style={styles.timeSettingRow}>
                  <Text style={styles.timeLabel}>Desde:</Text>
                  <TouchableOpacity style={styles.timeButton}>
                    <Text style={styles.timeText}>
                      {localSettings.quietHours?.startTime || '22:00'}
                    </Text>
                    <Ionicons name="time" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.timeSettingRow}>
                  <Text style={styles.timeLabel}>Hasta:</Text>
                  <TouchableOpacity style={styles.timeButton}>
                    <Text style={styles.timeText}>
                      {localSettings.quietHours?.endTime || '07:00'}
                    </Text>
                    <Ionicons name="time" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onClose}
            style={styles.footerButton}
          />
          <Button
            title="Guardar"
            onPress={handleSave}
            loading={saving}
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.veryLightGray,
    backgroundColor: colors.white,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  
  // Content
  content: {
    flex: 1,
    padding: 16,
  },
  
  // Section
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 16,
  },
  
  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 18,
  },
  
  // Category
  categoryItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 12,
  },
  categorySettings: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
  },
  categorySubSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  categorySubLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  
  // Priority
  priorityContainer: {
    marginTop: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  priorityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  selectedPriority: {
    backgroundColor: colors.primary + '10',
  },
  priorityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMedium,
  },
  
  // Quiet Hours
  quietHoursSettings: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  timeSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: colors.textMedium,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.veryLightGray,
    backgroundColor: colors.white,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});






























