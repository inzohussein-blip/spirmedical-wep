import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔌 حارس الميزات الموصولة
 *
 * فئة أخطاء لا يكشفها المترجم ولا الاختبارات: إجراء خادمي مبنيّ بالكامل
 * (جدول + RLS + منطق) **بلا أي واجهة تستدعيه**. الميزة تبدو موجودة في
 * الكود وغائبة تماماً عن المنتج.
 *
 * ثلاث حالات كانت كذلك:
 *   1. لا مسار يُنشئ صفّاً في `chats` إطلاقاً → **لا محادثة يمكن أن توجد**،
 *      رغم وجود صندوق وارد و`ChatList` وإرسال رسائل تقرأ منه.
 *   2. `submitPharmacyRating` بلا واجهة → `rating_count > 0` لا يتحقّق أبداً.
 *   3. المفضّلة: الصيدليات والأطباء لم يكن لهما زرّ رغم دعم النوعين.
 */

const SRC = join(process.cwd(), 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

/** يُزيل التعليقات كي لا يُرضي الحارسَ ذكرٌ في تعليق */
const strip = (c: string) =>
  c.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

describe('🔌 المحادثات: يوجد مسار يُنشئ محادثة فعلاً', () => {
  it('مساعد فتح المحادثة موجود ويُدرج في chats', () => {
    const code = strip(read('lib/chat/open-chat.ts'));
    expect(/from\(\s*['"]chats['"]\s*\)\s*\.insert\(/.test(code)).toBe(true);
    // يتحقّق أنّ الموعد يخصّ المستخدم قبل فتح محادثة عنه
    expect(code).toContain("eq('user_id', user.id)");
  });

  it('🚨 صفحة الرسائل توصل مدخل `?appointment=`', () => {
    const code = strip(read('app/(dashboard)/messages/page.tsx'));
    expect(code).toContain('openChatForAppointment');
    expect(code).toContain('searchParams.appointment');
  });

  it('الروابط المؤدّية للمحادثة تمرّر معرّف الطلب', () => {
    for (const rel of [
      'components/dashboard/LiveStatusCard.tsx',
      'app/(dashboard)/appointments/[id]/track/OrderTrackClient.tsx',
    ]) {
      expect(/\/messages\?appointment=/.test(strip(read(rel)))).toBe(true);
    }
  });

  it('🚨 لم تعد `createChat` المعطوبة موجودة (كانت تقلب طرفَي المحادثة)', () => {
    const code = read('app/(specialist)/specialist/inbox/actions.ts');
    expect(/export async function createChat\s*\(/.test(code)).toBe(false);
  });
});

describe('🔌 تقييم الصيدلية: للواجهة مدخل حقيقي', () => {
  it('بطاقة التقييم موجودة وتستدعي الإجراء', () => {
    const code = strip(read('app/(dashboard)/services/pharmacies/[id]/PharmacyRatingCard.tsx'));
    expect(code).toContain('submitPharmacyRating');
  });

  it('صفحة الصيدلية تعرض البطاقة وتزوّدها بحجزٍ مُستلَم', () => {
    const client = strip(read('app/(dashboard)/services/pharmacies/[id]/PharmacyDetailClient.tsx'));
    expect(client).toContain('PharmacyRatingCard');

    const page = strip(read('app/(dashboard)/services/pharmacies/[id]/page.tsx'));
    // الربط بحجزٍ مُستلَم يمنع التكرار: UNIQUE(user_id, reservation_id) لا
    // يعمل حين يكون reservation_id فارغاً (NULL متمايز في Postgres)
    expect(page).toContain('pharmacy_reservations');
    expect(page).toContain("'picked_up'");
  });
});

describe('🔌 لوحة الإدارة: ما تُظهره اللوحة يمكن إصلاحه منها', () => {
  it('🚨 تصحيح الإحداثيات موصول (اللوحة كانت تُظهر «بدون إحداثيات» بلا علاج)', () => {
    const code = strip(read('app/admin/locations/LocationsAdminClient.tsx'));
    expect(code).toContain('updateLocationCoords');
    expect(code).toContain('EditCoordsModal');
    // يبدأ من الإحداثيات الحالية عند وجودها
    expect(code).toContain('initialLat');
  });

  it('🚨 إعادة/إلغاء الإشعار موصولان بجدول الطابور', () => {
    const actions = strip(read('app/admin/notifications/NotificationRowActions.tsx'));
    expect(actions).toContain('retryNotification');
    expect(actions).toContain('cancelNotification');

    const page = strip(read('app/admin/notifications/page.tsx'));
    expect(page).toContain('NotificationRowActions');
  });

  it('الإتاحة تطابق ما يفرضه الإجراء نفسه', () => {
    const actions = strip(read('app/admin/notifications/NotificationRowActions.tsx'));
    // الإلغاء مقيَّد بـ pending داخل الإجراء، وإعادة المحاولة تخصّ الفاشلة
    expect(actions).toContain("status === 'failed'");
    expect(actions).toContain("status === 'pending'");

    const server = strip(read('app/admin/notifications/actions.ts'));
    expect(/cancelNotification[\s\S]*?eq\(\s*'status'\s*,\s*'pending'\s*\)/.test(server)).toBe(true);
  });

  it('قيم الحالة المستعملة موجودة في قيد قاعدة البيانات', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase/migrations/0002_communication.sql'),
      'utf8'
    );
    const check = /status\s+text DEFAULT 'pending' CHECK \(status IN \(([^)]*)\)\)/.exec(sql);
    expect(check).not.toBeNull();
    const allowed = [...check![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const v of ['pending', 'failed', 'cancelled']) {
      expect(allowed).toContain(v);
    }
  });
});

describe('🔌 المفضّلة: نظامٌ واحد موصول', () => {
  const DETAIL_PAGES_WITH_FAVORITE = [
    'app/(dashboard)/services/hospitals/[id]/page.tsx',
    'app/(dashboard)/services/dental/[id]/page.tsx',
    'app/(dashboard)/services/optical/[id]/page.tsx',
    'app/(dashboard)/services/mental-health/[id]/page.tsx',
    'app/(dashboard)/services/nutrition/[id]/page.tsx',
    'app/(dashboard)/services/physio/[id]/page.tsx',
  ];

  it.each(DETAIL_PAGES_WITH_FAVORITE)('%s فيه زرّ المفضّلة', (rel) => {
    expect(strip(read(rel))).toContain('ServiceFavoriteButton');
  });

  it('🚨 الصيدليات والأطباء أُضيفا إلى النظام نفسه (لا نظام ثانٍ)', () => {
    const pharmacy = strip(read('app/(dashboard)/services/pharmacies/[id]/PharmacyDetailClient.tsx'));
    const doctor = strip(read('app/(dashboard)/services/doctors/[id]/DoctorDetailClient.tsx'));
    expect(pharmacy).toContain('ServiceFavoriteButton');
    expect(doctor).toContain('ServiceFavoriteButton');
  });

  it('🚨 مقطع مسار كل نوع صحيح (لا اشتقاق بإضافة "s")', () => {
    const code = strip(read('components/services/favorites-actions.ts'));
    // الاشتقاق الخاطئ كان يُنتج pharmacys / mental_healths …
    expect(/\$\{serviceType\}s\//.test(code)).toBe(false);
    expect(code).toContain('SERVICE_PATH_SEGMENT');

    // كل مقطع في الخريطة يقابل مجلّداً حقيقياً تحت services/
    const dirs = new Set(
      readdirSync(join(SRC, 'app/(dashboard)/services'), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    );
    const segments = [...code.matchAll(/^\s*[a-z_]+:\s*'([a-z-]+)',/gim)].map((m) => m[1]);
    expect(segments.length).toBeGreaterThanOrEqual(8);
    for (const seg of segments) {
      expect(dirs.has(seg)).toBe(true);
      expect(existsSync(join(SRC, 'app/(dashboard)/services', seg, '[id]', 'page.tsx'))).toBe(true);
    }
  });
});
