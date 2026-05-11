import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AstraTheme = 'Solar' | 'Lunar' | 'Nebula';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string[];
}

const Themes: Record<AstraTheme, ThemeColors> = {
  Solar: {
    primary: '#ff7a00',
    secondary: '#ffb347',
    accent: '#ff3b30',
    background: ['#1c1d2e', '#0d0d16'],
  },
  Lunar: {
    primary: '#94a3b8',
    secondary: '#cbd5e1',
    accent: '#334155',
    background: ['#0f172a', '#020617'],
  },
  Nebula: {
    primary: '#a855f7',
    secondary: '#c084fc',
    accent: '#3b82f6',
    background: ['#1e1b4b', '#020617'],
  }
};

interface ThemeContextType {
  theme: AstraTheme;
  colors: ThemeColors;
  setTheme: (t: AstraTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AstraTheme>('Solar');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem('astra_theme');
    if (saved) setThemeState(saved as AstraTheme);
  };

  const setTheme = async (t: AstraTheme) => {
    setThemeState(t);
    await AsyncStorage.setItem('astra_theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors: Themes[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAstraTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAstraTheme must be used within ThemeProvider');
  return context;
}
