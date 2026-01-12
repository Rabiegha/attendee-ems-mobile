/**
 * Écran des événements en cours
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
import { fetchOngoingEventsThunk, fetchMoreOngoingEventsThunk } from '../../store/events.slice';
import { Event } from '../../types/event';
import { formatDate, formatTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { EventCardSkeleton, SkeletonList } from '../../components/ui/Skeleton';
import { useEventSearch } from '../../contexts/EventSearchContext';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

interface OngoingEventsScreenProps {
  navigation?: any;
  route?: any;
  onRefresh?: () => void;
}

export const OngoingEventsScreen: React.FC<OngoingEventsScreenProps> = ({ 
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
  
  // Utiliser le state ongoing
  const { events, isLoading, isLoadingMore, hasMore } = useAppSelector((state) => state.events.ongoing);

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
    nav?.navigate('EventInner', { eventId: event.id, eventName: event.name });
  }, [nav]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && events.length > 0) {
      console.log('[OngoingEventsScreen] Loading more events...');
      dispatch(fetchMoreOngoingEventsThunk({}));
    }
  }, [isLoadingMore, hasMore, events.length, dispatch]);

  const handleRefresh = useCallback(() => {
    console.log('[OngoingEventsScreen] Refreshing events...');
    dispatch(fetchOngoingEventsThunk({ page: 1 }));
  }, [dispatch]);

  const handleViewUpcoming = useCallback(() => {
    // Navigate to Upcoming tab
    nav?.navigate('Upcoming');
  }, [nav]);

  // Charger les événements au montage
  useEffect(() => {
    console.log('[OngoingEventsScreen] Component mounted, loading events...');
    dispatch(fetchOngoingEventsThunk({ page: 1 }));
  }, [dispatch]);

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
              <Text
                style={{
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.text.primary,
                  marginBottom: 4,
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.name || 'Événement sans titre'}
              </Text>

              <View style={[styles.ongoingBadge, { backgroundColor: theme.colors.brand[600], alignSelf: 'flex-start', paddingVertical: 2, marginBottom: 0 }]}>
                <Text style={[styles.ongoingBadgeText, { color: '#FFFFFF' }]}>
                  EN COURS
                </Text>
              </View>

              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
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
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
              Aucun événement en cours
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
              Il n'y a actuellement aucun événement en cours.
            </Text>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: theme.colors.brand[600] }]}
              onPress={handleViewUpcoming}
              activeOpacity={0.8}
            >
              <Text style={[styles.ctaButtonText, { color: '#FFFFFF' }]}>
                Voir les événements à venir
              </Text>
            </TouchableOpacity>
          </View>
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
  footerLoader: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ongoingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  ongoingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
