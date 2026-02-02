/**
 * Écran Stats standalone pour la navigation directe
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { StatsScreen as StatsContent } from '../EventDashboard/StatsScreen';

interface StatsScreenWrapperProps {
  navigation: any;
  route: any;
}

export const StatsScreenWrapper: React.FC<StatsScreenWrapperProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const eventId = route.params?.eventId;

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
        title="Statistiques"
        onBack={() => navigation.goBack()}
        rightComponent={<ProfileButton />}
      />

      {/* Contenu Stats */}
      <StatsContent navigation={navigation} route={{ ...route, params: { eventId } }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
