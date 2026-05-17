import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CheckResult {
  status: 'ok' | 'error';
  latency_ms?: number;
  error?: string;
}

/**
 * GET /api/health
 *
 * فحص صحة النظام لـ uptime monitoring (Better Uptime, UptimeRobot, ...)
 *
 * Returns:
 * - 200 إذا كل شي يعمل
 * - 503 إذا فيه مشكلة جوهرية (DB down)
 */
export async function GET() {
  const checks: Record<string, CheckResult> = {};
  let allOK = true;

  // 1. فحص Supabase
  try {
    const t0 = Date.now();
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      checks.database = { status: 'error', error: error.message };
      allOK = false;
    } else {
      checks.database = { status: 'ok', latency_ms: Date.now() - t0 };
    }
  } catch (e) {
    checks.database = {
      status: 'error',
      error: e instanceof Error ? e.message : 'unknown',
    };
    allOK = false;
  }

  // 2. فحص environment variables الحيوية
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ENCRYPTION_KEY',
  ];
  const missingEnv = requiredEnv.filter((k) => !process.env[k]);

  checks.environment = missingEnv.length === 0
    ? { status: 'ok' }
    : { status: 'error', error: `Missing: ${missingEnv.join(', ')}` };

  if (missingEnv.length > 0) allOK = false;

  const response = {
    status: allOK ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.22.0',
    environment: process.env.NODE_ENV ?? 'unknown',
    region: process.env.VERCEL_REGION ?? 'unknown',
    checks,
  };

  return NextResponse.json(response, {
    status: allOK ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
