/**
 * Utilitaires pour l'authentification
 */

/**
 * Décode le payload d'un JWT (sans vérification de signature)
 */
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur lors du décodage du JWT:', error);
    return null;
  }
};

/**
 * Récupère la date d'expiration d'un token
 */
export const getTokenExpiration = (token: string): number | null => {
  const decoded = decodeJWT(token);
  return decoded?.exp ? decoded.exp * 1000 : null; // Convertir en millisecondes
};

/**
 * Vérifie si un token est expiré
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return Date.now() >= expiration;
};

/**
 * Vérifie si un token expire bientôt
 * @param token - Le token JWT
 * @param thresholdSeconds - Seuil en secondes avant expiration
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 60): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  const timeUntilExpiration = expiration - Date.now();
  return timeUntilExpiration <= thresholdSeconds * 1000;
};

/**
 * Calcule le timestamp d'expiration à partir de expires_in
 */
export const calculateExpiresAt = (expiresIn: number): number => {
  return Date.now() + expiresIn * 1000;
};
