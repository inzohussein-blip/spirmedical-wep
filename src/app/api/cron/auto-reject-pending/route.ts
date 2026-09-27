import { NextResponse, type NextRequest } from 'next/server';
import { withCronAlert } from '@/lib/ops/alert-owner';
import { createServiceClient } from '@/lib/supabase/server-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * رفضٌ تلقائيّ للطلبات المعلَّقة غير المُسنَدة.
 *
 * طلبٌ يبقى `pending` بلا إسنادٍ لا يُغلق نفسه أبداً، فينتظر المريضُ ولا
 * أحد يخبره. هذا المسار يستدعي `run_auto_reject_stale_pending()` التي
 * تُلغي المستحقّ **وتُدرج الإشعار في المعاملة نفسها** — فلا يقع رفضٌ صامت.
 *
 * المدّة ليست هنا ولا في الدالّة: تُقرأ من `app_settings` بالمفتاح
 * `pending_auto_reject_hours` ويحرّرها المشرف. وغيابُ الإعداد أو صفرُه
 * يوقف الرفض بدل أن يعود إلى قيمةٍ مفترَضة (الترحيل 0042).
 *
 * الشروط كلُّها في SQL لا هنا: `pending` وحدها، وبلا إسناد، والطوارئ
 * (`nurse_emergency_logs`) مستثناة. فلا يتفرّق المنطقُ على موضعين.
 */
async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // الأنواع المولَّدة في `src/types/database.ts` لا تعرف هذه الدالّة بعد،
  // فتُوصَّف هنا كما في `src/lib/rate-limit.ts`.
  const service = createServiceClient() as unknown as {
    rpc: (fn: string) => Promise<{
      data: Array<{ rejected: number; notified: number }> | null;
      error: { message: string } | null;
    }>;
  };

  const { data, error } = await service.rpc('run_auto_reject_stale_pending');

  if (error) {
    logger.error('auto-reject-pending failed', { error: error.message });
    return NextResponse.json({ error: 'rpc_failed' }, { status: 500 });
  }

  // الدالّة تُرجع صفّاً واحداً
  const row = data?.[0];
  const rejected = row?.rejected ?? 0;
  const notified = row?.notified ?? 0;

  if (rejected > 0) {
    logger.info('auto-reject-pending', { rejected, notified });
  }

  return NextResponse.json({ ok: true, rejected, notified });
}

// عطلٌ (5xx أو استثناء) → بريدٌ للمالك
export const GET = withCronAlert('auto-reject-pending', handler);
