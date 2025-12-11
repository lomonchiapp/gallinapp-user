/**
 * Pantalla de Precios de la Granja
 * Muestra y permite editar todos los parámetros de precios
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { EngordeIcon } from '../../../src/components/ui/icons/EngordeIcon';
import { LevanteIcon } from '../../../src/components/ui/icons/LevanteIcon';
import { PonedoraIcon } from '../../../src/components/ui/icons/PonedoraIcon';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../../../src/constants/currencies';
import { useFarmStore } from '../../../src/stores/farmStore';
import { showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';

export default function FarmPricingScreen() {
  const { colors, isDark } = useTheme();
  const { currentFarm, updateFarm, isLoading } = useFarmStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para precios
  const [precioHuevo, setPrecioHuevo] = useState('');
  const [precioLibraEngorde, setPrecioLibraEngorde] = useState('');
  const [precioUnidadLevante, setPrecioUnidadLevante] = useState('');

  // Obtener moneda configurada
  const currency = currentFarm?.settings?.invoiceSettings?.currency || DEFAULT_CURRENCY;
  const currencySymbol = getCurrencySymbol(currency);

  // Cargar datos de precios al montar
  useEffect(() => {
    if (currentFarm?.settings) {
      const settings = currentFarm.settings;
      setPrecioHuevo((settings.defaultEggPrice ?? 8.0).toString());
      setPrecioLibraEngorde((settings.defaultChickenPricePerPound ?? 65.0).toString());
      setPrecioUnidadLevante((settings.defaultLevantePricePerUnit ?? 150.0).toString());
    } else {
      // Valores por defecto
      setPrecioHuevo('8.0');
      setPrecioLibraEngorde('65.0');
      setPrecioUnidadLevante('150.0');
    }
  }, [currentFarm]);

  const handleSave = async () => {
    if (!currentFarm) {
      showErrorAlert('Error', 'No hay granja seleccionada');
      return;
    }

    // Validaciones
    const precioHuevoNum = parseFloat(precioHuevo);
    const precioLibraEngordeNum = parseFloat(precioLibraEngorde);
    const precioUnidadLevanteNum = parseFloat(precioUnidadLevante);

    if (isNaN(precioHuevoNum) || precioHuevoNum <= 0) {
      showErrorAlert('Error', 'El precio del huevo debe ser un número mayor a 0');
      return;
    }

    if (isNaN(precioLibraEngordeNum) || precioLibraEngordeNum <= 0) {
      showErrorAlert('Error', 'El precio por libra de engorde debe ser un número mayor a 0');
      return;
    }

    if (isNaN(precioUnidadLevanteNum) || precioUnidadLevanteNum <= 0) {
      showErrorAlert('Error', 'El precio por unidad de levante debe ser un número mayor a 0');
      return;
    }

    setIsSaving(true);
    try {
      const existingSettings = currentFarm.settings || {};
      
      await updateFarm(currentFarm.id, {
        settings: {
          ...existingSettings,
          defaultEggPrice: precioHuevoNum,
          defaultChickenPricePerPound: precioLibraEngordeNum,
          defaultLevantePricePerUnit: precioUnidadLevanteNum,
        },
      });

      setIsEditing(false);
      showSuccessAlert('Éxito', 'Precios actualizados correctamente');
    } catch (error: any) {
      console.error('Error guardando precios:', error);
      showErrorAlert('Error', error.message || 'No se pudieron guardar los precios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    if (currentFarm?.settings) {
      const settings = currentFarm.settings;
      setPrecioHuevo((settings.defaultEggPrice ?? 8.0).toString());
      setPrecioLibraEngorde((settings.defaultChickenPricePerPound ?? 65.0).toString());
      setPrecioUnidadLevante((settings.defaultLevantePricePerUnit ?? 150.0).toString());
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
            title1="Precios"
          />
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={64} color={colors.text.secondary} />
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
          title1="Precios"
          title2="Configuración de precios por defecto"
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Precios de Ponedoras */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
                <PonedoraIcon width={32} height={32} fill="#F59E0B" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Gallinas Ponedoras
                </Text>
                <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                  Precio por unidad de huevo
                </Text>
              </View>
            </View>

            <View style={styles.priceInputContainer}>
              <View style={styles.currencyLabel}>
                <Text style={[styles.currencySymbol, { color: colors.text.secondary }]}>
                  {currency}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={precioHuevo}
                onChangeText={setPrecioHuevo}
                placeholder="8.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                editable={isEditing}
              />
              <Text style={[styles.unitLabel, { color: colors.text.secondary }]}>
                por huevo
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
              <Text style={[styles.infoText, { color: '#92400E' }]}>
                Este precio se usará como predeterminado al registrar ventas de huevos
              </Text>
            </View>
          </Card>

          {/* Precios de Engorde */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
                <EngordeIcon width={32} height={32} fill="#EF4444" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Pollos de Engorde
                </Text>
                <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                  Precio por libra de pollo
                </Text>
              </View>
            </View>

            <View style={styles.priceInputContainer}>
              <View style={styles.currencyLabel}>
                <Text style={[styles.currencySymbol, { color: colors.text.secondary }]}>
                  {currency}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={precioLibraEngorde}
                onChangeText={setPrecioLibraEngorde}
                placeholder="65.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                editable={isEditing}
              />
              <Text style={[styles.unitLabel, { color: colors.text.secondary }]}>
                por libra
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#EF4444" />
              <Text style={[styles.infoText, { color: '#991B1B' }]}>
                Este precio se usará como predeterminado al registrar ventas de pollos de engorde
              </Text>
            </View>
          </Card>

          {/* Precios de Levantes */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                <LevanteIcon width={32} height={32} fill="#10B981" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Pollas de Levante
                </Text>
                <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                  Precio por unidad de polla
                </Text>
              </View>
            </View>

            <View style={styles.priceInputContainer}>
              <View style={styles.currencyLabel}>
                <Text style={[styles.currencySymbol, { color: colors.text.secondary }]}>
                  {currency}
                </Text>
              </View>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={precioUnidadLevante}
                onChangeText={setPrecioUnidadLevante}
                placeholder="150.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                editable={isEditing}
              />
              <Text style={[styles.unitLabel, { color: colors.text.secondary }]}>
                por unidad
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#10B981" />
              <Text style={[styles.infoText, { color: '#065F46' }]}>
                Este precio se usará como predeterminado al registrar ventas de pollas de levante
              </Text>
            </View>
          </Card>

          {/* Información adicional */}
          <View style={[styles.infoContainer, { backgroundColor: colors.primary[50], borderColor: colors.primary[200] }]}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary[500]} />
            <View style={styles.infoContainerText}>
              <Text style={[styles.infoContainerTitle, { color: colors.primary[700] }]}>
                Precios por Defecto
              </Text>
              <Text style={[styles.infoContainerDescription, { color: colors.primary[600] }]}>
                Estos precios se utilizarán como valores predeterminados al crear nuevas ventas. Puedes modificarlos individualmente en cada venta si es necesario.
              </Text>
            </View>
          </View>

          {/* Botones de Acción */}
          {isEditing ? (
            <View style={styles.actionButtons}>
              <Button
                title="Cancelar"
                onPress={handleCancel}
                variant="outline"
                style={styles.cancelButton}
                disabled={isSaving}
              />
              <Button
                title={isSaving ? 'Guardando...' : 'Guardar Cambios'}
                onPress={handleSave}
                style={styles.saveButton}
                disabled={isSaving}
              />
            </View>
          ) : (
            <Button
              title="Editar Precios"
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
              icon="create-outline"
            />
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
  card: {
    marginBottom: spacing[4],
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  currencyLabel: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  currencySymbol: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold as '700',
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
    paddingHorizontal: spacing[2],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  infoContainerText: {
    flex: 1,
  },
  infoContainerTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  infoContainerDescription: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  editButton: {
    marginTop: spacing[2],
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
});

