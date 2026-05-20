import webpush from 'web-push';
import { createServiceClient } from '@/lib/supabase/server-service';
import { logger } from '@/lib/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * Push Notifications Service (V25.3)
 * ═══════════════════════════════════════════════════════════════
 *
 * يُستخدم في الـ server-side فقط:
 *   - sendPushToUser(userId, payload)
 *   - sendPushToUsers(userIds, payload)
 *
 * Setup VAPID keys (مرة واحدة، أضفها لـ .env):
 *   npx web-push generate-vapid-keys
 *
 *   → NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   → VAPID_PRIVATE_KEY=...
 *   → VAPID_SUBJECT=mailto:admin@spirmedical.iq
 * ═══════════════════════════════════════════════════════════════
 */

// ─── إعداد VAPID ──────────────────────────────────────
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@spirmedical.iq';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (err) {
    logger.warn('VAPID keys invalid', {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── Types ──────────────────────────────────────────── */

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export type NotificationCategory =
  | 'appointment_reminders'
  | 'test_results'
  | 'messages'
  | 'consultations'
  | 'promotions'
  | 'system_updates';

interface PushResult {
  sent: number;
  failed: number;
  removedSubscriptions: number;
}

/* ─── Send to single user ─────────────────────────── */

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  category?: NotificationCategory
): Promise<PushResult> {
  if (!isPushEnabled()) {
    logger.warn('Push notifications not configured (VAPID keys missing)');
    return { sent: 0, failed: 0, removedSubscriptions: 0 };
  }

  const supabase = createServiceClient();

  // ─── 1. تحقق من تفضيلات المستخدم ───
  if (category) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select(category)
      .eq('user_id', userId)
      .single();

    // إذا المستخدم عطّل هذا النوع، لا نُرسل
    if (prefs && !(prefs as unknown as Record<string, boolean>)[category]) {
      logger.info('Push skipped - user disabled category', { userId, category });
      return { sent: 0, failed: 0, removedSubscriptions: 0 };
    }

    // فحص quiet hours
    if (await isInQuietHours(userId)) {
      logger.info('Push skipped - in quiet hours', { userId });
      return { sent: 0, failed: 0, removedSubscriptions: 0 };
    }
  }

  // ─── 2. جلب الاشتراكات النشطة ───
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    logger.error('Failed to fetch subscriptions', {
      userId,
      error: error.message,
    });
    return { sent: 0, failed: 0, removedSubscriptions: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0, removedSubscriptions: 0 };
  }

  // ─── 3. أرسل لكل subscription ───
  return await sendToSubscriptions(subscriptions, payload);
}

/* ─── Send to multiple users ──────────────────────── */

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
  category?: NotificationCategory
): Promise<PushResult> {
  const results = await Promise.all(
    userIds.map((id) => sendPushToUser(id, payload, category))
  );

  return results.reduce(
    (acc, r) => ({
      sent: acc.sent + r.sent,
      failed: acc.failed + r.failed,
      removedSubscriptions: acc.removedSubscriptions + r.removedSubscriptions,
    }),
    { sent: 0, failed: 0, removedSubscriptions: 0 }
  );
}

/* ─── Helpers ─────────────────────────────────────── */

interface Subscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscriptions(
  subscriptions: Subscription[],
  payload: PushPayload
): Promise<PushResult> {
  const supabase = createServiceClient();
  let sent = 0;
  let failed = 0;
  let removedSubscriptions = 0;

  const fullPayload = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    url: payload.url || '/dashboard',
    tag: payload.tag || 'spir-notification',
    data: payload.data || {},
  };

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(fullPayload)
        );

        sent++;

        // حدّث last_used_at (fire-and-forget)
        supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id)
          .then(() => undefined);
      } catch (err) {
        const error = err as { statusCode?: number; body?: string };

        // 410 = endpoint منتهي → نحذفه
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          removedSubscriptions++;
        } else {
          failed++;
          logger.warn('Push send failed', {
            subscriptionId: sub.id,
            statusCode: error.statusCode,
            body: error.body,
          });
        }
      }
    })
  );

  return { sent, failed, removedSubscriptions };
}

async function isInQuietHours(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('quiet_hours_start, quiet_hours_end, quiet_hours_enabled')
    .eq('user_id', userId)
    .single();

  if (!prefs || !prefs.quiet_hours_enabled) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS

  const start = prefs.quiet_hours_start;
  const end = prefs.quiet_hours_end;

  // مثلاً: 23:00 → 07:00 (يعبر منتصف الليل)
  if (start > end) {
    return currentTime >= start || currentTime < end;
  } else {
    return currentTime >= start && currentTime < end;
  }
}

export function isPushEnabled(): boolean {
  return !!(VAPID_PUBLIC && VAPID_PRIVATE);
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC || null;
}
