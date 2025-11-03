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
  Dimensions,
  Modal,
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
import { APP_CONFIG } from '../../config/app.config';
import { useCheckIn } from '../../hooks/useCheckIn';
import { CheckInModal } from '../../components/modals/CheckInModal';
import LottieView from 'lottie-react-native';

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

  // État pour le modal d'impression
  const [isPrintModalVisible, setIsPrintModalVisible] = useState(false);
  const [printingStatus, setPrintingStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const [currentPrintingAttendee, setCurrentPrintingAttendee] = useState<Registration | null>(null);

  // Hook centralisé pour check-in et impression
  const checkIn = useCheckIn();
  
  // Fonction de recherche avec debounce manuel
  const performSearch = useCallback((query: string) => {
    if (eventId) {
      console.log('[AttendeesListScreen] Search query changed:', query);
      setIsSearching(true);  // Démarrer le loading
      setIsWaitingToSearch(false); // Arrêter l'attente
      dispatch(fetchRegistrationsThunk({ 
        eventId, 
        page: 1, 
        search: query
        // Supprimer le filtre par statut pour voir tous les participants
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
        search: '' // Pas de recherche au démarrage
        // Supprimer le filtre par statut pour voir tous les participants
      }));
    }
  }, [eventId, dispatch]);

  const loadRegistrations = useCallback(() => {
    if (eventId) {
      console.log('[AttendeesListScreen] Manual reload for eventId:', eventId);
      dispatch(fetchRegistrationsThunk({ 
        eventId, 
        page: 1, 
        search: searchQuery // Utiliser la recherche actuelle
        // Supprimer le filtre par statut pour voir tous les participants
      }));
    } else {
      console.warn('[AttendeesListScreen] No eventId available!');
    }
  }, [eventId, searchQuery, dispatch]);

  // Fonction pour fermer le modal d'impression
  const closePrintModal = useCallback(() => {
    setIsPrintModalVisible(false);
    setPrintingStatus('idle');
    setCurrentPrintingAttendee(null);
  }, []);

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
        search: searchQuery
        // Supprimer le filtre par statut pour charger tous les participants
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
    console.log('Print and check-in for:', registration.attendee.first_name);
    // Le bouton print fait maintenant print + check-in
    checkIn.printAndCheckIn(registration);
  };

  const handleCheckIn = (registration: Registration) => {
    console.log('Check in only:', registration.attendee.first_name);
    checkIn.checkInOnly(registration);
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
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <HighlightedText
                text={`${item.attendee.first_name} ${item.attendee.last_name}`}
                searchQuery={searchQuery}
                style={{
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.medium,
                  color: theme.colors.text.primary,
                  flex: 1,
                }}
                highlightColor={theme.colors.brand[100]}
                highlightStyle={{
                  backgroundColor: theme.colors.brand[100],
                  fontWeight: theme.fontWeight.bold,
                  color: theme.colors.brand[700],
                }}
              />
              
              {/* Badge de statut */}
              <View
                style={[
                  {
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    borderWidth: 1,
                  },
                  {
                    backgroundColor: item.status === 'approved' 
                      ? theme.colors.success[50] 
                      : item.status === 'pending' 
                      ? theme.colors.warning[50] 
                      : item.status === 'checked-in'
                      ? theme.colors.brand[50]
                      : theme.colors.error[50],
                    borderColor: item.status === 'approved' 
                      ? theme.colors.success[500] 
                      : item.status === 'pending' 
                      ? theme.colors.warning[500] 
                      : item.status === 'checked-in'
                      ? theme.colors.brand[500]
                      : theme.colors.error[500],
                  },
                ]}
              >
                <Text
                  style={{
                    color: item.status === 'approved' 
                      ? theme.colors.success[600] 
                      : item.status === 'pending' 
                      ? theme.colors.warning[600] 
                      : item.status === 'checked-in'
                      ? theme.colors.brand[600]
                      : theme.colors.error[600],
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.medium,
                  }}
                >
                  {item.status === 'approved' ? 'Approuvé' : 
                   item.status === 'pending' ? 'En attente' : 
                   item.status === 'checked-in' ? 'Présent' : 'Refusé'}
                </Text>
              </View>
            </View>
            
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

      {/* Compteur et barre de progression dynamique */}
      <View style={[styles.progressContainer, { paddingHorizontal: theme.spacing.lg }]}>
        {checkIn.stats.isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.brand[600]} />
        ) : (
          <>
            <Text
              style={{
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.text.primary,
                textAlign: 'center',
                marginBottom: theme.spacing.sm,
              }}
            >
              {checkIn.stats.checkedIn}/{checkIn.stats.total}
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
                    width: `${checkIn.stats.percentage}%`,
                    backgroundColor: theme.colors.brand[600],
                    borderRadius: theme.radius.full,
                  },
                ]}
              />
            </View>
          </>
        )}
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

      {/* Modal d'impression */}
      <Modal
        visible={isPrintModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePrintModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
            {/* Header du modal avec bouton fermer */}
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.colors.text.primary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }
                ]}
              >
                Impression de badge
              </Text>
              <TouchableOpacity onPress={closePrintModal} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.colors.text.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Animation et contenu */}
            <View style={[styles.animationSection, { backgroundColor: theme.colors.card }]}>
              {printingStatus === 'printing' ? (
                <>
                  <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                    <LottieView
                      source={require('../../assets/animations/Printing.json')}
                      autoPlay
                      loop
                      style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                      renderMode="AUTOMATIC"
                      colorFilters={[]}
                    />
                  </View>
                  <Text style={[styles.statusText, { color: theme.colors.text.primary }]}>
                    Impression en cours...
                  </Text>
                  {currentPrintingAttendee && (
                    <Text style={[styles.attendeeText, { color: theme.colors.text.secondary }]}>
                      {currentPrintingAttendee.attendee.first_name} {currentPrintingAttendee.attendee.last_name}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                    <LottieView
                      source={require('../../assets/animations/Accepted.json')}
                      autoPlay
                      loop={false}
                      style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                      renderMode="AUTOMATIC"
                      colorFilters={[]}
                    />
                  </View>
                  <Text style={[styles.statusText, { color: theme.colors.success[600] }]}>
                    Impression réussie !
                  </Text>
                  {currentPrintingAttendee && (
                    <Text style={[styles.attendeeText, { color: theme.colors.text.secondary }]}>
                      Badge de {currentPrintingAttendee.attendee.first_name} {currentPrintingAttendee.attendee.last_name} imprimé
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
  // Styles pour le modal d'impression
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  animationSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  animationContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  animationView: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  attendeeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  confirmButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
