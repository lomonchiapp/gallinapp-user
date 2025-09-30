/**
 * Utilidades para calcular el estado de maduración de los pollos
 */

import { TipoAve } from '../types';
import { calculateAgeInDays } from './dateUtils';

export interface MaturationStatus {
  isReady: boolean;
  daysToMaturity: number;
  weightStatus: 'underweight' | 'optimal' | 'overweight';
  ageStatus: 'young' | 'optimal' | 'old';
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
}

// Parámetros de maduración por tipo de ave
const MATURATION_PARAMS = {
  [TipoAve.POLLO_LEVANTE]: {
    minAge: 35, // días
    optimalAge: 42,
    maxAge: 49,
    minWeight: 1.5, // kg
    optimalWeight: 2.0,
    maxWeight: 2.8,
  },
  [TipoAve.POLLO_ENGORDE]: {
    minAge: 35,
    optimalAge: 42,
    maxAge: 56,
    minWeight: 2.0,
    optimalWeight: 2.8,
    maxWeight: 4.0,
  },
  [TipoAve.PONEDORA]: {
    minAge: 120, // 17-18 semanas
    optimalAge: 140, // 20 semanas
    maxAge: 168, // 24 semanas
    minWeight: 1.2,
    optimalWeight: 1.6,
    maxWeight: 2.0,
  }
};

/**
 * Evalúa el estado de maduración de un lote
 */
export const evaluateMaturation = (
  tipoAve: TipoAve,
  fechaNacimiento: Date,
  pesoPromedio: number = 0
): MaturationStatus => {
  const params = MATURATION_PARAMS[tipoAve];
  if (!params) {
    return {
      isReady: false,
      daysToMaturity: 0,
      weightStatus: 'optimal',
      ageStatus: 'young',
      recommendation: 'Tipo de ave no reconocido',
      urgency: 'low'
    };
  }

  const currentAge = calculateAgeInDays(fechaNacimiento);
  const daysToMaturity = Math.max(0, params.optimalAge - currentAge);

  // Evaluar estado de edad
  let ageStatus: 'young' | 'optimal' | 'old';
  if (currentAge < params.minAge) {
    ageStatus = 'young';
  } else if (currentAge <= params.maxAge) {
    ageStatus = 'optimal';
  } else {
    ageStatus = 'old';
  }

  // Evaluar estado de peso (solo si se proporciona)
  let weightStatus: 'underweight' | 'optimal' | 'overweight' = 'optimal';
  if (pesoPromedio > 0) {
    if (pesoPromedio < params.minWeight) {
      weightStatus = 'underweight';
    } else if (pesoPromedio > params.maxWeight) {
      weightStatus = 'overweight';
    }
  }

  // Determinar si está listo para venta/producción
  const isReady = currentAge >= params.minAge && 
                   (pesoPromedio === 0 || pesoPromedio >= params.minWeight);

  // Generar recomendación
  let recommendation = '';
  let urgency: 'low' | 'medium' | 'high' = 'low';

  if (tipoAve === TipoAve.PONEDORA) {
    if (currentAge >= params.optimalAge) {
      recommendation = 'Las gallinas están listas para comenzar la producción de huevos';
      urgency = currentAge > params.maxAge ? 'high' : 'medium';
    } else {
      recommendation = `Faltan ${daysToMaturity} días para que inicien la postura`;
    }
  } else {
    // Pollos de levante y engorde
    if (currentAge >= params.optimalAge) {
      recommendation = 'Los pollos están en peso y edad óptima para la venta';
      urgency = currentAge > params.maxAge ? 'high' : 'medium';
    } else if (currentAge >= params.minAge) {
      recommendation = 'Los pollos están listos para venta, pero pueden seguir creciendo';
      urgency = 'medium';
    } else {
      recommendation = `Faltan ${daysToMaturity} días para alcanzar la edad óptima de venta`;
    }

    // Ajustar recomendación según peso
    if (pesoPromedio > 0) {
      if (weightStatus === 'underweight' && currentAge >= params.minAge) {
        recommendation += '. Considere mejorar la alimentación para aumentar el peso';
        urgency = 'medium';
      } else if (weightStatus === 'overweight') {
        recommendation = 'Los pollos tienen sobrepeso. Considere venderlos pronto para evitar pérdidas';
        urgency = 'high';
      }
    }
  }

  return {
    isReady,
    daysToMaturity,
    weightStatus,
    ageStatus,
    recommendation,
    urgency
  };
};

/**
 * Obtiene el color asociado al estado de urgencia
 */
export const getUrgencyColor = (urgency: 'low' | 'medium' | 'high'): string => {
  switch (urgency) {
    case 'low': return '#4CAF50'; // Verde
    case 'medium': return '#FF9800'; // Naranja
    case 'high': return '#F44336'; // Rojo
  }
};

/**
 * Obtiene el icono asociado al estado de urgencia
 */
export const getUrgencyIcon = (urgency: 'low' | 'medium' | 'high'): string => {
  switch (urgency) {
    case 'low': return 'checkmark-circle';
    case 'medium': return 'warning';
    case 'high': return 'alert-circle';
  }
};










