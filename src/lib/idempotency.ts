/**
 * Idempotency Helper — حماية من الإرسال المزدوج
 *
 * يحمي من ضغط زرّ «تأكيد الطلب» مرّتين بسرعة (أو إعادة إرسال بعد انقطاع شبكة)
 * فيُنشأ طلبان متطابقان. يخزّن نتيجة العملية 24 ساعة ويُعيدها بدل تنفيذها ثانيةً.
 *
 * ⚠️ مبدأ سلامة أساسي: **لا تُخزَّن إلا النتائج الناجحة.**
 * لو خُزّن الفشل، لبقي المريض عالقاً 24 ساعة يتلقّى نفس رسالة الخطأ حتى لو
 * صحّح بياناته — فالمفتاح نفسه سيُعيد النتيجة المخزّنة. لذلك `shouldCache`
 * الافتراضي يرفض أي نتيجة تحمل `success:false` أو `ok:false`.
 *
 * يتطلّب جدول `idempotency_keys` (موجود في 0001_core_foundation.sql).
 */

import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const TTL_HOURS = 24;

/** توليد مفتاح ثابت من أجزاء الطلب المميِّزة */
export function generateKey(parts: (string | number | undefined | null)[]): string {
  const cleaned = parts.filter((p) => p !== undefined && p !== null && p !== '').join(':');
  return createHash('sha256').update(cleaned).digest('hex').slice(0, 32);
}

/** النتيجة ناجحة؟ (يدعم اصطلاحَي `success` و`ok` المستعملين في المشروع) */
function isSuccessful(result: unknown): boolean {
  if (!result || typeof result !== 'object') return true;
  const r = result as { success?: unknown; ok?: unknown };
  if (r.success === false || r.ok === false) return false;
  return true;
}

type IdempotencyClient = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        gte: (col: string, val: string) => {
          maybeSingle: () => Promise<{ data: { result: unknown } | null; error: unknown }>;
        };
      };
    };
    insert: (data: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    delete: (opts?: { count: 'exact' }) => {
      lt: (col: string, val: string) => Promise<{ count: number | null; error: unknown }>;
    };
  };
};

/**
 * نفّذ `fn` مرّة واحدة لكل مفتاح خلال 24 ساعة.
 *
 * فشل طبقة الـidempotency نفسها **لا يمنع تنفيذ العملية** — الحماية مكمّلة،
 * وتعطيلها أهون من منع مريض من رفع طلب.
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  options?: { shouldCache?: (result: T) => boolean }
): Promise<T> {
  const shouldCache = options?.shouldCache ?? isSuccessful;
  // الجدول غير مُعرَّف في types/database.ts بعد — cast مُضيَّق
  const supabase = createAdminClient() as unknown as IdempotencyClient;

  // 1) نتيجة محفوظة وسارية؟
  try {
    const { data: existing, error } = await supabase
      .from('idempotency_keys')
      .select('result')
      .eq('key', key)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      logger.warn('Idempotency lookup failed — proceeding without protection', { key });
    } else if (existing) {
      logger.info('Duplicate submission short-circuited by idempotency', { key });
      return existing.result as T;
    }
  } catch (err) {
    logger.warn('Idempotency lookup threw — proceeding without protection', {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 2) نفّذ العملية
  const result = await fn();

  // 3) خزّن الناجح فقط
  if (shouldCache(result)) {
    try {
      const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
      const { error } = await supabase.from('idempotency_keys').insert({
        key,
        result: result as unknown as Record<string, unknown>,
        expires_at: expiresAt.toISOString(),
      });
      if (error) {
        // تعارض المفتاح (23505) يعني أنّ طلباً متوازياً سبقنا — ليس خطأً فعلياً
        logger.warn('Idempotency store failed', { key, error: error.message });
      }
    } catch (err) {
      logger.warn('Idempotency store threw', {
        key,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

/** تنظيف المفاتيح المنتهية (يُستدعى من cron يومي) */
export async function cleanupExpiredKeys(): Promise<number> {
  const supabase = createAdminClient() as unknown as IdempotencyClient;
  try {
    const { count, error } = await supabase
      .from('idempotency_keys')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString());

    if (error) {
      logger.warn('cleanupExpiredKeys failed', { error: String(error) });
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    logger.warn('cleanupExpiredKeys threw', {
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
