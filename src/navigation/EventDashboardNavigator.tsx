/**
 * Stack Navigator pour EventDashboard
 * Permet de naviguer entre le Dashboard (avec tabs) et la liste des participants
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventDashboardScreen } from '../screens/EventDashboard/EventDashboardScreen';
import { AttendeesListScreen } from '../screens/EventDashboard/AttendeesListScreen';
import { useTheme } from '../theme/ThemeProvider';

export type EventDashboardStackParamList = {
  DashboardTabs: { eventId?: string };
  AttendeesList: { eventId: string };
};

const Stack = createNativeStackNavigator<EventDashboardStackParamList>();

interface EventDashboardNavigatorProps {
  route: any;
}

export const EventDashboardNavigator: React.FC<EventDashboardNavigatorProps> = ({ route }) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="DashboardTabs"
        component={EventDashboardScreen}
        initialParams={route.params}
      />
      <Stack.Screen
        name="AttendeesList"
        component={AttendeesListScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
