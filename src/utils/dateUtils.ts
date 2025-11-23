/**
 * Utilidades para manejo seguro de fechas
 */

/**
 * Convierte un valor a Date de forma segura
 */
export const toSafeDate = (value: any): Date => {
  if (!value) {
    return new Date();
  }
  
  if (value instanceof Date) {
    return value;
  }
  
  // Si es un Timestamp de Firestore
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Si es un string o número
  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Formatea una fecha de forma segura para mostrar en la UI
 */
export const formatDate = (value: any, locale: string = 'es-ES'): string => {
  try {
    const date = toSafeDate(value);
    return date.toLocaleDateString(locale);
  } catch (error) {
    console.warn('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha y hora de forma segura
 */
export const formatDateTime = (value: any, locale: string = 'es-ES'): string => {
  try {
    const date = toSafeDate(value);
    return date.toLocaleString(locale);
  } catch (error) {
    console.warn('Error al formatear fecha y hora:', error);
    return 'Fecha inválida';
  }
};

/**
 * Verifica si un valor es una fecha válida
 */
export const isValidDate = (value: any): boolean => {
  try {
    const date = toSafeDate(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Establece la hora de una fecha a medianoche (00:00:00.000)
 */
const setToMidnight = (date: Date): Date => {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return midnight;
};

/**
 * Calcula la diferencia en días entre dos fechas de forma segura
 * Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas.
 * Ejemplo: Si se crea a las 10:00 PM del día 1, cumple 1 día a las 00:00 del día 2.
 */
export const calculateDaysDifference = (startDate: any, endDate: any = new Date()): number => {
  try {
    const start = toSafeDate(startDate);
    const end = toSafeDate(endDate);
    
    if (!isValidDate(start) || !isValidDate(end)) {
      return 0;
    }
    
    // Establecer ambas fechas a medianoche (00:00:00.000)
    const startMidnight = setToMidnight(start);
    const endMidnight = setToMidnight(end);
    
    // Calcular diferencia en milisegundos
    const diffTime = endMidnight.getTime() - startMidnight.getTime();
    
    // Convertir a días (redondear hacia abajo)
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, days); // No permitir valores negativos
  } catch (error) {
    console.warn('Error al calcular diferencia de días:', error);
    return 0;
  }
};

/**
 * Calcula la edad en días de forma segura
 * Los días se calculan basándose en medianoche (00:00), no en 24 horas exactas.
 */
export const calculateAgeInDays = (birthDate: any): number => {
  return calculateDaysDifference(birthDate, new Date());
};
