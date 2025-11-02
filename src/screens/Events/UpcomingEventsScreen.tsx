/**
 * Écran des événements à venir
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchUpcomingEventsThunk, fetchMoreUpcomingEventsThunk } from '../../store/events.slice';
import { Event } from '../../types/event';
import { formatDate, formatTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';

interface UpcomingEventsScreenProps {
  navigation: any;
  onRefresh: () => void;
}

export const UpcomingEventsScreen: React.FC<UpcomingEventsScreenProps> = ({ 
  navigation,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Utiliser le state upcoming
  const { events, isLoading, isLoadingMore, hasMore } = useAppSelector((state) => state.events.upcoming);

  // Charger les événements au montage UNIQUEMENT
  useEffect(() => {
    if (events.length === 0) {
      console.log('[UpcomingEventsScreen] Initial load - Loading upcoming events');
      dispatch(fetchUpcomingEventsThunk({}));
    }
  }, []); // Dépendances vides = une seule fois

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventInner', { eventId: event.id, eventName: event.name });
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      console.log('[UpcomingEventsScreen] Loading more events...');
      dispatch(fetchMoreUpcomingEventsThunk({}));
    }
  };

  const handleRefresh = () => {
    console.log('[UpcomingEventsScreen] Refreshing events...');
    dispatch(fetchUpcomingEventsThunk({ page: 1 }));
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.brand[600]} />
        <Text style={{ color: theme.colors.text.secondary, marginLeft: 8 }}>
          Chargement...
        </Text>
      </View>
    );
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    // Détecter si l'événement est aujourd'hui
    const today = new Date();
    const eventDate = new Date(item.startDate);
    const isToday = 
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear();

    return (
      <TouchableOpacity onPress={() => handleEventPress(item)} activeOpacity={0.7}>
        <Card 
          style={[
            { marginBottom: theme.spacing.md },
            ...(isToday ? [{
              backgroundColor: theme.colors.brand[50],
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.brand[600],
            }] : [])
          ]}
        >
          <View style={styles.eventCard}>
            {/* Colonne de gauche : Date et heure */}
            <View style={styles.dateColumn}>
              {isToday && (
                <View style={[styles.todayBadge, { backgroundColor: theme.colors.brand[600] }]}>
                  <Text style={[styles.todayBadgeText, { color: '#FFFFFF' }]}>
                    AUJOURD'HUI
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: isToday ? theme.colors.brand[700] : theme.colors.text.tertiary,
                  textAlign: 'center',
                  fontWeight: isToday ? theme.fontWeight.semibold : theme.fontWeight.normal,
                }}
              >
                {formatDate(item.startDate)}
              </Text>
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: isToday ? theme.colors.brand[700] : theme.colors.text.primary,
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
                  color: isToday ? theme.colors.brand[600] : theme.colors.text.tertiary,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {item.location || 'En ligne'}
              </Text>
            </View>

            {/* Colonne de droite : Infos */}
            <View style={styles.eventInfo}>
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                  color: isToday ? theme.colors.brand[700] : theme.colors.text.primary,
                  marginBottom: theme.spacing.xs,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name || 'Événement sans titre'}
              </Text>

              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: isToday ? theme.colors.brand[600] : theme.colors.text.secondary,
                  lineHeight: 18,
                  height: 36,
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item, index) => item.id || `event-${index}`}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.base }}>
              {t('events.noEvents')}
            </Text>
          </View>
        }
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={isLoading}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
  },
  dateColumn: {
    marginRight: 16,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    justifyContent: 'flex-start',
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
  footerLoader: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
