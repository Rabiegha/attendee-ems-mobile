/**
 * Écran de liste des participants (registrations)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationsThunk, fetchMoreRegistrationsThunk } from '../../store/registrations.slice';
import { Registration } from '../../types/attendee';
import { SearchBar } from '../../components/ui/SearchBar';
import { Header } from '../../components/ui/Header';
import { HighlightedText } from '../../components/ui/HighlightedText';
import { Swipeable } from 'react-native-gesture-handler';
import Icons from '../../assets/icons';
import { APP_CONFIG } from '../../config/app.config';

interface AttendeesListScreenProps {
  navigation: any;
  route: any;
}

// Configuration de la recherche depuis le fichier global
const SEARCH_DEBOUNCE_DELAY = APP_CONFIG.SEARCH.DEBOUNCE_DELAY;

export const AttendeesListScreen: React.FC<AttendeesListScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { registrations, isLoading, isLoadingMore, hasMore, pagination } = useAppSelector((state) => state.registrations);
  const { currentEvent } = useAppSelector((state) => state.events);
  const insets = useSafeAreaInsets();

  const eventId = route.params?.eventId || currentEvent?.id;
  
  // État de recherche local 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isWaitingToSearch, setIsWaitingToSearch] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserInteracted = useRef(false);
  
  // Fonction de recherche avec debounce manuel
  const performSearch = useCallback((query: string) => {
    if (eventId) {
      console.log('[AttendeesListScreen] Search query changed:', query);
      setIsSearching(true);  // Démarrer le loading
      setIsWaitingToSearch(false); // Arrêter l'attente
      dispatch(fetchRegistrationsThunk({ 
        eventId, 
        page: 1, 
        search: query,
        status: 'approved'
      }));
    }
  }, [eventId, dispatch]);

  // Handler pour les changements de recherche
  const handleSearchChange = useCallback((query: string) => {
    hasUserInteracted.current = true;
    setSearchQuery(query);
  }, []);

  // Effet pour déclencher la recherche avec debounce (seulement après interaction utilisateur)
  useEffect(() => {
    // Ne pas déclencher de recherche au montage initial
    if (!hasUserInteracted.current) {
      return;
    }

    // Annuler le timeout précédent et réinitialiser les états
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      setIsWaitingToSearch(false);
    }

    // Si la recherche est vide, chercher immédiatement
    if (searchQuery.trim() === '') {
      setIsWaitingToSearch(false);
      performSearch('');
      return;
    }

    // Déclencher la recherche avec debounce de 2 secondes
    setIsWaitingToSearch(true); // Indiquer qu'on attend
    setIsSearching(false); // Pas encore en train de chercher
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, SEARCH_DEBOUNCE_DELAY);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        setIsWaitingToSearch(false);
      }
    };
  }, [searchQuery, performSearch]);
  
  // Référence pour garder trace du swipeable ouvert
  const openSwipeableRef = React.useRef<Swipeable | null>(null);

  // Synchroniser l'état local avec le store
  useEffect(() => {
    if (!isLoading) {
      setIsSearching(false);
    }
  }, [isLoading]);

  console.log('[AttendeesListScreen] Render with state:', {
    registrationsCount: registrations.length,
    isLoading,
    isLoadingMore,
    hasMore,
    pagination,
    eventId,
    searchQuery,
    isWaitingToSearch,
    isSearching,
  });

  // Chargement initial seulement si eventId change
  useEffect(() => {
    if (eventId) {
      console.log('[AttendeesListScreen] Initial load for eventId:', eventId);
      // Chargement initial sans recherche
      dispatch(fetchRegistrationsThunk({ 
        eventId, 
        page: 1, 
        search: '', // Pas de recherche au démarrage
        status: 'approved'
      }));
    }
  }, [eventId, dispatch]);

  const loadRegistrations = useCallback(() => {
    if (eventId) {
      console.log('[AttendeesListScreen] Manual reload for eventId:', eventId);
      dispatch(fetchRegistrationsThunk({ 
        eventId, 
        page: 1, 
        search: searchQuery, // Utiliser la recherche actuelle
        status: 'approved'
      }));
    } else {
      console.warn('[AttendeesListScreen] No eventId available!');
    }
  }, [eventId, searchQuery, dispatch]);

  const handleLoadMore = () => {
    console.log('[AttendeesListScreen] handleLoadMore called', {
      isLoadingMore,
      hasMore,
      eventId,
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
    });
    
    if (!isLoadingMore && hasMore && eventId) {
      console.log('[AttendeesListScreen] Loading more registrations...');
      dispatch(fetchMoreRegistrationsThunk({ 
        eventId, 
        search: searchQuery,
        status: 'approved' // Charger uniquement les participants approuvés
      }));
    } else {
      console.log('[AttendeesListScreen] Skipping load more:', {
        isLoadingMore,
        hasMore,
        eventId,
      });
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
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton, 
            { 
              backgroundColor: theme.colors.neutral[950],
              borderRadius: theme.radius.lg,
            }
          ]}
          onPress={() => handlePrint(registration)}
        >
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton, 
            { 
              backgroundColor: theme.colors.success[600],
              borderRadius: theme.radius.lg,
            }
          ]}
          onPress={() => handleCheckIn(registration)}
        >
          <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Check</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getAttendeeTypeColor = (registration: Registration) => {
    // Utiliser la couleur qui vient du backend
    return registration.eventAttendeeType?.attendeeType?.color_hex || 
           theme.colors.neutral[400];
  };

  const renderRegistrationItem = ({ item }: { item: Registration }) => {
    let swipeableRef: Swipeable | null = null;

    const handleSwipeableWillOpen = () => {
      // Fermer le swipeable précédemment ouvert dès qu'on commence à swiper un nouveau
      if (openSwipeableRef.current && openSwipeableRef.current !== swipeableRef) {
        openSwipeableRef.current.close();
      }
      // Garder la référence du nouveau swipeable en cours d'ouverture
      openSwipeableRef.current = swipeableRef;
    };

    return (
      <Swipeable
        ref={(ref) => { swipeableRef = ref; }}
        renderRightActions={(progress) => renderRightActions(item, progress)}
        overshootRight={false}
        onSwipeableWillOpen={handleSwipeableWillOpen}
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
          {/* Barre colorée inclinée sur le côté gauche */}
          <View
            style={[
              styles.colorStripe,
              { backgroundColor: getAttendeeTypeColor(item) },
            ]}
          />
          
          <View style={styles.registrationContent}>
            <HighlightedText
              text={`${item.attendee.first_name} ${item.attendee.last_name}`}
              searchQuery={searchQuery}
              style={{
                fontSize: theme.fontSize.base,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
              highlightColor={theme.colors.brand[100]}
              highlightStyle={{
                backgroundColor: theme.colors.brand[100],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.brand[700],
              }}
            />
            {item.attendee.company && (
              <HighlightedText
                text={item.attendee.company}
                searchQuery={searchQuery}
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginTop: 2,
                }}
                highlightColor={theme.colors.brand[100]}
                highlightStyle={{
                  backgroundColor: theme.colors.brand[100],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.brand[700],
                }}
              />
            )}
          </View>
          
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const checkedInCount = registrations.filter((r) => r.status === 'checked-in').length;
  const progressPercentage = pagination.total > 0 ? (checkedInCount / pagination.total) * 100 : 0;

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

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        }
      ]}
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
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={() => {
            // Déclencher la recherche immédiatement sur "Entrée"
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            setIsWaitingToSearch(false);
            performSearch(searchQuery);
          }}
        />
        {/* Indicateurs d'état de recherche */}
        {isWaitingToSearch && (
          <View style={styles.searchingIndicator}>
            <Text style={[styles.searchWaitText, { color: theme.colors.text.secondary }]}>
              Recherche...
            </Text>
          </View>
        )}
        {isSearching && !isWaitingToSearch && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color={theme.colors.brand[600]} />
          </View>
        )}
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
          contentContainerStyle={{ 
            padding: theme.spacing.lg,
            paddingBottom: 100, // Espace pour la bottom tab bar
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.base }}>
                {t('attendees.noAttendees')}
              </Text>
            </View>
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={isLoading}
          onRefresh={loadRegistrations}
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
  colorStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    transform: [{ skewY: '-5deg' }],
  },
  registrationContent: {
    flex: 1,
    marginLeft: 12, // Espace après la barre colorée
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
    alignItems: 'stretch',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    alignSelf: 'stretch',
    marginLeft: 4,
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
  footerLoader: {
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  searchWaitText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
