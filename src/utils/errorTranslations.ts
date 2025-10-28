/**
 * Traduction des messages d'erreur du serveur en français
 */

// Messages d'erreur user-friendly (affichés à l'utilisateur)
export const errorTranslations: Record<string, string> = {
  // Auth errors
  'Invalid credentials': 'Email ou mot de passe incorrect',
  'Refresh token not found': 'Votre session a expiré, veuillez vous reconnecter',
  'Refresh token has been revoked': 'Votre session a expiré, veuillez vous reconnecter',
  'Refresh token has expired': 'Votre session a expiré, veuillez vous reconnecter',
  'Invalid refresh token': 'Votre session a expiré, veuillez vous reconnecter',
  'User not found or inactive': 'Compte introuvable ou désactivé',
  'User not authenticated': 'Vous devez vous connecter',
  
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
 * Vérifie si une erreur est technique (ne doit pas être affichée à l'utilisateur)
 */
const isTechnicalError = (errorMessage: string): boolean => {
  const technicalPatterns = [
    /network error/i,
    /timeout/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /JSON/i,
    /parse/i,
    /serialize/i,
    /SecureStore/i,
    /Invalid value provided/i,
    /must be strings/i,
    /Request failed/i,
    /status code/i,
    /500/,
    /502/,
    /503/,
    /504/,
  ];
  
  return technicalPatterns.some(pattern => pattern.test(errorMessage));
};

/**
 * Traduit un message d'erreur anglais en français avec gestion des erreurs techniques
 * @param errorMessage Message d'erreur en anglais
 * @param showTechnicalDetails Si true, affiche les détails techniques (pour debug)
 * @returns Message traduit et user-friendly
 */
export const translateError = (errorMessage: string, showTechnicalDetails = false): string => {
  // Log l'erreur pour le debug
  console.log('[translateError] Message original:', errorMessage);
  
  // Si c'est une erreur technique, retourner un message générique
  if (isTechnicalError(errorMessage)) {
    console.warn('[translateError] Erreur technique détectée:', errorMessage);
    return 'Une erreur est survenue. Veuillez réessayer dans quelques instants.';
  }
  
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
  
  // Si aucune traduction trouvée et que ce n'est pas une erreur technique connue
  // Retourner un message générique pour ne pas exposer les détails
  console.warn('[translateError] Aucune traduction trouvée pour:', errorMessage);
  return 'Une erreur est survenue lors de la connexion. Veuillez vérifier vos identifiants.';
};
