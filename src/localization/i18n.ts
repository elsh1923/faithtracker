import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import am from './am.json';
import en from './en.json';

const resources = {
  am: { translation: am },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0].languageCode === 'am' ? 'am' : 'am', // Defaulting to 'am' as requested
    fallbackLng: 'am',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
