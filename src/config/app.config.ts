/**
 * Configuration globale de l'application
 */

export const APP_CONFIG = {
  // Configuration de la recherche
  SEARCH: {
    DEBOUNCE_DELAY: 1000, // Délai en millisecondes avant de déclencher la recherche
    MIN_SEARCH_LENGTH: 1, // Nombre minimum de caractères pour déclencher une recherche
  },
  
  // Configuration de la pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    LOAD_MORE_THRESHOLD: 0.5, // Déclencher le load more à 50% du scroll
  },
  
  // Configuration des timeouts API
  API: {
    REQUEST_TIMEOUT: 30000, // 30 secondes
    RETRY_ATTEMPTS: 3,
  },
  
  // Configuration de l'UI
  UI: {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
  },
} as const;

// Types pour une meilleure autocomplétion
export type AppConfig = typeof APP_CONFIG;