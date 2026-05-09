import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج Tailwind classes مع التعامل مع التضارب
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق التاريخ باللغة العربية
 */
export function formatDate(date: string | Date, locale = 'ar-IQ'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * تنسيق التاريخ والوقت
 */
export function formatDateTime(date: string | Date, locale = 'ar-IQ'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * تنسيق المبلغ بالدينار العراقي
 */
export function formatCurrency(amount: number, locale = 'ar-IQ'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IQD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * توليد slug من نص عربي
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-');
}
