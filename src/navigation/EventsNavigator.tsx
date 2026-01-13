/**
 * Navigation pour la liste des événements
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventsListScreen } from '../screens/Events/EventsListScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';

export type EventsStackParamList = {
  EventsList: undefined;
  Profile: undefined;
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
          backgroundColor: theme.colors.background,
          paddingTop: 0,
        },
        animation: 'none',
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="EventsList"
        component={EventsListScreen}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ 
          headerShown: false, // Pas de header, il est géré par ProfileScreen lui-même
        }}
      />
    </Stack.Navigator>
  );
};
