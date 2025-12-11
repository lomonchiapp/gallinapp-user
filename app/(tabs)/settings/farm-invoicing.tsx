/**
 * Pantalla Profesional de Ventas y Facturación
 * Configuración avanzada de numeración, impuestos, plantillas y más
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
import { UpgradePlanSheet } from '../../../src/components/ui/UpgradePlanSheet';
import { SubscriptionPlan } from '../../../src/types/subscription';
import { useSubscription } from '../../../src/hooks/useSubscription';

// Tipos de plantillas de PDF
type PDFTemplate = 'modern' | 'classic' | 'minimal' | 'professional';

// Tipos de impuestos internacionales
interface TaxType {
  id: string;
  name: string;
  rate: number;
  country: string;
  enabled: boolean;
}

// Serie de numeración
interface NumberingSeries {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  format: string; // {prefix}-{number}
  active: boolean;
}

export default function FarmInvoicingScreen() {
  const { colors, isDark } = useTheme();
  const { currentFarm, updateFarm } = useFarmStore();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  // Estados para configuración de numeración
  const [numberingSeries, setNumberingSeries] = useState<NumberingSeries[]>([
    { id: '1', name: 'Facturas', prefix: 'FAC', nextNumber: 1, format: '{prefix}-{number}', active: true },
  ]);
  const [showNumberingModal, setShowNumberingModal] = useState(false);
  const [editingNumbering, setEditingNumbering] = useState<NumberingSeries | null>(null);

  // Estados para impuestos
  const [taxes, setTaxes] = useState<TaxType[]>([
    { id: '1', name: 'ITBIS', rate: 18, country: 'DO', enabled: true },
    { id: '2', name: 'IVA', rate: 21, country: 'AR', enabled: false },
    { id: '3', name: 'IVA', rate: 19, country: 'CO', enabled: false },
    { id: '4', name: 'IVA', rate: 16, country: 'MX', enabled: false },
    { id: '5', name: 'IGV', rate: 18, country: 'PE', enabled: false },
  ]);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxType | null>(null);

  // Estados para plantillas
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate>('modern');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Estados para configuración de impresión
  const [printConfig, setPrintConfig] = useState({
    paperSize: 'A4',
    orientation: 'portrait',
    includeHeader: true,
    includeFooter: true,
    includeLogo: true,
    includeQR: false,
    autoGeneratePDF: true,
  });

  // Verificar si es PRO
  const isPro = subscription?.plan === SubscriptionPlan.PRO || subscription?.plan === SubscriptionPlan.ENTERPRISE;

  // Cargar datos de la granja al montar
  useEffect(() => {
    if (currentFarm) {
      const settings = currentFarm.settings || {};
      // Cargar configuración existente si hay
      // Por ahora usamos valores por defecto
    }
  }, [currentFarm]);

  const handlePressFeature = () => {
    if (!isPro) {
      setShowUpgradeSheet(true);
    }
  };

  const handleSave = async () => {
    if (!currentFarm) {
      showErrorAlert('Error', 'No hay granja seleccionada');
      return;
    }

    if (!isPro) {
      setShowUpgradeSheet(true);
      return;
    }

    setIsSaving(true);
    try {
      const existingSettings = currentFarm.settings || {};

      // Guardar configuración (aquí se puede extender para guardar en una colección separada)
      const updates: any = {
        settings: {
          ...existingSettings,
          invoicing: {
            numberingSeries,
            taxes,
            template: selectedTemplate,
            printConfig,
          },
        },
      };

      await updateFarm(currentFarm.id, updates);

      setIsEditing(false);
      showSuccessAlert('Éxito', 'Configuración de facturación actualizada correctamente');
    } catch (error: any) {
      console.error('Error guardando configuración de facturación:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar valores originales si es necesario
  };

  const renderNumberingSeries = (series: NumberingSeries) => (
    <TouchableOpacity
      key={series.id}
      style={[
        styles.listItem,
        {
          backgroundColor: colors.background.secondary,
          borderColor: series.active ? colors.primary[500] : colors.border.light,
        },
      ]}
      onPress={() => {
        if (!isPro) {
          handlePressFeature();
          return;
        }
        if (isEditing) {
          setEditingNumbering(series);
          setShowNumberingModal(true);
        }
      }}
      disabled={!isEditing}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemLeft}>
          <View style={[styles.listItemIcon, { backgroundColor: colors.primary[100] }]}>
            <Ionicons name="document-text" size={20} color={colors.primary[500]} />
          </View>
          <View style={styles.listItemText}>
            <Text style={[styles.listItemTitle, { color: colors.text.primary }]}>
              {series.name}
            </Text>
            <Text style={[styles.listItemSubtitle, { color: colors.text.secondary }]}>
              {series.format.replace('{prefix}', series.prefix).replace('{number}', series.nextNumber.toString().padStart(4, '0'))}
            </Text>
          </View>
        </View>
        <View style={styles.listItemRight}>
          {series.active && (
            <View style={[styles.statusBadge, { backgroundColor: colors.success[100] }]}>
              <Text style={[styles.statusBadgeText, { color: colors.success[600] }]}>Activa</Text>
            </View>
          )}
          {isEditing && <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTax = (tax: TaxType) => (
    <View
      key={tax.id}
      style={[
        styles.listItem,
        {
          backgroundColor: colors.background.secondary,
          borderColor: tax.enabled ? colors.primary[500] : colors.border.light,
        },
      ]}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemLeft}>
          <View style={[styles.listItemIcon, { backgroundColor: colors.warning[100] }]}>
            <Ionicons name="calculator" size={20} color={colors.warning[600]} />
          </View>
          <View style={styles.listItemText}>
            <Text style={[styles.listItemTitle, { color: colors.text.primary }]}>
              {tax.name} - {tax.country}
            </Text>
            <Text style={[styles.listItemSubtitle, { color: colors.text.secondary }]}>
              {tax.rate}%
            </Text>
          </View>
        </View>
        <Switch
          value={tax.enabled}
          onValueChange={(value) => {
            if (!isPro) {
              handlePressFeature();
              return;
            }
            if (isEditing) {
              setTaxes(taxes.map(t => t.id === tax.id ? { ...t, enabled: value } : t));
            }
          }}
          disabled={!isEditing}
          trackColor={{ false: colors.border.light, true: colors.primary[500] }}
          thumbColor={colors.background.primary}
        />
      </View>
    </View>
  );

  const templateOptions: { value: PDFTemplate; name: string; description: string; icon: string }[] = [
    { value: 'modern', name: 'Moderna', description: 'Diseño limpio y minimalista', icon: 'diamond-outline' },
    { value: 'classic', name: 'Clásica', description: 'Formato tradicional de factura', icon: 'document-outline' },
    { value: 'minimal', name: 'Minimal', description: 'Diseño ultra simplificado', icon: 'remove-outline' },
    { value: 'professional', name: 'Profesional', description: 'Para empresas grandes', icon: 'briefcase-outline' },
  ];

  const renderTemplate = (template: { value: PDFTemplate; name: string; description: string; icon: string }) => (
    <TouchableOpacity
      key={template.value}
      style={[
        styles.templateCard,
        {
          backgroundColor: colors.background.secondary,
          borderColor: selectedTemplate === template.value ? colors.primary[500] : colors.border.light,
        },
      ]}
      onPress={() => {
        if (!isPro) {
          handlePressFeature();
          return;
        }
        if (isEditing) {
          setSelectedTemplate(template.value);
        }
      }}
      disabled={!isEditing}
    >
      <View style={[styles.templateIcon, { backgroundColor: colors.primary[100] }]}>
        <Ionicons name={template.icon as any} size={32} color={colors.primary[500]} />
      </View>
      <Text style={[styles.templateName, { color: colors.text.primary }]}>
        {template.name}
      </Text>
      <Text style={[styles.templateDescription, { color: colors.text.secondary }]}>
        {template.description}
      </Text>
      {selectedTemplate === template.value && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
        </View>
      )}
    </TouchableOpacity>
  );

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
            title1="Ventas y Facturación"
            showEditButton={false}
          />
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.text.secondary} />
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
          title1="Ventas y Facturación"
          title2={currentFarm.name}
          showEditButton={isPro}
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
          {/* PRO Feature Badge */}
          {!isPro && (
            <TouchableOpacity
              style={[styles.proFeatureBanner, { backgroundColor: colors.primary[50] }]}
              onPress={() => setShowUpgradeSheet(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="diamond" size={24} color={colors.primary[500]} />
              <View style={styles.proFeatureContent}>
                <Text style={[styles.proFeatureTitle, { color: colors.primary[600] }]}>
                  Funcionalidad PRO
                </Text>
                <Text style={[styles.proFeatureText, { color: colors.primary[500]} ]}>
                  Mejora a PRO para acceder a la configuración avanzada de facturación
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.primary[500]} />
            </TouchableOpacity>
          )}

          {/* Numeración de Facturas */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="filing" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Numeración de Facturas
              </Text>
              {isPro && isEditing && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary[100] }]}
                  onPress={() => {
                    setEditingNumbering({
                      id: Date.now().toString(),
                      name: '',
                      prefix: '',
                      nextNumber: 1,
                      format: '{prefix}-{number}',
                      active: false,
                    });
                    setShowNumberingModal(true);
                  }}
                >
                  <Ionicons name="add" size={20} color={colors.primary[500]} />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Configura diferentes series de numeración para organizar tus facturas
            </Text>

            <View style={styles.listContainer}>
              {numberingSeries.map(renderNumberingSeries)}
            </View>
          </Card>

          {/* Impuestos por País */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="globe" size={24} color={colors.warning[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Impuestos por País
              </Text>
            </View>
            
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Activa los tipos de impuestos según los países donde operas
            </Text>

            <View style={styles.listContainer}>
              {taxes.map(renderTax)}
            </View>
          </Card>

          {/* Plantillas de PDF */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-attach" size={24} color={colors.success[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Plantillas de PDF
              </Text>
            </View>
            
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Elige el diseño de tus facturas impresas
            </Text>

            <View style={styles.templateGrid}>
              {templateOptions.map(renderTemplate)}
            </View>
          </Card>

          {/* Configuración de Impresión */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="print" size={24} color={colors.error[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Configuración de Impresión
              </Text>
            </View>
            
            <View style={styles.switchContainer}>
              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <Ionicons name="image" size={20} color={colors.text.secondary} />
                  <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                    Incluir Logo
                  </Text>
                </View>
                <Switch
                  value={printConfig.includeLogo}
                  onValueChange={(value) => {
                    if (!isPro) {
                      handlePressFeature();
                      return;
                    }
                    if (isEditing) {
                      setPrintConfig({ ...printConfig, includeLogo: value });
                    }
                  }}
                  disabled={!isEditing}
                  trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>

              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <Ionicons name="qr-code" size={20} color={colors.text.secondary} />
                  <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                    Incluir Código QR
                  </Text>
                </View>
                <Switch
                  value={printConfig.includeQR}
                  onValueChange={(value) => {
                    if (!isPro) {
                      handlePressFeature();
                      return;
                    }
                    if (isEditing) {
                      setPrintConfig({ ...printConfig, includeQR: value });
                    }
                  }}
                  disabled={!isEditing}
                  trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>

              <View style={styles.switchItem}>
                <View style={styles.switchItemLeft}>
                  <Ionicons name="download" size={20} color={colors.text.secondary} />
                  <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                    Generar PDF Automáticamente
                  </Text>
                </View>
                <Switch
                  value={printConfig.autoGeneratePDF}
                  onValueChange={(value) => {
                    if (!isPro) {
                      handlePressFeature();
                      return;
                    }
                    if (isEditing) {
                      setPrintConfig({ ...printConfig, autoGeneratePDF: value });
                    }
                  }}
                  disabled={!isEditing}
                  trackColor={{ false: colors.border.light, true: colors.primary[500] }}
                  thumbColor={colors.background.primary}
                />
              </View>
            </View>
          </Card>

          {/* Información */}
          {isPro && (
            <Card style={styles.card}>
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
                <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                  Esta configuración se aplicará a todas las facturas generadas en esta granja. 
                  Puedes cambiarla en cualquier momento.
                </Text>
              </View>
            </Card>
          )}
        </ScrollView>
      </View>

      {/* Upgrade Sheet */}
      <UpgradePlanSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        requiredPlan={SubscriptionPlan.PRO}
      />
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  // PRO Feature Banner
  proFeatureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[4],
    gap: spacing[3],
    ...shadows.md,
  },
  proFeatureContent: {
    flex: 1,
  },
  proFeatureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  proFeatureText: {
    fontSize: typography.sizes.sm,
  },
  // List Items
  listContainer: {
    gap: spacing[3],
  },
  listItem: {
    borderRadius: borderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1] / 2,
  },
  listItemSubtitle: {
    fontSize: typography.sizes.sm,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold as '700',
  },
  // Templates
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  templateCard: {
    width: '48%',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  templateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  templateName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  templateDescription: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
  },
  // Switches
  switchContainer: {
    gap: spacing[3],
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
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
  // Info
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});

