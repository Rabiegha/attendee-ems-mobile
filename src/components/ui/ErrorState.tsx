/**
 * Composant ErrorState pour les états d'erreur
 * Affiche une erreur avec possibilité de réessayer
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  error?: string;
  onRetry?: () => void;
  style?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  style,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {/* Icône d'erreur */}
        <Text style={styles.icon}>⚠️</Text>

        {/* Message d'erreur */}
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
          {t('common.error')}
        </Text>

        {error && (
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            {error}
          </Text>
        )}

        {/* Bouton réessayer */}
        {onRetry && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              {
                backgroundColor: theme.colors.brand[600],
                borderRadius: theme.radius.lg,
              },
            ]}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.retryText,
                {
                  color: '#FFFFFF',
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.semibold,
                },
              ]}
            >
              {t('errors.retry')}
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
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  retryText: {
    textAlign: 'center',
  },
});
