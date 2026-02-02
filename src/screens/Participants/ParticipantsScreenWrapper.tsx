/**
 * Écran Participants standalone pour la navigation directe depuis la tab bar
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppSelector } from '../../store/hooks';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { GuestListScreen } from '../EventDashboard/GuestListScreen';

interface ParticipantsScreenWrapperProps {
  navigation: any;
  route: any;
}

export const ParticipantsScreenWrapper: React.FC<ParticipantsScreenWrapperProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId;
  const { currentEvent } = useAppSelector((state) => state.events);

  // Formater la date
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ' •');
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
        title="Participants"
        subtitle={currentEvent ? `${currentEvent.name} • ${formatEventDate(currentEvent.startDate)}` : ''}
        rightComponent={<ProfileButton />}
      />

      {/* Contenu GuestList */}
      <GuestListScreen navigation={navigation} route={{ ...route, params: { eventId } }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
