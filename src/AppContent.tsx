/**
 * Contenu principal de l'app avec StatusBar adaptative
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from './theme/ThemeProvider';
import { AppNavigator } from './navigation/AppNavigator';
import { useTokenRestoration } from './hooks/useTokenRestoration';

export const AppContent: React.FC = () => {
  const { themeMode } = useTheme();
  
  // Restaurer le token au démarrage
  useTokenRestoration();
  
  return (
    <>
      <StatusBar 
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <AppNavigator />
    </>
  );
};
