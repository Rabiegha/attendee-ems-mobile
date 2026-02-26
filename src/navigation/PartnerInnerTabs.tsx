/**
 * PartnerInnerTabs - Bottom Tab Navigation pour les partenaires
 * 3 onglets : Scan (central), Ma Liste, Profil
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import Icons from '../assets/icons';
import { PartnerScanScreen } from '../screens/Partner/PartnerScanScreen';
import { PartnerListScreen } from '../screens/Partner/PartnerListScreen';
import { PartnerScanDetailScreen } from '../screens/Partner/PartnerScanDetailScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';

// ── Stack pour l'onglet "Ma Liste" (liste → détail) ──

export type PartnerListStackParamList = {
  PartnerListMain: { eventId: string };
  PartnerScanDetail: { scanId: string; eventId: string };
};

const ListStack = createNativeStackNavigator<PartnerListStackParamList>();

const PartnerListNavigator: React.FC<{ route: any }> = ({ route }) => {
  const { theme } = useTheme();
  const eventId = route.params?.eventId;

  return (
    <ListStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'none',
      }}
    >
      <ListStack.Screen
        name="PartnerListMain"
        component={PartnerListScreen}
        initialParams={{ eventId }}
      />
      <ListStack.Screen
        name="PartnerScanDetail"
        component={PartnerScanDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </ListStack.Navigator>
  );
};

// ── Bottom Tab (Scan, Ma Liste, Profil) ──

export type PartnerTabsParamList = {
  PartnerScan: { eventId: string };
  PartnerList: { eventId: string };
  PartnerProfile: undefined;
};

const Tab = createBottomTabNavigator<PartnerTabsParamList>();

interface PartnerInnerTabsProps {
  route: any;
}

export const PartnerInnerTabs: React.FC<PartnerInnerTabsProps> = ({ route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute' as const,
          bottom: Math.max(insets.bottom, 20),
          marginHorizontal: 16,
          height: 70,
          backgroundColor: theme.colors.tabBar,
          borderRadius: 24,
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
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="PartnerList"
        component={PartnerListNavigator}
        initialParams={{ eventId }}
        options={{
          tabBarLabel: 'Mes Contacts',
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
        name="PartnerScan"
        component={PartnerScanScreen}
        initialParams={{ eventId }}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.scanButton, { backgroundColor: theme.colors.brand[600] }]}>
              <Image
                source={Icons.Scan}
                style={[styles.scanIcon, { tintColor: '#FFFFFF' }]}
                resizeMode="contain"
                fadeDuration={0}
              />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="PartnerProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => (
            <Image
              source={Icons.Profil}
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

