/**
 * Point d'entrée de l'application Attendee EMS Mobile
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { ThemeProvider } from './src/theme/ThemeProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { buildAbilityFor, defaultAbility } from './src/permissions/ability';
import { AbilityProvider } from './src/permissions/AbilityProvider';
import './src/i18n';
// import './global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <ThemeProvider>
            <AbilityProvider ability={defaultAbility}>
              <StatusBar style="auto" />
              <AppNavigator />
            </AbilityProvider>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
