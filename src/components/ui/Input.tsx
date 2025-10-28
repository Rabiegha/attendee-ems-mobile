/**
 * Composant Input réutilisable
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text.secondary,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            height: 40,
            borderWidth: 1,
            borderColor: error
              ? theme.colors.error[500]
              : isFocused
              ? theme.colors.brand[600]
              : theme.colors.border,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            fontSize: theme.fontSize.base,
            color: theme.colors.text.primary,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <Text
          style={{
            color: theme.colors.error[500],
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing.xs,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {},
});
