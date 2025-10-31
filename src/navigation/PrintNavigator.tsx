/**
 * Navigateur pour les écrans d'impression
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PrintSettingsScreen } from '../screens/Print/PrintSettingsScreen';
import { PrintersListScreen } from '../screens/Print/PrintersListScreen';

export type PrintStackParamList = {
  PrintSettings: undefined;
  PrintersList: undefined;
};

const Stack = createNativeStackNavigator<PrintStackParamList>();

export const PrintNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
    </Stack.Navigator>
  );
};