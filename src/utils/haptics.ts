/**
 * Utilitaires pour le feedback haptique
 * Centralise toutes les vibrations de l'application
 */

import * as Haptics from 'expo-haptics';

/**
 * Feedback pour un succès (check-in, impression réussie, etc.)
 */
export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Feedback pour une erreur
 */
export const hapticError = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/**
 * Feedback pour un avertissement
 */
export const hapticWarning = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Feedback léger pour les interactions (boutons, sélection)
 */
export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Feedback moyen pour les interactions importantes
 */
export const hapticMedium = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/**
 * Feedback fort pour les actions critiques
 */
export const hapticHeavy = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/**
 * Feedback pour la sélection (swipe, toggle, etc.)
 */
export const hapticSelection = () => {
  Haptics.selectionAsync();
};
