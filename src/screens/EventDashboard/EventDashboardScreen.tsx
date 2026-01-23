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
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { GuestListSkeleton } from '../../components/skeletons/GuestListSkeleton';

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
  // Utiliser une ref pour éviter les chargements multiples
  const loadingRef = React.useRef(false);
  
  useEffect(() => {
    if (eventId && (!currentEvent || currentEvent.id !== eventId) && !loadingRef.current) {
      console.log('[EventDashboardScreen] Loading event with stats:', eventId);
      loadingRef.current = true;
      
      dispatch(fetchEventByIdThunk(eventId)).finally(() => {
        loadingRef.current = false;
      });
    }
  }, [eventId, currentEvent?.id, dispatch]);
  
  const event = currentEvent;
  
  // Vérifier si on affiche le bon événement
  const isLoadingWrongEvent = !currentEvent || currentEvent.id !== eventId;
  
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
      {/* Header unifié */}
      <Header
        title={event?.name || 'Événement'}
        subtitle={formatEventDate(event?.startDate)}
        onBack={() => navigation.goBack()}
        rightComponent={<ProfileButton />}
      />

      {/* Afficher un loader si on charge un nouvel événement */}
      {isLoadingWrongEvent ? (
        <GuestListSkeleton />
      ) : (
        <>
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
        </>
      )}
    </View>
  );
};const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
