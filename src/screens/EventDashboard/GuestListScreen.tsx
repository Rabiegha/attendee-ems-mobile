/**
 * Écran Guest List avec bouton vers la liste des participants
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationsThunk } from '../../store/registrations.slice';
import { Card } from '../../components/ui/Card';
import { PieChart } from 'react-native-chart-kit';

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
  
  // Calculer les stats en temps réel depuis les registrations
  const stats = useMemo(() => {
    const totalRegistrations = registrations.length;
    const checkedIn = registrations.filter((reg) => !!reg.checked_in_at).length;
    const approved = registrations.filter((reg) => reg.status === 'approved').length;
    const pending = registrations.filter((reg) => reg.status === 'pending').length;
    const cancelled = registrations.filter((reg) => reg.status === 'cancelled').length;
    const checkedInPercentage = totalRegistrations > 0 ? (checkedIn / totalRegistrations) * 100 : 0;

    console.log('[GuestListScreen] Stats calculated:', {
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
  }, [registrations]);

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

  // Calculer la distribution par type de participant (tous statuts)
  const attendeeTypeDistribution = useMemo(() => {
    const typeCounts: Record<string, { count: number; name: string; color: string }> = {};

    registrations.forEach((reg) => {
      let typeId = 'unknown';
      let typeName = 'Sans type';
      let typeColor = '#94a3b8';

      if (reg.eventAttendeeType?.attendeeType) {
        typeId = reg.eventAttendeeType.attendeeType.id;
        typeName = reg.eventAttendeeType.attendeeType.name;
        typeColor = reg.eventAttendeeType.attendeeType.color_hex || '#94a3b8';
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

    console.log('[GuestListScreen] Total registrations:', registrations.length);
    console.log('[GuestListScreen] Distribution data:', result);
    
    return result;
  }, [registrations, theme]);

  // Distribution par type - Inscriptions approuvées uniquement
  const checkedInTypeDistribution = useMemo(() => {
    const typeCounts: Record<string, { count: number; name: string; color: string }> = {};

    const checkedInRegs = registrations.filter((reg) => !!reg.checked_in_at);
    console.log('[GuestListScreen] Checked-in registrations:', checkedInRegs.length);

    checkedInRegs.forEach((reg) => {
        let typeId = 'unknown';
        let typeName = 'Sans type';
        let typeColor = '#94a3b8';

        if (reg.eventAttendeeType?.attendeeType) {
          typeId = reg.eventAttendeeType.attendeeType.id;
          typeName = reg.eventAttendeeType.attendeeType.name;
          typeColor = reg.eventAttendeeType.attendeeType.color_hex || '#94a3b8';
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

    console.log('[GuestListScreen] Checked-in distribution data:', result);
    return result;
  }, [registrations, theme]);

  // Distribution par type - Inscriptions non approuvées
  const notCheckedInTypeDistribution = useMemo(() => {
    const typeCounts: Record<string, { count: number; name: string; color: string }> = {};

    const notCheckedInRegs = registrations.filter((reg) => !reg.checked_in_at);
    console.log('[GuestListScreen] Not checked-in registrations:', notCheckedInRegs.length);

    notCheckedInRegs.forEach((reg) => {
        let typeId = 'unknown';
        let typeName = 'Sans type';
        let typeColor = '#94a3b8';

        if (reg.eventAttendeeType?.attendeeType) {
          typeId = reg.eventAttendeeType.attendeeType.id;
          typeName = reg.eventAttendeeType.attendeeType.name;
          typeColor = reg.eventAttendeeType.attendeeType.color_hex || '#94a3b8';
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

    console.log('[GuestListScreen] Not checked-in distribution data:', result);
    return result;
  }, [registrations, theme]);

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
            {stats.approved - stats.checkedIn} personnes non enregistrées
          </Text>
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
            {registrations.length} inscriptions au total
          </Text>
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
        </Card>
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
