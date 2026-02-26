/**
 * Configuration CASL pour les permissions
 * 
 * Les permissions backend sont au format "code:scope" (ex: "partner-scans.create:own")
 * On les mappe en abilities CASL compatibles.
 */

import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'view';
export type Subjects = 'Event' | 'Attendee' | 'Session' | 'Report' | 'PartnerScan' | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

/**
 * Mappe un code permission backend vers action + subject CASL
 * Exemples :
 *   "partner-scans.create:own" → can('create', 'PartnerScan')
 *   "events.read:assigned"     → can('read', 'Event')
 *   "attendees.read:any"       → can('read', 'Attendee')
 */
const SUBJECT_MAP: Record<string, Subjects> = {
  'events': 'Event',
  'attendees': 'Attendee',
  'sessions': 'Session',
  'reports': 'Report',
  'partner-scans': 'PartnerScan',
};

export const buildAbilityFor = (permissions: string[]): AppAbility => {
  const { can, build } = new AbilityBuilder(AppAbility);

  permissions.forEach((perm) => {
    // Format backend: "module.action:scope" (ex: "partner-scans.create:own")
    const [codeWithScope] = perm.split(':'); // "partner-scans.create"
    const dotIndex = codeWithScope.lastIndexOf('.');
    if (dotIndex === -1) return;

    const module = codeWithScope.substring(0, dotIndex);  // "partner-scans"
    const action = codeWithScope.substring(dotIndex + 1);  // "create"
    const subject = SUBJECT_MAP[module];

    if (subject && action) {
      can(action as Actions, subject);
    }
  });

  return build();
};

/**
 * Vérifie si une liste de permissions contient une permission spécifique
 * Utile pour les checks rapides sans CASL
 */
export const hasPermission = (permissions: string[], code: string): boolean => {
  return permissions.some((p) => p.startsWith(code));
};

/**
 * Ability par défaut (aucune permission)
 */
export const defaultAbility = new AppAbility([]);
