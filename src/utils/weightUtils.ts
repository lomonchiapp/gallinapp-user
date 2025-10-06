/**
 * Utilidades para manejo de unidades de peso en el sistema avícola
 * El mercado dominicano opera principalmente en libras
 */

export enum WeightUnit {
  OUNCES = 'oz',
  POUNDS = 'lb'
}

export interface WeightValue {
  value: number;
  unit: WeightUnit;
}

// Factores de conversión
const OUNCES_PER_POUND = 16;

/**
 * Convertir onzas a libras
 */
export const ouncesToPounds = (ounces: number): number => {
  return ounces / OUNCES_PER_POUND;
};

/**
 * Convertir libras a onzas
 */
export const poundsToOunces = (pounds: number): number => {
  return pounds * OUNCES_PER_POUND;
};

/**
 * Convertir cualquier unidad a libras (unidad estándar del sistema)
 */
export const convertToPounds = (weight: WeightValue): number => {
  switch (weight.unit) {
    case WeightUnit.OUNCES:
      return ouncesToPounds(weight.value);
    case WeightUnit.POUNDS:
      return weight.value;
    default:
      return weight.value;
  }
};

/**
 * Convertir libras a la unidad especificada
 */
export const convertFromPounds = (pounds: number, targetUnit: WeightUnit): number => {
  switch (targetUnit) {
    case WeightUnit.OUNCES:
      return poundsToOunces(pounds);
    case WeightUnit.POUNDS:
      return pounds;
    default:
      return pounds;
  }
};

/**
 * Formatear peso con unidad
 */
export const formatWeight = (value: number, unit: WeightUnit, decimals: number = 2): string => {
  const unitLabel = {
    [WeightUnit.OUNCES]: 'oz',
    [WeightUnit.POUNDS]: 'lb'
  }[unit];
  
  return `${value.toFixed(decimals)} ${unitLabel}`;
};

/**
 * Obtener label de unidad en español
 */
export const getUnitLabel = (unit: WeightUnit): string => {
  return {
    [WeightUnit.OUNCES]: 'Onzas',
    [WeightUnit.POUNDS]: 'Libras'
  }[unit];
};

/**
 * Validar peso según la unidad
 */
export const validateWeight = (weight: WeightValue): { isValid: boolean; message?: string } => {
  if (weight.value <= 0) {
    return { isValid: false, message: 'El peso debe ser mayor que 0' };
  }

  // Validaciones específicas por unidad
  switch (weight.unit) {
    case WeightUnit.OUNCES:
      if (weight.value > 160) { // ~10 libras máximo
        return { isValid: false, message: 'Peso demasiado alto (máximo 160 oz)' };
      }
      break;
    case WeightUnit.POUNDS:
      if (weight.value > 10) { // 10 libras máximo
        return { isValid: false, message: 'Peso demasiado alto (máximo 10 lb)' };
      }
      break;
  }

  return { isValid: true };
};

/**
 * Calcular peso promedio en libras
 */
export const calculateAverageWeight = (weights: WeightValue[]): number => {
  if (weights.length === 0) return 0;
  
  const totalPounds = weights.reduce((sum, weight) => sum + convertToPounds(weight), 0);
  return totalPounds / weights.length;
};

/**
 * Pesos de referencia por tipo de ave en libras
 */
export const REFERENCE_WEIGHTS = {
  POLLO_LEVANTE: {
    min: 2.5,    // 2.5 libras
    ideal: 4.5,  // 4.5 libras
    max: 6.0     // 6 libras
  },
  POLLO_ENGORDE: {
    min: 4.0,    // 4 libras
    ideal: 6.5,  // 6.5 libras  
    max: 8.0     // 8 libras
  },
  PONEDORA: {
    min: 3.0,    // 3 libras
    ideal: 4.0,  // 4 libras
    max: 5.0     // 5 libras
  }
};

















