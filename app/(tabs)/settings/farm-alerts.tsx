/**
 * Pantalla de Configuración de Alertas de la Granja
 * Sistema completo de alertas con umbrales configurables y selección de destinatarios
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { useFarmStore } from '../../../src/stores/farmStore';
import { showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';

// Tipos de alertas
type AlertType = 
  | 'high_mortality'
  | 'low_production'
  | 'low_inventory'
  | 'expiring_products'
  | 'task_reminders'
  | 'financial_alerts';

interface AlertConfig {
  id: AlertType;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  threshold?: number; // Umbral numérico (ej: 5% mortalidad)
  thresholdUnit?: string; // Unidad del umbral (%, días, etc.)
  notifyOwner: boolean;
  notifyCollaborators: string[]; // IDs de colaboradores
  sendPush: boolean;
  sendInApp: boolean;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FarmNotificationPreferences {
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

export default function FarmAlertsScreen() {
  const { colors, isDark } = useTheme();
  const { currentFarm, updateFarm, collaborators } = useFarmStore();
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para configuración general de notificaciones
  const [preferences, setPreferences] = useState<FarmNotificationPreferences>({
    enabled: true,
    channels: {
      push: true,
      email: true,
      sms: false,
    },
    categories: {
      production: true,
      financial: true,
      alerts: true,
      farm: true,
      collaboration: true,
      system: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    },
  });
  
  // Estados para alertas
  const [alerts, setAlerts] = useState<AlertConfig[]>([
    {
      id: 'high_mortality',
      name: 'Mortalidad Alta',
      description: 'Alertar cuando la mortalidad de un lote supere el umbral',
      icon: 'skull-outline',
      enabled: true,
      threshold: 5,
      thresholdUnit: '%',
      notifyOwner: true,
      notifyCollaborators: [],
      sendPush: true,
      sendInApp: true,
    },
    {
      id: 'low_production',
      name: 'Producción Baja',
      description: 'Alertar cuando la producción de huevos caiga significativamente',
      icon: 'trending-down',
      enabled: true,
      threshold: 15,
      thresholdUnit: '%',
      notifyOwner: true,
      notifyCollaborators: [],
      sendPush: true,
      sendInApp: true,
    },
    {
      id: 'low_inventory',
      name: 'Inventario Bajo',
      description: 'Alertar cuando el inventario de alimento esté por agotarse',
      icon: 'warning-outline',
      enabled: true,
      threshold: 7,
      thresholdUnit: 'días',
      notifyOwner: true,
      notifyCollaborators: [],
      sendPush: false,
      sendInApp: true,
    },
    {
      id: 'expiring_products',
      name: 'Productos por Vencer',
      description: 'Alertar cuando haya productos próximos a vencer',
      icon: 'time-outline',
      enabled: true,
      threshold: 3,
      thresholdUnit: 'días',
      notifyOwner: true,
      notifyCollaborators: [],
      sendPush: false,
      sendInApp: true,
    },
    {
      id: 'task_reminders',
      name: 'Recordatorios de Tareas',
      description: 'Recordatorios de tareas pendientes y próximas',
      icon: 'checkbox-outline',
      enabled: true,
      notifyOwner: true,
      notifyCollaborators: [],
      sendPush: true,
      sendInApp: true,
    },
    {
      id: 'financial_alerts',
      name: 'Alertas Financieras',
      description: 'Alertas de pagos pendientes y gastos inusuales',
      icon: 'cash-outline',
      enabled: false,
      threshold: 1000,
      thresholdUnit: 'DOP',
      notifyOwner: true,
      notifyCollaborators: [],
      sendPush: false,
      sendInApp: true,
    },
  ]);

  const [selectedAlert, setSelectedAlert] = useState<AlertConfig | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  // Mapear colaboradores del store al formato esperado
  const farmCollaborators: Collaborator[] = (collaborators || []).map(collab => ({
    id: collab.id,
    name: collab.displayName || collab.email || 'Sin nombre',
    email: collab.email,
    role: collab.role || 'Colaborador',
  }));

  // Cargar configuración de alertas y preferencias al montar
  useEffect(() => {
    if (currentFarm?.settings) {
      const settings = currentFarm.settings;
      const notifications = settings.notifications || {};
      
      // Cargar preferencias de notificaciones
      setPreferences({
        enabled: notifications.alertsEnabled ?? true,
        channels: {
          push: notifications.pushNotifications ?? true,
          email: notifications.emailNotifications ?? true,
          sms: notifications.smsNotifications ?? false,
        },
        categories: {
          production: true,
          financial: true,
          alerts: true,
          farm: true,
          collaboration: true,
          system: true,
        },
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '07:00',
        },
      });
      
      // Cargar configuración guardada de alertas si existe
      const savedAlerts = (settings as any).alerts;
      if (savedAlerts && Array.isArray(savedAlerts) && savedAlerts.length > 0) {
        setAlerts(savedAlerts);
      }
    }
  }, [currentFarm]);

  // Función helper para guardar preferencias de notificaciones en Firestore
  const savePreferencesToFirestore = async (updates: Partial<FarmNotificationPreferences>) => {
    if (!currentFarm) return;

    setIsSaving(true);
    try {
      const existingSettings = currentFarm.settings || {};
      const updatedPreferences = {
        ...preferences,
        ...updates,
      };

      const updatesData: any = {
        settings: {
          ...existingSettings,
          notifications: {
            ...existingSettings.notifications,
            alertsEnabled: updatedPreferences.enabled,
            pushNotifications: updatedPreferences.channels.push,
            emailNotifications: updatedPreferences.channels.email,
            smsNotifications: updatedPreferences.channels.sms,
          },
        },
      };

      await updateFarm(currentFarm.id, updatesData);
    } catch (error: any) {
      console.error('Error guardando preferencias:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar las preferencias');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Función helper para guardar alertas en Firestore
  const saveToFirestore = async (updatedAlerts: AlertConfig[]) => {
    if (!currentFarm) return;

    // Validaciones
    for (const alert of updatedAlerts) {
      if (alert.enabled && alert.threshold !== undefined) {
        if (alert.threshold <= 0) {
          showErrorAlert('Error', `El umbral de ${alert.name} debe ser mayor a 0`);
          throw new Error(`Umbral inválido para ${alert.name}`);
        }
      }
    }

    setIsSaving(true);
    try {
      const existingSettings = currentFarm.settings || {};

      const updates: any = {
        settings: {
          ...existingSettings,
          alerts: updatedAlerts,
          alertsEnabled: updatedAlerts.some(a => a.enabled),
        },
      };

      await updateFarm(currentFarm.id, updates);
    } catch (error: any) {
      console.error('Error guardando configuración de alertas:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar la configuración');
      throw error; // Re-lanzar para que el componente pueda revertir el cambio
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAlert = async (alertId: AlertType) => {
    const updatedAlerts = alerts.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    );
    
    // Actualizar estado local inmediatamente
    setAlerts(updatedAlerts);
    
    // Guardar en Firestore
    try {
      await saveToFirestore(updatedAlerts);
    } catch (error) {
      // Revertir cambio en caso de error
      setAlerts(alerts);
    }
  };

  const updateAlertThreshold = async (alertId: AlertType, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      showErrorAlert('Error', 'El umbral debe ser un número mayor a 0');
      return;
    }
    
    const updatedAlerts = alerts.map(a => 
      a.id === alertId ? { ...a, threshold: numValue } : a
    );
    
    // Actualizar estado local inmediatamente
    setAlerts(updatedAlerts);
    
    // Guardar en Firestore
    try {
      await saveToFirestore(updatedAlerts);
    } catch (error) {
      // Revertir cambio en caso de error
      setAlerts(alerts);
    }
  };

  const openAlertConfig = (alert: AlertConfig) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  const saveAlertConfig = async () => {
    if (!selectedAlert) return;
    
    const updatedAlerts = alerts.map(a => 
      a.id === selectedAlert.id ? selectedAlert : a
    );
    
    // Actualizar estado local inmediatamente
    setAlerts(updatedAlerts);
    
    // Guardar en Firestore
    try {
      await saveToFirestore(updatedAlerts);
      setShowAlertModal(false);
      setSelectedAlert(null);
    } catch (error) {
      // Revertir cambio en caso de error
      setAlerts(alerts);
    }
  };

  const toggleCollaboratorNotification = (collaboratorId: string) => {
    if (!selectedAlert) return;
    
    const isSelected = selectedAlert.notifyCollaborators.includes(collaboratorId);
    const newCollaborators = isSelected
      ? selectedAlert.notifyCollaborators.filter(id => id !== collaboratorId)
      : [...selectedAlert.notifyCollaborators, collaboratorId];
    
    setSelectedAlert({
      ...selectedAlert,
      notifyCollaborators: newCollaborators,
    });
  };

  // Funciones para manejar preferencias de notificaciones
  const toggleGeneral = async () => {
    const newValue = !preferences.enabled;
    setPreferences({ ...preferences, enabled: newValue });
    
    try {
      await savePreferencesToFirestore({ enabled: newValue });
    } catch (error) {
      setPreferences({ ...preferences, enabled: !newValue });
    }
  };

  const toggleChannel = async (channel: keyof FarmNotificationPreferences['channels']) => {
    const newValue = !preferences.channels[channel];
    const updatedChannels = { ...preferences.channels, [channel]: newValue };
    setPreferences({
      ...preferences,
      channels: updatedChannels,
    });
    
    try {
      await savePreferencesToFirestore({ channels: updatedChannels });
    } catch (error) {
      setPreferences({
        ...preferences,
        channels: { ...preferences.channels, [channel]: !newValue },
      });
    }
  };

  const toggleCategory = async (category: keyof FarmNotificationPreferences['categories']) => {
    const newValue = !preferences.categories[category];
    const updatedCategories = { ...preferences.categories, [category]: newValue };
    setPreferences({
      ...preferences,
      categories: updatedCategories,
    });
    
    try {
      await savePreferencesToFirestore({ categories: updatedCategories });
    } catch (error) {
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
      await savePreferencesToFirestore({ quietHours: { ...preferences.quietHours, enabled: newValue } });
    } catch (error) {
      setPreferences({
        ...preferences,
        quietHours: { ...preferences.quietHours, enabled: !newValue },
      });
    }
  };

  const updateQuietHoursTime = async (field: 'startTime' | 'endTime', value: string) => {
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
      await savePreferencesToFirestore({ quietHours: updatedQuietHours });
    } catch (error) {
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

  const renderAlertItem = (alert: AlertConfig) => (
    <TouchableOpacity
      key={alert.id}
      style={[
        styles.alertItem,
        {
          backgroundColor: colors.background.secondary,
          borderColor: alert.enabled ? colors.primary[500] : colors.border.light,
        },
      ]}
      onPress={() => openAlertConfig(alert)}
      disabled={isSaving}
      activeOpacity={0.7}
    >
      <View style={styles.alertContent}>
        <View style={styles.alertLeft}>
          <View style={[
            styles.alertIcon,
            { backgroundColor: alert.enabled ? colors.primary[100] : colors.border.light }
          ]}>
            <Ionicons
              name={alert.icon as any}
              size={24}
              color={alert.enabled ? colors.primary[500] : colors.text.tertiary}
            />
          </View>
          <View style={styles.alertInfo}>
            <Text style={[styles.alertName, { color: colors.text.primary }]}>
              {alert.name}
            </Text>
            <Text style={[styles.alertDescription, { color: colors.text.secondary }]}>
              {alert.description}
            </Text>
            {alert.threshold !== undefined && (
              <Text style={[styles.alertThreshold, { color: colors.text.tertiary }]}>
                Umbral: {alert.threshold}{alert.thresholdUnit}
              </Text>
            )}
          </View>
        </View>
        <Switch
          value={alert.enabled}
          onValueChange={() => toggleAlert(alert.id)}
          disabled={isSaving}
          trackColor={{ false: colors.border.light, true: colors.primary[500] }}
          thumbColor={colors.background.primary}
        />
      </View>
      
      {alert.enabled && (
        <View style={styles.alertDetails}>
          <View style={styles.alertDetailRow}>
            <View style={styles.alertDetailItem}>
              <Ionicons name="notifications" size={16} color={colors.text.secondary} />
              <Text style={[styles.alertDetailText, { color: colors.text.secondary }]}>
                {alert.sendPush ? 'Push' : ''}
                {alert.sendPush && alert.sendInApp ? ' • ' : ''}
                {alert.sendInApp ? 'In-App' : ''}
              </Text>
            </View>
            <View style={styles.alertDetailItem}>
              <Ionicons name="people" size={16} color={colors.text.secondary} />
              <Text style={[styles.alertDetailText, { color: colors.text.secondary }]}>
                {alert.notifyOwner ? 'Owner' : ''}
                {alert.notifyCollaborators.length > 0 
                  ? ` + ${alert.notifyCollaborators.length} colaborador${alert.notifyCollaborators.length > 1 ? 'es' : ''}` 
                  : ''}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCollaboratorItem = (collaborator: Collaborator) => {
    const isSelected = selectedAlert?.notifyCollaborators.includes(collaborator.id);
    
    return (
      <TouchableOpacity
        key={collaborator.id}
        style={[
          styles.collaboratorItem,
          {
            backgroundColor: colors.background.secondary,
            borderColor: isSelected ? colors.primary[500] : colors.border.light,
          },
        ]}
        onPress={() => toggleCollaboratorNotification(collaborator.id)}
        activeOpacity={0.7}
      >
        <View style={styles.collaboratorContent}>
          <View style={[styles.collaboratorAvatar, { backgroundColor: colors.primary[100] }]}>
            <Text style={[styles.collaboratorInitial, { color: colors.primary[500] }]}>
              {(collaborator.name || collaborator.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.collaboratorInfo}>
            <Text style={[styles.collaboratorName, { color: colors.text.primary }]}>
              {collaborator.name || collaborator.email || 'Sin nombre'}
            </Text>
            <Text style={[styles.collaboratorRole, { color: colors.text.secondary }]}>
              {collaborator.role || 'Colaborador'} • {collaborator.email || 'Sin email'}
            </Text>
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!currentFarm) {
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
            title1="Alertas"
            showEditButton={false}
          />
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.text.secondary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No hay granja seleccionada
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
          title1="Alertas"
          title2={currentFarm.name}
          subtitle="Configuraciones del sistema"
          showEditButton={false}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Información General */}
          <Card style={styles.card}>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                  Configuración de Notificaciones de la Granja
                </Text>
                <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                  Configura cómo y cuándo se envían las notificaciones de esta granja. 
                  Los usuarios pueden personalizar qué notificaciones reciben en su perfil personal.
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
                      Habilitar o deshabilitar todas las notificaciones de la granja
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
                      Enviar notificaciones push a los dispositivos
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
                      Enviar notificaciones importantes por correo
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
                      Enviar notificaciones críticas por mensaje de texto
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
              Elige qué tipos de notificaciones se envían desde esta granja
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

          {/* Alertas Operativas */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Alertas Operativas
              </Text>
            </View>
            
            <View style={styles.alertsList}>
              {alerts.filter(a => ['high_mortality', 'low_production', 'low_inventory'].includes(a.id)).map(renderAlertItem)}
            </View>
          </Card>

          {/* Alertas de Gestión */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={24} color={colors.warning[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Alertas de Gestión
              </Text>
            </View>
            
            <View style={styles.alertsList}>
              {alerts.filter(a => ['expiring_products', 'task_reminders', 'financial_alerts'].includes(a.id)).map(renderAlertItem)}
            </View>
          </Card>

          {/* Resumen de Configuración */}
          <Card style={[styles.card, { backgroundColor: colors.primary[50] }]}>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary[600] }]}>
                  {alerts.filter(a => a.enabled).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.primary[500] }]}>
                  Alertas Activas
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary[600] }]}>
                  {alerts.filter(a => a.enabled && a.sendPush).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.primary[500] }]}>
                  Con Push
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary[600] }]}>
                  {farmCollaborators.length + 1}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.primary[500] }]}>
                  Destinatarios
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </View>

      {/* Modal de Configuración de Alerta */}
      <Modal
        visible={showAlertModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {selectedAlert?.name}
              </Text>
              <TouchableOpacity 
                onPress={async () => {
                  // Guardar cambios automáticamente antes de cerrar
                  if (selectedAlert) {
                    try {
                      await saveAlertConfig();
                    } catch (error) {
                      // Si hay error, cerrar de todas formas
                      setShowAlertModal(false);
                      setSelectedAlert(null);
                    }
                  } else {
                    setShowAlertModal(false);
                  }
                }}
                disabled={isSaving}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Umbral */}
              {selectedAlert?.threshold !== undefined && (
                <View style={styles.modalSection}>
                  <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
                    Umbral de Alerta
                  </Text>
                  <View style={styles.thresholdInput}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background.secondary,
                          color: colors.text.primary,
                          borderColor: colors.border.light,
                        },
                      ]}
                      value={selectedAlert.threshold.toString()}
                      onChangeText={(value) => {
                        const numValue = parseFloat(value) || 0;
                        if (selectedAlert) {
                          setSelectedAlert({ ...selectedAlert, threshold: numValue });
                        }
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      editable={!isSaving}
                    />
                    <Text style={[styles.thresholdUnit, { color: colors.text.secondary }]}>
                      {selectedAlert.thresholdUnit}
                    </Text>
                  </View>
                </View>
              )}

              {/* Tipo de Notificación */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
                  Tipo de Notificación
                </Text>
                
                <View style={styles.switchItem}>
                  <View style={styles.switchItemLeft}>
                    <Ionicons name="phone-portrait" size={20} color={colors.text.secondary} />
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Notificación In-App
                    </Text>
                  </View>
                  <Switch
                    value={selectedAlert?.sendInApp || false}
                    onValueChange={(value) => {
                      if (selectedAlert) {
                        setSelectedAlert({ ...selectedAlert, sendInApp: value });
                      }
                    }}
                    disabled={isSaving}
                    trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                    thumbColor={colors.background.primary}
                  />
                </View>

                <View style={styles.switchItem}>
                  <View style={styles.switchItemLeft}>
                    <Ionicons name="notifications" size={20} color={colors.text.secondary} />
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Notificación Push
                    </Text>
                  </View>
                  <Switch
                    value={selectedAlert?.sendPush || false}
                    onValueChange={(value) => {
                      if (selectedAlert) {
                        setSelectedAlert({ ...selectedAlert, sendPush: value });
                      }
                    }}
                    disabled={isSaving}
                    trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                    thumbColor={colors.background.primary}
                  />
                </View>
              </View>

              {/* Destinatarios */}
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: colors.text.primary }]}>
                  Destinatarios
                </Text>
                
                <View style={styles.switchItem}>
                  <View style={styles.switchItemLeft}>
                    <Ionicons name="person-circle" size={20} color={colors.text.secondary} />
                    <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                      Notificar al Owner
                    </Text>
                  </View>
                  <Switch
                    value={selectedAlert?.notifyOwner || false}
                    onValueChange={(value) => {
                      if (selectedAlert) {
                        setSelectedAlert({ ...selectedAlert, notifyOwner: value });
                      }
                    }}
                    disabled={isSaving}
                    trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                    thumbColor={colors.background.primary}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.selectCollaboratorsButton, { backgroundColor: colors.primary[100] }]}
                  onPress={() => setShowCollaboratorModal(true)}
                >
                  <Ionicons name="people" size={20} color={colors.primary[500]} />
                  <Text style={[styles.selectCollaboratorsText, { color: colors.primary[500] }]}>
                    Seleccionar Colaboradores ({selectedAlert?.notifyCollaborators.length || 0})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary[500] }]}
                onPress={saveAlertConfig}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Selección de Colaboradores */}
      <Modal
        visible={showCollaboratorModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCollaboratorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                Seleccionar Colaboradores
              </Text>
              <TouchableOpacity onPress={() => setShowCollaboratorModal(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {farmCollaborators.length > 0 ? (
                farmCollaborators.map(renderCollaboratorItem)
              ) : (
                <View style={styles.emptyCollaborators}>
                  <Ionicons name="people-outline" size={48} color={colors.text.tertiary} />
                  <Text style={[styles.emptyCollaboratorsText, { color: colors.text.secondary }]}>
                    No hay colaboradores en esta granja
                  </Text>
                  <Text style={[styles.emptyCollaboratorsHint, { color: colors.text.tertiary }]}>
                    Invita colaboradores desde la configuración
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary[500] }]}
                onPress={() => setShowCollaboratorModal(false)}
              >
                <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
                  Listo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing[4],
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
  // Info Container
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
    marginBottom: spacing[2],
  },
  infoNote: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    fontStyle: 'italic',
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
  // Alerts List
  alertsList: {
    gap: spacing[3],
  },
  alertItem: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing[4],
    ...shadows.sm,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  alertDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[1],
  },
  alertThreshold: {
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
  },
  alertDetails: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  alertDetailRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  alertDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  alertDetailText: {
    fontSize: typography.sizes.xs,
  },
  // Summary
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  summaryLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: spacing[4],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  modalScroll: {
    maxHeight: '70%',
    padding: spacing[4],
  },
  modalSection: {
    marginBottom: spacing[4],
  },
  modalSectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[3],
  },
  thresholdInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  thresholdUnit: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
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
    gap: spacing[2],
  },
  switchLabel: {
    fontSize: typography.sizes.base,
  },
  selectCollaboratorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[2],
    gap: spacing[2],
  },
  selectCollaboratorsText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    ...shadows.md,
  },
  cancelButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  saveButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  // Collaborators
  collaboratorItem: {
    borderRadius: borderRadius.md,
    borderWidth: 2,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  collaboratorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  collaboratorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collaboratorInitial: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1] / 2,
  },
  collaboratorRole: {
    fontSize: typography.sizes.sm,
  },
  emptyCollaborators: {
    alignItems: 'center',
    padding: spacing[8],
  },
  emptyCollaboratorsText: {
    fontSize: typography.sizes.base,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  emptyCollaboratorsHint: {
    fontSize: typography.sizes.sm,
    marginTop: spacing[1],
    textAlign: 'center',
  },
});

