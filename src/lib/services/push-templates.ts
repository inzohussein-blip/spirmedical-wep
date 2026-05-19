'use server';

import { sendPushToUser } from './push';
import { logger } from '@/lib/logger';

/**
 * ═══════════════════════════════════════════════════════════════
 * Push Notification Templates (V25.3)
 * ═══════════════════════════════════════════════════════════════
 *
 * قوالب جاهزة لكل نوع من الأحداث.
 * كل دالة تأخذ user_id + بيانات الحدث، وتُرسل push مناسب.
 *
 * كل الدوال "fail-safe" - لو فشل الـ push، لا تُلقي خطأ.
 * ═══════════════════════════════════════════════════════════════
 */

/* ─── 1. تأكيد طلب جديد (للمريض) ─── */

export async function notifyOrderConfirmed(
  userId: string,
  data: { orderId: string; serviceName: string; scheduledAt: string }
): Promise<void> {
  try {
    const date = new Date(data.scheduledAt);
    const dateStr = date.toLocaleDateString('ar-IQ', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
    const timeStr = date.toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await sendPushToUser(
      userId,
      {
        title: '✅ تم تأكيد طلبك',
        body: `${data.serviceName} · ${dateStr} الساعة ${timeStr}`,
        url: `/appointments/${data.orderId}`,
        tag: `order-${data.orderId}-confirmed`,
        data: { orderId: data.orderId, type: 'order_confirmed' },
      },
      'appointment_reminders'
    );
  } catch (err) {
    logger.warn('notifyOrderConfirmed failed', {
      userId,
      orderId: data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 2. تعيين أخصائي (للمريض) ─── */

export async function notifySpecialistAssigned(
  userId: string,
  data: {
    orderId: string;
    specialistName: string;
    serviceName: string;
  }
): Promise<void> {
  try {
    await sendPushToUser(
      userId,
      {
        title: '👨‍⚕️ تم تعيين الفنّي',
        body: `${data.specialistName} سيقوم بـ ${data.serviceName}`,
        url: `/appointments/${data.orderId}/track`,
        tag: `order-${data.orderId}-assigned`,
        data: { orderId: data.orderId, type: 'specialist_assigned' },
      },
      'appointment_reminders'
    );
  } catch (err) {
    logger.warn('notifySpecialistAssigned failed', {
      userId,
      orderId: data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 3. إلغاء طلب (للمريض) ─── */

export async function notifyOrderCancelled(
  userId: string,
  data: {
    orderId: string;
    reason: string;
  }
): Promise<void> {
  try {
    await sendPushToUser(
      userId,
      {
        title: '❌ تم إلغاء طلبك',
        body: `السبب: ${data.reason}`,
        url: `/appointments/${data.orderId}`,
        tag: `order-${data.orderId}-cancelled`,
        data: { orderId: data.orderId, type: 'order_cancelled' },
      },
      'appointment_reminders'
    );
  } catch (err) {
    logger.warn('notifyOrderCancelled failed', {
      userId,
      orderId: data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 4. تذكير قبل الموعد (للمريض) - يُستخدم في Cron ─── */

export async function notifyAppointmentReminder(
  userId: string,
  data: {
    orderId: string;
    serviceName: string;
    minutesBefore: number;
  }
): Promise<void> {
  try {
    // ✨ V25.5: تكييف للـ daily cron
    const hours = Math.round(data.minutesBefore / 60);
    let timeText: string;
    let titleEmoji: string;

    if (hours === 0) {
      timeText = 'قريباً جداً';
      titleEmoji = '🚨';
    } else if (hours === 1) {
      timeText = 'خلال ساعة';
      titleEmoji = '⏰';
    } else if (hours <= 6) {
      timeText = `خلال ${hours} ساعات`;
      titleEmoji = '⏰';
    } else {
      timeText = `اليوم في الساعة المحدّدة`;
      titleEmoji = '📅';
    }

    await sendPushToUser(
      userId,
      {
        title: `${titleEmoji} موعدك اليوم`,
        body: `${data.serviceName} - ${timeText}. تأكد من جاهزيتك.`,
        url: `/appointments/${data.orderId}/track`,
        tag: `order-${data.orderId}-reminder`,
        data: { orderId: data.orderId, type: 'appointment_reminder' },
      },
      'appointment_reminders'
    );
  } catch (err) {
    logger.warn('notifyAppointmentReminder failed', {
      userId,
      orderId: data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 5. صدور نتائج التحاليل (للمريض) ─── */

export async function notifyTestResultsReady(
  userId: string,
  data: {
    orderId: string;
    testName?: string;
  }
): Promise<void> {
  try {
    await sendPushToUser(
      userId,
      {
        title: '🧪 نتائج تحاليلك جاهزة',
        body: data.testName
          ? `نتائج ${data.testName} متاحة الآن`
          : 'تحاليلك جاهزة - اضغط للعرض',
        url: `/appointments/${data.orderId}`,
        tag: `order-${data.orderId}-results`,
        data: { orderId: data.orderId, type: 'test_results' },
      },
      'test_results'
    );
  } catch (err) {
    logger.warn('notifyTestResultsReady failed', {
      userId,
      orderId: data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 6. الموافقة على طلب الأخصائي ─── */

export async function notifySpecialistApproved(
  userId: string,
  data: { specialistType?: string }
): Promise<void> {
  try {
    await sendPushToUser(
      userId,
      {
        title: '🎉 تمت الموافقة!',
        body: data.specialistType
          ? `أصبحت أخصائي ${data.specialistType} رسمياً في Spir Medical`
          : 'تم قبول طلبك كأخصائي - ابدأ استقبال الطلبات الآن',
        url: '/specialist',
        tag: 'specialist-approved',
        data: { type: 'specialist_approved' },
      },
      'system_updates'
    );
  } catch (err) {
    logger.warn('notifySpecialistApproved failed', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 7. رفض طلب الأخصائي ─── */

export async function notifySpecialistRejected(
  userId: string,
  data: { reason: string }
): Promise<void> {
  try {
    await sendPushToUser(
      userId,
      {
        title: 'تحديث على طلبك',
        body: `لم تتم الموافقة على طلبك. السبب: ${data.reason}`,
        url: '/specialist',
        tag: 'specialist-rejected',
        data: { type: 'specialist_rejected' },
      },
      'system_updates'
    );
  } catch (err) {
    logger.warn('notifySpecialistRejected failed', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 8. طلب جديد للأخصائي ─── */

export async function notifyNewOrderForSpecialist(
  specialistUserId: string,
  data: {
    orderId: string;
    serviceName: string;
    patientName: string;
    scheduledAt: string;
  }
): Promise<void> {
  try {
    const date = new Date(data.scheduledAt);
    const dateStr = date.toLocaleDateString('ar-IQ', {
      day: 'numeric',
      month: 'short',
    });
    const timeStr = date.toLocaleTimeString('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
    });

    await sendPushToUser(
      specialistUserId,
      {
        title: '📋 طلب جديد!',
        body: `${data.serviceName} · ${data.patientName} · ${dateStr} ${timeStr}`,
        url: `/specialist/orders/${data.orderId}`,
        tag: `specialist-order-${data.orderId}`,
        data: { orderId: data.orderId, type: 'new_order_specialist' },
      },
      'system_updates'
    );
  } catch (err) {
    logger.warn('notifyNewOrderForSpecialist failed', {
      specialistUserId,
      orderId: data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/* ─── 9. رسالة جديدة ─── */

export async function notifyNewMessage(
  recipientUserId: string,
  data: {
    senderName: string;
    preview: string;
    threadId: string;
  }
): Promise<void> {
  try {
    await sendPushToUser(
      recipientUserId,
      {
        title: `💬 ${data.senderName}`,
        body:
          data.preview.length > 80
            ? data.preview.slice(0, 80) + '...'
            : data.preview,
        url: `/messages/${data.threadId}`,
        tag: `message-${data.threadId}`,
        data: { threadId: data.threadId, type: 'new_message' },
      },
      'messages'
    );
  } catch (err) {
    logger.warn('notifyNewMessage failed', {
      recipientUserId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
