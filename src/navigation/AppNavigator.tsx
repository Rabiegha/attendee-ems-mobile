/**
 * Navigateur principal de l'application
 * Gère Auth → Events → EventInner
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthThunk } from '../store/auth.slice';
import { AuthNavigator } from './AuthNavigator';
import { EventsNavigator } from './EventsNavigator';
import { EventInnerTabs } from './EventInnerTabs';
import { AttendeeDetailsScreen } from '../screens/Attendees/AttendeeDetailsScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type RootStackParamList = {
  Auth: undefined;
  Events: undefined;
  EventInner: { eventId: string; eventName: string };
  AttendeeDetails: { attendeeId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false); // DÉSACTIVÉ pour test

  // useEffect(() => {
  //   checkAuthentication();
  // }, []);

  // const checkAuthentication = async () => {
  //   try {
  //     await dispatch(checkAuthThunk()).unwrap();
  //   } catch (error) {
  //     // Utilisateur non authentifié
  //   } finally {
  //     setIsCheckingAuth(false);
  //   }
  // };

  // if (isCheckingAuth) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: theme.colors.background }}>
  //       <ActivityIndicator size="large" color={theme.colors.brand[600]} />
  //     </View>
  //   );
  // }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Events" component={EventsNavigator} />
            <Stack.Screen
              name="EventInner"
              component={EventInnerTabs}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.eventName || 'Événement',
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.text.primary,
              })}
            />
            <Stack.Screen
              name="AttendeeDetails"
              component={AttendeeDetailsScreen}
              options={{
                headerShown: true,
                title: 'Détails du participant',
                headerStyle: {
                  backgroundColor: theme.colors.surface,
                },
                headerTintColor: theme.colors.text.primary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
