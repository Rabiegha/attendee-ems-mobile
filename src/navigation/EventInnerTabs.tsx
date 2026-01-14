/**
 * Bottom Tab Navigation pour le contexte d'un événement
 * Style flottant avec bouton Scan central proéminent
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import Icons from '../assets/icons';
import { EventDashboardNavigator } from './EventDashboardNavigator';
import { AttendeeAddScreen } from '../screens/Attendees/AttendeeAddScreen';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { PrintNavigator } from './PrintNavigator';

export type EventInnerTabsParamList = {
  Dashboard: { eventId: string };
  Attendees: { eventId: string };
  Scan: { eventId: string };
  Print: undefined;
};

const Tab = createBottomTabNavigator<EventInnerTabsParamList>();

interface EventInnerTabsProps {
  route: any;
}

export const EventInnerTabs: React.FC<EventInnerTabsProps> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarStyle: {
          position: 'absolute' as const,
          bottom: Math.max(insets.bottom, 20),
          marginHorizontal: 16, // Même padding que searchContainer et cards
          height: 70,
          backgroundColor: theme.colors.tabBar,
          borderRadius: theme.radius.xl,
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: theme.colors.brand[600],
        tabBarInactiveTintColor: theme.colors.tabBarText,
        tabBarLabelStyle: {
          fontSize: theme.fontSize.xs,
          fontWeight: theme.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={EventDashboardNavigator}
        initialParams={{ eventId }}
        options={{
          tabBarLabel: t('navigation.participants'),
          tabBarButton: () => null, 
          tabBarItemStyle: { display: 'none' }, // Ensure it takes no space
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Participant} 
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
              fadeDuration={0}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Attendees"
        component={AttendeeAddScreen}
        initialParams={{ eventId }}
        options={{
          tabBarLabel: t('navigation.add'),
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Ajouts} 
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
              fadeDuration={0}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        initialParams={{ eventId }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.scanButton}>
              <Image 
                source={Icons.Scan} 
                style={[styles.scanIcon, { tintColor: "#FFFFFF" }]}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Print"
        component={PrintNavigator}
        options={{
          tabBarLabel: t('navigation.print'),
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Print} 
              style={[styles.tabIcon, { tintColor: color }]}
              resizeMode="contain"
              fadeDuration={0}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
  scanButton: {
    width: 90,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2563EB', // Couleur fixe pour éviter les problèmes de thème
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanIcon: {
    width: 35,
    height: 35,
  },
});
