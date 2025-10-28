/**
 * Traduction des messages d'erreur du serveur en français
 */

export const errorTranslations: Record<string, string> = {
  // Auth errors
  'Invalid credentials': 'Identifiants invalides',
  'Refresh token not found': 'Token de rafraîchissement introuvable',
  'Refresh token has been revoked': 'Session expirée, veuillez vous reconnecter',
  'Refresh token has expired': 'Session expirée, veuillez vous reconnecter',
  'Invalid refresh token': 'Session invalide, veuillez vous reconnecter',
  'User not found or inactive': 'Utilisateur introuvable ou inactif',
  'User not authenticated': 'Utilisateur non authentifié',
  
  // Permission errors
  'Insufficient permissions': 'Permissions insuffisantes',
  'Organization scope required': 'Accès à l\'organisation requis',
  'HOSTESS role cannot update registration status': 'Le rôle HÔTESSE ne peut pas modifier le statut d\'inscription',
  
  // Registration errors
  'Registration not found': 'Inscription introuvable',
  'Event is full': 'L\'événement est complet',
  'This attendee was previously declined for this event': 'Ce participant a été précédemment refusé pour cet événement',
  'This attendee is already registered for this event': 'Ce participant est déjà inscrit à cet événement',
  'File is required': 'Fichier requis',
  'Excel file is empty': 'Le fichier Excel est vide',
  'No data found in Excel file': 'Aucune donnée trouvée dans le fichier Excel',
  
  // Event errors
  'Event not found': 'Événement introuvable',
  'end_at must be after start_at': 'La date de fin doit être après la date de début',
  'Failed to generate unique public token after multiple attempts': 'Échec de la génération d\'un token public unique',
  
  // Organization/Role errors
  'Organisation non trouvée': 'Organisation introuvable',
  'Rôle non trouvé': 'Rôle introuvable',
  'Utilisateur invitant non trouvé': 'Utilisateur invitant introuvable',
  
  // Generic errors
  'Forbidden': 'Accès interdit',
  'Not Found': 'Ressource introuvable',
  'Bad Request': 'Requête invalide',
  'Conflict': 'Conflit',
  'Internal Server Error': 'Erreur interne du serveur',
  'Network Error': 'Erreur réseau',
  'Request failed': 'La requête a échoué',
  'Timeout': 'Délai d\'attente dépassé',
};

/**
 * Traduit un message d'erreur anglais en français
 * @param errorMessage Message d'erreur en anglais
 * @returns Message traduit en français ou le message original si pas de traduction
 */
export const translateError = (errorMessage: string): string => {
  // Recherche exacte
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }
  
  // Recherche partielle (pour les messages qui contiennent des variables)
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (errorMessage.includes(key)) {
      return errorMessage.replace(key, value);
    }
  }
  
  // Si aucune traduction trouvée, retourner le message original
  return errorMessage;
};
