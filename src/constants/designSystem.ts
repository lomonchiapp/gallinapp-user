/**
 * Sistema de Diseño Gallinapp
 * Definiciones centralizadas para mantener consistencia visual
 */

// Sistema de colores adaptivo para light/dark mode
const lightColors = {
  // Colores primarios - Azul de la marca
  primary: {
    50: '#E8EBF5',
    100: '#C3CCE8',
    200: '#9DADD9',
    300: '#778EC9',
    400: '#5A75B8',
    500: '#345DAD',  // Principal - Azul marca
    600: '#2D5199',
    700: '#254480',
    800: '#1E3766',
    900: '#132547',
  },
  
  // Colores secundarios - Gris azulado oscuro de la marca
  secondary: {
    50: '#E8E8EA',
    100: '#C3C3C7',
    200: '#9D9DA3',
    300: '#777780',
    400: '#5A5A64',
    500: '#35354C',  // Principal - Gris azulado oscuro marca
    600: '#2D2D41',
    700: '#252536',
    800: '#1E1E2B',
    900: '#13131C',
  },
  
  // Colores neutros para light mode
  neutral: {
    0: '#FFFFFF',
    50: '#F8F9FA',
    100: '#F1F3F4',
    200: '#E8EAED',
    300: '#DADCE0',
    400: '#BDC1C6',
    500: '#9AA0A6',
    600: '#80868B',
    700: '#5F6368',
    800: '#3C4043',
    900: '#202124',
  },
  
  // Backgrounds y superficies
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F4',
  },
  
  // Texto
  text: {
    primary: '#202124',
    secondary: '#5F6368',
    tertiary: '#80868B',
    inverse: '#FFFFFF',
  },
  
  // Bordes y divisores
  border: {
    light: '#E8EAED',
    medium: '#DADCE0',
    strong: '#BDC1C6',
  },
  
  // Colores semánticos
  success: {
    50: '#E8F5E8',
    500: '#2E7D32',  // Verde éxito
    900: '#1B5E20',
  },
  
  warning: {
    50: '#FFF8E1',
    500: '#FF9800',  // Naranja advertencia
    900: '#E65100',
  },
  
  error: {
    50: '#FFEBEE',
    500: '#F44336',  // Rojo error
    900: '#B71C1C',
  },
  
  info: {
    50: '#E3F2FD',
    500: '#2196F3',  // Azul información
    900: '#0D47A1',
  },
  
  // Colores específicos del dominio avícola (adaptados a la marca)
  poultry: {
    egg: '#FFD700',        // Color huevo (dorado)
    chicken: '#D2B48C',    // Color pollo
    feed: '#8B4513',       // Color alimento
    health: '#4CAF50',     // Color salud/bienestar
    growth: '#66BB6A',     // Color crecimiento
  }
};

const darkColors = {
  // Colores primarios ajustados para dark mode
  primary: {
    50: '#132547',
    100: '#1E3766',
    200: '#254480',
    300: '#2D5199',
    400: '#345DAD',
    500: '#5A75B8',  // Más claro en dark mode
    600: '#778EC9',
    700: '#9DADD9',
    800: '#C3CCE8',
    900: '#E8EBF5',
  },
  
  // Colores secundarios ajustados para dark mode
  secondary: {
    50: '#13131C',
    100: '#1E1E2B',
    200: '#252536',
    300: '#2D2D41',
    400: '#35354C',
    500: '#5A5A64',
    600: '#777780',
    700: '#9D9DA3',
    800: '#C3C3C7',
    900: '#E8E8EA',
  },
  
  // Colores neutros para dark mode
  neutral: {
    0: '#000000',
    50: '#0D1117',
    100: '#161B22',
    200: '#21262D',
    300: '#30363D',
    400: '#484F58',
    500: '#6E7681',
    600: '#8B949E',
    700: '#B1BAC4',
    800: '#C9D1D9',
    900: '#F0F6FC',
  },
  
  // Backgrounds y superficies para dark mode
  background: {
    primary: '#000000',
    secondary: '#0D1117',
    tertiary: '#161B22',
  },
  
  // Texto para dark mode
  text: {
    primary: '#F0F6FC',
    secondary: '#C9D1D9',
    tertiary: '#8B949E',
    inverse: '#202124',
  },
  
  // Bordes y divisores para dark mode
  border: {
    light: '#21262D',
    medium: '#30363D',
    strong: '#484F58',
  },
  
  // Colores semánticos para dark mode
  success: {
    50: '#1B5E20',
    500: '#4CAF50',  // Verde éxito más claro en dark mode
    900: '#81C784',
  },
  
  warning: {
    50: '#E65100',
    500: '#FF9800',  // Naranja advertencia
    900: '#FFB74D',
  },
  
  error: {
    50: '#B71C1C',
    500: '#F44336',  // Rojo error
    900: '#E57373',
  },
  
  info: {
    50: '#0D47A1',
    500: '#2196F3',  // Azul información
    900: '#64B5F6',
  },
  
  // Colores específicos del dominio avícola (adaptados a la marca)
  poultry: {
    egg: '#FFD700',        // Color huevo (dorado)
    chicken: '#D2B48C',    // Color pollo
    feed: '#8B4513',       // Color alimento
    health: '#4CAF50',     // Color salud/bienestar
    growth: '#66BB6A',     // Color crecimiento
  }
};

// Función para obtener colores según el theme
export const getThemeColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? darkColors : lightColors;
};

// Colores base (mantener compatibilidad)
export const colors = lightColors;

// Tipografía
export const typography = {
  fonts: {
    primary: 'System', // React Native usa fuentes del sistema por defecto
    mono: 'Menlo',
  },
  
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  }
};

// Espaciado
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

// Radios de borde
export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Sombras
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Breakpoints para responsividad
export const breakpoints = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// Configuraciones de animación
export const animations = {
  durations: {
    fastest: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slowest: 800,
  },
  
  easings: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
};

// Configuraciones específicas de componentes
export const components = {
  button: {
    heights: {
      sm: 32,
      base: 44,
      lg: 56,
    },
    paddingHorizontal: {
      sm: 16,
      base: 20,
      lg: 24,
    }
  },
  
  input: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: typography.sizes.base,
  },
  
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  
  modal: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
  }
};

// Utilidades para consistencia
export const getColor = (color: string, shade: number = 500) => {
  const colorObj = colors[color as keyof typeof colors] as any;
  if (typeof colorObj === 'string') return colorObj;
  return colorObj?.[shade] || colors.neutral[500];
};

export const getSpacing = (size: keyof typeof spacing) => spacing[size];

export const getBorderRadius = (size: keyof typeof borderRadius) => borderRadius[size];

export const getShadow = (size: keyof typeof shadows) => shadows[size];
