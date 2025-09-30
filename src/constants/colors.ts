/**
 * Colores para la aplicación Asoaves
 */

export const colors = {
  // Colores principales
  primary: '#0A3D62', // Azul oscuro del logo
  secondary: '#3282B8', // Azul más claro
  accent: '#BBE1FA', // Azul muy claro
  accent2: '#0A3D62', // Azul oscuro del logo
  accent3: '#3282B8', // Azul más claro

  // UI


  
  // Colores para estados
  success: '#2ECC71', // Verde
  warning: '#F39C12', // Amarillo
  danger: '#E74C3C', // Rojo
  info: '#3498DB', // Azul
  error: '#E74C3C', // Rojo
  
  // Colores neutros
  black: '#000000',
  darkGray: '#333333',
  mediumGray: '#666666',
  lightGray: '#999999',
  veryLightGray: '#E0E0E0',
  white: '#FFFFFF',
  
  // Colores para módulos específicos
  ponedoras: '#1E8449', // Verde para módulo de ponedoras
  israelies: '#E67E22', // Naranja para módulo de israelíes
  engorde: '#9B59B6', // Morado para módulo de engorde
  
  // Colores para gráficos
  chart1: '#3498DB',
  chart2: '#2ECC71',
  chart3: '#F1C40F',
  chart4: '#E74C3C',
  chart5: '#9B59B6',
  chart6: '#1ABC9C',
  
  // Colores para fondos
  background: '#F5F7FA',
  backgroundLight: '#F5F7FA',
  card: '#FFFFFF',
  
  // Colores para texto
  textDark: '#333333',
  textMedium: '#666666',
  textLight: '#999999',
  textWhite: '#FFFFFF',
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