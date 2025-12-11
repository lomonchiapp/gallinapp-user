/**
 * Pantalla de Información General de la Granja
 * Muestra y permite editar todos los parámetros básicos de la granja
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyByCode } from '../../../src/constants/currencies';
import { useFarmStore } from '../../../src/stores/farmStore';
import { showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';
import { formatDate } from '../../../src/utils/dateUtils';

export default function FarmInfoScreen() {
  const { colors, isDark } = useTheme();
  const { currentFarm, updateFarm, isLoading } = useFarmStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para información básica
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [farmCode, setFarmCode] = useState('');

  // Estados para información de contacto y ubicación
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Estados para información operativa
  const [establishedDate, setEstablishedDate] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [capacity, setCapacity] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  // Cargar datos de la granja al montar
  useEffect(() => {
    if (currentFarm) {
      setName(currentFarm.name || '');
      setDisplayName(currentFarm.displayName || '');
      setDescription(currentFarm.description || '');
      setFarmCode(currentFarm.farmCode || '');

      const farmInfo = currentFarm.farmInfo || {};
      setLocation(farmInfo.location || '');
      setAddress(farmInfo.address || '');
      setPhone(farmInfo.phone || '');
      setEmail(farmInfo.email || '');
      setEstablishedDate(
        farmInfo.establishedDate
          ? formatDate(farmInfo.establishedDate instanceof Date ? farmInfo.establishedDate : new Date(farmInfo.establishedDate), 'YYYY-MM-DD')
          : ''
      );
      setTotalArea(farmInfo.totalArea?.toString() || '');
      setCapacity(farmInfo.capacity?.toString() || '');
      
      // Cargar moneda desde invoiceSettings
      const invoiceSettings = currentFarm.settings?.invoiceSettings;
      setCurrency(invoiceSettings?.currency || DEFAULT_CURRENCY);
    }
  }, [currentFarm]);

  const handleSave = async () => {
    if (!currentFarm) {
      showErrorAlert('Error', 'No hay granja seleccionada');
      return;
    }

    // Validaciones básicas
    if (!name.trim()) {
      showErrorAlert('Error', 'El nombre de la granja es requerido');
      return;
    }

    setIsSaving(true);
    try {
      // Preparar farmInfo, solo incluyendo campos con valores válidos
      const farmInfo: any = {};
      if (location.trim()) farmInfo.location = location.trim();
      if (address.trim()) farmInfo.address = address.trim();
      if (phone.trim()) farmInfo.phone = phone.trim();
      if (email.trim()) farmInfo.email = email.trim();
      if (establishedDate) {
        const date = new Date(establishedDate);
        if (!isNaN(date.getTime())) farmInfo.establishedDate = date;
      }
      if (totalArea) {
        const area = parseFloat(totalArea);
        if (!isNaN(area)) farmInfo.totalArea = area;
      }
      if (capacity) {
        const cap = parseInt(capacity, 10);
        if (!isNaN(cap)) farmInfo.capacity = cap;
      }

      const existingSettings = currentFarm.settings || {};
      const existingInvoiceSettings = existingSettings.invoiceSettings || {};

      // Preparar updates, solo incluyendo campos con valores válidos
      const updates: any = {
        name: name.trim(),
      };
      
      if (displayName.trim()) {
        updates.displayName = displayName.trim();
      }
      if (description.trim()) {
        updates.description = description.trim();
      }
      if (Object.keys(farmInfo).length > 0) {
        updates.farmInfo = farmInfo;
      }
      
      updates.settings = {
        ...existingSettings,
        invoiceSettings: {
          ...existingInvoiceSettings,
          currency,
        },
      };

      await updateFarm(currentFarm.id, updates);

      setIsEditing(false);
      showSuccessAlert('Éxito', 'Información de la granja actualizada correctamente');
    } catch (error: any) {
      console.error('Error guardando información de la granja:', error);
      showErrorAlert('Error', error.message || 'No se pudo guardar la información');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restaurar valores originales
    if (currentFarm) {
      setName(currentFarm.name || '');
      setDisplayName(currentFarm.displayName || '');
      setDescription(currentFarm.description || '');
      const farmInfo = currentFarm.farmInfo || {};
      setLocation(farmInfo.location || '');
      setAddress(farmInfo.address || '');
      setPhone(farmInfo.phone || '');
      setEmail(farmInfo.email || '');
      setEstablishedDate(
        farmInfo.establishedDate
          ? formatDate(farmInfo.establishedDate instanceof Date ? farmInfo.establishedDate : new Date(farmInfo.establishedDate), 'YYYY-MM-DD')
          : ''
      );
      setTotalArea(farmInfo.totalArea?.toString() || '');
      setCapacity(farmInfo.capacity?.toString() || '');
      
      const invoiceSettings = currentFarm.settings?.invoiceSettings;
      setCurrency(invoiceSettings?.currency || DEFAULT_CURRENCY);
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
            title1="Información General"
            showEditButton={false}
          />
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={colors.text.secondary} />
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
          title1="Información General"
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
          {/* Información Básica */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Información Básica
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Nombre de la Granja <Text style={styles.required}>*</Text>
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
                value={name}
                onChangeText={setName}
                placeholder="Ej: Granja San Juan"
                placeholderTextColor={colors.text.tertiary}
                editable={isEditing}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Nombre para Mostrar
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
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Ej: Granja San Juan SRL"
                placeholderTextColor={colors.text.tertiary}
                editable={isEditing}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Descripción
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción de la granja..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={4}
                editable={isEditing}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.secondary }]}>
                Código de Granja
              </Text>
              <View style={[styles.codeContainer, { backgroundColor: colors.background.tertiary }]}>
                <Text style={[styles.codeText, { color: colors.text.secondary }]}>
                  {farmCode || 'No disponible'}
                </Text>
                <Ionicons name="lock-closed" size={16} color={colors.text.tertiary} />
              </View>
              <Text style={[styles.helperText, { color: colors.text.tertiary }]}>
                El código de granja no puede ser modificado
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Moneda
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.light,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
                onPress={() => isEditing && setShowCurrencyModal(true)}
                disabled={!isEditing}
              >
                <View style={styles.currencyDisplay}>
                  <Text style={[styles.currencyCode, { color: colors.text.primary }]}>
                    {getCurrencyByCode(currency)?.code || currency}
                  </Text>
                  <Text style={[styles.currencyName, { color: colors.text.secondary }]}>
                    {getCurrencyByCode(currency)?.name || currency}
                  </Text>
                </View>
                {isEditing && (
                  <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {/* Información de Contacto y Ubicación */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Contacto y Ubicación
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Ubicación
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
                value={location}
                onChangeText={setLocation}
                placeholder="Ej: Santo Domingo Este"
                placeholderTextColor={colors.text.tertiary}
                editable={isEditing}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Dirección
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  },
                ]}
                value={address}
                onChangeText={setAddress}
                placeholder="Dirección completa de la granja"
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={2}
                editable={isEditing}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Teléfono
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
                value={phone}
                onChangeText={setPhone}
                placeholder="Ej: (809) 555-1234"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Email
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
                value={email}
                onChangeText={setEmail}
                placeholder="Ej: contacto@granja.com"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>
          </Card>

          {/* Información Operativa */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart" size={24} color={colors.primary[500]} />
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Información Operativa
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Fecha de Establecimiento
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
                value={establishedDate}
                onChangeText={setEstablishedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.tertiary}
                editable={isEditing}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>
                  Área Total (Hectáreas)
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
                  value={totalArea}
                  onChangeText={setTotalArea}
                  placeholder="Ej: 5.5"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="decimal-pad"
                  editable={isEditing}
                />
              </View>

              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={[styles.label, { color: colors.text.primary }]}>
                  Capacidad Total (Aves)
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
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Ej: 10000"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="number-pad"
                  editable={isEditing}
                />
              </View>
            </View>
          </Card>

        </ScrollView>

        {/* Modal de Selección de Moneda */}
        <Modal
          visible={showCurrencyModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCurrencyModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Seleccionar Moneda
                </Text>
                <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {CURRENCIES.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor:
                          currency === curr.code
                            ? colors.primary[100]
                            : colors.background.secondary,
                        borderColor:
                          currency === curr.code ? colors.primary[500] : colors.border.light,
                      },
                    ]}
                    onPress={() => {
                      setCurrency(curr.code);
                      setShowCurrencyModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionContent}>
                      <View style={styles.modalOptionText}>
                        <Text
                          style={[
                            styles.modalOptionCode,
                            {
                              color:
                                currency === curr.code
                                  ? colors.primary[500]
                                  : colors.text.primary,
                              fontWeight:
                                currency === curr.code
                                  ? (typography.weights.bold as '700')
                                  : (typography.weights.semibold as '600'),
                            },
                          ]}
                        >
                          {curr.code}
                        </Text>
                        <Text
                          style={[
                            styles.modalOptionName,
                            { color: colors.text.secondary },
                          ]}
                        >
                          {curr.name}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.modalOptionSymbol,
                          {
                            color:
                              currency === curr.code
                                ? colors.primary[500]
                                : colors.text.secondary,
                          },
                        ]}
                      >
                        {curr.symbol}
                      </Text>
                    </View>
                    {currency === curr.code && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  formRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  formGroupHalf: {
    flex: 1,
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
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.sizes.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  codeText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium as '500',
    fontFamily: 'monospace',
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
  currencyDisplay: {
    flex: 1,
  },
  currencyCode: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1] / 2,
  },
  currencyName: {
    fontSize: typography.sizes.sm,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
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
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  modalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: spacing[2],
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionCode: {
    fontSize: typography.sizes.base,
    marginBottom: spacing[1] / 2,
  },
  modalOptionName: {
    fontSize: typography.sizes.sm,
  },
  modalOptionSymbol: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginLeft: spacing[2],
  },
});

