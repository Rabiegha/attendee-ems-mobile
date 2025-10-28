/**
 * Navigation pour la liste des événements
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventsListScreen } from '../screens/Events/EventsListScreen';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';

export type EventsStackParamList = {
  EventsList: undefined;
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export const EventsNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="EventsList"
        component={EventsListScreen}
        options={{ title: t('events.title') }}
      />
    </Stack.Navigator>
  );
};
