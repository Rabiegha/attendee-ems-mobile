/**
 * Écran Guest List avec bouton vers la liste des participants
 */

import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEventStatsThunk } from '../../store/events.slice';
import { Card } from '../../components/ui/Card';

interface GuestListScreenProps {
  navigation: any;
  route: any;
}

export const GuestListScreen: React.FC<GuestListScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentEvent, currentEventStats } = useAppSelector((state) => state.events);
  const [refreshing, setRefreshing] = useState(false);
  const isLoadingRef = React.useRef(false);

  const eventId = route.params?.eventId || currentEvent?.id;
  
  // Utiliser les stats de l'API
  const stats = useMemo(() => {
    if (currentEventStats) {
      console.log('[GuestListScreen] Using API stats:', currentEventStats);
      return currentEventStats;
    }

    console.log('[GuestListScreen] No stats available yet');
    return {
      totalRegistrations: 0,
      checkedIn: 0,
      approved: 0,
      pending: 0,
      cancelled: 0,
      checkedInPercentage: 0,
    };
  }, [currentEventStats]);

  const loadData = useCallback(() => {
    if (!eventId || isLoadingRef.current) return;
    
    console.log('[GuestListScreen] Loading stats for event:', eventId);
    isLoadingRef.current = true;
    
    dispatch(fetchEventStatsThunk(eventId)).finally(() => {
      isLoadingRef.current = false;
      setRefreshing(false);
    });
  }, [eventId, dispatch]);

  // Recharger les données quand l'écran devient visible
  useFocusEffect(
    useCallback(() => {
      console.log('[GuestListScreen] Screen focused, reloading stats...');
      loadData();
    }, [loadData])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    console.log('[GuestListScreen] Pull-to-refresh triggered');
    loadData();
  }, [loadData]);

  const handleNavigateToList = () => {
    navigation.navigate('Participants', { eventId });
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
              {stats.totalRegistrations} Total | {stats.checkedIn} Enregistrés
            </Text>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
