// ═══════════════════════════════════════════════════════════════
// ❤️ V25.47: Favorites Page
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, Heart, Building2, Stethoscope, Eye, Pill, UserCircle,
  Brain, Apple, Activity, MapPin, Star,
} from 'lucide-react';
import type { ServiceType } from '@/components/services/favorites-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'مفضّلتي · سباير ميديكال' };

/**
 * ⚠️ هذه الخريطة يجب أن تغطّي **كل** قيمة في `ServiceType` — وإلّا اختفى
 * المفضَّل بصمت: الصفّ يُكتب في القاعدة والقلب يمتلئ في صفحة التفاصيل،
 * ثمّ لا يظهر هنا أبداً لأنّ `SERVICE_META[type]` غير معرّف فيُرجع `null`.
 * كانت ثلاثة أنواع من الثمانية بهذا الحال: الصحّة النفسية، التغذية،
 * العلاج الطبيعي. النوع `Record<ServiceType, …>` يجعل إغفال نوعٍ جديد
 * خطأً في البناء لا خللاً صامتاً. يحرسه `tests/favorites-integrity.test.ts`.
 */
const SERVICE_META: Record<ServiceType, {
  label: string;
  icon: typeof Building2;
  color: string;
  bg: string;
  baseUrl: string;
}> = {
  hospital: { label: 'مستشفى', icon: Building2, color: '#0F6E56', bg: '#E1F5EE', baseUrl: '/services/hospitals' },
  dental: { label: 'عيادة أسنان', icon: Stethoscope, color: '#A32D2D', bg: '#FCEBEB', baseUrl: '/services/dental' },
  optical: { label: 'محل نظارات', icon: Eye, color: '#A57100', bg: '#FAEEDA', baseUrl: '/services/optical' },
  pharmacy: { label: 'صيدلية', icon: Pill, color: '#1D9E75', bg: '#E1F5EE', baseUrl: '/services/pharmacies' },
  doctor: { label: 'طبيب', icon: UserCircle, color: '#0F6E56', bg: '#E1F5EE', baseUrl: '/services/doctors' },
  // الألوان مطابقة لبطاقات هذه الخدمات في `/services` كي لا يتغيّر تمثيلها
  // البصريّ بين الصفحتين.
  mental_health: { label: 'أخصائي نفسي', icon: Brain, color: '#7C4DFF', bg: '#EDE7F6', baseUrl: '/services/mental-health' },
  nutritionist: { label: 'أخصائي تغذية', icon: Apple, color: '#34A853', bg: '#E8F5E9', baseUrl: '/services/nutrition' },
  physio: { label: 'علاج طبيعي', icon: Activity, color: '#1A73E8', bg: '#E8F0FE', baseUrl: '/services/physio' },
};

/**
 * `service_type` يصل من القاعدة كنصّ حرّ، فقد يحمل نوعاً لا يعرفه هذا
 * الإصدار (صفٌّ قديم، أو نشرٌ متأخّر). نبحث بأمان ونتحمّل الغياب بدل
 * الانهيار — مع بقاء `SERVICE_META` نفسها كاملةً بحكم نوعها.
 */
function metaFor(type: string) {
  return SERVICE_META[type as ServiceType] as (typeof SERVICE_META)[ServiceType] | undefined;
}

interface FavoriteWithDetails {
  id: string;
  service_type: string;
  service_id: string;
  created_at: string;
  // Joined data (manual)
  name?: string;
  /** وصفٌ مهنيّ (تخصّص/لقب) — ليس موقعاً، فلا تُرسم بجانبه أيقونة الدبّوس */
  subtitle?: string;
  city?: string;
  district?: string;
  rating_avg?: number;
  rating_count?: number;
}

