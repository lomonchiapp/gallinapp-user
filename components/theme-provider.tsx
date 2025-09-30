import React, { createContext, useContext } from 'react';

type ThemeType = 'light' | 'dark';

const ThemeContext = createContext<ThemeType>('light');

export function useTheme(): ThemeType {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  value: ThemeType;
  children: React.ReactNode;
}

export function ThemeProvider({ value, children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


