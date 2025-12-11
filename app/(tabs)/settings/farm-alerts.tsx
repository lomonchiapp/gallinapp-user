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

export default function FarmAlertsScreen() {
  const { colors, isDark } = useTheme();
  const { currentFarm, updateFarm, collaborators } = useFarmStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
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

  // Mock de colaboradores (en producción, esto vendría de useFarmStore)
  const farmCollaborators: Collaborator[] = collaborators || [];

  // Cargar configuración de alertas al montar
  useEffect(() => {
    if (currentFarm?.settings) {
      // Cargar configuración guardada si existe
      const savedAlerts = (currentFarm.settings as any).alerts;
      if (savedAlerts) {
        setAlerts(savedAlerts);
      }
    }
  }, [currentFarm]);

  const handleSave = async () => {
    if (!currentFarm) {
      showErrorAlert('Error', 'No hay granja seleccionada');
      return;
    }

    // Validaciones
    for (const alert of alerts) {
      if (alert.enabled && alert.threshold !== undefined) {
        if (alert.threshold <= 0) {
          showErrorAlert('Error', `El umbral de ${alert.name} debe ser mayor a 0`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      const existingSettings = currentFarm.settings || {};

      const updates: any = {
        settings: {
          ...existingSettings,
          alerts: alerts,
          alertsEnabled: alerts.some(a => a.enabled),
        },
      };

      await updateFarm(currentFarm.id, updates);

      setIsEditing(false);
      showSuccessAlert('Éxito', 'Configuración de alertas actualizada correctamente');
    } catch (error: any) {
      console.error('Error guardando configuración de alertas:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    if (currentFarm?.settings) {
      const savedAlerts = (currentFarm.settings as any).alerts;
      if (savedAlerts) {
        setAlerts(savedAlerts);
      }
    }
    setIsEditing(false);
  };

  const toggleAlert = (alertId: AlertType) => {
    if (!isEditing) return;
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const updateAlertThreshold = (alertId: AlertType, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, threshold: numValue } : a
    ));
  };

  const openAlertConfig = (alert: AlertConfig) => {
    if (!isEditing) return;
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  const saveAlertConfig = () => {
    if (!selectedAlert) return;
    
    setAlerts(alerts.map(a => 
      a.id === selectedAlert.id ? selectedAlert : a
    ));
    setShowAlertModal(false);
    setSelectedAlert(null);
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
      disabled={!isEditing}
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
          disabled={!isEditing}
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
              {collaborator.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.collaboratorInfo}>
            <Text style={[styles.collaboratorName, { color: colors.text.primary }]}>
              {collaborator.name}
            </Text>
            <Text style={[styles.collaboratorRole, { color: colors.text.secondary }]}>
              {collaborator.role} • {collaborator.email}
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
          {/* Información General */}
          <Card style={styles.card}>
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
                  Sistema de Alertas
                </Text>
                <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                  Configura los umbrales y destinatarios de las alertas de tu granja. 
                  Las alertas notificarán automáticamente cuando se cumplan las condiciones establecidas.
                </Text>
                <Text style={[styles.infoNote, { color: colors.warning[600] }]}>
                  Nota: Los usuarios configuran si reciben estas notificaciones en su perfil personal.
                </Text>
              </View>
            </View>
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
              <TouchableOpacity onPress={() => setShowAlertModal(false)}>
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
                        setSelectedAlert({ ...selectedAlert, threshold: numValue });
                      }}
                      keyboardType="decimal-pad"
                      placeholder="0"
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
                    onValueChange={(value) => 
                      setSelectedAlert(selectedAlert ? { ...selectedAlert, sendInApp: value } : null)
                    }
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
                    onValueChange={(value) => 
                      setSelectedAlert(selectedAlert ? { ...selectedAlert, sendPush: value } : null)
                    }
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
                    onValueChange={(value) => 
                      setSelectedAlert(selectedAlert ? { ...selectedAlert, notifyOwner: value } : null)
                    }
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
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border.light }]}
                onPress={() => setShowAlertModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary[500] }]}
                onPress={saveAlertConfig}
              >
                <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
                  Guardar
                </Text>
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

