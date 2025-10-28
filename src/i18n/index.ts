/**
 * Configuration i18next
 * Langue par défaut: français
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr/common.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: 'fr',
  fallbackLng: 'fr',
  resources: {
    fr: {
      translation: fr,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
