/**
 * Hook pour gérer l'onboarding
 * Détecte si c'est le premier lancement et gère la navigation
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@attendee_ems_onboarding_completed';

export const useOnboarding = () => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'onboarding a déjà été complété
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(value === 'true');
    } catch (error) {
      console.error('[useOnboarding] Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer l'onboarding comme complété
  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsOnboardingComplete(true);
    } catch (error) {
      console.error('[useOnboarding] Error saving onboarding status:', error);
    }
  }, []);

  // Réinitialiser l'onboarding (pour debug/settings)
  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setIsOnboardingComplete(false);
    } catch (error) {
      console.error('[useOnboarding] Error resetting onboarding:', error);
    }
  }, []);

  return {
    isOnboardingComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
};
