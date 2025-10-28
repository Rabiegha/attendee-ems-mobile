/**
 * ThemeProvider - Gère le thème de l'application
 * Supporte les modes: system, light, dark
 * Synchronise avec NativeWind et expose le thème via Context
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, Theme, ColorScheme } from './index';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@attendee_ems_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  );

  // Charger la préférence utilisateur au démarrage
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Calculer le colorScheme effectif
  useEffect(() => {
    const effectiveScheme =
      themeMode === 'system'
        ? systemColorScheme === 'dark'
          ? 'dark'
          : 'light'
        : themeMode;
    
    setColorScheme(effectiveScheme);
    
    // Synchroniser avec NativeWind
    if (typeof document !== 'undefined') {
      if (effectiveScheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'system' || savedMode === 'light' || savedMode === 'dark')) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la préférence de thème:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la préférence de thème:', error);
    }
  };

  const currentTheme = theme[colorScheme];

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        colorScheme,
        themeMode,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur de ThemeProvider');
  }
  return context;
};
