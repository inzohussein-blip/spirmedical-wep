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

// ─────────────────────────────────────────────────────────
// 🚀 V29: Upstash Redis client (singleton)
// ─────────────────────────────────────────────────────────
let upstashRedis: unknown = null;
let upstashReady = false;
let upstashChecked = false;

async function getUpstashRedis(): Promise<unknown> {
  if (upstashChecked) return upstashRedis;
  upstashChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const mod = await import(
      /* webpackIgnore: true */ '@upstash/redis' as string
    ).catch(() => null);
    if (!mod) return null;

    const Redis = (mod as { Redis?: new (cfg: unknown) => unknown }).Redis;
    if (!Redis) return null;

    upstashRedis = new Redis({ url, token });
    upstashReady = true;
    return upstashRedis;
  } catch {
    return null;
  }
}

async function checkRateLimitUpstash(
  key: string,
  options: RateLimitOptions,
  redis: unknown
): Promise<RateLimitResult> {
  const r = redis as {
    incr: (k: string) => Promise<number>;
    expire: (k: string, s: number) => Promise<number>;
    ttl: (k: string) => Promise<number>;
  };

  const redisKey = `rl:${key}`;
  const count = await r.incr(redisKey);

  if (count === 1) {
    await r.expire(redisKey, options.windowSeconds);
  }

  if (count > options.max) {
    const ttl = await r.ttl(redisKey);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: ttl > 0 ? ttl : options.windowSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.max - count),
    retryAfterSeconds: 0,
  };
}

/**
 * فحص rate limit
 *
 * في الإنتاج (لو UPSTASH_* مُعرّف): يستخدم Upstash Redis (دائم + multi-instance).
 * خلاف ذلك: in-memory store (fallback).
 *
 * @example
 * const result = await checkRateLimit(`otp:${phone}`, { max: 3, windowSeconds: 600 });
 * if (!result.allowed) return { error: `حاول بعد ${result.retryAfterSeconds}s` };
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  // 🚀 V29: استخدم Upstash لو متاح
  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const redis = await getUpstashRedis();
      if (redis && upstashReady) {
        return await checkRateLimitUpstash(key, options, redis);
      }
    } catch {
      // لو فشل Upstash لأي سبب، ارجع للذاكرة
    }
  }

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
