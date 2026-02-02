/**
 * Écran Liste des Participants pour accès direct depuis la tab bar
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { AttendeesListScreen } from '../EventDashboard/AttendeesListScreen';

interface AttendeesListWrapperProps {
  navigation: any;
  route: any;
}

export const AttendeesListWrapper: React.FC<AttendeesListWrapperProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const eventId = route.params?.eventId;

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.background,
        }
      ]}
    >
      <AttendeesListScreen navigation={navigation} route={{ ...route, params: { eventId } }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
