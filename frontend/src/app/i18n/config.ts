export type AppLanguage =
  | 'en'
  | 'hi'
  | 'es'
  | 'fr'
  | 'de'
  | 'ta'
  | 'te'
  | 'bn'
  | 'mr'
  | 'kn'
  | 'ml'
  | 'gu'
  | 'pa';

export type AppScript = 'latin' | 'devanagari';
export type AppDirection = 'ltr' | 'rtl';

export interface LanguageOption {
  value: AppLanguage;
  locale: string;
  fallback: AppLanguage;
  script: AppScript;
  dir: AppDirection;
}

export const DEFAULT_LANGUAGE: AppLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'originx-language';

// Launch only fully localized languages.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { value: 'en', locale: 'en-US', fallback: 'en', script: 'latin', dir: 'ltr' },
  { value: 'hi', locale: 'hi-IN', fallback: 'en', script: 'devanagari', dir: 'ltr' },
  { value: 'mr', locale: 'mr-IN', fallback: 'en', script: 'devanagari', dir: 'ltr' },
];

export function isSupportedLanguage(value: string): value is AppLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language.value === value);
}

export function localeFromLanguage(language: AppLanguage): string {
  return SUPPORTED_LANGUAGES.find((option) => option.value === language)?.locale || 'en-US';
}

export function scriptFromLanguage(language: AppLanguage): AppScript {
  return SUPPORTED_LANGUAGES.find((option) => option.value === language)?.script || 'latin';
}

export function directionFromLanguage(language: AppLanguage): AppDirection {
  return SUPPORTED_LANGUAGES.find((option) => option.value === language)?.dir || 'ltr';
}
