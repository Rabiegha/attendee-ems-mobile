/**
 * Écran Dashboard de l'événement avec Material Top Tabs
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../../theme/ThemeProvider';
import { GuestListScreen } from './GuestListScreen';
import { SessionsScreen } from './SessionsScreen';
import { useNavigation } from '@react-navigation/native';
import Icons from '../../assets/icons';
import { Image } from 'react-native';

const Tab = createMaterialTopTabNavigator();

export const EventDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header avec titre et bouton retour */}
      <View 
        style={[
          styles.header, 
          { 
            backgroundColor: theme.colors.background,
            borderBottomColor: theme.colors.divider,
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Image 
            source={Icons.Retour} 
            style={styles.backIcon}
            tintColor={theme.colors.brand[600]}
          />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text 
            style={[
              styles.eventTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
              }
            ]}
          >
            cionet-bt-cisco_2025
          </Text>
          <Text 
            style={[
              styles.eventDate, 
              { 
                color: theme.colors.brand[600],
                fontSize: theme.fontSize.sm,
              }
            ]}
          >
            04/11/2025 06:30 PM
          </Text>
        </View>
      </View>

      {/* Material Top Tabs */}
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.brand[600],
          tabBarInactiveTintColor: theme.colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: theme.colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.divider,
          },
          tabBarIndicatorStyle: {
            backgroundColor: theme.colors.brand[600],
            height: 3,
            borderRadius: 2,
          },
          tabBarPressColor: theme.colors.brand[100],
          swipeEnabled: true,
          animationEnabled: true,
        }}
      >
        <Tab.Screen 
          name="GuestList" 
          component={GuestListScreen}
          options={{
            tabBarLabel: 'GuestLists',
          }}
        />
        <Tab.Screen 
          name="Sessions" 
          component={SessionsScreen}
          options={{
            tabBarLabel: 'Sessions',
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerContent: {
    flex: 1,
  },
  eventTitle: {
    marginBottom: 4,
  },
  eventDate: {
  },
});
