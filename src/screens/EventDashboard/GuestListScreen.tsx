/**
 * Écran Guest List avec bouton vers la liste des participants
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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

  useEffect(() => {
    if (eventId) {
      dispatch(fetchRegistrationsThunk({ eventId }));
    }
  }, [eventId]);

  const handleNavigateToList = () => {
    navigation.navigate('AttendeesList', { eventId });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        contentContainerStyle={{ padding: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
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
