/**
 * Écran Dashboard de l'événement avec Material Top Tabs
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../../theme/ThemeProvider';
import { GuestListScreen } from './GuestListScreen';
import { SessionsScreen } from './SessionsScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchEventByIdThunk } from '../../store/events.slice';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

interface EventDashboardScreenProps {
  route?: any;
}

export const EventDashboardScreen: React.FC<EventDashboardScreenProps> = ({ route: screenRoute }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { currentEvent } = useAppSelector((state) => state.events);
  const insets = useSafeAreaInsets();
  
  // Récupérer l'eventId depuis les params de la route
  const routeParams = (route.params || screenRoute?.params) as any;
  const eventId = routeParams?.eventId;
  
  console.log('[EventDashboardScreen] eventId:', eventId);
  console.log('[EventDashboardScreen] currentEvent:', currentEvent?.name);
  console.log('[EventDashboardScreen] stats:', currentEvent?.stats);
  
  // Charger l'événement si on a un ID (les stats sont incluses)
  useEffect(() => {
    if (eventId && (!currentEvent || currentEvent.id !== eventId)) {
      console.log('[EventDashboardScreen] Loading event with stats:', eventId);
      dispatch(fetchEventByIdThunk(eventId));
    }
  }, [eventId, dispatch]);
  
  const event = currentEvent;
  
  // Formater la date
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ' •');
  };

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        }
      ]}
    >
      {/* Header avec titre et bouton retour */}
      <View 
        style={[
          styles.header, 
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.colors.background }]}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-back" 
              size={34} 
              color={theme.colors.brand[600]} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerCenter}>
          <Text 
            style={[
              styles.eventTitle, 
              { 
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.bold,
              }
            ]}
            numberOfLines={1}
          >
            {event?.name || 'Événement'}
          </Text>
          <View style={styles.dateContainer}>
            <Text 
              style={[
                styles.eventDate, 
                { 
                  color: theme.colors.brand[600],
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                }
              ]}
            >
              {formatEventDate(event?.startDate)}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight} />
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
};const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerLeft: {
    width: 48,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    width: 48,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  eventTitle: {
    marginBottom: 4,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDate: {
  },
});
