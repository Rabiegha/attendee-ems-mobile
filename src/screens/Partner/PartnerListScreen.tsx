/**
 * PartnerListScreen - Liste des contacts scannés par le partenaire
 * FlatList avec recherche, pull-to-refresh, navigation vers détail
 */

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPartnerScansThunk, clearPartnerScans } from '../../store/partnerScans.slice';
import { useTheme } from '../../theme/ThemeProvider';
import type { Theme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { PartnerScan } from '../../types/partnerScan';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import Icons from '../../assets/icons';

type PartnerInnerTabsParamList = {
  PartnerList: { eventId: string; eventName?: string };
  PartnerScanDetail: { scanId: string; eventId: string };
};

type PartnerListRouteProp = RouteProp<PartnerInnerTabsParamList, 'PartnerList'>;

export const PartnerListScreen: React.FC<{ route?: any }> = ({ route: routeProp }) => {
  const route = useRoute<PartnerListRouteProp>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const eventId = route.params?.eventId || routeProp?.params?.eventId;
  const eventName = route.params?.eventName || routeProp?.params?.eventName;
  const { scans, meta, isLoading, error } = useAppSelector((state) => state.partnerScans);


  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<any>(null);

  // Composant séparateur stable (évite re-création à chaque render)
  const ItemSeparator = useCallback(() => <View style={{ height: 8 }} />, []);

  // Charger les scans au focus, cleanup au blur ou changement d'événement
  useFocusEffect(
    useCallback(() => {
      dispatch(clearPartnerScans());
      setSearchQuery('');
      loadScans();

      // Cleanup : annuler le debounce en cours si on quitte l'écran
      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [eventId])
  );

  const loadScans = (page = 1, search?: string) => {
    if (!eventId) return;
    // Annuler la requête précédente pour éviter les résultats obsolètes (race condition)
    if (lastFetchRef.current) {
      (lastFetchRef.current as any).abort();
    }
    lastFetchRef.current = dispatch(
      fetchPartnerScansThunk({
        event_id: eventId,
        page,
        limit: 50,
        search: search ?? searchQuery,
      })
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(
      fetchPartnerScansThunk({
        event_id: eventId,
        page: 1,
        limit: 50,
        search: searchQuery,
      })
    );
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    // Debounce : annuler le timeout précédent et attendre 400ms
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      loadScans(1, query);
      setIsSearching(false);
    }, 400);
  };

  const handlePressScan = (scan: PartnerScan) => {
    navigation.navigate('PartnerScanDetail' as never, {
      scanId: scan.id,
      eventId,
    } as never);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderScanItem = ({ item }: { item: PartnerScan }) => {
    const attendee = item.attendee_data;
    const fullName = `${attendee?.first_name || ''} ${attendee?.last_name || ''}`.trim() || 'Contact';
    const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.scanCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => handlePressScan(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: theme.colors.brand[100] }]}>
            <Text style={[styles.avatarText, { color: theme.colors.brand[600] }]}>{initials}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, { color: theme.colors.text.primary }]} numberOfLines={1}>
              {fullName}
            </Text>
            {attendee?.company && (
              <Text style={[styles.cardCompany, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                {attendee.company}{attendee.job_title ? ` • ${attendee.job_title}` : ''}
              </Text>
            )}
            {item.comment && (
              <View style={styles.commentPreview}>
                <Ionicons name="chatbubble-outline" size={12} color={theme.colors.text.tertiary} />
                <Text style={[styles.commentText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                  {item.comment}
                </Text>
              </View>
            )}
          </View>

          {/* Date + chevron */}
          <View style={styles.cardRight}>
            <Text style={[styles.cardDate, { color: theme.colors.text.tertiary }]}>
              {formatDate(item.scanned_at)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    // Si erreur et pas de données en cache
    if (error && scans.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color={theme.colors.error[400]} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
            Impossible de charger les contacts
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => loadScans()}
            style={[styles.retryButtonLarge, { backgroundColor: theme.colors.brand[600] }]}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.text.inverse} />
            <Text style={styles.retryTextLarge}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color={theme.colors.text.tertiary} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
          {searchQuery ? 'Aucun résultat' : 'Aucun contact scanné'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
          {searchQuery
            ? 'Essayez avec d\'autres termes de recherche'
            : 'Scannez le badge des participants pour les ajouter à votre liste'}
        </Text>
      </View>
    );
  };

  // Badge compteur comme rightComponent du Header
  const CountBadge = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={[styles.countBadge, { backgroundColor: theme.colors.brand[100] }]}>
        <Text style={[styles.countText, { color: theme.colors.brand[600] }]}>
          {meta.total}
        </Text>
      </View>
      <ProfileButton />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Header partagé */}
      <Header
        title={eventName || 'Mes Contacts'}
        onBack={() => navigation.goBack()}
        rightComponent={<CountBadge />}
      />

      {/* Search bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Ionicons name="search" size={18} color={theme.colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text.primary }]}
          placeholder="Rechercher un contact..."
          placeholderTextColor={theme.colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Erreur */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error[50], borderColor: theme.colors.error[100] }]}>
          <Ionicons name="alert-circle" size={18} color={theme.colors.error[500]} />
          <Text style={[styles.errorText, { color: theme.colors.error[600] }]} numberOfLines={2}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => loadScans()} style={[styles.retryButton, { backgroundColor: theme.colors.error[500] }]}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={scans}
        renderItem={renderScanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          scans.length === 0 && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brand[600]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />

      {/* Loading indicator (masqué pendant le debounce de recherche pour éviter le clignotement) */}
      {isLoading && !refreshing && !isSearching && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={theme.colors.brand[600]} />
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140, // espace pour la tab bar flottante
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  scanCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  commentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  commentText: {
    fontSize: 12,
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cardDate: {
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  retryButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  retryTextLarge: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
});

