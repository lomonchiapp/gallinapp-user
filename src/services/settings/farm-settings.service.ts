/**
 * Servicio para gestionar configuraciones de granjas
 */

import { Farm } from '../../types/farm';
import { DEFAULT_FARM_SETTINGS, FarmSettings } from '../../types/settings';
import { farmUnifiedService } from '../farm-unified.service';

/**
 * Obtener configuraciones de una granja
 */
export const getFarmSettings = async (farmId: string): Promise<FarmSettings> => {
  try {
    const farm = await farmUnifiedService.getFarmById(farmId);
    if (!farm) {
      throw new Error('Granja no encontrada');
    }
    
    // Convertir Farm.settings al formato FarmSettings
    return farmSettingsAdapter(farm);
  } catch (error) {
    console.error('❌ [FarmSettings] Error:', error);
    throw error;
  }
};

/**
 * Actualizar configuraciones de una granja
 */
export const updateFarmSettings = async (
  farmId: string,
  updates: Partial<FarmSettings>
): Promise<void> => {
  try {
    // Convertir FarmSettings al formato Farm.settings
    const farmUpdates: Partial<Farm['settings']> = {};
    
    if (updates.pricing) {
      farmUpdates.defaultEggPrice = updates.pricing.defaultEggPrice;
      farmUpdates.defaultChickenPricePerPound = updates.pricing.defaultChickenPricePerPound;
      farmUpdates.defaultLevantePricePerUnit = updates.pricing.defaultLevantePricePerUnit;
    }
    
    if (updates.production) {
      farmUpdates.israeliGrowthDays = updates.production.israeliGrowthDays;
      farmUpdates.engordeGrowthDays = updates.production.engordeGrowthDays;
      farmUpdates.targetEngordeWeight = updates.production.targetEngordeWeight;
      farmUpdates.acceptableMortalityRate = updates.production.acceptableMortalityRate;
      farmUpdates.eggsPerBox = updates.production.eggsPerBox;
    }
    
    if (updates.invoicing) {
      farmUpdates.invoiceSettings = {
        prefix: updates.invoicing.prefix,
        nextNumber: updates.invoicing.nextNumber,
        format: updates.invoicing.format,
        taxRate: updates.invoicing.taxRate,
        currency: updates.invoicing.currency,
      };
    }
    
    if (updates.notifications) {
      // Adaptar notificaciones
      farmUpdates.notifications = {
        alertsEnabled: updates.notifications.enabled,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        mostrarAlertasExito: true,
        mostrarAlertasError: true,
        mostrarAlertasConfirmacion: true,
        sonidoAlertas: true,
        vibrarEnAlertas: true,
      };
    }
    
    if (updates.regional) {
      farmUpdates.timezone = updates.regional.timezone;
      farmUpdates.language = updates.regional.language;
    }
    
    await farmUnifiedService.updateFarm(farmId, { settings: farmUpdates });
    console.log('✅ [FarmSettings] Actualizado');
  } catch (error) {
    console.error('❌ [FarmSettings] Error al actualizar:', error);
    throw error;
  }
};

/**
 * Adaptador para convertir Farm.settings a FarmSettings
 */
const farmSettingsAdapter = (farm: Farm): FarmSettings => {
  const settings = farm.settings || DEFAULT_FARM_SETTINGS;
  
  return {
    pricing: {
      defaultEggPrice: settings.defaultEggPrice ?? DEFAULT_FARM_SETTINGS.pricing.defaultEggPrice,
      defaultChickenPricePerPound: settings.defaultChickenPricePerPound ?? DEFAULT_FARM_SETTINGS.pricing.defaultChickenPricePerPound,
      defaultLevantePricePerUnit: settings.defaultLevantePricePerUnit ?? DEFAULT_FARM_SETTINGS.pricing.defaultLevantePricePerUnit,
    },
    
    production: {
      israeliGrowthDays: settings.israeliGrowthDays ?? DEFAULT_FARM_SETTINGS.production.israeliGrowthDays,
      engordeGrowthDays: settings.engordeGrowthDays ?? DEFAULT_FARM_SETTINGS.production.engordeGrowthDays,
      targetEngordeWeight: settings.targetEngordeWeight ?? DEFAULT_FARM_SETTINGS.production.targetEngordeWeight,
      acceptableMortalityRate: settings.acceptableMortalityRate ?? DEFAULT_FARM_SETTINGS.production.acceptableMortalityRate,
      eggsPerBox: settings.eggsPerBox ?? DEFAULT_FARM_SETTINGS.production.eggsPerBox,
    },
    
    invoicing: {
      prefix: settings.invoiceSettings?.prefix ?? DEFAULT_FARM_SETTINGS.invoicing.prefix,
      nextNumber: settings.invoiceSettings?.nextNumber ?? DEFAULT_FARM_SETTINGS.invoicing.nextNumber,
      format: settings.invoiceSettings?.format ?? DEFAULT_FARM_SETTINGS.invoicing.format,
      taxRate: settings.invoiceSettings?.taxRate ?? DEFAULT_FARM_SETTINGS.invoicing.taxRate,
      currency: settings.invoiceSettings?.currency ?? DEFAULT_FARM_SETTINGS.invoicing.currency,
      includeQR: false,
      includeTerms: true,
    },
    
    notifications: {
      enabled: settings.notifications?.alertsEnabled ?? DEFAULT_FARM_SETTINGS.notifications.enabled,
      alerts: {
        highMortality: true,
        lowProduction: true,
        lowInventory: true,
        taskReminders: true,
      },
      thresholds: {
        mortalityRate: settings.acceptableMortalityRate ?? 5.0,
        productionDropRate: 15.0,
        inventoryDaysAlert: 7,
      },
    },
    
    regional: {
      timezone: settings.timezone ?? DEFAULT_FARM_SETTINGS.regional.timezone,
      language: settings.language ?? DEFAULT_FARM_SETTINGS.regional.language,
    },
  };
};

/**
 * Validar configuraciones de la granja
 */
export const validateFarmSettings = (settings: Partial<FarmSettings>): string[] => {
  const errors: string[] = [];
  
  if (settings.pricing) {
    if (settings.pricing.defaultEggPrice <= 0) {
      errors.push('El precio del huevo debe ser mayor a 0');
    }
    if (settings.pricing.defaultChickenPricePerPound <= 0) {
      errors.push('El precio por libra debe ser mayor a 0');
    }
    if (settings.pricing.defaultLevantePricePerUnit <= 0) {
      errors.push('El precio unitario debe ser mayor a 0');
    }
  }
  
  if (settings.production) {
    if (settings.production.israeliGrowthDays <= 0 || settings.production.israeliGrowthDays > 365) {
      errors.push('Los días de crecimiento israelí deben estar entre 1 y 365');
    }
    if (settings.production.engordeGrowthDays <= 0 || settings.production.engordeGrowthDays > 365) {
      errors.push('Los días de crecimiento de engorde deben estar entre 1 y 365');
    }
    if (settings.production.targetEngordeWeight <= 0 || settings.production.targetEngordeWeight > 50) {
      errors.push('El peso objetivo debe estar entre 0 y 50 libras');
    }
    if (settings.production.acceptableMortalityRate < 0 || settings.production.acceptableMortalityRate > 100) {
      errors.push('La tasa de mortalidad debe estar entre 0 y 100%');
    }
    if (settings.production.eggsPerBox <= 0 || settings.production.eggsPerBox > 1000) {
      errors.push('Los huevos por caja deben estar entre 1 y 1000');
    }
  }
  
  return errors;
};




