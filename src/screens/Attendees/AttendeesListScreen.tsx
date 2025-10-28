/**
 * Écran de liste des participants
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAttendeesThunk } from '../../store/attendees.slice';
import { Attendee } from '../../types/attendee';

interface AttendeesListScreenProps {
  navigation: any;
  route: any;
}

export const AttendeesListScreen: React.FC<AttendeesListScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { attendees, isLoading, pagination } = useAppSelector((state) => state.attendees);
  const { currentEvent } = useAppSelector((state) => state.events);

  const [searchQuery, setSearchQuery] = useState('');
  const eventId = route.params?.eventId || currentEvent?.id;

  useEffect(() => {
    if (eventId) {
      loadAttendees();
    }
  }, [eventId]);

  const loadAttendees = () => {
    if (eventId) {
      dispatch(fetchAttendeesThunk({ eventId, search: searchQuery }));
    }
  };

  const handleAttendeePress = (attendee: Attendee) => {
    navigation.navigate('AttendeeDetails', { attendeeId: attendee.id });
  };

  const renderAttendeeItem = ({ item }: { item: Attendee }) => (
    <TouchableOpacity
      style={[
        styles.attendeeItem,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          marginBottom: theme.spacing.sm,
          padding: theme.spacing.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => handleAttendeePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.attendeeContent}>
        <Text
          style={{
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text.primary,
          }}
        >
          {item.firstName} {item.lastName}
        </Text>
        {item.company && (
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.xs,
            }}
          >
            {item.company}
          </Text>
        )}
      </View>
      
      {/* Coin incliné gris (style ancien app) */}
      <View
        style={[
          styles.corner,
          { backgroundColor: theme.colors.neutral[300] },
        ]}
      />
    </TouchableOpacity>
  );

  const checkedInCount = attendees.filter((a) => a.status === 'checked-in').length;

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
          onSubmitEditing={loadAttendees}
        />
      </View>

      {/* Compteur */}
      <View style={[styles.counterContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <Text
          style={{
            fontSize: theme.fontSize.lg,
            fontWeight: theme.fontWeight.semibold,
            color: theme.colors.text.primary,
            textAlign: 'center',
          }}
        >
          {checkedInCount}/{pagination.total}
        </Text>
      </View>

      {/* Liste des participants */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        </View>
      ) : (
        <FlatList
          data={attendees}
          renderItem={renderAttendeeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.base }}>
                {t('attendees.noAttendees')}
              </Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={loadAttendees}
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
  counterContainer: {
    paddingVertical: 12,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  attendeeContent: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 40,
    height: 40,
    transform: [{ rotate: '45deg' }, { translateX: 20 }, { translateY: -20 }],
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
