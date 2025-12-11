/**
 * Pantalla de Apariencia - Configuración de tema y colores
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemeType, useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Card from '../../../src/components/ui/Card';
import { borderRadius, spacing, typography } from '../../../src/constants/designSystem';

type ThemeOption = {
  value: ThemeType;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Modo Claro',
    description: 'Fondo claro, ideal para usar durante el día',
    icon: 'sunny',
  },
  {
    value: 'dark',
    label: 'Modo Oscuro',
    description: 'Fondo oscuro, ideal para usar de noche',
    icon: 'moon',
  },
  {
    value: 'auto',
    label: 'Automático',
    description: 'Se adapta al tema de tu dispositivo',
    icon: 'phone-portrait',
  },
];

export default function AppearanceScreen() {
  const { colors, isDark, theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
  };

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
          title1="Apariencia"
          title2="Personaliza tu experiencia"
        />
        
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Selección de Tema */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Tema de Color
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Elige cómo quieres ver la aplicación
            </Text>

            <View style={styles.themeOptions}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor:
                        theme === option.value
                          ? colors.primary[100]
                          : colors.background.secondary,
                      borderColor:
                        theme === option.value ? colors.primary[500] : colors.border.light,
                    },
                  ]}
                  onPress={() => handleThemeChange(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.themeOptionHeader}>
                    <View
                      style={[
                        styles.themeIconContainer,
                        {
                          backgroundColor:
                            theme === option.value
                              ? colors.primary[500]
                              : colors.background.tertiary,
                        },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={
                          theme === option.value ? colors.text.inverse : colors.text.primary
                        }
                      />
                    </View>
                    <View style={styles.themeOptionContent}>
                      <Text
                        style={[
                          styles.themeOptionLabel,
                          {
                            color:
                              theme === option.value
                                ? colors.primary[500]
                                : colors.text.primary,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={[styles.themeOptionDescription, { color: colors.text.secondary }]}
                      >
                        {option.description}
                      </Text>
                    </View>
                    {theme === option.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary[500]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Vista Previa */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Vista Previa
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Así se ve tu tema actual
            </Text>

            <View style={styles.previewContainer}>
              {/* Header Preview */}
              <View
                style={[
                  styles.previewHeader,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <View style={[styles.previewAvatar, { backgroundColor: colors.primary[500] }]}>
                  <Ionicons name="person" size={20} color={colors.text.inverse} />
                </View>
                <View style={styles.previewHeaderContent}>
                  <Text style={[styles.previewTitle, { color: colors.text.primary }]}>
                    Mi Granja
                  </Text>
                  <Text style={[styles.previewSubtitle, { color: colors.text.secondary }]}>
                    Ejemplo de texto
                  </Text>
                </View>
              </View>

              {/* Content Preview */}
              <View style={styles.previewContent}>
                <View
                  style={[
                    styles.previewCard,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <View style={styles.previewCardHeader}>
                    <View
                      style={[
                        styles.previewCardIcon,
                        { backgroundColor: colors.primary[100] },
                      ]}
                    >
                      <Ionicons name="egg" size={20} color={colors.primary[500]} />
                    </View>
                    <Text style={[styles.previewCardTitle, { color: colors.text.primary }]}>
                      Lotes Ponedoras
                    </Text>
                  </View>
                  <Text style={[styles.previewCardText, { color: colors.text.secondary }]}>
                    Este es un ejemplo de cómo se verá el contenido
                  </Text>
                </View>

                <View
                  style={[
                    styles.previewButton,
                    { backgroundColor: colors.primary[500] },
                  ]}
                >
                  <Text style={[styles.previewButtonText, { color: colors.text.inverse }]}>
                    Botón de Ejemplo
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Paleta de Colores */}
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              Paleta de Colores
            </Text>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              Colores principales de la aplicación
            </Text>

            <View style={styles.colorPalette}>
              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colors.primary[500] },
                  ]}
                />
                <Text style={[styles.colorLabel, { color: colors.text.primary }]}>
                  Primario
                </Text>
              </View>

              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colors.success[500] },
                  ]}
                />
                <Text style={[styles.colorLabel, { color: colors.text.primary }]}>
                  Éxito
                </Text>
              </View>

              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colors.warning[500] },
                  ]}
                />
                <Text style={[styles.colorLabel, { color: colors.text.primary }]}>
                  Alerta
                </Text>
              </View>

              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: colors.error[500] },
                  ]}
                />
                <Text style={[styles.colorLabel, { color: colors.text.primary }]}>
                  Error
                </Text>
              </View>
            </View>
          </Card>

          {/* Información Adicional */}
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
              Los cambios se aplican inmediatamente en toda la aplicación
            </Text>
          </View>
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
  themeOptions: {
    gap: spacing[3],
  },
  themeOption: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing[4],
  },
  themeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1],
  },
  themeOptionDescription: {
    fontSize: typography.sizes.sm,
  },
  previewContainer: {
    gap: spacing[3],
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[3],
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewHeaderContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
    marginBottom: spacing[1] / 2,
  },
  previewSubtitle: {
    fontSize: typography.sizes.sm,
  },
  previewContent: {
    gap: spacing[3],
  },
  previewCard: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  previewCardIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewCardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold as '700',
  },
  previewCardText: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
  previewButton: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  previewButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold as '600',
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  colorItem: {
    alignItems: 'center',
    gap: spacing[2],
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  colorLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as '500',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing[2],
    marginTop: spacing[2],
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.4,
  },
});



