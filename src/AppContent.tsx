/**
 * Contenu principal de l'app avec StatusBar adaptative
 */

import React, { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from './theme/ThemeProvider';
import { AppNavigator } from './navigation/AppNavigator';
import { useTokenRestoration } from './hooks/useTokenRestoration';
import { useSocketSync } from './hooks/useSocketSync';
import { usePrintJobNotifications } from './hooks/usePrintJobNotifications';
import { ToastContainer } from './components/ui/ToastContainer';
import { PrintStatusBanner } from './components/ui/PrintStatusBanner';
import { useAppDispatch } from './store/hooks';
import { clearAuth } from './store/auth.slice';
import { setOnAuthFailure } from './api/backend/axiosClient';

export const AppContent: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Configurer le callback de déconnexion automatique en cas d'échec d'auth
  useEffect(() => {
    setOnAuthFailure(() => {
      console.log('[AppContent] Auth failure detected, clearing auth state...');
      dispatch(clearAuth());
    });
  }, [dispatch]);
  
  // Restaurer le token au démarrage
  useTokenRestoration();
  
  // Synchroniser les données via WebSocket
  useSocketSync();
  
  // Notifications en temps réel pour les jobs d'impression
  usePrintJobNotifications();
  
  // Configurer les barres système selon le thème
  useEffect(() => {
    const barStyle = colorScheme === 'dark' ? 'light-content' : 'dark-content';
    
    console.log('[AppContent] Updating status bar:', { colorScheme, barStyle });
    
    // Configurer la status bar avec l'API native
    StatusBar.setBarStyle(barStyle, true);
    StatusBar.setTranslucent(true);
    
    if (Platform.OS === 'android') {
      // Configurer la navigation bar (barre du bas) sur Android
      NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
    }
  }, [colorScheme]);
  
  return (
    <>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        translucent={true}
        backgroundColor="transparent"
      />
      <AppNavigator />
      <ToastContainer />
      <PrintStatusBanner />
    </>
  );
};
