/**
 * Pantalla de Parámetros de Producción de la Granja
 * Muestra y permite editar todos los parámetros de producción y crecimiento
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';
import { DEFAULT_FARM_SETTINGS } from '../../../src/types/farm';
import { useFarmStore } from '../../../src/stores/farmStore';
import { showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';

export default function FarmProductionScreen() {
  const { colors, isDark } = useTheme();
  const { currentFarm, updateFarm } = useFarmStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para parámetros de producción
  const [israeliGrowthDays, setIsraeliGrowthDays] = useState('');
  const [engordeGrowthDays, setEngordeGrowthDays] = useState('');
  const [targetEngordeWeight, setTargetEngordeWeight] = useState('');
  const [acceptableMortalityRate, setAcceptableMortalityRate] = useState('');
  const [eggsPerBox, setEggsPerBox] = useState('');

  // Cargar datos de la granja al montar
  useEffect(() => {
    if (currentFarm) {
      const settings = currentFarm.settings || {};
      setIsraeliGrowthDays(settings.israeliGrowthDays?.toString() || DEFAULT_FARM_SETTINGS.israeliGrowthDays.toString());
      setEngordeGrowthDays(settings.engordeGrowthDays?.toString() || DEFAULT_FARM_SETTINGS.engordeGrowthDays.toString());
      setTargetEngordeWeight(settings.targetEngordeWeight?.toString() || DEFAULT_FARM_SETTINGS.targetEngordeWeight.toString());
      setAcceptableMortalityRate(settings.acceptableMortalityRate?.toString() || DEFAULT_FARM_SETTINGS.acceptableMortalityRate.toString());
      setEggsPerBox(settings.eggsPerBox?.toString() || DEFAULT_FARM_SETTINGS.eggsPerBox.toString());
    }
  }, [currentFarm]);

  const handleSave = async () => {
    if (!currentFarm) {
      showErrorAlert('Error', 'No hay granja seleccionada');
      return;
    }

    // Validaciones
    const israeliDays = parseInt(israeliGrowthDays, 10);
    const engordeDays = parseInt(engordeGrowthDays, 10);
    const targetWeight = parseFloat(targetEngordeWeight);
    const mortalityRate = parseFloat(acceptableMortalityRate);
    const eggsBox = parseInt(eggsPerBox, 10);

    if (isNaN(israeliDays) || israeliDays <= 0 || israeliDays > 365) {
      showErrorAlert('Error', 'Los días de crecimiento para pollos israelíes deben estar entre 1 y 365');
      return;
    }

    if (isNaN(engordeDays) || engordeDays <= 0 || engordeDays > 365) {
      showErrorAlert('Error', 'Los días de crecimiento para pollos de engorde deben estar entre 1 y 365');
      return;
    }

    if (isNaN(targetWeight) || targetWeight <= 0 || targetWeight > 50) {
      showErrorAlert('Error', 'El peso objetivo debe estar entre 0 y 50 libras');
      return;
    }

    if (isNaN(mortalityRate) || mortalityRate < 0 || mortalityRate > 100) {
      showErrorAlert('Error', 'La tasa de mortalidad aceptable debe estar entre 0 y 100%');
      return;
    }

    if (isNaN(eggsBox) || eggsBox <= 0 || eggsBox > 1000) {
      showErrorAlert('Error', 'Los huevos por caja deben estar entre 1 y 1000');
      return;
    }

    setIsSaving(true);
    try {
      const existingSettings = currentFarm.settings || {};
      const existingPricing = existingSettings.defaultEggPrice !== undefined ? {
        defaultEggPrice: existingSettings.defaultEggPrice,
        defaultChickenPricePerPound: existingSettings.defaultChickenPricePerPound,
        defaultLevantePricePerUnit: existingSettings.defaultLevantePricePerUnit,
      } : {};

      const updates: any = {
        settings: {
          ...existingSettings,
          ...existingPricing,
          israeliGrowthDays: israeliDays,
          engordeGrowthDays: engordeDays,
          targetEngordeWeight: targetWeight,
          acceptableMortalityRate: mortalityRate,
          eggsPerBox: eggsBox,
        },
      };

      await updateFarm(currentFarm.id, updates);

      setIsEditing(false);
      showSuccessAlert('Éxito', 'Parámetros de producción actualizados correctamente');
    } catch (error: any) {
      console.error('Error guardando parámetros de producción:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar la información');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    if (currentFarm) {
      const settings = currentFarm.settings || {};
      setIsraeliGrowthDays(settings.israeliGrowthDays?.toString() || DEFAULT_FARM_SETTINGS.israeliGrowthDays.toString());
      setEngordeGrowthDays(settings.engordeGrowthDays?.toString() || DEFAULT_FARM_SETTINGS.engordeGrowthDays.toString());
      setTargetEngordeWeight(settings.targetEngordeWeight?.toString() || DEFAULT_FARM_SETTINGS.targetEngordeWeight.toString());
      setAcceptableMortalityRate(settings.acceptableMortalityRate?.toString() || DEFAULT_FARM_SETTINGS.acceptableMortalityRate.toString());
      setEggsPerBox(settings.eggsPerBox?.toString() || DEFAULT_FARM_SETTINGS.eggsPerBox.toString());
    }
    setIsEditing(false);
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
            title1="Producción"
            showEditButton={false}
          />
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={colors.text.secondary} />
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
          title1="Producción"
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
          {/* Parámetros de Crecimiento */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Parámetros de Crecimiento
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Días de Crecimiento - Pollos Israelíes <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={israeliGrowthDays}
                onChangeText={setIsraeliGrowthDays}
                placeholder="Ej: 45"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                editable={isEditing}
              />
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                Días promedio que tarda un pollo israelí en alcanzar su peso objetivo
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Días de Crecimiento - Pollos de Engorde <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={engordeGrowthDays}
                onChangeText={setEngordeGrowthDays}
                placeholder="Ej: 42"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                editable={isEditing}
              />
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                Días promedio que tarda un pollo de engorde en alcanzar su peso objetivo
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Peso Objetivo - Pollos de Engorde (Libras) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={targetEngordeWeight}
                onChangeText={setTargetEngordeWeight}
                placeholder="Ej: 4.5"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                editable={isEditing}
              />
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                Peso objetivo en libras para pollos de engorde al momento de la venta
              </Text>
            </View>
          </Card>

          {/* Parámetros Operativos */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Parámetros Operativos
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Tasa de Mortalidad Aceptable (%) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={acceptableMortalityRate}
                onChangeText={setAcceptableMortalityRate}
                placeholder="Ej: 5.0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                editable={isEditing}
              />
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                Porcentaje máximo de mortalidad considerado aceptable en un lote
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Huevos por Caja <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={eggsPerBox}
                onChangeText={setEggsPerBox}
                placeholder="Ej: 30"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                editable={isEditing}
              />
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                Cantidad estándar de huevos por caja para ventas y cálculos
              </Text>
            </View>
          </Card>

          {/* Información Adicional */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Información
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: colors.text.secondary }]}>
                Estos parámetros se utilizan para calcular proyecciones de crecimiento, 
                estimaciones de producción y alertas automáticas en tus lotes. 
                Asegúrate de mantenerlos actualizados para obtener cálculos más precisos.
              </Text>
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
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
  },
  formGroup: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1],
  },
  required: {
    color: '#EF4444',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.base,
  },
  helperText: {
    fontSize: typography.sizes.xs,
    marginTop: spacing[1],
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
  infoContainer: {
    padding: spacing[3],
  },
  infoText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});


