/**
 * Configuration CASL pour les permissions
 */

import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';

export type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export';
export type Subjects = 'Event' | 'Attendee' | 'Session' | 'Report' | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

/**
 * Crée une instance Ability à partir des permissions utilisateur
 */
export const buildAbilityFor = (permissions: string[]): AppAbility => {
  const { can, build } = new AbilityBuilder(AppAbility);

  // Parser les permissions et les ajouter
  permissions.forEach((permission) => {
    // Format attendu: "action:subject" (ex: "read:Event", "manage:all")
    const [action, subject] = permission.split(':');
    
    if (action && subject) {
      can(action as Actions, subject as Subjects);
    }
  });

  return build();
};

/**
 * Ability par défaut (aucune permission)
 */
export const defaultAbility = new AppAbility([]);
