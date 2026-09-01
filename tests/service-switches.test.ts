import { readFileSync } from 'fs';
import { join } from 'path';
import {
  serviceIdForPath,
  isEnabled,
  noteFor,
  allSwitchableServices,
  NON_SWITCHABLE,
  type ServiceSwitch,
} from '@/lib/service-switches';
import { FEATURED_SERVICE, CORE_SERVICES, SMART_TOOLS } from '@/lib/services-v3';

/**
 * 🔌 حارس مفاتيح تشغيل الخدمات
 *
 * الخدمة المطفأة تبقى معروضةً بشارة «قريباً» ولا تُفتح. والعبرة في الشطر
 * الثاني: النسخة الأولى من هذا السلوك في المشروع كانت تُسقط الرابط من
 * البطاقة وحدها، فكانت كتابةُ المسار في شريط العنوان — أو رابطٌ محفوظ أو
 * نتيجةُ بحث — تفتح الخدمة كاملةً. فالمنع في تخطيط المجموعة، وهذا يحرسه.
 */

const mk = (rows: Partial<ServiceSwitch>[] = []): Map<string, ServiceSwitch> => {
  const m = new Map<string, ServiceSwitch>();
  for (const r of rows) {
    m.set(r.service_id!, {
      service_id: r.service_id!,
      is_enabled: r.is_enabled ?? true,
      note_ar: r.note_ar ?? null,
      updated_at: '2026-01-01T00:00:00Z',
    });
  }
  return m;
};

describe('قرار التشغيل', () => {
  it('الغياب من الجدول يعني «مشتغلة» — فشلٌ مفتوح', () => {
    // عطبٌ في جدول أعلامٍ لا يجوز أن يُطفئ منصّةً طبّية
    expect(isEnabled(mk(), 'dental')).toBe(true);
    expect(isEnabled(mk(), 'أيّ-شيء')).toBe(true);
  });

  it('المطفأة مطفأة، والمشتغلة مشتغلة', () => {
    const s = mk([
      { service_id: 'dental', is_enabled: false },
      { service_id: 'optical', is_enabled: true },
    ]);
    expect(isEnabled(s, 'dental')).toBe(false);
    expect(isEnabled(s, 'optical')).toBe(true);
  });

  it('الطوارئ لا تُطفأ ولو كُتب في الجدول أنّها مطفأة', () => {
    // إدراجٌ يدويٌّ في الجدول لا يكفي لقطع طريق نجدةٍ عن مريض
    const s = mk([{ service_id: 'sos', is_enabled: false }]);
    expect(isEnabled(s, 'sos')).toBe(true);
    expect(NON_SWITCHABLE.has('sos')).toBe(true);
  });

  it('السبب يُقرأ حين يوجد', () => {
    const s = mk([{ service_id: 'dental', is_enabled: false, note_ar: 'تعود الأحد' }]);
    expect(noteFor(s, 'dental')).toBe('تعود الأحد');
    expect(noteFor(s, 'optical')).toBeNull();
  });
});

describe('مطابقة المسار بالخدمة', () => {
  it('المسار المباشر', () => {
    expect(serviceIdForPath('/services/dental')).toBe('dental');
    expect(serviceIdForPath('/services/optical')).toBe('optical');
    expect(serviceIdForPath('/tools/first-aid')).toBe('first-aid');
  });

  it('الصفحات الداخلية تُمنع مع أمّها', () => {
    // وإلّا فتح رابطٌ محفوظٌ عيادةً في خدمةٍ مطفأة
    expect(serviceIdForPath('/services/dental/abc-123')).toBe('dental');
    expect(serviceIdForPath('/services/pharmacies/xyz')).toBe('pharmacy');
  });

  it('لا يخلط مساراً ببادئة مسارٍ آخر', () => {
    // `/services/doctorsX` ليست `/services/doctors`
    expect(serviceIdForPath('/services/doctorsX')).toBeNull();
  });

  it('المسار المشترك يُحسم بـ`?service=` لا بالمسار', () => {
    // `blood-draw` و`nursing` كلاهما على `/appointments/new`
    const p = '/appointments/new';
    expect(serviceIdForPath(p, new URLSearchParams('service=blood-draw'))).toBe('blood-draw');
    expect(serviceIdForPath(p, new URLSearchParams('service=home-nursing'))).toBe('nursing');
    // بلا معامل: لا نُطفئ إحداهما بالأخرى
    expect(serviceIdForPath(p)).toBeNull();
    expect(serviceIdForPath(p, new URLSearchParams('service=مجهول'))).toBeNull();
  });

  it('يقبل `searchParams` بشكل Next كما بشكل URLSearchParams', () => {
    expect(serviceIdForPath('/appointments/new', { service: 'blood-draw' })).toBe('blood-draw');
    expect(serviceIdForPath('/appointments/new', { service: ['blood-draw'] })).toBe('blood-draw');
  });

  it('مسارٌ لا خدمةَ له يُرجع null', () => {
    expect(serviceIdForPath('/dashboard')).toBeNull();
    expect(serviceIdForPath('/account/favorites')).toBeNull();
  });

  it('الطوارئ ليست في المطابقة أصلاً', () => {
    expect(serviceIdForPath('/sos')).toBeNull();
  });
});

