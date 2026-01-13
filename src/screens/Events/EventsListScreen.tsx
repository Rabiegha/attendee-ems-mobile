/**
 * Écran de liste des événements avec Material Top Tabs
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { SearchBar } from '../../components/ui/SearchBar';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import Icons from '../../assets/icons';
import { OngoingEventsScreen } from './OngoingEventsScreen';
import { UpcomingEventsScreen } from './UpcomingEventsScreen';
import { PastEventsScreen } from './PastEventsScreen';
import { EventSearchProvider, useEventSearch } from '../../contexts/EventSearchContext';

const Tab = createMaterialTopTabNavigator();

interface EventsListScreenProps {
  navigation: any;
}

const EventsListContent: React.FC<EventsListScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { searchQuery, setSearchQuery } = useEventSearch();
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }
      ]}
    >
      {/* Header unifié */}
      <Header
        title={t('events.title')}
        showBackButton={false}
        rightComponent={<ProfileButton />}
      />

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
          name="Ongoing" 
          options={{
            tabBarLabel: 'En cours',
          }}
          component={OngoingEventsScreen}
          initialParams={{ navigation }}
        />
        <Tab.Screen 
          name="Upcoming" 
          options={{
            tabBarLabel: t('events.upcoming'),
          }}
          component={UpcomingEventsScreen}
          initialParams={{ navigation }}
        />
        <Tab.Screen 
          name="Past"
          options={{
            tabBarLabel: t('events.past'),
          }}
          component={PastEventsScreen}
          initialParams={{ navigation }}
        />
      </Tab.Navigator>
    </View>
  );
};

export const EventsListScreen: React.FC<EventsListScreenProps> = ({ navigation }) => {
  return (
    <EventSearchProvider>
      <EventsListContent navigation={navigation} />
    </EventSearchProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
