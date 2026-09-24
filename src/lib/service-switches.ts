import {
  FEATURED_SERVICE,
  CORE_SERVICES,
  SMART_TOOLS,
  type ServiceConfig,
} from '@/lib/services-v3';

/**
 * ════════════════════════════════════════════════════════════════════
 * 🔌 مفاتيح تشغيل الخدمات — المنطق الصافي
 * ════════════════════════════════════════════════════════════════════
 *
 * لا استيرادَ هنا من `react` ولا من عميل Supabase: القرار وحده. والجلب
 * في `service-switches.server.ts`. وسببُ الفصل عمليّ: `cache` من React
 * غير متاحةٍ في بيئة الاختبار، فكان استيرادها يُسقط ملفّ الاختبار كلَّه
 * قبل أن يصل إلى دالّةٍ واحدة. وهو فصلٌ صحيحٌ بذاته كذلك — المنطق الصافي
 * يصلح للعميل أيضاً.
 * ════════════════════════════════════════════════════════════════════
 *
 * الخدمة المطفأة **تبقى معروضة** في الشبكة بشارة «قريباً»، ولا تُفتح.
 * والمنع في تخطيط المجموعة لا في البطاقة: إخفاء الرابط وحده يترك المسار
 * مفتوحاً لمن يكتبه في شريط العنوان.
 *
 * ─── فشلٌ مفتوح مقصود ───
 * إن تعذّرت قراءة الجدول (انقطاع، صلاحية، جدولٌ غير مُرحَّل بعد) تُعتبر
 * كلّ الخدمات مشتغلة. عطبٌ في جدول أعلامٍ لا يجوز أن يُطفئ منصّةً طبّية.
 */

export interface ServiceSwitch {
  service_id: string;
  is_enabled: boolean;
  note_ar: string | null;
  updated_at: string;
}

/**
 * خدماتٌ لا يجوز إطفاؤها من اللوحة مهما كان في الجدول.
 * `sos` شاشة طوارئ: إطفاؤها بنقرةٍ خطأ يقطع طريق نجدةٍ عن مريض.
 */
export const NON_SWITCHABLE = new Set<string>(['sos']);

/** كلّ ما يظهر في الشبكات — بترتيب عرضه */
export function allSwitchableServices(): ServiceConfig[] {
  return [FEATURED_SERVICE, ...CORE_SERVICES, ...SMART_TOOLS].filter(
    (s) => !NON_SWITCHABLE.has(s.id)
  );
}

/**
 * المسار الأساسيّ لخدمةٍ ما، بلا معاملات الاستعلام.
 * `'/appointments/new?service=blood-draw'` ⇒ `'/appointments/new'`
 */
function basePath(route: string): string {
  return route.split('?')[0];
}

/**
 * معرّف الخدمة التي يخصّها مسارٌ ما، أو `null`.
 *
 * المطابقة بالبادئة كي يشمل المنعُ الصفحات الداخلية أيضاً: إطفاء
 * `/services/dental` يمنع `/services/dental/<id>` كذلك، وإلّا بقي رابطٌ
 * محفوظٌ أو نتيجةُ بحثٍ تفتح عيادةً في خدمةٍ مطفأة.
 *
 * ويُستثنى ما يشترك في مساره أكثر من خدمة: `blood-draw` و`nursing` كلاهما
 * على `/appointments/new` ويفترقان بـ`?service=`. فالمطابقة هناك على
 * المعامل لا على المسار، وإلّا أطفأ أحدُهما الآخر.
 */
export function serviceIdForPath(
  pathname: string,
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined>
): string | null {
  const services = allSwitchableServices();

  // مساراتٌ يتقاسمها أكثر من خدمة — تُحسم بالمعامل
  const byBase = new Map<string, ServiceConfig[]>();
  for (const s of services) {
    const b = basePath(s.route);
    byBase.set(b, [...(byBase.get(b) ?? []), s]);
  }

  const getParam = (key: string): string | null => {
    if (!searchParams) return null;
    if (searchParams instanceof URLSearchParams) return searchParams.get(key);
    const v = searchParams[key];
    return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
  };

  // الأطول أوّلاً: `/services/doctors` قبل `/services`
  const bases = [...byBase.keys()].sort((a, b) => b.length - a.length);

  for (const base of bases) {
    if (pathname !== base && !pathname.startsWith(base + '/')) continue;

    const candidates = byBase.get(base)!;
    if (candidates.length === 1) return candidates[0].id;

    // مسارٌ مشترك: نطابق على `?service=`
    const wanted = getParam('service');
    if (!wanted) return null;
    const hit = candidates.find((c) => {
      const q = c.route.split('?')[1];
      return q ? new URLSearchParams(q).get('service') === wanted : false;
    });
    return hit?.id ?? null;
  }

  return null;
}

/** الغياب من الجدول يعني «مشتغلة» */
export function isEnabled(
  switches: Map<string, ServiceSwitch>,
  serviceId: string
): boolean {
  if (NON_SWITCHABLE.has(serviceId)) return true;
  const row = switches.get(serviceId);
  return row ? row.is_enabled : true;
}

export function noteFor(
  switches: Map<string, ServiceSwitch>,
  serviceId: string
): string | null {
  return switches.get(serviceId)?.note_ar ?? null;
}
