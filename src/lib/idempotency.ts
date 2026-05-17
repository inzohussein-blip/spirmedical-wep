/**
 * Idempotency Helper
 *
 * يحمي من double-submit (مثلاً ضغط زر "حجز" مرتين بسرعة)
 * عبر تخزين Idempotency-Key لـ 24 ساعة.
 *
 * الاستخدام:
 *   const result = await withIdempotency(
 *     `appointment:${userId}:${formHash}`,
 *     async () => { return await createAppointment(...); }
 *   );
 *
 * ⚠️ يتطلّب جدول idempotency_keys (انظر supabase/migrations/20260510_001_*.sql)
 */

import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

const TTL_HOURS = 24;

/**
 * توليد idempotency key من بيانات الطلب
 */
export function generateKey(parts: (string | number | undefined | null)[]): string {
  const cleaned = parts.filter(Boolean).join(':');
  return createHash('sha256').update(cleaned).digest('hex').slice(0, 32);
}

/**
 * خزّن نتيجة عملية وأعِدها لاحقاً إذا كرّر المستخدم نفس الطلب
 *
 * ملاحظة: الجدول `idempotency_keys` ليس في types/database.ts بعد،
 * لذلك نستخدم `as any` على الـ table reference.
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // ملاحظة: الجدول `idempotency_keys` ليس في types/database.ts
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          gte: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { result: unknown } | null }>;
          };
        };
      };
      insert: (data: Record<string, unknown>) => Promise<unknown>;
      delete: (opts: { count: string }) => {
        lt: (col: string, val: string) => Promise<{ count: number | null }>;
      };
    };
  };

  // ابحث عن نتيجة موجودة
  const { data: existing } = await supabase
    .from('idempotency_keys')
    .select('result')
    .eq('key', key)
    .gte('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return existing.result as T;
  }

  // نفّذ العملية
  const result = await fn();

  // خزّن النتيجة
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);
  await supabase.from('idempotency_keys').insert({
    key,
    result: result as Record<string, unknown>,
    expires_at: expiresAt.toISOString(),
  });

  return result;
}

/**
 * تنظيف الـ keys المنتهية الصلاحية (cron job)
 */
export async function cleanupExpiredKeys(): Promise<number> {
  const supabase = createAdminClient() as unknown as {
    from: (table: string) => {
      delete: (opts: { count: string }) => {
        lt: (col: string, val: string) => Promise<{ count: number | null }>;
      };
    };
  };
  const { count } = await supabase
    .from('idempotency_keys')
    .delete({ count: 'exact' })
    .lt('expires_at', new Date().toISOString());

  return count ?? 0;
}
