/**
 * ═══════════════════════════════════════════════════════════════
 * 🌍 Countries Registry
 * ═══════════════════════════════════════════════════════════════
 *
 * قائمة الدول المدعومة في Country Picker.
 * العراق أولاً (السوق الأساسي)، قابل للتوسع.
 */

import type { Country } from '../types';

export const COUNTRIES: readonly Country[] = [
  { code: '+964', iso: 'iq', label: 'العراق',       flag: '🇮🇶', maxLen: 10, prefix: '7' },
  { code: '+966', iso: 'sa', label: 'السعودية',     flag: '🇸🇦', maxLen: 9,  prefix: '5' },
  { code: '+971', iso: 'ae', label: 'الإمارات',     flag: '🇦🇪', maxLen: 9,  prefix: '5' },
  { code: '+965', iso: 'kw', label: 'الكويت',       flag: '🇰🇼', maxLen: 8,  prefix: '5' },
  { code: '+962', iso: 'jo', label: 'الأردن',       flag: '🇯🇴', maxLen: 9,  prefix: '7' },
  { code: '+961', iso: 'lb', label: 'لبنان',        flag: '🇱🇧', maxLen: 8,  prefix: '3' },
  { code: '+970', iso: 'ps', label: 'فلسطين',       flag: '🇵🇸', maxLen: 9,  prefix: '5' },
  { code: '+20',  iso: 'eg', label: 'مصر',          flag: '🇪🇬', maxLen: 10, prefix: '1' },
] as const;

export const DEFAULT_COUNTRY: Country = COUNTRIES[0]; // العراق

export function findCountryByIso(iso: string): Country | undefined {
  return COUNTRIES.find((c) => c.iso === iso);
}
