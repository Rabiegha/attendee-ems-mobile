/**
 * Composant Button réutilisable
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: theme.radius.md,
      // ...theme.shadows.sm,
    };

    // Size
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: { height: 36, paddingHorizontal: theme.spacing.md },
      md: { height: 40, paddingHorizontal: theme.spacing.lg },
      lg: { height: 44, paddingHorizontal: theme.spacing['2xl'] },
    };

    // Variant
    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: {
        backgroundColor: theme.colors.brand[600],
      },
      secondary: {
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      destructive: {
        backgroundColor: theme.colors.error[600],
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: theme.fontWeight.semibold,
    };

    // Size
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      sm: { fontSize: theme.fontSize.sm },
      md: { fontSize: theme.fontSize.base },
      lg: { fontSize: theme.fontSize.lg },
    };

    // Variant
    const variantStyles: Record<ButtonVariant, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: theme.colors.text.primary },
      destructive: { color: '#FFFFFF' },
      ghost: { color: theme.colors.brand[600] },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : theme.colors.brand[600]}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
