/**
 * Écran des événements à venir
 */

import React from 'react';
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
import { useAppSelector } from '../../store/hooks';
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
  const { events, isLoading } = useAppSelector((state) => state.events);

  // Filtrer les événements à venir
  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    return eventDate >= now;
  });

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventInner', { eventId: event.id, eventName: event.name });
  };

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
        data={upcomingEvents}
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
        onRefresh={onRefresh}
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
});
