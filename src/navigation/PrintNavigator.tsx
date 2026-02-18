/**
 * Navigateur pour les écrans d'impression
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PrintSettingsScreen } from '../screens/Print/PrintSettingsScreen';
import { PrintersListScreen } from '../screens/Print/PrintersListScreen';
import { EmsPrintersListScreen } from '../screens/Print/EmsPrintersListScreen';
import { useTheme } from '../theme/ThemeProvider';

export type PrintStackParamList = {
  PrintSettings: undefined;
  PrintersList: undefined;
  EmsPrintersList: undefined;
};

const Stack = createNativeStackNavigator<PrintStackParamList>();

export const PrintNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'none',
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name="PrintSettings"
        component={PrintSettingsScreen}
      />
      <Stack.Screen
        name="PrintersList"
        component={PrintersListScreen}
      />
      <Stack.Screen
        name="EmsPrintersList"
        component={EmsPrintersListScreen}
      />
    </Stack.Navigator>
  );
};