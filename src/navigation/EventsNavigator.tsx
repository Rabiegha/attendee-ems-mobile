/**
 * Navigation pour la liste des événements
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventsListScreen } from '../screens/Events/EventsListScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';

export type EventsStackParamList = {
  EventsList: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export const EventsNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          paddingTop: 0,
        },
      }}
    >
      <Stack.Screen
        name="EventsList"
        component={EventsListScreen}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ 
          headerShown: false, // Pas de header, il est géré par SettingsScreen lui-même
        }}
      />
    </Stack.Navigator>
  );
};
