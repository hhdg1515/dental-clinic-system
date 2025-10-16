import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from './translations';

export type Language = 'en' | 'zh';
export type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  lang: Language;
  currentLanguage: Language;
  t: (key: TranslationKey) => string;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const resolveInitialLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('preferred-language');
    if (stored === 'en' || stored === 'zh') {
      return stored;
    }

    const browserLanguage = window.navigator.language ?? 'en';
    return browserLanguage.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }

  return 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(resolveInitialLanguage);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const toggle = () => {
    setLang((previousLang) => {
      const nextLang: Language = previousLang === 'en' ? 'zh' : 'en';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('preferred-language', nextLang);
      }
      if (typeof document !== 'undefined') {
        document.documentElement.lang = nextLang;
      }
      return nextLang;
    });
  };

  const translate = (key: TranslationKey): string =>
    translations[lang]?.[key] ?? key;

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      currentLanguage: lang,
      t: translate,
      toggle
    }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
