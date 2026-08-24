import { readFileSync } from 'fs';
import { join } from 'path';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

describe('Rate Limit', () => {
  beforeEach(() => {
    resetRateLimit('test-key');
  });

  it('يسمح بالطلب الأول', async () => {
    const result = await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('يحتسب المحاولات بشكل صحيح', async () => {
    await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    const result = await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('يمنع بعد تجاوز الحد', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    }
    const result = await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('مفاتيح مختلفة لها عدّادات مستقلة', async () => {
    await checkRateLimit('key-a', { max: 1, windowSeconds: 60 });
    const a = await checkRateLimit('key-a', { max: 1, windowSeconds: 60 });
    const b = await checkRateLimit('key-b', { max: 1, windowSeconds: 60 });

    expect(a.allowed).toBe(false);
    expect(b.allowed).toBe(true);
  });

  it('reset يُعيد العداد', async () => {
    await checkRateLimit('test-key', { max: 1, windowSeconds: 60 });
    let result = await checkRateLimit('test-key', { max: 1, windowSeconds: 60 });
    expect(result.allowed).toBe(false);

    resetRateLimit('test-key');
    result = await checkRateLimit('test-key', { max: 1, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// طبقة قاعدة البيانات — حارسٌ ساكن
// ─────────────────────────────────────────────────────────────────
/**
 * `checkRateLimit` يحرس محيط المصادقة كلَّه (إرسال OTP والتحقّق منه
 * والدخول والتسجيل والطوارئ). وكانت طبقتاه: Upstash إن ضُبط، وإلّا
 * **ذاكرة العملية** — و`UPSTASH_REDIS_REST_URL=` فارغٌ في `.env.example`.
 *
 * وعلى منصّةٍ عديمة الحالة لكلّ نسخةٍ ذاكرتُها، فالحدّ الفعليّ = الحدّ ×
 * عدد النسخ. أُضيفت طبقةُ قاعدةٍ بينهما تستعمل `rate_limit_buckets`
 * (الجدول كان مبنيّاً وغير قابلٍ للاستعمال: سياسته تشترط `service_role`
 * بينما `service_role` بلا مِنحةٍ واحدة).
 *
 * الترتيب مقصود، وكذلك الفشل المفتوح: تعذُّر القاعدة يسقط إلى الذاكرة لا
 * إلى المنع — فلا يُحرَم مريضٌ من الدخول بسبب عطلٍ في التخزين.
 */
describe('طبقات تحديد المعدّل', () => {
  const src = readFileSync(join(process.cwd(), 'src', 'lib', 'rate-limit.ts'), 'utf8');

  it('طبقة القاعدة موجودة وتسبق الذاكرة', () => {
    expect(src).toMatch(/checkRateLimitDb/);
    const dbCall = src.indexOf('await checkRateLimitDb(');
    const memCall = src.indexOf('return checkRateLimitMemory(key, options);\n}');
    expect(dbCall).toBeGreaterThan(-1);
    expect(dbCall).toBeLessThan(memCall);
  });

  it('تفشل مفتوحةً إلى الطبقة التالية لا إلى المنع', () => {
    const fn = src.slice(src.indexOf('async function checkRateLimitDb'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    // كل مخارج الفشل ترجع null (تسليمٌ للذاكرة) ولا ترمي
    expect(body).toMatch(/catch\s*\{\s*return null;\s*\}/);
    expect(body).toMatch(/if \(error \|\| !data \|\| data\.length === 0\) return null;/);
    expect(body).not.toMatch(/allowed:\s*false/);
  });

  it('الدالّة في الترحيل ذرّية ومحصورةٌ بالدور الخدميّ', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase', 'migrations', '0027_db_rate_limit.sql'),
      'utf8',
    );
    // الزيادة والقرار في عبارةٍ واحدة — لا قراءةٌ ثمّ كتابة
    expect(sql).toMatch(/ON CONFLICT \(bucket_key\) DO UPDATE/);
    expect(sql).toMatch(/REVOKE EXECUTE ON FUNCTION public\.consume_rate_limit[\s\S]*?FROM PUBLIC, anon, authenticated/);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.consume_rate_limit[\s\S]*?TO service_role/);
  });
});
