/**
 * Utilidades para manejo de unidades de peso en el sistema avícola
 * El mercado dominicano opera principalmente en libras
 */

export enum WeightUnit {
  GRAMS = 'g',
  OUNCES = 'oz',
  POUNDS = 'lb'
}

export interface WeightValue {
  value: number;
  unit: WeightUnit;
}

// Factores de conversión
const OUNCES_PER_POUND = 16;
const GRAMS_PER_POUND = 453.592; // 1 libra = 453.592 gramos
const GRAMS_PER_KG = 1000; // 1 kg = 1000 gramos

/**
 * Convertir gramos a libras
 */
export const gramsToPounds = (grams: number): number => {
  return grams / GRAMS_PER_POUND;
};

/**
 * Convertir libras a gramos
 */
export const poundsToGrams = (pounds: number): number => {
  return pounds * GRAMS_PER_POUND;
};

/**
 * Convertir gramos a kilogramos
 */
export const gramsToKg = (grams: number): number => {
  return grams / GRAMS_PER_KG;
};

/**
 * Convertir kilogramos a gramos
 */
export const kgToGrams = (kg: number): number => {
  return kg * GRAMS_PER_KG;
};

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
    case WeightUnit.GRAMS:
      return gramsToPounds(weight.value);
    case WeightUnit.OUNCES:
      return ouncesToPounds(weight.value);
    case WeightUnit.POUNDS:
      return weight.value;
    default:
      return weight.value;
  }
};

/**
 * Convertir cualquier unidad a kilogramos (unidad de almacenamiento en BD)
 */
export const convertToKg = (weight: WeightValue): number => {
  switch (weight.unit) {
    case WeightUnit.GRAMS:
      return gramsToKg(weight.value);
    case WeightUnit.OUNCES:
      return gramsToKg(poundsToGrams(ouncesToPounds(weight.value)));
    case WeightUnit.POUNDS:
      return gramsToKg(poundsToGrams(weight.value));
    default:
      return weight.value;
  }
};

/**
 * Convertir libras a la unidad especificada
 */
export const convertFromPounds = (pounds: number, targetUnit: WeightUnit): number => {
  switch (targetUnit) {
    case WeightUnit.GRAMS:
      return poundsToGrams(pounds);
    case WeightUnit.OUNCES:
      return poundsToOunces(pounds);
    case WeightUnit.POUNDS:
      return pounds;
    default:
      return pounds;
  }
};

/**
 * Convertir kilogramos a la unidad especificada
 */
export const convertFromKg = (kg: number, targetUnit: WeightUnit): number => {
  const pounds = kg * 2.20462; // 1 kg = 2.20462 libras
  return convertFromPounds(pounds, targetUnit);
};

/**
 * Formatear peso con unidad
 */
export const formatWeight = (value: number, unit: WeightUnit, decimals: number = 2): string => {
  const unitLabel = {
    [WeightUnit.GRAMS]: 'g',
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
    [WeightUnit.GRAMS]: 'Gramos',
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
    case WeightUnit.GRAMS:
      if (weight.value > 4536) { // ~10 libras máximo (4536 gramos)
        return { isValid: false, message: 'Peso demasiado alto (máximo 4536 g)' };
      }
      break;
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





































