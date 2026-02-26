/**
 * Écran des événements à venir
 */

import React, { useEffect, useCallback, useMemo } from 'react';
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
import { EmptyState } from '../../components/ui/EmptyState';
import { EventCardSkeleton, SkeletonList } from '../../components/ui/Skeleton';
import { useEventSearch } from '../../contexts/EventSearchContext';
import { getRouteForRole } from '../../navigation/roleRouteMap';

interface UpcomingEventsScreenProps {
  navigation?: any;
  route?: any;
  onRefresh?: () => void;
}

export const UpcomingEventsScreen: React.FC<UpcomingEventsScreenProps> = ({ 
  navigation,
  route,
  onRefresh,
}) => {
  // Récupérer navigation depuis route si pas disponible directement
  const nav = navigation || route?.params?.navigation;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { searchQuery } = useEventSearch();
  
  // Déterminer le rôle de l'utilisateur pour la navigation conditionnelle
  const userRole = useAppSelector((state) => state.auth.user?.role);

  // Utiliser le state upcoming
  const { events, isLoading, isLoadingMore, hasMore } = useAppSelector((state) => state.events.upcoming);

  // Filtrer les événements selon la recherche
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    
    const query = searchQuery.toLowerCase();
    return events.filter(event => 
      event.name.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  // Mémoriser les callbacks pour éviter les re-rendus
  const handleEventPress = useCallback((event: Event) => {
    const target = getRouteForRole(userRole);
    nav?.navigate(target, { eventId: event.id, eventName: event.name });
  }, [nav, userRole]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && events.length > 0) {
      console.log('[UpcomingEventsScreen] Loading more events...');
      dispatch(fetchMoreUpcomingEventsThunk({}));
    }
  }, [isLoadingMore, hasMore, events.length, dispatch]);

  const handleRefresh = useCallback(() => {
    console.log('[UpcomingEventsScreen] Refreshing events...');
    dispatch(fetchUpcomingEventsThunk({ page: 1 }));
  }, [dispatch]);

  // Charger les événements au montage
  useEffect(() => {
    console.log('[UpcomingEventsScreen] Component mounted, loading events...');
    dispatch(fetchUpcomingEventsThunk({ page: 1 }));
  }, [dispatch]); // Charger à chaque montage

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.brand[600]} />
        <Text style={{ color: theme.colors.text.secondary, marginLeft: 8 }}>
          Chargement...
        </Text>
      </View>
    );
  }, [isLoadingMore, theme.colors.brand, theme.colors.text.secondary]);

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
                  marginBottom: 4,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name || 'Événement sans titre'}
              </Text>

              <View style={[styles.upcomingBadge, { backgroundColor: theme.colors.brand[600], alignSelf: 'flex-start', paddingVertical: 2, marginBottom: 0 }]}>
                <Text style={[styles.upcomingBadgeText, { color: '#FFFFFF' }]}>
                  {(() => {
                    const now = new Date();
                    const start = new Date(item.startDate);
                    const diffTime = start.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return 'AUJOURD\'HUI';
                    if (diffDays === 1) return 'DEMAIN';
                    return `DANS ${diffDays} JOURS`;
                  })()}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: isToday ? theme.colors.brand[600] : theme.colors.text.secondary,
                  lineHeight: 18,
                }}
                numberOfLines={1}
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SkeletonList
          count={5}
          renderItem={() => <EventCardSkeleton />}
          style={{ padding: theme.spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item, index) => item.id || `event-${index}`}
        contentContainerStyle={{ padding: theme.spacing.lg }}
        ListEmptyComponent={
          <EmptyState
            title={t('events.noUpcomingEvents')}
            description={t('events.noUpcomingEventsDescription')}
            actionLabel={t('common.refresh')}
            onAction={handleRefresh}
          />
        }
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
        getItemLayout={undefined}
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
  upcomingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  upcomingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
