import { createAdminClient } from '@/lib/supabase/server';

export interface RateLimitOptions {
  /** الحد الأقصى للمحاولات */
  max: number;
  /** نافذة الزمن بالثواني */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * In-memory rate limit store (fallback عندما لا يوجد Redis/Upstash)
 * ⚠ ملاحظة: في serverless multi-instance، هذا غير دقيق.
 * للإنتاج: استخدم @upstash/ratelimit أو Vercel KV.
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

// تنظيف دوري للذاكرة (كل دقيقة)
if (typeof globalThis !== 'undefined' && !(globalThis as any).__rateLimitCleanup) {
  (globalThis as any).__rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) memoryStore.delete(key);
    }
  }, 60_000);
}

/**
 * فحص rate limit
 *
 * في التطوير: يستخدم in-memory store.
 * في الإنتاج (موصى به): استبدله بـ Upstash Redis أو Vercel KV.
 *
 * @example
 * const result = await checkRateLimit(`otp:${phone}`, { max: 3, windowSeconds: 600 });
 * if (!result.allowed) return { error: `حاول بعد ${result.retryAfterSeconds}s` };
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  // في الإنتاج، استخدم Upstash:
  // if (process.env.UPSTASH_REDIS_REST_URL) {
  //   return checkRateLimitUpstash(key, options);
  // }

  return checkRateLimitMemory(key, options);
}

function checkRateLimitMemory(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: options.max - 1,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: options.max - entry.count,
    retryAfterSeconds: 0,
  };
}

/**
 * إعادة تعيين rate limit لمفتاح معيّن (لاستخدامه في الاختبارات)
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}
