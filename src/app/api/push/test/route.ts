import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/services/push';

/**
 * POST /api/push/test
 *
 * يُرسل push notification تجريبي للمستخدم الحالي
 * يُستخدم لاختبار الاشتراك في صفحة الإعدادات
 */
export async function POST() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول' },
      { status: 401 }
    );
  }

  const result = await sendPushToUser(user.id, {
    title: '🎉 إشعار تجريبي',
    body: 'الإشعارات تعمل بشكل ممتاز! ستصلك المواعيد والنتائج هنا.',
    url: '/dashboard',
    tag: 'test',
  });

  return NextResponse.json({
    success: result.sent > 0,
    ...result,
  });
}
