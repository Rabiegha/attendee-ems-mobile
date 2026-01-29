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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationsThunk, fetchMoreRegistrationsThunk, checkOutRegistrationThunk, undoCheckOutThunk } from '../../store/registrations.slice';
import { fetchEventAttendeeTypesThunk } from '../../store/events.slice';
import { Registration } from '../../types/attendee';
import { SearchBar } from '../../components/ui/SearchBar';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { HighlightedText } from '../../components/ui/HighlightedText';
import { Swipeable } from 'react-native-gesture-handler';
import { APP_CONFIG } from '../../config/app.config';
import { useCheckIn } from '../../hooks/useCheckIn';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterModal, FilterOptions } from '../../components/modals/FilterModal';
import { useToast } from '../../contexts/ToastContext';
import LottieView from 'lottie-react-native';
import { Image } from 'react-native';
import Icons from '../../assets/icons';
import { EmptyState } from '../../components/ui/EmptyState';
import { AttendeeListItemSkeleton, SkeletonList } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';

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
  const { currentEvent, currentEventAttendeeTypes } = useAppSelector((state) => state.events);
  const insets = useSafeAreaInsets();

  const eventId = route.params?.eventId || currentEvent?.id;
  
  console.log('[AttendeesListScreen] Current state:', {
    routeEventId: route.params?.eventId,
    currentEventId: currentEvent?.id,
    finalEventId: eventId,
    currentEvent: currentEvent?.name,
    registrationsCount: registrations.length,
  });
  
  // État de recherche local 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isWaitingToSearch, setIsWaitingToSearch] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false); // Nouveau: suivre les interactions
  const [showActions, setShowActions] = useState(true); // Par défaut activé pour voir les changements
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    attendeeTypeIds: [],
    statuses: [],
    checkedIn: 'all',
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasUserInteracted = useRef(false);

  // Charger l'état du toggle depuis AsyncStorage au montage
  useEffect(() => {
    const loadShowActionsState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('showActions');
        if (savedState !== null) {
          setShowActions(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('[AttendeesListScreen] Error loading showActions state:', error);
      }
    };
    loadShowActionsState();
  }, []);

  // Charger les types de participants pour l'événement
  useEffect(() => {
    if (eventId) {
      console.log('[AttendeesListScreen] Loading attendee types for event:', eventId);
      dispatch(fetchEventAttendeeTypesThunk(eventId));
    }
  }, [eventId, dispatch]);

  // Sauvegarder l'état du toggle dans AsyncStorage quand il change
  const handleToggleActions = useCallback(async () => {
    const newState = !showActions;
    setShowActions(newState);
    try {
      await AsyncStorage.setItem('showActions', JSON.stringify(newState));
    } catch (error) {
      console.error('[AttendeesListScreen] Error saving showActions state:', error);
    }
  }, [showActions]);

  // Handler pour appliquer les filtres
  const handleApplyFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    performSearch(searchQuery, newFilters);
  }, [searchQuery, performSearch]);

  // Hook centralisé pour check-in et impression
  const checkIn = useCheckIn();
  const toast = useToast();

  // État pour le dialog de confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    confirmColor: theme.colors.brand[600],
    icon: 'checkmark-circle',
    iconColor: theme.colors.brand[600],
    onConfirm: () => {},
  });
  
  // Fonction de recherche avec debounce manuel
  const performSearch = useCallback((query: string, currentFilters?: FilterOptions) => {
    if (eventId) {
      console.log('[AttendeesListScreen] Search query changed:', query);
      setIsSearching(true);  // Démarrer le loading
      setIsWaitingToSearch(false); // Arrêter l'attente
      
      const filtersToUse = currentFilters || filters;
      const params: any = { 
        eventId, 
        page: 1, 
        search: query
      };
      
      // Ajouter les filtres s'ils sont actifs
      // Note: Le backend n'accepte qu'un seul attendeeTypeId, on prend le premier
      if (filtersToUse.attendeeTypeIds.length > 0) {
        params.attendeeTypeId = filtersToUse.attendeeTypeIds[0];
      }
      // Filtrer par statut (le backend accepte les valeurs: approved, pending, rejected, checked-in)
      if (filtersToUse.statuses.length > 0) {
        params.status = filtersToUse.statuses[0]; // Le backend n'accepte qu'un statut
      }
      // Pour checkedIn, on doit filtrer côté client car le backend n'a pas ce paramètre
      
      dispatch(fetchRegistrationsThunk(params));
    }
  }, [eventId, dispatch, filters]);

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

  // Chargement initial et rechargement complet
  const loadAllData = useCallback(() => {
    if (eventId) {
      console.log('[AttendeesListScreen] Loading all data for eventId:', eventId);
      const params: any = { 
        eventId, 
        page: 1, 
        search: searchQuery
      };
      
      // Ajouter les filtres (backend n'accepte qu'un seul attendeeTypeId et status)
      if (filters.attendeeTypeIds.length > 0) {
        params.attendeeTypeId = filters.attendeeTypeIds[0];
      }
      if (filters.statuses.length > 0) {
        params.status = filters.statuses[0];
      }
      // checkedIn sera filtré côté client
      
      dispatch(fetchRegistrationsThunk(params));
      // Note: Stats calculées automatiquement depuis Redux
    }
  }, [eventId, searchQuery, filters, dispatch, checkIn]);

  // Chargement initial
  useEffect(() => {
    loadAllData();
  }, [eventId]); // Charger seulement quand eventId change

  const loadRegistrations = useCallback(() => {
    console.log('[AttendeesListScreen] Manual reload triggered');
    loadAllData();
  }, [loadAllData]);

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
    setConfirmDialog({
      visible: true,
      title: 'Imprimer le badge',
      message: `Imprimer et enregistrer ${registration.attendee.first_name} ${registration.attendee.last_name} ?`,
      confirmText: 'Imprimer',
      confirmColor: theme.colors.neutral[950],
      icon: 'print',
      iconColor: theme.colors.neutral[700],
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        // Fermer le swipeable ouvert
        if (openSwipeableRef.current) {
          openSwipeableRef.current.close();
          openSwipeableRef.current = null;
        }
        checkIn.printAndCheckIn(
          registration,
          (message) => toast.success(message),
          (message) => toast.error(message)
        );
      },
    });
  };

  const handleCheckIn = (registration: Registration) => {
    console.log('Check in only:', registration.attendee.first_name);
    setConfirmDialog({
      visible: true,
      title: 'Enregistrer',
      message: `Enregistrer ${registration.attendee.first_name} ${registration.attendee.last_name} comme présent(e) ?`,
      confirmText: 'Enregistrer',
      confirmColor: theme.colors.success[600],
      icon: 'checkmark-circle',
      iconColor: theme.colors.success[600],
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        // Fermer le swipeable ouvert
        if (openSwipeableRef.current) {
          openSwipeableRef.current.close();
          openSwipeableRef.current = null;
        }
        checkIn.checkInOnly(
          registration,
          (message) => toast.success(message),
          (message) => toast.error(message)
        );
      },
    });
  };

  const handleUndoCheckIn = (registration: Registration) => {
    console.log('Undo check in:', registration.attendee.first_name);
    setConfirmDialog({
      visible: true,
      title: 'Annuler l\'enregistrement',
      message: `Annuler l'enregistrement de ${registration.attendee.first_name} ${registration.attendee.last_name} ?`,
      confirmText: 'Confirmer',
      confirmColor: theme.colors.error[600],
      icon: 'arrow-undo',
      iconColor: theme.colors.error[600],
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        // Fermer le swipeable ouvert
        if (openSwipeableRef.current) {
          openSwipeableRef.current.close();
          openSwipeableRef.current = null;
        }
        checkIn.undoCheckIn(
          registration,
          (message) => toast.success(message),
          (message) => toast.error(message)
        );
      },
    });
  };

  const handleCheckOut = (registration: Registration) => {
    console.log('[AttendeesListScreen] Check out:', registration.attendee.first_name);
    setConfirmDialog({
      visible: true,
      title: t('attendees.checkOut'),
      message: `${t('attendees.checkOut')} ${registration.attendee.first_name} ${registration.attendee.last_name} ?`,
      confirmText: t('attendees.checkOut'),
      confirmColor: theme.colors.brand[600],
      icon: 'exit-outline',
      iconColor: theme.colors.brand[600],
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        // Fermer le swipeable ouvert
        if (openSwipeableRef.current) {
          openSwipeableRef.current.close();
          openSwipeableRef.current = null;
        }
        
        try {
          await dispatch(checkOutRegistrationThunk({
            registrationId: registration.id,
            eventId: eventId!,
          })).unwrap();
          
          toast.success(t('attendees.checkOutSuccess'));
          // Note: Stats calculées automatiquement depuis Redux
        } catch (error: any) {
          const errorMessage = error?.detail || error?.message || t('attendees.checkOutError');
          toast.error(errorMessage);
        }
      },
    });
  };

  const handleUndoCheckOut = (registration: Registration) => {
    console.log('[AttendeesListScreen] Undo check out:', registration.attendee.first_name);
    setConfirmDialog({
      visible: true,
      title: t('attendees.undoCheckOut'),
      message: `${t('attendees.undoCheckOut')} ${registration.attendee.first_name} ${registration.attendee.last_name} ?`,
      confirmText: t('common.confirm'),
      confirmColor: theme.colors.warning[600],
      icon: 'arrow-undo',
      iconColor: theme.colors.warning[600],
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        // Fermer le swipeable ouvert
        if (openSwipeableRef.current) {
          openSwipeableRef.current.close();
          openSwipeableRef.current = null;
        }
        
        try {
          await dispatch(undoCheckOutThunk({
            registrationId: registration.id,
            eventId: eventId!,
          })).unwrap();
          
          toast.success('Check-out annulé');
          // Note: Stats calculées automatiquement depuis Redux
        } catch (error: any) {
          const errorMessage = error?.detail || error?.message || 'Erreur lors de l\'annulation';
          toast.error(errorMessage);
        }
      },
    });
  };

  const renderRightActions = (registration: Registration, progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [250, 0],
    });

    // Vérifier l'état du participant
    const isCheckedIn = registration.status === 'checked-in' || registration.checked_in_at;
    const isCheckedOut = registration.checked_out_at;

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
        {/* Bouton Print - toujours visible */}
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
          <Ionicons name="print" size={20} color="#FFFFFF" />
          <Text style={[styles.actionText, { color: '#FFFFFF', fontSize: 11 }]}>Print</Text>
        </TouchableOpacity>

        {/* Bouton Check-in / Undo Check-in */}
        {!isCheckedOut && (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: isCheckedIn 
                  ? theme.colors.error[600] 
                  : theme.colors.success[600],
                borderRadius: theme.radius.lg,
              }
            ]}
            onPress={() => isCheckedIn ? handleUndoCheckIn(registration) : handleCheckIn(registration)}
          >
            <Ionicons name={isCheckedIn ? 'arrow-undo' : 'checkmark-circle'} size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF', fontSize: 11 }]}>
              {isCheckedIn ? 'Undo' : 'Check'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Bouton Check-out - visible seulement si checked-in et pas encore checked-out */}
        {isCheckedIn && !isCheckedOut && (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: theme.colors.brand[600],
                borderRadius: theme.radius.lg,
              }
            ]}
            onPress={() => handleCheckOut(registration)}
          >
            <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF', fontSize: 11 }]}>Out</Text>
          </TouchableOpacity>
        )}

        {/* Bouton Undo Check-out - visible seulement si checked-out */}
        {isCheckedOut && (
          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: theme.colors.warning[600],
                borderRadius: theme.radius.lg,
              }
            ]}
            onPress={() => handleUndoCheckOut(registration)}
          >
            <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
            <Text style={[styles.actionText, { color: '#FFFFFF', fontSize: 11 }]}>Undo Out</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const getAttendeeTypeColor = (registration: Registration) => {
    // Utiliser la couleur spécifique à l'événement (peut être personnalisée)
    // Fallback sur la couleur globale du type si pas de couleur spécifique
    return registration.eventAttendeeType?.color_hex || 
           registration.eventAttendeeType?.attendeeType?.color_hex || 
           theme.colors.neutral[400];
  };

  const renderRegistrationItem = ({ item }: { item: Registration }) => {
    const isCheckedIn = item.status === 'checked-in' || item.checked_in_at;

    // Si showActions est false, utiliser le swipe classique
    if (!showActions) {
      let swipeableRef: Swipeable | null = null;

      const handleSwipeableWillOpen = () => {
        setIsUserInteracting(true);
        if (openSwipeableRef.current && openSwipeableRef.current !== swipeableRef) {
          openSwipeableRef.current.close();
        }
        openSwipeableRef.current = swipeableRef;
      };

      const handleSwipeableClose = () => {
        setIsUserInteracting(false);
        openSwipeableRef.current = null;
      };

      return (
        <Swipeable
          ref={(ref) => { swipeableRef = ref; }}
          renderRightActions={(progress) => renderRightActions(item, progress)}
          overshootRight={false}
          onSwipeableWillOpen={handleSwipeableWillOpen}
          onSwipeableClose={handleSwipeableClose}
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
                      backgroundColor: item.checked_out_at
                        ? theme.colors.neutral[100]
                        : item.status === 'approved' 
                        ? theme.colors.success[50] 
                        : item.status === 'awaiting' 
                        ? theme.colors.warning[50] 
                        : item.status === 'checked-in'
                        ? theme.colors.brand[50]
                        : item.status === 'refused'
                        ? theme.colors.error[50]
                        : item.status === 'cancelled'
                        ? theme.colors.neutral[100]
                        : theme.colors.error[50],
                      borderColor: item.checked_out_at
                        ? theme.colors.neutral[500]
                        : item.status === 'approved' 
                        ? theme.colors.success[500] 
                        : item.status === 'awaiting' 
                        ? theme.colors.warning[500] 
                        : item.status === 'checked-in'
                        ? theme.colors.brand[500]
                        : item.status === 'refused'
                        ? theme.colors.error[500]
                        : item.status === 'cancelled'
                        ? theme.colors.neutral[400]
                        : theme.colors.error[500],
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: item.checked_out_at
                        ? theme.colors.neutral[600]
                        : item.status === 'approved' 
                        ? theme.colors.success[600] 
                        : item.status === 'awaiting' 
                        ? theme.colors.warning[600] 
                        : item.status === 'checked-in'
                        ? theme.colors.brand[600]
                        : item.status === 'refused'
                        ? theme.colors.error[600]
                        : item.status === 'cancelled'
                        ? theme.colors.neutral[700]
                        : theme.colors.error[600],
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {item.checked_out_at ? t('attendees.checkedOut') :
                     item.status === 'approved' ? 'Approuvé' : 
                     item.status === 'awaiting' ? 'En attente' : 
                     item.status === 'refused' ? 'Refusé' :
                     item.status === 'cancelled' ? 'Annulé' :
                     item.status === 'checked-in' ? 'Présent' : item.status}
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

            {/* Icône checked-in */}
            {(item.status === 'checked-in' || item.checked_in_at) && (
              <View style={styles.checkedInIconContainer}>
                <Image
                  source={Icons.Accepted}
                  style={styles.checkedInIcon}
                  resizeMode="contain"
                />
              </View>
            )}
            
          </TouchableOpacity>
        </Swipeable>
      );
    }

    // Si showActions est true, afficher les boutons en colonne sous le contenu
    return (
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
        
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <View style={[styles.registrationContent, { paddingBottom: theme.spacing.lg }]}>
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
                      backgroundColor: item.checked_out_at
                        ? theme.colors.neutral[100]
                        : item.status === 'approved' 
                        ? theme.colors.success[50] 
                        : item.status === 'awaiting' 
                        ? theme.colors.warning[50] 
                        : item.status === 'checked-in'
                        ? theme.colors.brand[50]
                        : item.status === 'refused'
                        ? theme.colors.error[50]
                        : item.status === 'cancelled'
                        ? theme.colors.neutral[100]
                        : theme.colors.error[50],
                      borderColor: item.checked_out_at
                        ? theme.colors.neutral[500]
                        : item.status === 'approved' 
                        ? theme.colors.success[500] 
                        : item.status === 'awaiting' 
                        ? theme.colors.warning[500] 
                        : item.status === 'checked-in'
                        ? theme.colors.brand[500]
                        : item.status === 'refused'
                        ? theme.colors.error[500]
                        : item.status === 'cancelled'
                        ? theme.colors.neutral[400]
                        : theme.colors.error[500],
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: item.checked_out_at
                        ? theme.colors.neutral[600]
                        : item.status === 'approved' 
                        ? theme.colors.success[600] 
                        : item.status === 'awaiting' 
                        ? theme.colors.warning[600] 
                        : item.status === 'checked-in'
                        ? theme.colors.brand[600]
                        : item.status === 'refused'
                        ? theme.colors.error[600]
                        : item.status === 'cancelled'
                        ? theme.colors.neutral[700]
                        : theme.colors.error[600],
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    {item.checked_out_at ? t('attendees.checkedOut') :
                     item.status === 'approved' ? 'Approuvé' : 
                     item.status === 'awaiting' ? 'En attente' : 
                     item.status === 'refused' ? 'Refusé' :
                     item.status === 'cancelled' ? 'Annulé' :
                     item.status === 'checked-in' ? 'Présent' : item.status}
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

          {/* Boutons d'action en colonne sous le contenu */}
          <View style={{ 
            flexDirection: 'row', 
            gap: theme.spacing.xs, 
            paddingRight: theme.spacing.md,
            paddingTop: 0,
            paddingBottom: theme.spacing.sm,
            marginLeft: 'auto',
          }}>
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#1F2937',
              borderRadius: theme.radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#374151',
            }}
            onPress={() => handleRegistrationPress(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="eye" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#6366F1',
              borderRadius: theme.radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#818CF8',
            }}
            onPress={() => {
              // TODO: Navigation vers écran d'édition
              console.log('Edit registration:', item.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              backgroundColor: '#1F2937',
              borderRadius: theme.radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#374151',
            }}
            onPress={() => handlePrint(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="print" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              backgroundColor: isCheckedIn ? '#EF4444' : '#10B981',
              borderRadius: theme.radius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isCheckedIn ? '#F87171' : '#34D399',
            }}
            onPress={() => isCheckedIn ? handleUndoCheckIn(item) : handleCheckIn(item)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isCheckedIn ? "arrow-undo" : "checkmark-circle"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
        </View>
      </TouchableOpacity>
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
        rightComponent={<ProfileButton />}
      />

      {/* Barre de recherche avec toggle intégré */}
      <View style={[styles.searchContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
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
          </View>
        
        {/* Bouton filtre */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (filters.attendeeTypeIds.length > 0 || filters.statuses.length > 0 || filters.checkedIn !== 'all') 
              ? theme.colors.brand[600] 
              : theme.colors.card,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: (filters.attendeeTypeIds.length > 0 || filters.statuses.length > 0 || filters.checkedIn !== 'all')
              ? theme.colors.brand[600] 
              : theme.colors.border,
            position: 'relative',
          }}
          onPress={() => setIsFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={(filters.attendeeTypeIds.length > 0 || filters.statuses.length > 0 || filters.checkedIn !== 'all')
              ? '#FFFFFF' 
              : theme.colors.text.secondary
            } 
          />
          {/* Badge de nombre de filtres actifs */}
          {(filters.attendeeTypeIds.length > 0 || filters.statuses.length > 0 || filters.checkedIn !== 'all') && (
            <View style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: theme.colors.error[600],
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: theme.colors.background,
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                {filters.attendeeTypeIds.length + filters.statuses.length + (filters.checkedIn !== 'all' ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Bouton toggle compact */}
        <TouchableOpacity
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: showActions ? theme.colors.brand[600] : theme.colors.card,
            borderRadius: theme.radius.md,
            borderWidth: 1,
            borderColor: showActions ? theme.colors.brand[600] : theme.colors.border,
          }}
          onPress={handleToggleActions}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={showActions ? "eye" : "eye-off"} 
            size={20} 
            color={showActions ? '#FFFFFF' : theme.colors.text.secondary} 
          />
        </TouchableOpacity>
        </View>
        
        {/* Indicateurs d'état de recherche sous la barre - hauteur fixe pour éviter le décalage */}
        <View style={{ height: 20, justifyContent: 'center', marginTop: 0, paddingLeft: 4 }}>
          {(isWaitingToSearch || isSearching) && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isSearching && !isWaitingToSearch && (
                <ActivityIndicator size="small" color={theme.colors.brand[600]} style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.searchWaitText, { color: theme.colors.text.secondary }]}>
                Recherche...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Compteur et barre de progression dynamique */}
      {checkIn.stats.total > 0 && (
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
      )}

      {/* Liste des participants */}
      {isLoading ? (
        <SkeletonList
          count={8}
          renderItem={() => <AttendeeListItemSkeleton />}
          style={{ padding: theme.spacing.lg }}
        />
      ) : (
        <FlatList
          data={registrations.filter(reg => {
            // Filtrer rejected par défaut
            if (reg.status === 'rejected') return false;
            
            // Filtrer par type d'attendee (côté client pour multi-sélection)
            if (filters.attendeeTypeIds.length > 0 && !filters.attendeeTypeIds.includes(reg.event_attendee_type_id)) {
              return false;
            }
            
            // Filtrer par statut (côté client pour multi-sélection)
            if (filters.statuses.length > 0 && !filters.statuses.includes(reg.status)) {
              return false;
            }
            
            // Filtrer par check-in
            if (filters.checkedIn === 'checked-in' && !reg.checked_in_at) {
              return false;
            }
            if (filters.checkedIn === 'not-checked-in' && reg.checked_in_at) {
              return false;
            }
            
            return true;
          })}
          renderItem={renderRegistrationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ 
            padding: theme.spacing.lg,
            paddingBottom: 120, // Espace pour la bottom tab bar (70px hauteur + 20px bottom + marge)
          }}
          ListEmptyComponent={
            <EmptyState
              title={t('attendees.noAttendees')}
              description={searchQuery ? t('attendees.noSearchResults') : t('attendees.noAttendeesDescription')}
              actionLabel={t('common.refresh')}
              onAction={loadRegistrations}
            />
          }
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={isLoading}
          onRefresh={loadRegistrations}
        />
      )}

      {/* Modal de filtres */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        attendeeTypes={currentEventAttendeeTypes.map(eat => ({
          id: eat.id,
          name: eat.attendeeType.name,
          color_hex: eat.color_hex || eat.attendeeType.color_hex,
        }))}
      />

      {/* Dialog de confirmation pour les actions */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        icon={confirmDialog.icon}
        iconColor={confirmDialog.iconColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  progressContainer: {
    paddingBottom: 8,
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
    left: -5,
    top: -2,
    bottom: -2,
    width: 20,
    transform: [{ skewY: '-5deg' }],
  },
  registrationContent: {
    flex: 1,
    marginLeft: 12,
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
  searchWaitText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  checkedInIconContainer: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedInIcon: {
    width: 20,
    height: 20,
  },
});