export default async function FavoritesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  // جلب كل المفضّلات
  
  const favsRes = await supabaseAny
    .from('service_favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const allFavorites = (favsRes.data as Array<{
    id: string;
    service_type: string;
    service_id: string;
    created_at: string;
  }>) ?? [];

  // جلب التفاصيل لكل نوع
  const favoritesByType = new Map<string, string[]>();
  allFavorites.forEach((f) => {
    if (!favoritesByType.has(f.service_type)) {
      favoritesByType.set(f.service_type, []);
    }
    favoritesByType.get(f.service_type)!.push(f.service_id);
  });

  // أنواع المفضّلات مستقلّة عن بعضها — نجلب تفاصيلها **بالتوازي** بدل خمس
  // رحلات متتالية للقاعدة، ولا نستعلم إلا عن الأنواع الموجودة فعلاً.
  //
  // ⚠️ كما في `SERVICE_META`: نوعٌ بلا مصدرٍ هنا لا تُجلَب تفاصيله، فيسقط
  // في `.filter((f) => f.name)` أدناه ويختفي بلا أثر. لذلك المفتاح
  // `ServiceType` لا `string` — إغفال نوعٍ جديد يصير خطأ بناء.
  //
  // جداول المختصّين الثلاثة (نفسي/تغذية/علاج طبيعي) لا تحمل `city`
  // و`district` بل `title` و`clinic_name`، فتُعرَض وصفاً مهنيّاً في
  // `subtitle` بدل موقعٍ زائف بجانب دبّوس الخريطة.
  const SOURCES: Array<{
    type: ServiceType;
    table: string;
    cols: string;
    map?: (row: Record<string, unknown>) => Record<string, unknown>;
  }> = [
    { type: 'hospital', table: 'hospitals', cols: 'id, name, city, district, rating_avg, rating_count' },
    { type: 'dental', table: 'dental_clinics', cols: 'id, name, city, district, rating_avg, rating_count' },
    { type: 'optical', table: 'optical_stores', cols: 'id, name, city, district, rating_avg, rating_count' },
    { type: 'pharmacy', table: 'pharmacies', cols: 'id, name, city, district, rating_avg, rating_count' },
    {
      type: 'doctor',
      table: 'doctors',
      cols: 'id, full_name, specialty, rating_avg, rating_count',
      map: (d) => ({ ...d, name: d.full_name, subtitle: d.specialty }),
    },
    {
      type: 'mental_health',
      table: 'mental_health_specialists',
      cols: 'id, full_name, title, clinic_name, rating_avg, rating_count',
      map: (d) => ({ ...d, name: d.full_name, subtitle: d.title ?? d.clinic_name }),
    },
    {
      type: 'nutritionist',
      table: 'nutritionists',
      cols: 'id, full_name, title, clinic_name, rating_avg, rating_count',
      map: (d) => ({ ...d, name: d.full_name, subtitle: d.title ?? d.clinic_name }),
    },
    {
      type: 'physio',
      table: 'physio_specialists',
      cols: 'id, full_name, title, clinic_name, rating_avg, rating_count',
      map: (d) => ({ ...d, name: d.full_name, subtitle: d.title ?? d.clinic_name }),
    },
  ];

  const detailsMap = new Map<string, Record<string, unknown>>();

  const fetched = await Promise.all(
    SOURCES.filter((s) => favoritesByType.has(s.type)).map(async (s) => {
      const res = await supabaseAny
        .from(s.table)
        .select(s.cols)
        .in('id', favoritesByType.get(s.type)!);
      const rows = (res.data as Array<Record<string, unknown>>) ?? [];
      return { type: s.type, rows: rows.map((r) => (s.map ? s.map(r) : r)) };
    })
  );

  for (const { type, rows } of fetched) {
    for (const row of rows) detailsMap.set(`${type}:${row.id}`, row);
  }

  // دمج البيانات
  const favoritesWithDetails: FavoriteWithDetails[] = allFavorites.map((f) => {
    const details = detailsMap.get(`${f.service_type}:${f.service_id}`) || {};
    return {
      ...f,
      name: details.name as string | undefined,
      subtitle: details.subtitle as string | undefined,
      city: details.city as string | undefined,
      district: details.district as string | undefined,
      rating_avg: details.rating_avg as number | undefined,
      rating_count: details.rating_count as number | undefined,
    };
  }).filter((f) => f.name); // فقط المتوفّر في DB

  // إحصاءات
  const counts: Record<string, number> = {};
  favoritesWithDetails.forEach((f) => {
    counts[f.service_type] = (counts[f.service_type] || 0) + 1;
  });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">المفضّلة</h1>
          <div className="scr-page-spacer" />
        </div>
        <p className="scr-page-subtitle">الأماكن التي حفظتها للوصول السريع</p>

        {/* Stats */}
        {favoritesWithDetails.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', 
            gap: 6,
            marginTop: 8,
          }}>
            {Object.entries(counts).map(([type, count]) => {
              const meta = metaFor(type);
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div 
                  key={type}
                  style={{
                    background: meta.bg,
                    borderRadius: 10,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <Icon size={18} strokeWidth={2.2} style={{ color: meta.color, marginBottom: 2 }} aria-hidden />
                  <div style={{ fontSize: 16, fontWeight: 800, color: meta.color }}>{count}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{meta.label}</div>
                </div>
              );
            })}
          </div>
        )}

        {favoritesWithDetails.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 40 }}>
            <div className="scr-empty-icon">
              <Heart size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد مفضّلات بعد</h2>
            <p className="scr-empty-desc">
              اضغط ❤️ على أيّ مستشفى/عيادة/صيدلية لحفظها هنا للوصول السريع.
            </p>
            <Link href="/services" className="scr-empty-cta">
              تصفّح الخدمات ←
            </Link>
          </div>
        ) : (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">القائمة ({favoritesWithDetails.length})</div>
            </div>

            <div className="scr-list-stack">
              {favoritesWithDetails.map((fav) => {
                const meta = metaFor(fav.service_type);
                if (!meta) return null;
                const Icon = meta.icon;
                
                return (
                  <Link
                    key={fav.id}
                    href={`${meta.baseUrl}/${fav.service_id}`}
                    className="scr-list-item scr-list-item-clickable"
                  >
                    <div
                      className="scr-list-item-icon"
                      style={{ background: meta.bg, color: meta.color }}
                      aria-hidden="true"
                    >
                      <Icon size={20} strokeWidth={2} />
                    </div>
                    <div className="scr-list-item-content">
                      <div className="scr-list-item-title">
                        {fav.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {meta.label}
                        {/* وصفٌ مهنيّ — بلا دبّوس، فهو ليس موقعاً */}
                        {fav.subtitle && ` · ${fav.subtitle}`}
                        {fav.city && ` · `}
                        {fav.city && (
                          <>
                            <MapPin size={10} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                            {fav.city}
                            {fav.district && ` - ${fav.district}`}
                          </>
                        )}
                      </div>
                      {fav.rating_avg && fav.rating_avg > 0 && (
                        <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Star size={10} fill="#A57100" stroke="#A57100" aria-hidden />
                          <span style={{ fontSize: 11, fontWeight: 700 }}>
                            {fav.rating_avg.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                            ({fav.rating_count} تقييم)
                          </span>
                        </div>
                      )}
                    </div>
                    <Heart 
                      size={16} 
                      fill="#FF6B6B" 
                      stroke="#FF6B6B" 
                      aria-hidden
                      style={{ flexShrink: 0 }}
                    />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
