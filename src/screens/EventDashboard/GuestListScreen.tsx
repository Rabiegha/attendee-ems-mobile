/**
 * Écran Guest List avec bouton vers la liste des participants
 */

import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationsThunk } from '../../store/registrations.slice';
import { Card } from '../../components/ui/Card';

interface GuestListScreenProps {
  navigation: any;
  route: any;
}

export const GuestListScreen: React.FC<GuestListScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { registrations, pagination } = useAppSelector((state) => state.registrations);
  const { currentEvent } = useAppSelector((state) => state.events);
  const [refreshing, setRefreshing] = useState(false);
  const isLoadingRef = React.useRef(false);

  const eventId = route.params?.eventId || currentEvent?.id;
  
  // Utiliser les stats depuis l'événement au lieu de calculer manuellement
  const stats = currentEvent?.stats || {
    totalRegistrations: 0,
    checkedIn: 0,
    approved: 0,
    pending: 0,
    cancelled: 0,
    checkedInPercentage: 0,
  };

  // Fonction pour charger/recharger les données
  const loadData = useCallback(async () => {
    if (eventId && !isLoadingRef.current) {
      isLoadingRef.current = true;
      console.log('[GuestListScreen] Loading data for event:', eventId);
      
      try {
        // Charger uniquement les registrations, l'event est déjà chargé par EventDashboardScreen
        await dispatch(fetchRegistrationsThunk({ eventId }));
      } finally {
        isLoadingRef.current = false;
      }
    }
  }, [eventId, dispatch]);

  // Chargement initial uniquement
  useEffect(() => {
    loadData();
  }, [eventId]); // Charger seulement quand eventId change

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('[GuestListScreen] Pull-to-refresh triggered');
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleNavigateToList = () => {
    navigation.navigate('AttendeesList', { eventId });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={{ 
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand[600]}
            colors={[theme.colors.brand[600]]}
          />
        }
      >
        {/* Card Liste des participants */}
        <TouchableOpacity onPress={handleNavigateToList} activeOpacity={0.7}>
          <Card style={{ marginBottom: theme.spacing.md }}>
            <Text 
              style={{ 
                fontSize: theme.fontSize.lg, 
                fontWeight: theme.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Liste des participants
            </Text>
            <Text 
              style={{ 
                fontSize: theme.fontSize.sm, 
                color: theme.colors.text.secondary,
              }}
            >
              {stats.approved} Total | {stats.checkedIn} Enregistrés
            </Text>
          </Card>
        </TouchableOpacity>

        {/* Placeholder pour d'autres contenus */}
        <View style={styles.placeholderContainer}>
          <Text style={{ color: theme.colors.text.tertiary, fontSize: theme.fontSize.sm }}>
            Autres statistiques à venir...
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
