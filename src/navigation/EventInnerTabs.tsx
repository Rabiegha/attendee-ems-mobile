/**
 * Bottom Tab Navigation pour le contexte d'un événement
 * Style flottant avec bouton Scan central proéminent
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import Icons from '../assets/icons';
import { EventDashboardScreen } from '../screens/EventDashboard/EventDashboardScreen';
import { AttendeesListScreen } from '../screens/Attendees/AttendeesListScreen';
import { ScanScreen } from '../screens/Scan/ScanScreen';
import { PrintSettingsScreen } from '../screens/Print/PrintSettingsScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';

export type EventInnerTabsParamList = {
  Dashboard: undefined;
  Attendees: { eventId: string };
  Scan: undefined;
  Print: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<EventInnerTabsParamList>();

interface EventInnerTabsProps {
  route: any;
}

export const EventInnerTabs: React.FC<EventInnerTabsProps> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const eventId = route.params?.eventId;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute' as const,
          bottom: 20,
          left: 20,
          right: 20,
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
        component={EventDashboardScreen}
        options={{
          tabBarLabel: t('navigation.participants'),
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Participant} 
              style={{ width: 24, height: 24 }}
              tintColor={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Attendees"
        component={AttendeesListScreen}
        initialParams={{ eventId }}
        options={{
          tabBarLabel: t('navigation.add'),
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Ajouts} 
              style={{ width: 24, height: 24 }}
              tintColor={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: theme.colors.brand[600],
                justifyContent: 'center' as const,
                alignItems: 'center' as const,
                marginTop: -30,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Image 
                source={Icons.ScanCamera} 
                style={{ width: 32, height: 32 }}
                tintColor="#FFFFFF"
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Print"
        component={PrintSettingsScreen}
        options={{
          tabBarLabel: t('navigation.print'),
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Print} 
              style={{ width: 24, height: 24 }}
              tintColor={color}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('navigation.menu'),
          tabBarIcon: ({ color }) => (
            <Image 
              source={Icons.Outils} 
              style={{ width: 24, height: 24 }}
              tintColor={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({});
