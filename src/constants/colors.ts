/**
 * Sistema de colores actualizado para Gallinapp
 * Migrado del diseño anterior al nuevo sistema profesional
 */

export const colors = {
  // Colores principales - Colores de la marca Gallinapp
  primary: '#345DAD',      // Azul marca
  secondary: '#35354C',    // Gris azulado oscuro marca
  accent: '#E8EBF5',       // Azul muy claro
  accent2: '#345DAD',      // Azul principal marca
  accent3: '#5A75B8',      // Azul medio

  // Colores para estados
  success: '#2E7D32',      // Verde éxito
  warning: '#FF9800',      // Naranja advertencia  
  danger: '#F44336',       // Rojo error
  info: '#2196F3',         // Azul información
  error: '#F44336',        // Rojo error
  
  // Colores neutros - Actualizados con colores de la marca
  black: '#13131C',
  darkGray: '#35354C',     // Color secundario marca
  mediumGray: '#7A7A7A',
  lightGray: '#BFBFBF',    // Gris claro marca
  veryLightGray: '#E0E0E0',
  white: '#FFFFFF',
  gray: '#9D9D9D',         // Para compatibilidad
  lightBlue: '#E8EBF5',    // Azul claro basado en marca
  
  // Colores para módulos específicos - Adaptados a la marca
  ponedoras: '#345DAD',    // Azul marca para ponedoras
  israelies: '#5A75B8',    // Azul medio para israelíes/levante
  engorde: '#778EC9',      // Azul claro para engorde
  
  // Colores para gráficos - Adaptados a la marca
  chart1: '#345DAD',       // Azul marca
  chart2: '#5A75B8',       // Azul medio
  chart3: '#35354C',       // Gris azulado marca
  chart4: '#FF9800',       // Naranja advertencia
  chart5: '#2196F3',       // Azul información
  chart6: '#D2B48C',       // Color pollo
  
  // Colores para fondos - Actualizados
  background: '#FFFFFF',
  backgroundLight: '#F4F6F8',
  surface: '#F4F6F8',      // Para compatibilidad
  card: '#FFFFFF',
  
  // Colores para texto - Adaptados a la marca
  text: '#35354C',         // Texto principal (gris azulado marca)
  textDark: '#35354C',     // Texto oscuro marca
  textMedium: '#7A7A7A',
  textLight: '#BFBFBF',    // Gris claro marca
  textSecondary: '#7A7A7A', // Para compatibilidad
  textWhite: '#FFFFFF',
  border: '#BFBFBF',      // Borde con gris marca
  
  // Colores específicos del dominio avícola - Adaptados a la marca
  poultryPrimary: '#345DAD',   // Azul marca
  poultrySecondary: '#35354C',  // Gris azulado marca
  eggColor: '#FFD700',          // Color huevo (dorado)
  chickenColor: '#D2B48C',     // Color pollo
};

// Exportación para compatibilidad con el sistema de temas de Expo
export const Colors = {
  light: {
    text: colors.textDark,
    background: colors.background,
    tint: colors.primary,
    icon: colors.mediumGray,
    tabIconDefault: colors.lightGray,
    tabIconSelected: colors.primary,
  },
  dark: {
    text: colors.textWhite,
    background: colors.darkGray,
    tint: colors.accent,
    icon: colors.lightGray,
    tabIconDefault: colors.mediumGray,
    tabIconSelected: colors.accent,
  },
  
};

export default colors;