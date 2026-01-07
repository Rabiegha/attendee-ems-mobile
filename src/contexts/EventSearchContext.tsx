/**
 * Contexte pour partager la recherche entre EventsListScreen et ses tabs
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface EventSearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const EventSearchContext = createContext<EventSearchContextType | undefined>(undefined);

export const EventSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <EventSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </EventSearchContext.Provider>
  );
};

export const useEventSearch = () => {
  const context = useContext(EventSearchContext);
  if (context === undefined) {
    throw new Error('useEventSearch must be used within an EventSearchProvider');
  }
  return context;
};
