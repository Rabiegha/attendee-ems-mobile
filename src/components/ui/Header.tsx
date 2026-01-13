/**
 * Composant Header réutilisable avec bouton retour et titre
 * Layout unifié avec dimensions fixes pour éviter les déplacements
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle,
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
      {/* Zone gauche - Bouton retour (largeur fixe) */}
      <View style={styles.leftContainer}>
        {showBackButton && onBack ? (
          <TouchableOpacity 
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-back" 
              size={28} 
              color={theme.colors.brand[600]} 
            />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Zone centrale - Titre */}
      <View style={styles.centerContainer}>
        <Text 
          style={[
            styles.headerTitle, 
            { 
              color: theme.colors.text.primary,
            }
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text 
            style={[
              styles.headerSubtitle, 
              { 
                color: theme.colors.brand[600],
              }
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {/* Zone droite - Composant custom (largeur fixe) */}
      <View style={styles.rightContainer}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 68, // Hauteur fixe pour tous les headers (avec ou sans subtitle)
  },
  leftContainer: {
    width: 48, // Largeur fixe pour alignement
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: 44, // Hauteur minimale pour centrer le contenu
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  rightContainer: {
    width: 48, // Largeur fixe pour alignement
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
