import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server-service';
import { enqueueRawNotification } from '@/lib/notifications';
import { sendQueuedNotification } from '@/lib/notifications-processor';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * تذكيرات المستخدم (دواء/موعد/فحص/لقاح) — كان جدول `reminders` يُكتب ولا يُقرأ
 * أبداً (لا مُرسِل). هذا الكرون يقرأ التذكيرات المستحقّة ويُرسلها عبر الطابور.
 *
 * نموذج التكرار (كرون يومي على خطة Hobby): يُرسَل التذكير مرّة لكل دورة اعتماداً
 * على last_triggered. 'once' يُعطَّل بعد الإرسال.
 */

interface ReminderRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  frequency: string;
  last_triggered: string | null;
}

const MIN_GAP_MS: Record<string, number> = {
  daily: 20 * 60 * 60 * 1000,        // ~مرة يومياً
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 28 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

function isDue(r: ReminderRow, now: number): boolean {
  if (new Date(r.scheduled_at).getTime() > now) return false; // لم يحن بعد
  if (r.frequency === 'once') return r.last_triggered == null;
  if (!r.last_triggered) return true;
  const gap = MIN_GAP_MS[r.frequency] ?? MIN_GAP_MS.daily;
  return now - new Date(r.last_triggered).getTime() >= gap;
}

const TYPE_LABEL: Record<string, string> = {
  medication: '💊 تذكير دواء',
  appointment: '📅 تذكير موعد',
  checkup: '🩺 تذكير فحص',
  vaccine: '💉 تذكير لقاح',
};

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const { data: reminders, error } = await service
    .from('reminders')
    .select('id, user_id, type, title, description, scheduled_at, frequency, last_triggered')
    .eq('active', true)
    .lte('scheduled_at', nowIso)
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = (reminders ?? []).filter((r) => isDue(r as ReminderRow, now));
  if (due.length === 0) return NextResponse.json({ processed: 0, sent: 0 });

  // هواتف المستخدمين
  const userIds = [...new Set(due.map((r) => r.user_id))];
  const { data: users } = await service
    .from('users')
    .select('id, phone, full_name')
    .in('id', userIds);
  const phoneMap = new Map((users ?? []).map((u) => [u.id, u]));

  let sent = 0;
  for (const r of due) {
    const u = phoneMap.get(r.user_id);
    if (!u?.phone) continue;

    const label = TYPE_LABEL[r.type] ?? '🔔 تذكير';
    const body = `${label}\n${r.title}${r.description ? `\n${r.description}` : ''}`;

    const enq = await enqueueRawNotification(
      {
        recipientUserId: r.user_id,
        recipientPhone: u.phone,
        channel: 'whatsapp',
        body,
        relatedType: 'reminder',
        relatedId: r.id,
      },
      service,
    );
    if (enq.ok) {
      await sendQueuedNotification(enq.id);
      sent++;
    }

    await service
      .from('reminders')
      .update({
        last_triggered: nowIso,
        ...(r.frequency === 'once' ? { active: false } : {}),
      })
      .eq('id', r.id);
  }

  logger.info('Reminders cron processed', { due: due.length, sent });
  return NextResponse.json({ processed: due.length, sent });
}