describe('اتّساق الكود مع الترحيل', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '0031_service_switches.sql'),
    'utf8'
  );

  it('كلّ خدمةٍ قابلةٍ للإطفاء مبذورةٌ في الترحيل', () => {
    const seeded = new Set(
      [...sql.matchAll(/\('([a-z-]+)',\s*true\)/g)].map((m) => m[1])
    );
    const missing = allSwitchableServices()
      .map((s) => s.id)
      .filter((id) => !seeded.has(id));
    expect(missing).toEqual([]);
  });

  it('الطوارئ غير مبذورةٍ في الترحيل', () => {
    expect(/\('sos',\s*(true|false)\)/.test(sql)).toBe(false);
  });

  it('الجدول مقروءٌ للجميع ومكتوبٌ للمشرف وحده', () => {
    expect(sql).toContain('FOR SELECT USING (true)');
    expect(sql).toContain('private.is_admin(auth.uid())');
  });
});

describe('المنع في التخطيط لا في البطاقة', () => {
  const layout = readFileSync(
    join(process.cwd(), 'src', 'app', '(dashboard)', 'layout.tsx'),
    'utf8'
  );

  it('تخطيط المجموعة يفحص الإطفاء قبل عرض children', () => {
    // أوّل صياغةٍ لهذا التأكيد كانت `toContain('serviceIdForPath')`، وهي
    // تمرّ حتى بعد إعادة تسمية النداء إلى `serviceIdForPath_DISABLED`
    // لأنّها مطابقةُ نصٍّ جزئيّ. فالمطلوب علامةٌ بنيويّة: النداء بوسائطه،
    // والفرع الذي يُرجع شاشة «قريباً» بدل `children`.
    expect(layout).toMatch(/serviceIdForPath\(\s*pathname\s*,\s*search\s*\)/);
    expect(layout).toMatch(/if\s*\(\s*!isEnabled\(\s*switches\s*,\s*serviceId\s*\)\s*\)/);
    expect(layout).toMatch(/<ServiceComingSoon/);
  });

  it('التخطيط يقرأ المسار **ومعاملاته** من ترويسات الوسيط', () => {
    // بلا `x-search` لا تُميَّز `blood-draw` من `nursing`
    expect(layout).toContain("x-pathname");
    expect(layout).toContain("x-search");
    const mw = readFileSync(join(process.cwd(), 'src', 'middleware.ts'), 'utf8');
    expect(mw).toContain("response.headers.set('x-search'");
  });

  it('البحث لا يقدّم رابطاً لخدمةٍ مطفأة', () => {
    const client = readFileSync(
      join(process.cwd(), 'src', 'app', '(dashboard)', 'search', 'SearchClient.tsx'),
      'utf8'
    );
    expect(client).toContain('disabledIds');
    expect(client).toContain('aria-disabled');
  });
});

describe('كلّ خدمةٍ في الشبكة لها مفتاح', () => {
  it('لا خدمةَ بلا معرّفٍ فريد', () => {
    const ids = [FEATURED_SERVICE, ...CORE_SERVICES, ...SMART_TOOLS].map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('كلّ معرّفٍ يُطابقه مسار', () => {
    for (const s of allSwitchableServices()) {
      const [path, query] = s.route.split('?');
      const got = serviceIdForPath(path, new URLSearchParams(query ?? ''));
      expect(got).toBe(s.id);
    }
  });
});
