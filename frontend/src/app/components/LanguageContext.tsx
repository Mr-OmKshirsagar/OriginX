import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { AppLanguage, DEFAULT_LANGUAGE, directionFromLanguage, isSupportedLanguage, LANGUAGE_STORAGE_KEY, localeFromLanguage, scriptFromLanguage } from '../i18n/config';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && isSupportedLanguage(saved)) {
      return saved;
    }
    return DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = localeFromLanguage(language);
    html.dir = directionFromLanguage(language);
    html.dataset.language = language;
    html.dataset.script = scriptFromLanguage(language);
  }, [language]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const base = translations[language]?.[key] || translations[DEFAULT_LANGUAGE]?.[key] || key;
      if (!params) {
        return base;
      }

      return Object.entries(params).reduce((result, [paramKey, value]) => {
        return result.replaceAll(`{${paramKey}}`, String(value));
      }, base);
    };
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, locale: localeFromLanguage(language), t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
