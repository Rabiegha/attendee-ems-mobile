/**
 * DESIGN TOKENS - ATTENDEE EMS MOBILE
 * Source unique de vérité pour les tokens de design
 * Inspiré des tokens de la web app
 */

export const colors = {
  brand: {
    50: 'rgb(239, 246, 255)',
    100: 'rgb(219, 234, 254)',
    500: 'rgb(59, 130, 246)',
    600: 'rgb(37, 99, 235)',
    700: 'rgb(29, 78, 216)',
  },
  neutral: {
    50: 'rgb(249, 250, 251)',
    100: 'rgb(243, 244, 246)',
    200: 'rgb(229, 231, 235)',
    300: 'rgb(209, 213, 219)',
    400: 'rgb(156, 163, 175)',
    500: 'rgb(107, 114, 128)',
    600: 'rgb(75, 85, 99)',
    700: 'rgb(55, 65, 81)',
    800: 'rgb(31, 41, 55)',
    900: 'rgb(17, 24, 39)',
  },
  success: {
    50: 'rgb(240, 253, 244)',
    500: 'rgb(34, 197, 94)',
    600: 'rgb(22, 163, 74)',
  },
  warning: {
    50: 'rgb(255, 251, 235)',
    500: 'rgb(245, 158, 11)',
    600: 'rgb(217, 119, 6)',
  },
  error: {
    50: 'rgb(254, 242, 242)',
    400: 'rgb(248, 113, 113)',
    500: 'rgb(239, 68, 68)',
    600: 'rgb(220, 38, 38)',
    700: 'rgb(185, 28, 28)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
};

export const animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
  },
};
