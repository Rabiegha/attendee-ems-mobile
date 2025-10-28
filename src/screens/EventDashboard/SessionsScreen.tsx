/**
 * Écran Sessions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SearchBar } from '../../components/ui/SearchBar';
import { Card } from '../../components/ui/Card';

export const SessionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ padding: theme.spacing.lg }}>
        {/* Barre de recherche */}
        <SearchBar
          placeholder="Rechercher une session..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ marginBottom: theme.spacing.lg }}
        />
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Placeholder pour les sessions */}
        <Card>
          <Text 
            style={{ 
              fontSize: theme.fontSize.base, 
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Aucune session pour le moment
          </Text>
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
