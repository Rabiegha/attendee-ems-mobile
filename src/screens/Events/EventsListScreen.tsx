/**
 * Écran de liste des événements avec Material Top Tabs
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch } from '../../store/hooks';
import { fetchEventsThunk } from '../../store/events.slice';
import { SearchBar } from '../../components/ui/SearchBar';
import Icons from '../../assets/icons';
import { UpcomingEventsScreen } from './UpcomingEventsScreen';
import { PastEventsScreen } from './PastEventsScreen';

const Tab = createMaterialTopTabNavigator();

interface EventsListScreenProps {
  navigation: any;
}

export const EventsListScreen: React.FC<EventsListScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');

  // Configurer le header avec le bouton paramètres
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={{ marginRight: 16 }}
        >
          <Image 
            source={Icons.Outils} 
            style={{ width: 24, height: 24 }} 
            tintColor={theme.colors.brand[600]}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    dispatch(fetchEventsThunk({ search: searchQuery }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={loadEvents}
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
          name="Upcoming" 
          options={{
            tabBarLabel: t('events.upcoming'),
          }}
        >
          {() => <UpcomingEventsScreen navigation={navigation} onRefresh={loadEvents} />}
        </Tab.Screen>
        <Tab.Screen 
          name="Past"
          options={{
            tabBarLabel: t('events.past'),
          }}
        >
          {() => <PastEventsScreen navigation={navigation} onRefresh={loadEvents} />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
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
