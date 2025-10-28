/**
 * Configuration du store Redux
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import eventsReducer from './events.slice';
import attendeesReducer from './attendees.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    attendees: attendeesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer ces actions pour les checks de sérialisation
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
