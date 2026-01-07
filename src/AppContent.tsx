/**
 * Contenu principal de l'app avec StatusBar adaptative
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar, setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from './theme/ThemeProvider';
import { AppNavigator } from './navigation/AppNavigator';
import { useTokenRestoration } from './hooks/useTokenRestoration';
import { ToastContainer } from './components/ui/ToastContainer';

export const AppContent: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  
  // Restaurer le token au démarrage
  useTokenRestoration();
  
  // Configurer les barres système selon le thème
  useEffect(() => {
    const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';
    
    // Forcer le style de la status bar
    setStatusBarStyle(statusBarStyle);
    
    if (Platform.OS === 'android') {
      // Configurer la status bar (barre du haut) sur Android
      setStatusBarBackgroundColor(theme.colors.background, true);
      
      // Configurer la navigation bar (barre du bas) sur Android
      NavigationBar.setBackgroundColorAsync(theme.colors.background);
      NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
    }
  }, [theme.colors.background, colorScheme]);
  
  return (
    <>
      <StatusBar 
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        translucent={true}
      />
      <AppNavigator />
      <ToastContainer />
    </>
  );
};
