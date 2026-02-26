/**
 * Navigateur principal de l'application
 * Gère Auth → Events → EventInner
 */

import React, { useEffect, useState, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { checkAuthThunk } from '../store/auth.slice';
import { AuthNavigator } from './AuthNavigator';
import { EventsNavigator } from './EventsNavigator';
import { EventInnerTabs } from './EventInnerTabs';
import { PartnerInnerTabs } from './PartnerInnerTabs';
import { AttendeeDetailsScreen } from '../screens/EventDashboard/AttendeeDetailsScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type RootStackParamList = {
  Auth: undefined;
  Events: undefined;
  EventInner: { eventId: string; eventName: string };
  PartnerInner: { eventId: string; eventName: string };
  AttendeeDetails: { registrationId: string; eventId: string };
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme, colorScheme } = useTheme();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Créer un thème de navigation personnalisé basé sur notre thème
  const navigationTheme = useMemo(
    () => ({
      dark: colorScheme === 'dark',
      colors: {
        primary: theme.colors.brand[600],
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text.primary,
        border: theme.colors.border,
        notification: theme.colors.brand[600],
      },
      fonts: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400' as const,
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500' as const,
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '700' as const,
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '900' as const,
        },
      },
    }),
    [colorScheme, theme]
  );

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      await dispatch(checkAuthThunk()).unwrap();
    } catch (error) {
      // Utilisateur non authentifié
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const, backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <NavigationContainer 
        theme={navigationTheme}
        documentTitle={{
          formatter: () => 'Attendee EMS'
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'none',
            presentation: 'card',
          }}
        >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen 
              name="Events" 
              component={EventsNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="EventInner"
              component={EventInnerTabs}
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="PartnerInner"
              component={PartnerInnerTabs}
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="AttendeeDetails"
              component={AttendeeDetailsScreen}
              options={{
                headerShown: false,
                animation: 'none',
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                presentation: 'card',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
  );
};
