import { NextResponse, type NextRequest } from 'next/server';
import { verifyGithubOidc } from '@/lib/ops/github-oidc';
import { recordSystemError, resolveSystemErrors } from '@/lib/ops/system-errors';
import { alertOwner } from '@/lib/ops/alert-owner';
import { ingestSchema, ingestKey, isCritical, markIngestSeen } from '@/lib/ops/ci-ingest';

/**
 * POST /api/ops/ingest — فشلُ البناء وفحوصِ GitHub يصل إلى رصد الأخطاء (0057).
 *
 * يرسله `.github/workflows/report-failures.yml` عند انتهاء كلّ سير عمل (workflow_run) وكلّ حالة نشرٍ من
 * Vercel (deployment_status). الهويّةُ رمزُ OIDC من GitHub — لا سرَّ مشترك. الفشلُ يُسجَّل (وعلى main أو
 * الإنتاج يُرسَل بريدٌ للمالك)، والنجاحُ يُغلق الفشلَ نفسَه على الفرع نفسه.
 */
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const auth = await verifyGithubOidc(token);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized', reason: auth.reason }, { status: 401 });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const parsed = ingestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  const { kind, status, name, branch, url, sha, description } = parsed.data;
  const key = ingestKey(name, branch);
  await markIngestSeen({ kind, status, name, branch });

  if (status === 'success') {
    const resolved = await resolveSystemErrors(kind, [key]);
    return NextResponse.json({ ok: true, resolved });
  }

  const critical = isCritical(kind, name, branch);
  const message = kind === 'ci'
    ? `فشل فحص «${name}» على ${branch}`
    : `فشل النشر على Vercel (${name}) — ${branch}`;
  const recorded = await recordSystemError({
    source: kind,
    key,
    level: critical ? 'fatal' : 'error',
    message,
    path: null,
    detail: { name, branch, url, sha: sha?.slice(0, 12), description },
  });
  if (critical) {
    await alertOwner(message, [url ? `الرابط: ${url}` : '', sha ? `الإيداع: ${sha.slice(0, 12)}` : '', description ?? ''].filter(Boolean));
  }
  return NextResponse.json({ ok: true, recorded });
}
