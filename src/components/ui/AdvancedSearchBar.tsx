import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { SearchBar } from './SearchBar';
import { HighlightedText } from './HighlightedText';
import { useSearch, matchesSearchQuery as originalMatchesSearchQuery } from '../../hooks/useSearch';

interface AdvancedSearchBarProps {
  /** Placeholder pour la barre de recherche */
  placeholder?: string;
  /** Callback appelé quand la recherche change */
  onSearchChange?: (query: string) => void;
  /** Valeur initiale de la recherche */
  initialValue?: string;
  /** Délai de debounce en ms */
  debounceDelay?: number;
  /** Afficher l'indicateur de recherche en cours */
  showSearchIndicator?: boolean;
}

/**
 * Composant de recherche avancée avec debounce et indicateurs visuels
 */
export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  placeholder = 'Rechercher...',
  onSearchChange,
  initialValue = '',
  debounceDelay = 300,
  showSearchIndicator = true,
}) => {
  const { theme } = useTheme();
  
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearchActive,
    isSearching,
  } = useSearch({
    debounceDelay,
    minSearchLength: 1,
    onSearch: onSearchChange,
    initialValue,
  });

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder={placeholder}
        value={searchQuery}
        onChangeText={setSearchQuery}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      {showSearchIndicator && isSearching && (
        <View style={[
          styles.searchingIndicator,
          { backgroundColor: theme.colors.brand[100] }
        ]}>
          {/* Ici on pourrait ajouter un indicateur de recherche */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 2,
  },
});

// Types pour le hook de recherche de liste
interface UseListSearchOptions<T> {
  debounceDelay?: number;
  onSearchChange?: (filteredItems: T[], query: string) => void;
}

interface UseListSearchResult<T> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
  isSearching: boolean;
  filteredItems: T[];
}

// Hook personnalisé pour la recherche dans des listes
export function useListSearch<T>(
  items: T[],
  searchFields: (item: T) => string[],
  options: UseListSearchOptions<T> = {}
): UseListSearchResult<T> {
  const { debounceDelay = 300, onSearchChange } = options;
  
  const {
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearchActive,
    isSearching,
  } = useSearch({
    debounceDelay,
    minSearchLength: 1,
    onSearch: (query) => {
      const filtered = filterItems(items, query, searchFields);
      onSearchChange?.(filtered, query);
    },
  });

  const filterItems = (items: T[], query: string, getFields: (item: T) => string[]): T[] => {
    if (!query.trim() || !isSearchActive) return items;
    
    return items.filter(item => {
      const fields = getFields(item);
      const primaryField = fields[0] || '';
      const additionalFields = fields.slice(1);
      
      return originalMatchesSearchQuery(primaryField, query, additionalFields);
    });
  };

  const filteredItems = React.useMemo(() => 
    filterItems(items, searchQuery, searchFields),
    [items, searchQuery, searchFields, isSearchActive]
  );

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    isSearchActive,
    isSearching,
    filteredItems,
  };
}

