import { getDictionary, createTranslator, locales, defaultLocale } from '@/lib/i18n';

describe('i18n', () => {
  it('default locale is Arabic', () => {
    expect(defaultLocale).toBe('ar');
  });

  it('supports ar and en', () => {
    expect(locales).toContain('ar');
    expect(locales).toContain('en');
  });

  it('returns Arabic dictionary by default', () => {
    const dict = getDictionary();
    expect(dict.common.appName).toBe('سباير ميديكال');
  });

  it('returns English dictionary when requested', () => {
    const dict = getDictionary('en');
    expect(dict.common.appName).toBe('Spir Medical');
  });

  it('falls back to Arabic for unknown locale', () => {
    const dict = getDictionary('ku' as any);
    expect(dict.common.appName).toBe('سباير ميديكال');
  });

  describe('translator', () => {
    const dict = getDictionary('ar');
    const t = createTranslator(dict);

    it('translates dot-notation keys', () => {
      expect(t('nav.home')).toBe('الرئيسية');
      expect(t('auth.loginTitle')).toBe('تسجيل الدخول');
    });

    it('returns key for missing translation', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('handles deeply nested keys', () => {
      expect(t('appointments.statusPending')).toBe('قيد الانتظار');
    });
  });
});
