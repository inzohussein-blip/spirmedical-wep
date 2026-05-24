// ═══════════════════════════════════════════════════════════════
// ❤️ V25.47: Favorites Page
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, Heart, Building2, Stethoscope, Eye, Pill, UserCircle,
  MapPin, Star,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'مفضّلتي · سباير ميديكال' };

const SERVICE_META: Record<string, { 
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
};

interface FavoriteWithDetails {
  id: string;
  service_type: string;
  service_id: string;
  created_at: string;
  // Joined data (manual)
  name?: string;
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

  const detailsMap = new Map<string, Record<string, unknown>>();

  // Hospitals
  if (favoritesByType.has('hospital')) {
    const ids = favoritesByType.get('hospital')!;
    
    const res = await supabaseAny
      .from('hospitals')
      .select('id, name, city, district, rating_avg, rating_count')
      .in('id', ids);
    
    ((res.data as Array<Record<string, unknown>>) ?? []).forEach((h) => {
      detailsMap.set(`hospital:${h.id}`, h);
    });
  }

  // Dental
  if (favoritesByType.has('dental')) {
    const ids = favoritesByType.get('dental')!;
    const res = await supabaseAny
      .from('dental_clinics')
      .select('id, name, city, district, rating_avg, rating_count')
      .in('id', ids);
    
    ((res.data as Array<Record<string, unknown>>) ?? []).forEach((d) => {
      detailsMap.set(`dental:${d.id}`, d);
    });
  }

  // Optical
  if (favoritesByType.has('optical')) {
    const ids = favoritesByType.get('optical')!;
    const res = await supabaseAny
      .from('optical_stores')
      .select('id, name, city, district, rating_avg, rating_count')
      .in('id', ids);
    
    ((res.data as Array<Record<string, unknown>>) ?? []).forEach((o) => {
      detailsMap.set(`optical:${o.id}`, o);
    });
  }

  // Pharmacies
  if (favoritesByType.has('pharmacy')) {
    const ids = favoritesByType.get('pharmacy')!;
    const res = await supabaseAny
      .from('pharmacies')
      .select('id, name, city, district, rating_avg, rating_count')
      .in('id', ids);
    
    ((res.data as Array<Record<string, unknown>>) ?? []).forEach((p) => {
      detailsMap.set(`pharmacy:${p.id}`, p);
    });
  }

  // Doctors
  if (favoritesByType.has('doctor')) {
    const ids = favoritesByType.get('doctor')!;
    const res = await supabaseAny
      .from('doctors')
      .select('id, full_name, specialty, rating_avg, rating_count')
      .in('id', ids);
    
    ((res.data as Array<Record<string, unknown>>) ?? []).forEach((d) => {
      detailsMap.set(`doctor:${d.id}`, { ...d, name: d.full_name, city: d.specialty });
    });
  }

  // دمج البيانات
  const favoritesWithDetails: FavoriteWithDetails[] = allFavorites.map((f) => {
    const details = detailsMap.get(`${f.service_type}:${f.service_id}`) || {};
    return {
      ...f,
      name: details.name as string | undefined,
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
              const meta = SERVICE_META[type];
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
                  <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>{meta.label}</div>
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
                const meta = SERVICE_META[fav.service_type];
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
                          <span style={{ fontSize: 10, fontWeight: 700 }}>
                            {fav.rating_avg.toFixed(1)}
                          </span>
                          <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>
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
