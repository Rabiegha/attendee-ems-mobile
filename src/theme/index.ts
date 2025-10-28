/**
 * Theme configuration
 * Exporte les thèmes light et dark
 */

import { colors, spacing, radius, fontSize, fontWeight, shadows } from './tokens';

export const theme = {
  light: {
    colors: {
      ...colors,
      background: '#FFFFFF',
      surface: '#FFFFFF',
      text: {
        primary: colors.neutral[900],
        secondary: colors.neutral[600],
        tertiary: colors.neutral[500],
        inverse: '#FFFFFF',
      },
      border: colors.neutral[200],
      divider: colors.neutral[200],
    },
    spacing,
    radius,
    fontSize,
    fontWeight,
    shadows,
  },
  dark: {
    colors: {
      ...colors,
      background: colors.neutral[900],
      surface: colors.neutral[800],
      text: {
        primary: '#FFFFFF',
        secondary: colors.neutral[300],
        tertiary: colors.neutral[400],
        inverse: colors.neutral[900],
      },
      border: colors.neutral[700],
      divider: colors.neutral[700],
    },
    spacing,
    radius,
    fontSize,
    fontWeight,
    shadows,
  },
};

export type Theme = typeof theme.light;
export type ColorScheme = 'light' | 'dark';
