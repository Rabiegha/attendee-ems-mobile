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
      card: colors.neutral[100], // Fond des cartes en mode light
      cardHover: colors.neutral[200], // Fond des cartes au hover/sélection
      brandLight: colors.brand[100], // Accent clair pour sélections
      tabBar: colors.neutral[900], // Tab bar foncée en mode light
      tabBarText: '#FFFFFF', // Texte clair sur tab bar foncée
      text: {
        primary: colors.neutral[900],
        secondary: colors.neutral[600],
        tertiary: colors.neutral[500],
        inverse: '#FFFFFF',
      },
      border: colors.neutral[200],
      divider: colors.neutral[200],
      skeleton: colors.neutral[200],
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
      card: colors.neutral[800], // Fond des cartes en mode dark
      cardHover: colors.neutral[700], // Fond des cartes au hover/sélection
      brandLight: colors.brand[700], // Accent pour sélections en dark (plus foncé)
      tabBar: colors.neutral[800], // Tab bar foncée en mode dark
      tabBarText: '#FFFFFF', // Texte clair sur tab bar foncée
      text: {
        primary: '#FFFFFF',
        secondary: colors.neutral[300],
        tertiary: colors.neutral[400],
        inverse: '#FFFFFF', // Texte blanc sur boutons colorés
      },
      border: colors.neutral[700],
      divider: colors.neutral[700],
      skeleton: colors.neutral[700],
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
