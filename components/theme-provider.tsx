import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getThemeColors } from '../src/constants/designSystem';

export type ThemeType = 'light' | 'dark' | 'auto';

interface ThemeContextValue {
  theme: ThemeType;
  isDark: boolean;
  colors: ReturnType<typeof getThemeColors>;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'auto',
  isDark: false,
  colors: getThemeColors('light'),
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('auto');
  
  // Determinar el tema efectivo
  const effectiveTheme = theme === 'auto' ? (systemColorScheme || 'light') : theme;
  const isDark = effectiveTheme === 'dark';
  const colors = getThemeColors(effectiveTheme);
  
  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };
  
  const value: ThemeContextValue = {
    theme,
    isDark,
    colors,
    toggleTheme,
    setTheme,
  };
  
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


