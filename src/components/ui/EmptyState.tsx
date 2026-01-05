/**
 * Composant EmptyState réutilisable
 * Affiche un état vide avec icône, titre, description et action optionnelle
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface EmptyStateProps {
  icon?: string; // Emoji ou caractère
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Icône/Illustration */}
        <Text style={styles.icon}>{icon}</Text>

        {/* Titre */}
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text.primary,
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
            },
          ]}
        >
          {title}
        </Text>

        {/* Description */}
        {description && (
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            {description}
          </Text>
        )}

        {/* Action optionnelle */}
        {actionLabel && onAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: theme.colors.brand[600],
                borderRadius: theme.radius.lg,
              },
            ]}
            onPress={onAction}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionText,
                {
                  color: '#FFFFFF',
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.semibold,
                },
              ]}
            >
              {actionLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  actionText: {
    textAlign: 'center',
  },
});
