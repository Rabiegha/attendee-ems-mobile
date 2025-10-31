/**
 * Composant Header réutilisable avec bouton retour et titre
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  showBackButton = true,
  rightComponent,
  style 
}) => {
  const { theme } = useTheme();

  return (
    <View 
      style={[
        styles.header, 
        style
      ]}
    >
      {showBackButton && onBack && (
        <TouchableOpacity 
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons 
            name="chevron-back" 
            size={34} 
            color={theme.colors.brand[600]} 
          />
        </TouchableOpacity>
      )}
      
      <Text 
        style={[
          styles.headerTitle, 
          { 
            color: theme.colors.text.primary,
            textAlign: 'center',
          }
        ]}
      >
        {title}
      </Text>
      
      {rightComponent && (
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  rightContainer: {
    marginLeft: 8,
  },
});
