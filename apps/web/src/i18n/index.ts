import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { fr } from './fr';

/** Same keys as the French reference, any string values. */
type DeepStrings<T> = { readonly [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };
export type Dictionary = DeepStrings<typeof fr>;

export const LANGUAGES = ['en', 'fr'] as const;
export type Language = (typeof LANGUAGES)[number];
export const LANGUAGE_STORAGE_KEY = 'admissions-hub.lang';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    // Keys are checked; values stay plain strings so interpolation accepts numbers.
    resources: { translation: Dictionary };
  }
}

/** Browser language first (remembered once chosen), English as fallback. */
export function initI18n(lng?: Language) {
  return i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { en: { translation: en }, fr: { translation: fr } },
      lng,
      supportedLngs: LANGUAGES,
      fallbackLng: 'en',
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      showSupportNotice: false,
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        caches: ['localStorage'],
      },
    });
}

/** Current language, reduced to a supported code (e.g. fr-FR → fr). */
export const currentLanguage = (): Language =>
  (LANGUAGES as readonly string[]).includes(i18n.resolvedLanguage ?? '')
    ? (i18n.resolvedLanguage as Language)
    : 'en';

export { i18n };
