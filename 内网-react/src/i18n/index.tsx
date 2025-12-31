import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { translations, type Lang } from './translations';

type TranslateVars = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string, vars?: TranslateVars) => string;
  locale: string;
}

const STORAGE_KEY = 'dental_admin_lang';

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const resolveKey = (obj: Record<string, unknown>, key: string) => {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
};

const formatText = (text: string, vars?: TranslateVars) => {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, token) => {
    const value = vars[token];
    return value === undefined ? `{${token}}` : String(value);
  });
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'zh' || stored === 'en' ? stored : 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: TranslateVars) => {
      const current = resolveKey(translations[lang] as Record<string, unknown>, key);
      const fallback = resolveKey(translations.en as Record<string, unknown>, key);
      const text = typeof current === 'string'
        ? current
        : typeof fallback === 'string'
          ? fallback
          : key;
      return formatText(text, vars);
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'zh' : 'en'));
  }, []);

  const locale = lang === 'zh' ? 'zh-CN' : 'en-US';

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    setLang,
    toggleLang,
    t,
    locale,
  }), [lang, t, toggleLang, locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
