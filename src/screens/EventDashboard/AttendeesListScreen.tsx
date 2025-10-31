/**
 * Écran de liste des participants (registrations)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationsThunk } from '../../store/registrations.slice';
import { Registration } from '../../types/attendee';
import { SearchBar } from '../../components/ui/SearchBar';
import { Header } from '../../components/ui/Header';
import { Swipeable } from 'react-native-gesture-handler';
import Icons from '../../assets/icons';

interface AttendeesListScreenProps {
  navigation: any;
  route: any;
}

export const AttendeesListScreen: React.FC<AttendeesListScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { registrations, isLoading, pagination } = useAppSelector((state) => state.registrations);
  const { currentEvent } = useAppSelector((state) => state.events);

  const [searchQuery, setSearchQuery] = useState('');
  const eventId = route.params?.eventId || currentEvent?.id;

  useEffect(() => {
    if (eventId) {
      loadRegistrations();
    }
  }, [eventId]);

  const loadRegistrations = () => {
    if (eventId) {
      dispatch(fetchRegistrationsThunk({ eventId, search: searchQuery }));
    }
  };

  const handleRegistrationPress = (registration: Registration) => {
    navigation.navigate('AttendeeDetails', { registrationId: registration.id });
  };

  const handlePrint = (registration: Registration) => {
    console.log('Print badge for:', registration.attendee.first_name);
    // TODO: Implement print logic
  };

  const handleCheckIn = (registration: Registration) => {
    console.log('Check in:', registration.attendee.first_name);
    // TODO: Implement check-in logic
  };

  const renderRightActions = (registration: Registration, progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [200, 0],
    });

    return (
      <Animated.View
        style={[
          styles.actionsContainer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.neutral[800] }]}
          onPress={() => handlePrint(registration)}
        >
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.success[600] }]}
          onPress={() => handleCheckIn(registration)}
        >
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Check</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in':
        return theme.colors.warning[500]; // Yellow
      case 'approved':
        return theme.colors.neutral[300]; // Gray
      default:
        return theme.colors.neutral[300];
    }
  };

  const renderRegistrationItem = ({ item }: { item: Registration }) => (
    <Swipeable
      renderRightActions={(progress) => renderRightActions(item, progress)}
      overshootRight={false}
    >
      <TouchableOpacity
        style={[
          styles.registrationItem,
          {
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.lg,
            marginBottom: theme.spacing.sm,
          },
        ]}
        onPress={() => handleRegistrationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.registrationContent}>
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.text.primary,
            }}
          >
            {item.attendee.first_name} {item.attendee.last_name}
          </Text>
          {item.attendee.company && (
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginTop: 2,
              }}
            >
              {item.attendee.company}
            </Text>
          )}
        </View>
        
        {/* Coin coloré incliné */}
        <View
          style={[
            styles.corner,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        />
      </TouchableOpacity>
    </Swipeable>
  );

  const checkedInCount = registrations.filter((r) => r.status === 'checked-in').length;
  const progressPercentage = pagination.total > 0 ? (checkedInCount / pagination.total) * 100 : 0;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <Header
        title={t('Liste des participants')}
        onBack={() => navigation.goBack()}
      />

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <SearchBar
          placeholder={t('common.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={loadRegistrations}
        />
      </View>

      {/* Compteur et barre de progression */}
      <View style={[styles.progressContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <Text
          style={{
            fontSize: theme.fontSize.xl,
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          {checkedInCount}/{pagination.total}
        </Text>
        
        {/* Barre de progression */}
        <View
          style={[
            styles.progressBarBackground,
            {
              backgroundColor: theme.colors.neutral[200],
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor: theme.colors.brand[600],
                borderRadius: theme.radius.full,
              },
            ]}
          />
        </View>
      </View>

      {/* Liste des participants */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        </View>
      ) : (
        <FlatList
          data={registrations}
          renderItem={renderRegistrationItem}
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
          onRefresh={loadRegistrations}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingVertical: 12,
  },
  progressContainer: {
    paddingVertical: 12,
  },
  progressBarBackground: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  registrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  registrationContent: {
    flex: 1,
  },
  corner: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 60,
    borderTopWidth: 60,
    borderLeftColor: 'transparent',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginLeft: 4,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
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
