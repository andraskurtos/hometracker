import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import huTranslations from './locales/hu.json';

i18n
  // Detects the user's browser language automatically
  .use(LanguageDetector)
  // Passes the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hu: { translation: huTranslations }
    },
    fallbackLng: 'en', // If a translation is missing, use English
    interpolation: {
      escapeValue: false, // React already protects from XSS
    },
  });

export default i18n;