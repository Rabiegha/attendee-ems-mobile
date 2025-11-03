/**
 * Écran des événements passés
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
import { fetchPastEventsThunk, fetchMorePastEventsThunk } from '../../store/events.slice';
import { Event } from '../../types/event';
import { formatDate, formatTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';

interface PastEventsScreenProps {
  navigation?: any;
  route?: any;
  onRefresh?: () => void;
}

export const PastEventsScreen: React.FC<PastEventsScreenProps> = ({ 
  navigation,
  route,
  onRefresh,
}) => {
  // Récupérer navigation depuis route si pas disponible directement
  const nav = navigation || route?.params?.navigation;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Utiliser le state past
  const { events, isLoading, isLoadingMore, hasMore } = useAppSelector((state) => state.events.past);

  // Mémoriser les callbacks pour éviter les re-rendus
  const handleEventPress = useCallback((event: Event) => {
    nav?.navigate('EventInner', { eventId: event.id, eventName: event.name });
  }, [nav]);

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && events.length > 0) {
      console.log('[PastEventsScreen] Loading more events...');
      dispatch(fetchMorePastEventsThunk({}));
    }
  }, [isLoadingMore, hasMore, events.length, dispatch]);

  const handleRefresh = useCallback(() => {
    console.log('[PastEventsScreen] Refreshing events...');
    dispatch(fetchPastEventsThunk({ page: 1 }));
  }, [dispatch]);

  // Charger les événements au montage
  useEffect(() => {
    console.log('[PastEventsScreen] Component mounted, loading events...');
    dispatch(fetchPastEventsThunk({ page: 1 }));
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
                  color: theme.colors.text.secondary,
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
});
