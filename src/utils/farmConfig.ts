/**
 * Utilidades para obtener configuración desde farm.settings
 * Single Source of Truth para configuraciones de la granja
 */

import { DEFAULT_FARM_SETTINGS, Farm } from '../types/farm';

/**
 * Obtiene la configuración de la granja actual
 * Si no hay granja, retorna los valores por defecto
 */
export const getFarmConfig = (farm: Farm | null) => {
  if (!farm || !farm.settings) {
    return DEFAULT_FARM_SETTINGS;
  }
  
  return farm.settings;
};

/**
 * Helper para obtener valores específicos de configuración
 */
export const getFarmConfigValue = <K extends keyof typeof DEFAULT_FARM_SETTINGS>(
  farm: Farm | null,
  key: K
): typeof DEFAULT_FARM_SETTINGS[K] => {
  const config = getFarmConfig(farm);
  return config[key] ?? DEFAULT_FARM_SETTINGS[key];
};

/**
 * Obtiene el precio de huevo de la granja
 */
export const getEggPrice = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'defaultEggPrice');
};

/**
 * Obtiene el precio por libra de engorde
 */
export const getEngordePricePerPound = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'defaultChickenPricePerPound');
};

/**
 * Obtiene el precio por unidad israelí
 */
export const getIsraeliPricePerUnit = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'defaultLevantePricePerUnit');
};

/**
 * Obtiene los días de crecimiento israelí
 */
export const getIsraeliGrowthDays = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'israeliGrowthDays');
};

/**
 * Obtiene los días de crecimiento de engorde
 */
export const getEngordeGrowthDays = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'engordeGrowthDays');
};

/**
 * Obtiene el peso objetivo de engorde
 */
export const getTargetEngordeWeight = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'targetEngordeWeight');
};

/**
 * Obtiene la tasa de mortalidad aceptable
 */
export const getAcceptableMortalityRate = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'acceptableMortalityRate');
};

/**
 * Obtiene la cantidad de huevos por caja
 */
export const getEggsPerBox = (farm: Farm | null): number => {
  return getFarmConfigValue(farm, 'eggsPerBox');
};



