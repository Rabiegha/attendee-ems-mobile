/**
 * Hook pour gérer les préférences utilisateur
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserPreferences {
  searchDebounceDelay: number;
  defaultPageSize: number;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  searchDebounceDelay: 2000, // 2 secondes par défaut
  defaultPageSize: 20,
  enableNotifications: true,
  theme: 'auto',
};

const PREFERENCES_KEY = '@user_preferences';

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les préférences au démarrage
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Erreur lors du chargement des préférences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
  };

  const resetPreferences = async () => {
    try {
      await AsyncStorage.removeItem(PREFERENCES_KEY);
      setPreferences(DEFAULT_PREFERENCES);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des préférences:', error);
    }
  };

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
};