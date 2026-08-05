import { createHash, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * 🔒 قفل التطبيق (PIN)
 *
 * ثغرتان أُصلحتا:
 *  1. `verifyPin` كان **بلا حدّ محاولات** — PIN من ٤ أرقام (10٬000 احتمال)
 *     يُكسر بالقوة الغاشمة في ثوانٍ. (الحدّ نفسه مغطّى في `rate-limit`.)
 *  2. التخزين كان SHA-256 **سريعة**: من يصل إلى الجدول يستخرج كل الـ PINs فوراً.
 *
 * هنا نختبر عقد التجزئة والمقارنة (منطق نقيّ، بلا شبكة أو قاعدة بيانات).
 */

// نُعيد إنتاج الدوال كما في `lib/services/pin-actions.ts`
// (الملف `'use server'` فلا يُصدّر دوالّ غير async للاختبار المباشر)
const hashPin = (pin: string, userId: string) => bcrypt.hash(`${userId}:${pin}`, 10);
const legacyHashPin = (pin: string, userId: string) =>
  createHash('sha256').update(`${userId}:${pin}`).digest('hex');
const isBcryptHash = (h: string) => /^\$2[aby]\$/.test(h);

async function matchesPin(pin: string, userId: string, stored: string): Promise<boolean> {
  if (isBcryptHash(stored)) return bcrypt.compare(`${userId}:${pin}`, stored);
  const incoming = Buffer.from(legacyHashPin(pin, userId));
  const expected = Buffer.from(stored);
  if (incoming.length !== expected.length) return false;
  return timingSafeEqual(incoming, expected);
}

const USER = '11111111-2222-3333-4444-555555555555';

describe('🔒 تجزئة الـ PIN بـ bcrypt', () => {
  it('تُنتج تجزئة bcrypt يمكن التحقّق منها', async () => {
    const h = await hashPin('1234', USER);
    expect(isBcryptHash(h)).toBe(true);
    expect(await matchesPin('1234', USER, h)).toBe(true);
  });

  it('ترفض PIN خاطئاً', async () => {
    const h = await hashPin('1234', USER);
    expect(await matchesPin('4321', USER, h)).toBe(false);
  });

  it('نفس الـ PIN لمستخدمين مختلفين ⇒ تجزئتان مختلفتان', async () => {
    const a = await hashPin('1234', USER);
    const b = await hashPin('1234', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(a).not.toBe(b);
  });

  it('🚨 PIN مستخدم آخر لا يُقبل بمعرّف مختلف (الملح يعمل)', async () => {
    const h = await hashPin('1234', USER);
    expect(await matchesPin('1234', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', h)).toBe(false);
  });
});

describe('🔒 التوافق مع الـ PINs القديمة (ترقية شفّافة)', () => {
  it('يتحقّق من تجزئة SHA-256 المخزّنة سابقاً', async () => {
    const legacy = legacyHashPin('1234', USER);
    expect(isBcryptHash(legacy)).toBe(false);
    expect(await matchesPin('1234', USER, legacy)).toBe(true);
  });

  it('يرفض PIN خاطئاً على الصيغة القديمة', async () => {
    const legacy = legacyHashPin('1234', USER);
    expect(await matchesPin('9999', USER, legacy)).toBe(false);
  });

  it('يميّز الصيغتين بلا التباس', () => {
    expect(isBcryptHash('$2a$10$abcdefghijklmnopqrstuv')).toBe(true);
    expect(isBcryptHash('$2b$10$abcdefghijklmnopqrstuv')).toBe(true);
    expect(isBcryptHash(legacyHashPin('1234', USER))).toBe(false);
  });

  it('لا ينهار على تجزئة مشوّهة أو فارغة', async () => {
    expect(await matchesPin('1234', USER, '')).toBe(false);
    expect(await matchesPin('1234', USER, 'not-a-hash')).toBe(false);
  });
});
