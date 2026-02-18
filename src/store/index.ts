/**
 * Configuration du store Redux avec persistance
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './auth.slice';
import eventsReducer from './events.slice';
import attendeesReducer from './attendees.slice';
import registrationsReducer from './registrations.slice';
import printersReducer from './printers.slice';
import emsPrintersReducer from './emsPrinters.slice';
import printStatusReducer from './printStatus.slice';

// Configuration de la persistence pour le slice auth
const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'organization', 'isAuthenticated'], // Sauvegarder uniquement ces champs
};

// Créer le reducer persisté pour auth
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer, // Utiliser le reducer persisté pour auth
    events: eventsReducer,
    attendees: attendeesReducer,
    registrations: registrationsReducer,
    printers: printersReducer,
    emsPrinters: emsPrintersReducer,
    printStatus: printStatusReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer ces actions pour les checks de sérialisation (redux-persist utilise des valeurs non-sérialisables)
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
        ignoredActionPaths: ['register', 'rehydrate'],
        ignoredPaths: ['_persist'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
