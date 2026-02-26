/**
 * Point d'entrée de l'application Attendee EMS Mobile
 */

import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { useAppSelector } from './src/store/hooks';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { buildAbilityFor, defaultAbility } from './src/permissions/ability';
import { AbilityProvider } from './src/permissions/AbilityProvider';
import { AppContent } from './src/AppContent';
import { ToastProvider } from './src/contexts/ToastContext';
import './src/i18n';
// import './global.css';

// Composant de chargement pendant la rehydratation Redux
const LoadingView = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
    <ActivityIndicator size="large" color="#FFF" />
    <Text style={{ color: '#FFF', marginTop: 16 }}>Chargement...</Text>
  </View>
);

/**
 * Wrapper qui construit l'ability CASL à partir des permissions Redux
 * Se met à jour automatiquement quand le user change (login/logout)
 */
const AbilityGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const ability = useMemo(
    () => (permissions?.length ? buildAbilityFor(permissions) : defaultAbility),
    [permissions],
  );

  return <AbilityProvider ability={ability}>{children}</AbilityProvider>;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingView />} persistor={persistor}>
            <ThemeProvider>
              <ToastProvider>
                <AbilityGate>
                  <AppContent />
                </AbilityGate>
              </ToastProvider>
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
