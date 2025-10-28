/**
 * Composant SearchBar réutilisable
 */

import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import Icons from '../../assets/icons';

interface SearchBarProps extends TextInputProps {
  onSearch?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  style,
  ...props 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={Icons.Rechercher} 
        style={styles.icon}
        tintColor={theme.colors.text.tertiary}
      />
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.card,
            color: theme.colors.text.primary,
            fontSize: theme.fontSize.base,
          },
        ]}
        placeholderTextColor={theme.colors.text.tertiary}
        onSubmitEditing={onSearch}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
});
