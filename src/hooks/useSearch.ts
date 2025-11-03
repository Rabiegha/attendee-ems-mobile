import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/**
 * Fonction debounce simple
 */
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
  
  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debounced;
};

/**
 * Hook centralisé pour la recherche avec debounce et normalisation
 */
export interface UseSearchOptions {
  /** Délai de debounce en ms (défaut: 300) */
  debounceDelay?: number;
  /** Recherche minimum de caractères (défaut: 2) */
  minSearchLength?: number;
  /** Callback appelé quand la recherche change */
  onSearch?: (query: string) => void;
  /** Valeur initiale */
  initialValue?: string;
}

export interface UseSearchResult {
  /** Valeur actuelle de la recherche */
  searchQuery: string;
  /** Valeur normalisée pour la recherche */
  normalizedQuery: string;
  /** Définir la valeur de recherche */
  setSearchQuery: (query: string) => void;
  /** Effacer la recherche */
  clearSearch: () => void;
  /** Indique si la recherche est active */
  isSearchActive: boolean;
  /** Indique si on attend le debounce */
  isSearching: boolean;
}

/**
 * Normalise une chaîne pour la recherche :
 * - Supprime les accents
 * - Convertit en minuscules
 * - Supprime les espaces multiples
 * - Trim
 */
export const normalizeSearchText = (text: string): string => {
  return text
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .toLowerCase()
    .replace(/\s+/g, ' ') // Remplace les espaces multiples par un seul
    .trim();
};

/**
 * Vérifie si un texte correspond à une requête de recherche
 * Gère l'inversion nom/prénom et la recherche partielle
 */
export const matchesSearchQuery = (
  text: string, 
  query: string,
  additionalFields: string[] = []
): boolean => {
  if (!query.trim()) return true;
  
  const normalizedQuery = normalizeSearchText(query);
  const normalizedText = normalizeSearchText(text);
  
  // Tous les champs à rechercher
  const allFields = [normalizedText, ...additionalFields.map(normalizeSearchText)];
  
  // Diviser la requête en mots
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
  
  // Pour chaque champ, vérifier si tous les mots de la requête sont présents
  return allFields.some(field => 
    queryWords.every(word => field.includes(word))
  );
};

export const useSearch = (options: UseSearchOptions = {}): UseSearchResult => {
  const {
    debounceDelay = 300,
    minSearchLength = 1,
    onSearch,
    initialValue = '',
  } = options;

  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const isInitialMount = useRef(true);

  // Fonction de recherche debouncée
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setIsSearching(false);
      if (onSearch) {
        onSearch(query);
      }
    }, debounceDelay),
    [debounceDelay, onSearch]
  );

  // Effet pour déclencher la recherche
  useEffect(() => {
    // Éviter de déclencher la recherche au montage initial
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (searchQuery.length >= minSearchLength || searchQuery.length === 0) {
      setIsSearching(true);
      debouncedSearch(searchQuery);
    }

    // Cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch, minSearchLength]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
  }, []);

  const normalizedQuery = useMemo(() => normalizeSearchText(searchQuery), [searchQuery]);
  const isSearchActive = searchQuery.length >= minSearchLength;

  return {
    searchQuery,
    normalizedQuery,
    setSearchQuery,
    clearSearch,
    isSearchActive,
    isSearching,
  };
};