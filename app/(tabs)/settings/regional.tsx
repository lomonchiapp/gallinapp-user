/**
 * Pantalla de Configuración Regional - Idioma, Zona Horaria y Formato de Fecha
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';
import { useAccountStore } from '../../../src/stores/accountStore';
import { showSuccessAlert } from '../../../src/utils/alert.service';

// Opciones de idioma
const languageOptions = [
  { code: 'es', label: 'Español', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', nativeLabel: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', nativeLabel: 'Italiano', flag: '🇮🇹' },
];

// Opciones de zona horaria (principales zonas de América)
const timezoneOptions = [
  { value: 'America/Santo_Domingo', label: 'República Dominicana (GMT-4)', offset: '-04:00' },
  { value: 'America/New_York', label: 'Nueva York, EE.UU. (GMT-5)', offset: '-05:00' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)', offset: '-06:00' },
  { value: 'America/Chicago', label: 'Chicago, EE.UU. (GMT-6)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Denver, EE.UU. (GMT-7)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles, EE.UU. (GMT-8)', offset: '-08:00' },
  { value: 'America/Caracas', label: 'Caracas, Venezuela (GMT-4)', offset: '-04:00' },
  { value: 'America/Bogota', label: 'Bogotá, Colombia (GMT-5)', offset: '-05:00' },
  { value: 'America/Lima', label: 'Lima, Perú (GMT-5)', offset: '-05:00' },
  { value: 'America/Santiago', label: 'Santiago, Chile (GMT-3)', offset: '-03:00' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires, Argentina (GMT-3)', offset: '-03:00' },
];

// Opciones de formato de fecha
const dateFormatOptions = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '25/12/2024' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '12/25/2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2024-12-25' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '25-12-2024' },
];

export default function RegionalScreen() {
  const { colors, isDark } = useTheme();
  const { account, updateAccount } = useAccountStore();

  // Estados locales
  const [language, setLanguage] = useState('es');
  const [timezone, setTimezone] = useState('America/Santo_Domingo');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showDateFormatModal, setShowDateFormatModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar configuración actual al montar
  useEffect(() => {
    if (account?.profile?.preferences) {
      const prefs = account.profile.preferences;
      setLanguage(prefs.language || 'es');
      setTimezone(prefs.timezone || 'America/Santo_Domingo');
      setDateFormat(prefs.dateFormat || 'DD/MM/YYYY');
    }
  }, [account]);

  // Guardar configuración
  const handleSave = async () => {
    if (!account) return;

    setIsSaving(true);
    try {
      await updateAccount({
        profile: {
          ...account.profile,
          preferences: {
            ...account.profile.preferences,
            language,
            timezone,
            dateFormat,
          },
        },
      });

      showSuccessAlert('Configuración guardada', 'Los cambios se aplicarán en toda la aplicación');
    } catch (error: any) {
      console.error('Error guardando configuración regional:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedLanguage = languageOptions.find(lang => lang.code === language) || languageOptions[0];
  const selectedTimezone = timezoneOptions.find(tz => tz.value === timezone) || timezoneOptions[0];
  const selectedDateFormat = dateFormatOptions.find(df => df.value === dateFormat) || dateFormatOptions[0];

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
          showUserIcon={false}
          showNotificationsIcon={false}
          title1="Configuración Regional"
          title2="Idioma, zona horaria y formato"
        />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Idioma */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Idioma de la Aplicación
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Selecciona el idioma en el que deseas usar la aplicación
            </Text>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionButtonContent}>
                <View style={styles.optionButtonLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="language" size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.optionButtonText}>
                    <Text style={[styles.optionButtonLabel, { color: colors.text.primary }]}>
                      {selectedLanguage.flag} {selectedLanguage.nativeLabel}
                    </Text>
                    <Text style={[styles.optionButtonSubtext, { color: colors.text.secondary }]}>
                      {selectedLanguage.label}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Zona Horaria */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Zona Horaria
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Configura la zona horaria para mostrar las fechas y horas correctamente
            </Text>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => setShowTimezoneModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionButtonContent}>
                <View style={styles.optionButtonLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="time-outline" size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.optionButtonText}>
                    <Text style={[styles.optionButtonLabel, { color: colors.text.primary }]}>
                      {selectedTimezone.label}
                    </Text>
                    <Text style={[styles.optionButtonSubtext, { color: colors.text.secondary }]}>
                      {selectedTimezone.offset}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Formato de Fecha */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Formato de Fecha
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Elige cómo quieres ver las fechas en la aplicación
            </Text>

            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.light,
                },
              ]}
              onPress={() => setShowDateFormatModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionButtonContent}>
                <View style={styles.optionButtonLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name="calendar-outline" size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.optionButtonText}>
                    <Text style={[styles.optionButtonLabel, { color: colors.text.primary }]}>
                      {selectedDateFormat.label}
                    </Text>
                    <Text style={[styles.optionButtonSubtext, { color: colors.text.secondary }]}>
                      Ejemplo: {selectedDateFormat.example}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Información */}
          <View
            style={[
              styles.infoContainer,
              {
                backgroundColor: colors.primary[50],
                borderColor: colors.primary[200],
              },
            ]}
          >
            <Ionicons name="information-circle" size={20} color={colors.primary[500]} />
            <Text style={[styles.infoText, { color: colors.primary[700] }]}>
              Los cambios se aplicarán en toda la aplicación. Es posible que necesites reiniciar la app para ver algunos cambios.
            </Text>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: colors.primary[500],
                opacity: isSaving ? 0.6 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de Idioma */}
        <Modal
          visible={showLanguageModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Seleccionar Idioma
                </Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {languageOptions.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor:
                          language === lang.code
                            ? colors.primary[100]
                            : colors.background.secondary,
                        borderColor:
                          language === lang.code ? colors.primary[500] : colors.border.light,
                      },
                    ]}
                    onPress={() => {
                      setLanguage(lang.code);
                      setShowLanguageModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalOptionFlag}>{lang.flag}</Text>
                    <View style={styles.modalOptionText}>
                      <Text
                        style={[
                          styles.modalOptionLabel,
                          {
                            color:
                              language === lang.code
                                ? colors.primary[500]
                                : colors.text.primary,
                            fontWeight:
                              language === lang.code
                                ? (typography.weights.bold as '700')
                                : (typography.weights.medium as '500'),
                          },
                        ]}
                      >
                        {lang.nativeLabel}
                      </Text>
                      <Text
                        style={[
                          styles.modalOptionSubtext,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {lang.label}
                      </Text>
                    </View>
                    {language === lang.code && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Zona Horaria */}
        <Modal
          visible={showTimezoneModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimezoneModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Seleccionar Zona Horaria
                </Text>
                <TouchableOpacity onPress={() => setShowTimezoneModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {timezoneOptions.map((tz) => (
                  <TouchableOpacity
                    key={tz.value}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor:
                          timezone === tz.value
                            ? colors.primary[100]
                            : colors.background.secondary,
                        borderColor:
                          timezone === tz.value ? colors.primary[500] : colors.border.light,
                      },
                    ]}
                    onPress={() => {
                      setTimezone(tz.value);
                      setShowTimezoneModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionText}>
                      <Text
                        style={[
                          styles.modalOptionLabel,
                          {
                            color:
                              timezone === tz.value
                                ? colors.primary[500]
                                : colors.text.primary,
                            fontWeight:
                              timezone === tz.value
                                ? (typography.weights.bold as '700')
                                : (typography.weights.medium as '500'),
                          },
                        ]}
                      >
                        {tz.label}
                      </Text>
                      <Text
                        style={[
                          styles.modalOptionSubtext,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {tz.offset}
                      </Text>
                    </View>
                    {timezone === tz.value && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Formato de Fecha */}
        <Modal
          visible={showDateFormatModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDateFormatModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                  Seleccionar Formato de Fecha
                </Text>
                <TouchableOpacity onPress={() => setShowDateFormatModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {dateFormatOptions.map((df) => (
                  <TouchableOpacity
                    key={df.value}
                    style={[
                      styles.modalOption,
                      {
                        backgroundColor:
                          dateFormat === df.value
                            ? colors.primary[100]
                            : colors.background.secondary,
                        borderColor:
                          dateFormat === df.value ? colors.primary[500] : colors.border.light,
                      },
                    ]}
                    onPress={() => {
                      setDateFormat(df.value);
                      setShowDateFormatModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionText}>
                      <Text
                        style={[
                          styles.modalOptionLabel,
                          {
                            color:
                              dateFormat === df.value
                                ? colors.primary[500]
                                : colors.text.primary,
                            fontWeight:
                              dateFormat === df.value
                                ? (typography.weights.bold as '700')
                                : (typography.weights.medium as '500'),
                          },
                        ]}
                      >
                        {df.label}
                      </Text>
                      <Text
                        style={[
                          styles.modalOptionSubtext,
                          { color: colors.text.secondary },
                        ]}
                      >
                        Ejemplo: {df.example}
                      </Text>
                    </View>
                    {dateFormat === df.value && (
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
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[2],
  },
  sectionDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing[4],
    lineHeight: typography.sizes.sm * 1.4,
  },
  optionButton: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing[4],
  },
  optionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionButtonText: {
    flex: 1,
  },
  optionButtonLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
    marginBottom: spacing[1] / 2,
  },
  optionButtonSubtext: {
    fontSize: typography.sizes.sm,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  saveButton: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
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
    padding: spacing[4],
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[3],
  },
  modalOptionFlag: {
    fontSize: 32,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionLabel: {
    fontSize: typography.sizes.base,
    marginBottom: spacing[1] / 2,
  },
  modalOptionSubtext: {
    fontSize: typography.sizes.sm,
  },
});

