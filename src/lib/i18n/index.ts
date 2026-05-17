import ar from '../../../public/locales/ar.json';
import en from '../../../public/locales/en.json';

export type Locale = 'ar' | 'en';
export const defaultLocale: Locale = 'ar';
export const locales: Locale[] = ['ar', 'en'];

const dictionaries = { ar, en };

export type Dictionary = typeof ar;

/**
 * احصل على القاموس بناءً على اللغة
 */
export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ar;
}

/**
 * الترجمة بـ dot-notation: t('nav.home')
 */
export function createTranslator(dict: Dictionary) {
  return function t(key: string): string {
    const keys = key.split('.');
    let value: unknown = dict;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return key; // إرجاع المفتاح إذا لم توجد ترجمة
      }
    }
    return typeof value === 'string' ? value : key;
  };
}
