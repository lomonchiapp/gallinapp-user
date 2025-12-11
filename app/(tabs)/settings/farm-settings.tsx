/**
 * Pantalla de configuración de la granja (Farm Settings)
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from 'react-native';
import { useTheme } from '../../../components/theme-provider';
import AppHeader from '../../../src/components/layouts/AppHeader';
import { ScreenWrapper } from '../../../src/components/navigation/ScreenWrapper';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import { spacing, typography } from '../../../src/constants/designSystem';
import { useFarmStore } from '../../../src/stores/farmStore';
import { showErrorAlert, showSuccessAlert } from '../../../src/utils/alert.service';

export default function FarmSettingsScreen() {
  const theme = useTheme();
  const { currentFarm, updateFarm, isLoading } = useFarmStore();
  
  // Asegurar que colors esté definido con valores por defecto
  const colors = theme?.colors || {
    background: { primary: '#FFFFFF', secondary: '#F8F9FA', tertiary: '#F1F3F4' },
    text: { primary: '#202124', secondary: '#5F6368', tertiary: '#80868B', inverse: '#FFFFFF' },
    primary: { 500: '#345DAD' },
    success: { 500: '#2E7D32' },
    warning: { 500: '#FF9800' },
    error: { 500: '#F44336' },
    border: { light: '#E8EAED', medium: '#DADCE0', strong: '#BDC1C6' },
  };
  
  // Si no hay colors válido, no renderizar
  if (!theme || !colors) {
    return null;
  }
  
  // Estados para configuración de precios
  const [precioHuevo, setPrecioHuevo] = useState('');
  const [precioLibraEngorde, setPrecioLibraEngorde] = useState('');
  const [precioUnidadIsraeli, setPrecioUnidadIsraeli] = useState('');
  const [diasCrecimientoIsraeli, setDiasCrecimientoIsraeli] = useState('');
  const [diasCrecimientoEngorde, setDiasCrecimientoEngorde] = useState('');
  const [pesoObjetivoEngorde, setPesoObjetivoEngorde] = useState('');
  const [tasaMortalidadAceptable, setTasaMortalidadAceptable] = useState('');
  const [huevosPorCaja, setHuevosPorCaja] = useState('');
  
  // Estados para configuración de notificaciones
  const [alertasHabilitadas, setAlertasHabilitadas] = useState(true);
  const [mostrarAlertasExito, setMostrarAlertasExito] = useState(true);
  const [mostrarAlertasError, setMostrarAlertasError] = useState(true);
  const [mostrarAlertasConfirmacion, setMostrarAlertasConfirmacion] = useState(true);
  const [sonidoAlertas, setSonidoAlertas] = useState(true);
  const [vibrarEnAlertas, setVibrarEnAlertas] = useState(true);
  
  // Cargar configuración de la granja al montar
  useEffect(() => {
    if (currentFarm && currentFarm.settings) {
      const settings = currentFarm.settings;
      
      // Usar valores por defecto si no existen
      setPrecioHuevo((settings?.defaultEggPrice ?? 8.0).toString());
      setPrecioLibraEngorde((settings?.defaultChickenPricePerPound ?? 65.0).toString());
      setPrecioUnidadIsraeli((settings?.defaultLevantePricePerUnit ?? 150.0).toString());
      setDiasCrecimientoIsraeli((settings?.israeliGrowthDays ?? 45).toString());
      setDiasCrecimientoEngorde((settings?.engordeGrowthDays ?? 42).toString());
      setPesoObjetivoEngorde((settings?.targetEngordeWeight ?? 4.5).toString());
      setTasaMortalidadAceptable((settings?.acceptableMortalityRate ?? 5.0).toString());
      setHuevosPorCaja((settings?.eggsPerBox ?? 30).toString());
      
      // Cargar configuración de notificaciones con valores por defecto
      const notifications = settings?.notifications || {};
      setAlertasHabilitadas(notifications?.alertsEnabled ?? true);
      setMostrarAlertasExito(notifications?.mostrarAlertasExito ?? true);
      setMostrarAlertasError(notifications?.mostrarAlertasError ?? true);
      setMostrarAlertasConfirmacion(notifications?.mostrarAlertasConfirmacion ?? true);
      setSonidoAlertas(notifications?.sonidoAlertas ?? true);
      setVibrarEnAlertas(notifications?.vibrarEnAlertas ?? true);
    } else {
      // Si no hay settings, inicializar con valores por defecto
      setPrecioHuevo('8.0');
      setPrecioLibraEngorde('65.0');
      setPrecioUnidadIsraeli('150.0');
      setDiasCrecimientoIsraeli('45');
      setDiasCrecimientoEngorde('42');
      setPesoObjetivoEngorde('4.5');
      setTasaMortalidadAceptable('5.0');
      setHuevosPorCaja('30');
    }
  }, [currentFarm]);
  
  // Manejar guardado de configuración
  const handleSaveSettings = async () => {
    if (!currentFarm) {
      showErrorAlert('Error', 'No hay granja seleccionada');
      return;
    }
    
    try {
      // Obtener valores existentes o usar defaults
      const existingSettings = currentFarm?.settings || {};
      const existingNotifications = existingSettings?.notifications || {};
      const existingInvoiceSettings = existingSettings?.invoiceSettings || {
        prefix: 'FAC',
        nextNumber: 1,
        format: 'FAC-{number}',
        taxRate: 0.18,
        currency: 'DOP',
      };
      
      // Validar que todos los campos sean números válidos
      const settings = {
        defaultEggPrice: parseFloat(precioHuevo),
        defaultChickenPricePerPound: parseFloat(precioLibraEngorde),
        defaultLevantePricePerUnit: parseFloat(precioUnidadIsraeli),
        israeliGrowthDays: parseInt(diasCrecimientoIsraeli),
        engordeGrowthDays: parseInt(diasCrecimientoEngorde),
        targetEngordeWeight: parseFloat(pesoObjetivoEngorde),
        acceptableMortalityRate: parseFloat(tasaMortalidadAceptable),
        eggsPerBox: parseInt(huevosPorCaja),
        notifications: {
          alertsEnabled: alertasHabilitadas,
          emailNotifications: existingNotifications.emailNotifications ?? true,
          smsNotifications: existingNotifications.smsNotifications ?? false,
          pushNotifications: existingNotifications.pushNotifications ?? true,
          mostrarAlertasExito,
          mostrarAlertasError,
          mostrarAlertasConfirmacion,
          sonidoAlertas,
          vibrarEnAlertas,
        },
        invoiceSettings: existingInvoiceSettings,
        timezone: existingSettings.timezone || 'America/Santo_Domingo',
        language: existingSettings.language || 'es',
      };
      
      // Verificar que todos los valores sean números válidos
      try {
        if (settings && typeof settings === 'object' && settings !== null) {
          for (const [key, value] of Object.entries(settings)) {
            if (key === 'notifications' || key === 'invoiceSettings' || key === 'timezone' || key === 'language') continue;
            if (value !== null && value !== undefined && (isNaN(value as number) || (value as number) < 0)) {
              showErrorAlert('Error', `El valor para ${key} no es válido`);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error validando settings:', error);
        showErrorAlert('Error', 'Error al validar la configuración');
        return;
      }
      
      await updateFarm(currentFarm.id, { settings });
      showSuccessAlert('Éxito', 'Configuración de la granja guardada correctamente');
    } catch (error: any) {
      showErrorAlert('Error', error.message || 'No se pudo guardar la configuración');
    }
  };
  
  if (!currentFarm) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors?.background?.primary || '#FFFFFF' }]}>
          <AppHeader
            title1="Configuración"
            title2="de la Granja"
            variant="floating"
            showBack={true}
            onBackPress={() => router.back()}
            showThemeToggle={true}
            enableBlur={true}
            showFarmSettings={false}
          />
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors?.text?.secondary || '#5F6368'} />
            <Text style={[styles.emptyText, { color: colors?.text?.secondary || '#5F6368' }]}>
              No hay granja seleccionada
            </Text>
            <Button
              title="Seleccionar Granja"
              onPress={() => router.push('/(tabs)/index')}
              style={styles.emptyButton}
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }
  
  if (isLoading && !currentFarm?.settings) {
    return (
      <ScreenWrapper transitionType="fade">
        <View style={[styles.container, { backgroundColor: colors?.background?.primary || '#FFFFFF' }]}>
          <AppHeader
            title1="Configuración"
            title2="de la Granja"
            variant="floating"
            showBack={true}
            onBackPress={() => router.back()}
            showThemeToggle={true}
            enableBlur={true}
            showFarmSettings={false}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors?.primary?.[500] || '#345DAD'} />
            <Text style={[styles.loadingText, { color: colors?.text?.secondary || '#5F6368' }]}>
              Cargando configuración...
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }
  
  return (
    <ScreenWrapper transitionType="slide">
      <View style={[styles.container, { backgroundColor: colors?.background?.primary || '#FFFFFF' }]}>
        <AppHeader
          title1="Configuración"
          title2="de la Granja"
          variant="floating"
          showBack={true}
          onBackPress={() => router.back()}
          showThemeToggle={true}
          enableBlur={true}
          showFarmSettings={false}
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Precios */}
          <Card style={[styles.settingsCard, { backgroundColor: colors.background?.secondary || '#F8F9FA' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={24} color={colors.primary?.[500] || '#345DAD'} />
              <Text style={[styles.sectionTitle, { color: colors.text?.primary || '#202124' }]}>
                Precios
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Precio por Huevo (DOP)"
                value={precioHuevo}
                onChangeText={setPrecioHuevo}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Precio por Libra de Pollo de Engorde (DOP)"
                value={precioLibraEngorde}
                onChangeText={setPrecioLibraEngorde}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Precio por Unidad de Pollo Israelí (DOP)"
                value={precioUnidadIsraeli}
                onChangeText={setPrecioUnidadIsraeli}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
            </View>
          </Card>
          
          {/* Parámetros de Producción */}
          <Card style={[styles.settingsCard, { backgroundColor: colors.background?.secondary || '#F8F9FA' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="analytics-outline" size={24} color={colors.primary?.[500] || '#345DAD'} />
              <Text style={[styles.sectionTitle, { color: colors.text?.primary || '#202124' }]}>
                Parámetros de Producción
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Días de Crecimiento para Pollos Israelíes"
                value={diasCrecimientoIsraeli}
                onChangeText={setDiasCrecimientoIsraeli}
                keyboardType="numeric"
                placeholder="0"
                required
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Días de Crecimiento para Pollos de Engorde"
                value={diasCrecimientoEngorde}
                onChangeText={setDiasCrecimientoEngorde}
                keyboardType="numeric"
                placeholder="0"
                required
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Peso Objetivo para Pollos de Engorde (libras)"
                value={pesoObjetivoEngorde}
                onChangeText={setPesoObjetivoEngorde}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Tasa de Mortalidad Aceptable (%)"
                value={tasaMortalidadAceptable}
                onChangeText={setTasaMortalidadAceptable}
                keyboardType="numeric"
                placeholder="0.00"
                required
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Input
                label="Huevos por Caja"
                value={huevosPorCaja}
                onChangeText={setHuevosPorCaja}
                keyboardType="numeric"
                placeholder="30"
                required
              />
            </View>
          </Card>
          
          {/* Configuración de Notificaciones */}
          <Card style={[styles.settingsCard, { backgroundColor: colors.background?.secondary || '#F8F9FA' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary?.[500] || '#345DAD'} />
              <Text style={[styles.sectionTitle, { color: colors.text?.primary || '#202124' }]}>
                Notificaciones
              </Text>
            </View>
            
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <Ionicons name="notifications-outline" size={20} color={colors.text?.primary || '#202124'} />
                  <Text style={[styles.switchLabel, { color: colors.text?.primary || '#202124' }]}>
                    Alertas Habilitadas
                  </Text>
                </View>
                <Switch
                  value={alertasHabilitadas}
                  onValueChange={setAlertasHabilitadas}
                  trackColor={{ false: colors.border?.light || '#E8EAED', true: colors.primary?.[500] || '#345DAD' }}
                  thumbColor={colors.text?.inverse || '#FFFFFF'}
                />
              </View>
              
              {alertasHabilitadas && (
                <>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={colors.success?.[500] || '#2E7D32'} />
                      <Text style={[styles.switchLabel, { color: colors.text?.primary || '#202124' }]}>
                        Mostrar Alertas de Éxito
                      </Text>
                    </View>
                    <Switch
                      value={mostrarAlertasExito}
                      onValueChange={setMostrarAlertasExito}
                      trackColor={{ false: colors.border?.light || '#E8EAED', true: colors.success?.[500] || '#2E7D32' }}
                      thumbColor={colors.text?.inverse || '#FFFFFF'}
                    />
                  </View>
                  
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="alert-circle-outline" size={20} color={colors.error?.[500] || '#F44336'} />
                      <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
                        Mostrar Alertas de Error
                      </Text>
                    </View>
                    <Switch
                      value={mostrarAlertasError}
                      onValueChange={setMostrarAlertasError}
                      trackColor={{ false: colors.border?.light || '#E8EAED', true: colors.error?.[500] || '#F44336' }}
                      thumbColor={colors.text?.inverse || '#FFFFFF'}
                    />
                  </View>
                  
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="help-circle-outline" size={20} color={colors.warning?.[500] || '#FF9800'} />
                      <Text style={[styles.switchLabel, { color: colors.text?.primary || '#202124' }]}>
                        Mostrar Alertas de Confirmación
                      </Text>
                    </View>
                    <Switch
                      value={mostrarAlertasConfirmacion}
                      onValueChange={setMostrarAlertasConfirmacion}
                      trackColor={{ false: colors.border?.light || '#E8EAED', true: colors.warning?.[500] || '#FF9800' }}
                      thumbColor={colors.text?.inverse || '#FFFFFF'}
                    />
                  </View>
                  
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="volume-high-outline" size={20} color={colors.text?.primary || '#202124'} />
                      <Text style={[styles.switchLabel, { color: colors.text?.primary || '#202124' }]}>
                        Sonido en Alertas
                      </Text>
                    </View>
                    <Switch
                      value={sonidoAlertas}
                      onValueChange={setSonidoAlertas}
                      trackColor={{ false: colors.border?.light || '#E8EAED', true: colors.primary?.[500] || '#345DAD' }}
                      thumbColor={colors.text?.inverse || '#FFFFFF'}
                    />
                  </View>
                  
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name="phone-portrait-outline" size={20} color={colors.text?.primary || '#202124'} />
                      <Text style={[styles.switchLabel, { color: colors.text?.primary || '#202124' }]}>
                        Vibrar en Alertas
                      </Text>
                    </View>
                    <Switch
                      value={vibrarEnAlertas}
                      onValueChange={setVibrarEnAlertas}
                      trackColor={{ false: colors.border?.light || '#E8EAED', true: colors.primary?.[500] || '#345DAD' }}
                      thumbColor={colors.text?.inverse || '#FFFFFF'}
                    />
                  </View>
                </>
              )}
            </View>
          </Card>
          
          {/* Botón de guardar */}
          <View style={styles.buttonContainer}>
            <Button
              title="Guardar Configuración"
              onPress={handleSaveSettings}
              loading={isLoading}
              style={styles.saveButton}
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.sizes.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  emptyText: {
    marginTop: spacing[4],
    marginBottom: spacing[6],
    fontSize: typography.sizes.lg,
    textAlign: 'center',
  },
  emptyButton: {
    minWidth: 200,
  },
  
  // Settings Card
  settingsCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
  inputGroup: {
    marginBottom: spacing[3],
  },
  buttonContainer: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  saveButton: {
    minHeight: 56,
  },
  switchGroup: {
    gap: spacing[3],
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  switchLabel: {
    fontSize: typography.sizes.base,
    flex: 1,
  },
});

