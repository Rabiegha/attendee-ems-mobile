/**
 * Contenu principal de l'app avec StatusBar adaptative
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from './theme/ThemeProvider';
import { AppNavigator } from './navigation/AppNavigator';

export const AppContent: React.FC = () => {
  const { themeMode } = useTheme();
  
  // Déterminer le style de la StatusBar selon le mode
  // light = texte foncé (pour fond clair)
  // dark = texte clair (pour fond foncé)
  const statusBarStyle = themeMode === 'dark' ? 'light' : 'dark';
  
  return (
    <>
      <StatusBar style={statusBarStyle} />
      <AppNavigator />
    </>
  );
};
