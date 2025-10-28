/**
 * Écran de liste des événements
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEventsThunk } from '../../store/events.slice';
import { Event } from '../../types/event';
import { formatDate, formatTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import Icons from '../../assets/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EventsListScreenProps {
  navigation: any;
}

export const EventsListScreen: React.FC<EventsListScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { events, isLoading } = useAppSelector((state) => state.events);

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

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
  }, [navigation]);

  useEffect(() => {
    loadEvents();
    // Scroll vers la bonne page quand on change d'onglet
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: activeTab === 'upcoming' ? 0 : SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [activeTab]);

  const loadEvents = () => {
    // Ne pas envoyer le status au backend, on filtrera côté frontend
    dispatch(fetchEventsThunk({ search: searchQuery }));
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventInner', { eventId: event.id, eventName: event.name });
  };

  // Filtrer les événements selon l'onglet actif
  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return eventDate >= now;
    } else {
      return eventDate < now;
    }
  });

  const renderEventCard = ({ item }: { item: Event }) => {
    console.log('[EventCard] Rendering:', { 
      id: item.id, 
      name: item.name, 
      hasName: !!item.name,
      description: item.description?.substring(0, 50),
    });

    return (
      <TouchableOpacity onPress={() => handleEventPress(item)} activeOpacity={0.7}>
        <Card style={{ marginBottom: theme.spacing.md }}>
          <View style={styles.eventCard}>
            {/* Colonne de gauche : Date et heure */}
            <View style={styles.dateColumn}>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  textAlign: 'center',
                }}
              >
                {formatDate(item.startDate)}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.primary,
                  fontWeight: theme.fontWeight.semibold,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {formatTime(item.startDate)}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {item.location || 'En ligne'}
              </Text>
            </View>

            {/* Colonne de droite : Infos */}
            <View style={styles.eventInfo}>
              {/* Titre - TOUJOURS affiché */}
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name || 'Événement sans titre'}
              </Text>

              {/* Description - TOUJOURS 2 lignes pour cohérence */}
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
                  lineHeight: 18,
                  height: 36, // 2 lignes * 18 de lineHeight
                }}
                numberOfLines={2}
              >
                {item.description || ' '}
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.text.primary,
              borderRadius: theme.radius.md,
              paddingHorizontal: theme.spacing.md,
            },
          ]}
          placeholder={t('common.search')}
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadEvents}
        />
      </View>

      {/* Onglets */}
      <View style={[styles.tabsContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'upcoming' && {
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.brand[600],
            },
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: activeTab === 'upcoming' ? theme.fontWeight.semibold : theme.fontWeight.normal,
              color: activeTab === 'upcoming' ? theme.colors.brand[600] : theme.colors.text.secondary,
            }}
          >
            {t('events.upcoming')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'past' && {
              borderBottomWidth: 2,
              borderBottomColor: theme.colors.brand[600],
            },
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: activeTab === 'past' ? theme.fontWeight.semibold : theme.fontWeight.normal,
              color: activeTab === 'past' ? theme.colors.brand[600] : theme.colors.text.secondary,
            }}
          >
            {t('events.past')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des événements avec swipe horizontal */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const newTab = offsetX > SCREEN_WIDTH / 2 ? 'past' : 'upcoming';
          if (newTab !== activeTab) {
            setActiveTab(newTab);
          }
        }}
      >
        {/* Page À venir */}
        <View style={{ width: SCREEN_WIDTH }}>
          {isLoading && activeTab === 'upcoming' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.brand[600]} />
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: theme.spacing.lg }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.base }}>
                    {t('events.noEvents')}
                  </Text>
                </View>
              }
              refreshing={isLoading}
              onRefresh={loadEvents}
            />
          )}
        </View>

        {/* Page Passés */}
        <View style={{ width: SCREEN_WIDTH }}>
          {isLoading && activeTab === 'past' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.brand[600]} />
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: theme.spacing.lg }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.base }}>
                    {t('events.noEvents')}
                  </Text>
                </View>
              }
              refreshing={isLoading}
              onRefresh={loadEvents}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingVertical: 12,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
  },
  tabsContainer: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  eventCard: {
    flexDirection: 'row' as const,
  },
  dateColumn: {
    marginRight: 16,
    minWidth: 80,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'flex-start' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 48,
  },
});
