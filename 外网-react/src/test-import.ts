// Test file to verify exports
import { translations } from './context/translations';
import type { Language, TranslationKey } from './context/LanguageContext';

const lang: Language = 'en';
const key: TranslationKey = 'nav-home';
const text = translations[lang][key];

if (import.meta.env.DEV) {
  console.log('Test successful:', text);
}
