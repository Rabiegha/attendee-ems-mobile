/**
 * Écran de scan QR Code
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

export const ScanScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.lg }}>
        {t('scan.title')}
      </Text>
      <Text style={{ color: theme.colors.text.secondary, marginTop: theme.spacing.md }}>
        Scanner QR Code (à implémenter)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});
