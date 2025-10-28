/**
 * Écran de liste des événements
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEventsThunk } from '../../store/events.slice';
import { Event } from '../../types/event';
import { formatDate, formatTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';

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

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const loadEvents = () => {
    dispatch(fetchEventsThunk({ status: activeTab, search: searchQuery }));
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventInner', { eventId: event.id, eventName: event.name });
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity onPress={() => handleEventPress(item)} activeOpacity={0.7}>
      <Card style={{ marginBottom: theme.spacing.md }}>
        <View style={styles.eventCard}>
          {/* Date et heure */}
          <View style={styles.dateContainer}>
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.tertiary,
                marginBottom: theme.spacing.xs,
              }}
            >
              {formatDate(item.startDate)}
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {formatTime(item.startDate)}
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.text.tertiary,
                marginTop: theme.spacing.xs,
              }}
            >
              {item.location || 'Autre'}
            </Text>
          </View>

          {/* Titre */}
          <View style={styles.eventInfo}>
            <Text
              style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}
            >
              {item.name}
            </Text>
            {item.description && (
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.xs,
                }}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

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
              borderBottomColor: theme.colors.success[600],
            },
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: activeTab === 'upcoming' ? theme.fontWeight.semibold : theme.fontWeight.normal,
              color: activeTab === 'upcoming' ? theme.colors.success[600] : theme.colors.text.secondary,
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
              borderBottomColor: theme.colors.success[600],
            },
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: activeTab === 'past' ? theme.fontWeight.semibold : theme.fontWeight.normal,
              color: activeTab === 'past' ? theme.colors.success[600] : theme.colors.text.secondary,
            }}
          >
            {t('events.past')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des événements */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        </View>
      ) : (
        <FlatList
          data={events}
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
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventCard: {
    flexDirection: 'row',
  },
  dateContainer: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  eventInfo: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
});
