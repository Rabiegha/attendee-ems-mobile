/**
 * Provider pour CASL Ability
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { createContextualCan } from '@casl/react';
import { AppAbility, defaultAbility } from './ability';

const AbilityContext = createContext<AppAbility>(defaultAbility);

export const Can = createContextualCan(AbilityContext.Consumer);

interface AbilityProviderProps {
  ability: AppAbility;
  children: ReactNode;
}

export const AbilityProvider: React.FC<AbilityProviderProps> = ({ ability, children }) => {
  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
};

export const useAbility = (): AppAbility => {
  return useContext(AbilityContext);
};
