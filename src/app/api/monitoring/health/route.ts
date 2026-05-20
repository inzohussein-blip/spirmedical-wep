/**
 * ═══════════════════════════════════════════════════════════════
 * 🟢 Health Check & Monitoring (V25.12)
 * ═══════════════════════════════════════════════════════════════
 *
 * GET /api/monitoring/health
 *
 * يفحص:
 *   - الـ DB connection
 *   - الـ Auth service
 *   - الـ Storage
 *   - مدّة الاستجابة
 *
 * Returns 200 لو كل شيء OK، 503 لو في مشاكل
 *
 * يُستخدم مع:
 *   - UptimeRobot (مجاني)
 *   - Pingdom
 *   - StatusCake
 *   - Vercel Cron
 * ═══════════════════════════════════════════════════════════════
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CheckResult {
  ok: boolean;
  latency_ms?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  uptime_seconds: number;
  checks: {
    database: CheckResult;
    auth: CheckResult;
    storage: CheckResult;
  };
  region?: string;
}

const APP_VERSION = 'V25.12';
const START_TIME = Date.now();

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createClient();
    // فحص بسيط - عدّ في جدول users
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return { ok: false, error: error.message, latency_ms: Date.now() - start };
    }

    return { ok: true, latency_ms: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      latency_ms: Date.now() - start,
    };
  }
}

async function checkAuth(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createClient();
    // فحص الـ auth service (getSession آمن - لا يفشل)
    const { error } = await supabase.auth.getSession();

    if (error) {
      return { ok: false, error: error.message, latency_ms: Date.now() - start };
    }

    return { ok: true, latency_ms: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      latency_ms: Date.now() - start,
    };
  }
}

async function checkStorage(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const supabase = createClient();
    const { error } = await supabase.storage.listBuckets();

    if (error) {
      return { ok: false, error: error.message, latency_ms: Date.now() - start };
    }

    return { ok: true, latency_ms: Date.now() - start };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      latency_ms: Date.now() - start,
    };
  }
}

export async function GET() {
  const [database, auth, storage] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
  ]);

  const allOk = database.ok && auth.ok && storage.ok;
  const anyOk = database.ok || auth.ok || storage.ok;

  const status: HealthResponse['status'] =
    allOk ? 'healthy' :
    anyOk ? 'degraded' :
    'down';

  const response: HealthResponse = {
    status,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
    checks: { database, auth, storage },
    region: process.env.VERCEL_REGION,
  };

  const httpStatus = allOk ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Status': status,
    },
  });
}
