/**
 * Composant Input réutilisable
 */

import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Icons from '../../assets/icons';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  showPasswordToggle = false,
  secureTextEntry,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

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
      <View style={styles.inputWrapper}>
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
              paddingRight: showPasswordToggle ? 48 : theme.spacing.md,
              fontSize: theme.fontSize.base,
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.surface,
              flex: 1,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.toggleButton}
          >
            <Image 
              source={isPasswordVisible ? Icons.Vu : Icons.PasVu} 
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor={theme.colors.brand[600]}
            />
          </TouchableOpacity>
        )}
      </View>
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
  inputWrapper: {
    position: 'relative' as const,
  },
  toggleButton: {
    position: 'absolute' as const,
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: 32,
  },
});
