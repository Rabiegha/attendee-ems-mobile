/**
 * DESIGN TOKENS - ATTENDEE EMS MOBILE
 * Source unique de vérité pour les tokens de design
 * Inspiré des tokens de la web app
 */

export const colors = {
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#000000',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

export const fontWeight = {
  regular: '400' as const,
  normal: 'normal' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: 'bold' as const,
  extrabold: '800' as const,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
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
    instant: 0,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
  },
};

export const zIndex = {
  base: 0,
  above: 1,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
};

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

export const buttonSizes = {
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: fontSize.sm,
    borderRadius: radius.md,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: fontSize.base,
    borderRadius: radius.lg,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: fontSize.lg,
    borderRadius: radius.xl,
  },
};

export const inputSizes = {
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: fontSize.base,
    borderRadius: radius.lg,
    height: 48,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontSize: fontSize.lg,
    borderRadius: radius.xl,
    height: 56,
  },
};

// Breakpoints pour responsive (si nécessaire plus tard)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
