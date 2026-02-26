/**
 * Mapping centralisé rôle → route de navigation
 *
 * Un seul endroit à modifier quand un nouveau rôle est ajouté.
 * Utilisé par les 3 écrans d'événements (Ongoing, Upcoming, Past).
 */

export type InnerRoute = 'EventInner' | 'PartnerInner';
// Ajouter ici les futures routes : | 'ExhibitorInner' | 'SpeakerInner'

const ROLE_ROUTE_MAP: Record<string, InnerRoute> = {
  ADMIN: 'EventInner',
  ORGANIZER: 'EventInner',
  PARTNER: 'PartnerInner',
  // EXHIBITOR: 'ExhibitorInner',
  // SPEAKER: 'SpeakerInner',
  VIEWER: 'EventInner',
};

/**
 * Retourne la route de navigation intérieure correspondant au rôle.
 * Fallback sur 'EventInner' si le rôle est inconnu.
 */
export const getRouteForRole = (role?: string): InnerRoute => {
  return ROLE_ROUTE_MAP[role || ''] || 'EventInner';
};
