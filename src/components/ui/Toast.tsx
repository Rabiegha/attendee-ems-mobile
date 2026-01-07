/**
 * Toast Component
 * Affiche un toast avec icône, couleur et animation
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { ToastConfig, ToastType } from '../../contexts/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  toast: ToastConfig;
  onDismiss: (id: string) => void;
  index: number;
}

const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case 'success': return '✓';
    case 'error': return '✕';
    case 'warning': return '';
    case 'info': return 'ℹ';
    default: return 'ℹ';
  }
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, index }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Animation de sortie avant la durée
    if (toast.duration && toast.duration > 0) {
      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss(toast.id));
      }, toast.duration - 200);

      return () => clearTimeout(timeout);
    }
  }, [toast.duration, toast.id, onDismiss]);

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: theme.colors.success[50],
          border: theme.colors.success[500],
          text: theme.colors.success[700],
          icon: theme.colors.success[600],
        };
      case 'error':
        return {
          bg: theme.colors.error[50],
          border: theme.colors.error[500],
          text: theme.colors.error[700],
          icon: theme.colors.error[600],
        };
      case 'warning':
        return {
          bg: theme.colors.warning[50],
          border: theme.colors.warning[500],
          text: theme.colors.warning[700],
          icon: theme.colors.warning[600],
        };
      case 'info':
        return {
          bg: theme.colors.info[50],
          border: theme.colors.info[500],
          text: theme.colors.info[700],
          icon: theme.colors.info[600],
        };
      default:
        return {
          bg: theme.colors.neutral[50],
          border: theme.colors.neutral[500],
          text: theme.colors.neutral[700],
          icon: theme.colors.neutral[600],
        };
    }
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 16 + (index * 70), // Empiler les toasts
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          {
            backgroundColor: colors.bg,
            borderLeftWidth: 4,
            borderLeftColor: colors.border,
            borderRadius: theme.radius.lg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
        onPress={() => onDismiss(toast.id)}
        activeOpacity={0.9}
      >
        {/* Icône */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.icon,
              borderRadius: theme.radius.full,
            },
          ]}
        >
          <Text style={styles.icon}>{getToastIcon(toast.type)}</Text>
        </View>

        {/* Message */}
        <Text
          style={[
            styles.message,
            {
              color: colors.text,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
            },
          ]}
          numberOfLines={2}
        >
          {toast.message}
        </Text>

        {/* Bouton fermer */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onDismiss(toast.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 60,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
