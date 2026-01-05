/**
 * Contenu principal de l'app avec StatusBar adaptative
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from './theme/ThemeProvider';
import { AppNavigator } from './navigation/AppNavigator';
import { useTokenRestoration } from './hooks/useTokenRestoration';
import { ToastContainer } from './components/ui/ToastContainer';

export const AppContent: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  
  // Restaurer le token au démarrage
  useTokenRestoration();
  
  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <AppNavigator />
      <ToastContainer />
    </>
  );
};
