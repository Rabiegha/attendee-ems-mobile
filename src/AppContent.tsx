/**
 * Contenu principal de l'app avec StatusBar adaptative
 */

import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform, StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from './theme/ThemeProvider';
import { AppNavigator } from './navigation/AppNavigator';

import { useSocketSync } from './hooks/useSocketSync';
import { usePrintJobNotifications } from './hooks/usePrintJobNotifications';
import { ToastContainer } from './components/ui/ToastContainer';
import { PrintStatusBanner } from './components/ui/PrintStatusBanner';
import { useAppDispatch } from './store/hooks';
import { clearAuth, restoreSessionThunk } from './store/auth.slice';
import { setOnAuthFailure } from './api/backend/axiosClient';

export const AppContent: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  const dispatch = useAppDispatch();
  
  const appState = useRef(AppState.currentState);

  // Configurer le callback de déconnexion automatique en cas d'échec d'auth
  useEffect(() => {
    setOnAuthFailure(() => {
      console.log('[AppContent] Auth failure detected, clearing auth state...');
      dispatch(clearAuth());
    });
  }, [dispatch]);

  // Point d'entrée UNIQUE pour la restauration de session au démarrage
  useEffect(() => {
    console.log('[AppContent] Bootstrapping auth session...');
    dispatch(restoreSessionThunk());
  }, [dispatch]);

  // Re-vérifier la session quand l'app revient au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[AppContent] App returned to foreground, verifying session...');
        dispatch(restoreSessionThunk({ silent: true }));
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [dispatch]);

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
