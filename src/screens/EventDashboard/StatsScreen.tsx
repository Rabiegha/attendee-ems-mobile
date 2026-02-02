/**
 * Écran Stats - Affiche les graphiques statistiques de l'événement
 */

import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEventStatsThunk } from '../../store/events.slice';
import { registrationsService } from '../../api/backend/registrations.service';
import { Registration } from '../../types/attendee';
import { Card } from '../../components/ui/Card';
import { PieChart } from 'react-native-chart-kit';

interface StatsScreenProps {
  navigation: any;
  route: any;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentEvent, currentEventStats, isLoadingStats } = useAppSelector((state) => state.events);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const isLoadingRef = React.useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const eventId = route.params?.eventId || currentEvent?.id;
  
  // Utiliser les stats de l'API au lieu de les calculer à partir des registrations paginées
  const stats = useMemo(() => {
    if (currentEventStats) {
      console.log('[StatsScreen] Using API stats:', currentEventStats);
      return currentEventStats;
    }
    
    // Fallback sur le calcul local uniquement si les stats API ne sont pas disponibles
    const totalRegistrations = registrations.length;
    const checkedIn = registrations.filter((reg) => !!reg.checked_in_at).length;
    const approved = registrations.filter((reg) => reg.status === 'approved').length;
    const pending = registrations.filter((reg) => reg.status === 'awaiting').length;
    const cancelled = registrations.filter((reg) => reg.status === 'cancelled').length;
    const checkedInPercentage = totalRegistrations > 0 ? (checkedIn / totalRegistrations) * 100 : 0;

    console.log('[StatsScreen] Using calculated stats (fallback):', {
      totalRegistrations,
      checkedIn,
      approved,
      pending,
      cancelled,
      checkedInPercentage,
    });

    return {
      totalRegistrations,
      checkedIn,
      approved,
      pending,
      cancelled,
      checkedInPercentage,
    };
  }, [currentEventStats, registrations]);

  const loadData = useCallback(async () => {
    if (!eventId || isLoadingRef.current) return;
    
    console.log('[StatsScreen] Loading data for event:', eventId);
    isLoadingRef.current = true;
    setIsLoadingRegistrations(true);
    
    try {
      // Charger les stats et TOUTES les registrations en parallèle
      const [statsResult, registrationsResult] = await Promise.all([
        dispatch(fetchEventStatsThunk(eventId)).unwrap(),
        registrationsService.getRegistrations(eventId, { 
          page: 1,
          limit: 9999, // Charger toutes les registrations pour les stats
        }),
      ]);
      
      console.log('[StatsScreen] Registrations loaded:', registrationsResult.data.length);
      setRegistrations(registrationsResult.data);
      
    } catch (error) {
      console.error('[StatsScreen] Error loading data:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingRegistrations(false);
      setRefreshing(false);
      
      // Animation d'apparition après le chargement
      if (isInitialLoad) {
        setIsInitialLoad(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [eventId, dispatch, isInitialLoad, fadeAnim]);

  useFocusEffect(
    useCallback(() => {
      if (eventId) {
        console.log('[StatsScreen] Screen focused, loading data for event:', eventId);
        loadData();
      }
    }, [eventId, loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Distribution des types de participants - Check-in effectués
  const checkedInTypeDistribution = useMemo(() => {
    const checkedInRegistrations = registrations.filter((reg) => !!reg.checked_in_at);
    
    const typeCounts: Record<string, { count: number; name: string; color: string }> = {};
    
    checkedInRegistrations.forEach((reg) => {
      const typeId = reg.eventAttendeeType?.attendeeType?.id || 'unknown';
      let typeName = 'Type inconnu';
      let typeColor = '#94a3b8';
      
      if (reg.eventAttendeeType) {
        typeName = reg.eventAttendeeType.attendeeType.name;
        typeColor = reg.eventAttendeeType.color_hex || reg.eventAttendeeType.attendeeType.color_hex || '#94a3b8';
      }
      
      if (!typeCounts[typeId]) {
        typeCounts[typeId] = { count: 0, name: typeName, color: typeColor };
      }
      typeCounts[typeId].count++;
    });

    const result = Object.values(typeCounts).map((typeData) => ({
      name: typeData.name,
      population: typeData.count,
      color: typeData.color,
      legendFontColor: theme.colors.text.primary,
      legendFontSize: 13,
    }));

    console.log('[StatsScreen] Checked-in distribution data:', result);
    return result;
  }, [registrations, theme]);

  // Distribution des types de participants - Sans check-in
  const notCheckedInTypeDistribution = useMemo(() => {
    const notCheckedInRegistrations = registrations.filter((reg) => !reg.checked_in_at);
    
    const typeCounts: Record<string, { count: number; name: string; color: string }> = {};
    
    notCheckedInRegistrations.forEach((reg) => {
      const typeId = reg.eventAttendeeType?.attendeeType?.id || 'unknown';
      let typeName = 'Type inconnu';
      let typeColor = '#94a3b8';
      
      if (reg.eventAttendeeType) {
        typeName = reg.eventAttendeeType.attendeeType.name;
        typeColor = reg.eventAttendeeType.color_hex || reg.eventAttendeeType.attendeeType.color_hex || '#94a3b8';
      }
      
      if (!typeCounts[typeId]) {
        typeCounts[typeId] = { count: 0, name: typeName, color: typeColor };
      }
      typeCounts[typeId].count++;
    });

    const result = Object.values(typeCounts).map((typeData) => ({
      name: typeData.name,
      population: typeData.count,
      color: typeData.color,
      legendFontColor: theme.colors.text.primary,
      legendFontSize: 13,
    }));

    console.log('[StatsScreen] Not checked-in distribution data:', result);
    return result;
  }, [registrations, theme]);

  // Distribution globale des types de participants
  const attendeeTypeDistribution = useMemo(() => {
    console.log('[StatsScreen] ========== COMPUTING DISTRIBUTION ==========');
    console.log('[StatsScreen] Total registrations:', registrations.length);
    
    if (registrations.length > 0) {
      // Afficher TOUTES les registrations avec leurs types
      const allTypes = registrations.map((r, idx) => ({
        idx,
        id: r.id?.substring(0, 8),
        eventAttendeeTypeId: r.eventAttendeeTypeId?.substring(0, 8),
        hasEventAttendeeType: !!r.eventAttendeeType,
        attendeeTypeName: r.eventAttendeeType?.attendeeType?.name,
        attendeeTypeId: r.eventAttendeeType?.attendeeType?.id?.substring(0, 8),
      }));
      console.log('[StatsScreen] ALL registrations types:', JSON.stringify(allTypes, null, 2));
    }
    
    const typeCounts: Record<string, { count: number; name: string; color: string }> = {};
    
    registrations.forEach((reg, index) => {
      const typeId = reg.eventAttendeeType?.attendeeType?.id || 'unknown';
      let typeName = 'Type inconnu';
      let typeColor = '#94a3b8';
      
      if (reg.eventAttendeeType) {
        typeName = reg.eventAttendeeType.attendeeType.name;
        typeColor = reg.eventAttendeeType.color_hex || reg.eventAttendeeType.attendeeType.color_hex || '#94a3b8';
      }
      
      if (!typeCounts[typeId]) {
        typeCounts[typeId] = { count: 0, name: typeName, color: typeColor };
        console.log(`[StatsScreen] NEW TYPE: ${typeId.substring(0, 8)} = ${typeName}`);
      }
      typeCounts[typeId].count++;
    });

    console.log('[StatsScreen] Final type counts:', JSON.stringify(typeCounts, null, 2));

    const result = Object.values(typeCounts).map((typeData) => ({
      name: typeData.name,
      population: typeData.count,
      color: typeData.color,
      legendFontColor: theme.colors.text.primary,
      legendFontSize: 13,
    }));

    console.log('[StatsScreen] Attendee type distribution data:', result);
    return result;
  }, [registrations, theme]);

  // Composant skeleton pour les graphiques
  const ChartSkeleton = () => (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <View 
        style={{ 
          width: 180, 
          height: 180, 
          borderRadius: 90, 
          backgroundColor: theme.colors.neutral[200],
          opacity: 0.3,
        }} 
      />
      <View style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
        <View style={{ width: 120, height: 12, backgroundColor: theme.colors.neutral[200], borderRadius: 6, opacity: 0.3 }} />
        <View style={{ width: 80, height: 12, backgroundColor: theme.colors.neutral[200], borderRadius: 6, opacity: 0.3 }} />
      </View>
    </View>
  );

  // Vérifier si les données sont chargées
  const isDataLoaded = !isInitialLoad && currentEventStats && registrations.length > 0;

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
        {/* Card récapitulatif */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text 
            style={{ 
              fontSize: theme.fontSize.xl, 
              fontWeight: theme.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            Statistiques de l'événement
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: theme.fontSize.xxxl, fontWeight: theme.fontWeight.bold, color: theme.colors.brand[600] }}>
                {stats.totalRegistrations}
              </Text>
              <Text style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary }}>Total</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: theme.fontSize.xxxl, fontWeight: theme.fontWeight.bold, color: theme.colors.success[600] }}>
                {stats.checkedIn}
              </Text>
              <Text style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary }}>Enregistrés</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: theme.fontSize.xxxl, fontWeight: theme.fontWeight.bold, color: theme.colors.neutral[600] }}>
                {Math.round(stats.checkedInPercentage)}%
              </Text>
              <Text style={{ fontSize: theme.fontSize.sm, color: theme.colors.text.secondary }}>Taux</Text>
            </View>
          </View>
        </Card>

        {/* Distribution par type - Check-in effectués */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text 
            style={{ 
              fontSize: theme.fontSize.lg, 
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Distribution par type (Check-in effectués)
          </Text>
          <Text 
            style={{ 
              fontSize: theme.fontSize.sm, 
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
            }}
          >
            {stats.checkedIn} personnes enregistrées
          </Text>
          {!isDataLoaded ? (
            <ChartSkeleton />
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {checkedInTypeDistribution.length > 0 ? (
                <PieChart
                  data={checkedInTypeDistribution}
                  width={Dimensions.get('window').width - 64}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => theme.colors.text.primary,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text style={{ color: theme.colors.text.tertiary, textAlign: 'center', paddingVertical: 20 }}>
                  Aucune donnée disponible
                </Text>
              )}
            </Animated.View>
          )}
        </Card>

        {/* Distribution par type - Sans check-in */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text 
            style={{ 
              fontSize: theme.fontSize.lg, 
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Distribution par type (Sans check-in)
          </Text>
          <Text 
            style={{ 
              fontSize: theme.fontSize.sm, 
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
            }}
          >
            {stats.totalRegistrations - stats.checkedIn} personnes non enregistrées
          </Text>
          {!isDataLoaded ? (
            <ChartSkeleton />
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {notCheckedInTypeDistribution.length > 0 ? (
                <PieChart
                  data={notCheckedInTypeDistribution}
                  width={Dimensions.get('window').width - 64}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => theme.colors.text.primary,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text style={{ color: theme.colors.text.tertiary, textAlign: 'center', paddingVertical: 20 }}>
                  Tout le monde a fait son check-in
                </Text>
              )}
            </Animated.View>
          )}
        </Card>

        {/* Distribution par type de participant - GLOBAL */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text 
            style={{ 
              fontSize: theme.fontSize.lg, 
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.xs,
            }}
          >
            Distribution par type (Toutes inscriptions)
          </Text>
          <Text 
            style={{ 
              fontSize: theme.fontSize.sm, 
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
            }}
          >
            {stats.totalRegistrations} inscriptions au total
          </Text>
          {!isDataLoaded ? (
            <ChartSkeleton />
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {attendeeTypeDistribution.length > 0 ? (
                <PieChart
                  data={attendeeTypeDistribution}
                  width={Dimensions.get('window').width - 64}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => theme.colors.text.primary,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              ) : (
                <Text style={{ color: theme.colors.text.tertiary, textAlign: 'center', paddingVertical: 20 }}>
                  Aucune donnée disponible
                </Text>
              )}
            </Animated.View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
