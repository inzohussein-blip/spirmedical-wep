import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowRight, MessageCircle, Stethoscope, Target, Video, Clock, Info,
  ChevronLeft,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'استشارة طبية · سباير ميديكال',
};

const SPECIALTIES: Record<string, string> = {
  family_medicine: 'طب عائلة',
  pediatrics: 'أطفال',
  internal: 'باطنية',
  cardiology: 'قلبية',
  gynecology: 'نسائية',
  orthopedics: 'عظام',
  dermatology: 'جلدية',
  psychiatry: 'نفسية',
  general: 'طب عام',
};

export default async function ConsultationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string) => unknown;
    };
  };

  
  const doctorsRes = await (supabaseAny.from('doctors')
    .select('id, specialty, available_for_video, available_for_clinic, full_name') as Promise<{ data: unknown }> & {
      eq: (col: string, val: boolean) => Promise<{ data: unknown }>;
    });

  
  const allDoctorsRaw = (await supabase
    .from('doctors')
    .select('id, specialty, available_for_video, available_for_clinic, full_name')
    .eq('is_active', true)).data ?? [];
  
  
  const allDoctors = allDoctorsRaw as Array<{
    id: string;
    specialty: string;
    available_for_video: boolean;
    available_for_clinic: boolean;
    full_name: string;
  }>;

  // طبيبي المختار - الأطباء اللي تعامل معاهم قبلاً
  
  const previousRes = await (supabaseAny.from('appointments').select('doctor_id') as Promise<{ data: unknown }>);
  const previousData = (previousRes as { data: Array<{ doctor_id: string | null }> | null }).data ?? [];
  
  const previousDoctorIds = new Set(
    previousData
      .map((a) => a.doctor_id)
      .filter((id): id is string => Boolean(id))
  );
  
  const myDoctors = allDoctors.filter((d) => previousDoctorIds.has(d.id));

  const availableSpecialties = Array.from(new Set(allDoctors.map((d) => d.specialty)));
  
  const totalDoctors = allDoctors.length;
  const videoAvailable = allDoctors.filter((d) => d.available_for_video).length;
  
  // suppress unused warning
  void doctorsRes;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">استشارة طبية</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">تواصل مع طبيب الآن · {totalDoctors} طبيب متاح</p>

        {/* استشارة عامة */}
        <div className="scr-section-head" style={{ marginTop: 8 }}>
          <div className="scr-section-title">استشارة سريعة</div>
        </div>

        <div className="scr-list-stack">
          <Link 
            href="/services/doctors" 
            className="scr-list-item scr-list-item-clickable"
          >
            <div className="scr-list-item-icon" aria-hidden="true">
              <MessageCircle size={28} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">استشارة عامة</div>
              <div className="scr-list-item-subtitle">تصفّح كل الأطباء واختر من تريد</div>
              <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                <span className="scr-tag scr-tag-success">
                  {totalDoctors} طبيب متاح
                </span>
                <span className="scr-tag">
                  <Clock size={11} strokeWidth={2.4} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                  ~ 15 دقيقة
                </span>
              </div>
            </div>
            <ChevronLeft size={20} style={{ color: 'var(--ink-3)' }} aria-hidden="true" />
          </Link>
        </div>

        {/* طبيبي المختار */}
        {myDoctors.length > 0 && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">
                <Stethoscope size={14} strokeWidth={2.2} style={{ verticalAlign: -3, marginLeft: 4, color: '#0F6E56' }} aria-hidden />
                أطبائي السابقون
              </div>
            </div>
            <div className="scr-list-stack">
              {myDoctors.slice(0, 5).map((doctor) => (
                <Link
                  key={doctor.id}
                  href={`/services/doctors/${doctor.id}`}
                  className="scr-list-item scr-list-item-clickable"
                >
                  <div 
                    className="scr-list-item-icon" 
                    aria-hidden="true"
                    style={{ background: '#E1F5EE', color: '#0F6E56' }}
                  >
                    <Stethoscope size={20} strokeWidth={2} />
                  </div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">د. {doctor.full_name}</div>
                    <div className="scr-list-item-subtitle">
                      {SPECIALTIES[doctor.specialty] || doctor.specialty}
                    </div>
                  </div>
                  <ChevronLeft size={20} style={{ color: 'var(--ink-3)' }} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </>
        )}

        {/* استشارة متخصصة */}
        {availableSpecialties.length > 0 && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">
                <Target size={14} strokeWidth={2.2} style={{ verticalAlign: -3, marginLeft: 4, color: '#A57100' }} aria-hidden />
                استشارة متخصصة
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {availableSpecialties.map((spec) => {
                const count = allDoctors.filter((d) => d.specialty === spec).length;
                const label = SPECIALTIES[spec] || spec;
                return (
                  <Link
                    key={spec}
                    href={`/services/doctors?specialty=${spec}`}
                    style={{
                      padding: 12,
                      background: 'var(--white)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: 'var(--ink)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                      {count} طبيب
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* استشارة فيديو */}
        {videoAvailable > 0 && (
          <>
            <div className="scr-section-head" style={{ marginTop: 16 }}>
              <div className="scr-section-title">
                <Video size={14} strokeWidth={2.2} style={{ verticalAlign: -3, marginLeft: 4, color: '#1D9E75' }} aria-hidden />
                استشارة فيديو مباشرة
              </div>
            </div>
            <div className="scr-list-stack">
              <Link
                href="/services/doctors?video=true"
                className="scr-list-item scr-list-item-clickable"
              >
                <div 
                  className="scr-list-item-icon" 
                  aria-hidden="true"
                  style={{ background: '#E1F5EE', color: '#1D9E75' }}
                >
                  <Video size={28} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">احجز موعد فيديو</div>
                  <div className="scr-list-item-subtitle">
                    مكالمة فيديو مباشرة · {videoAvailable} طبيب متاح
                  </div>
                  <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                    <span className="scr-tag">
                      <Clock size={11} strokeWidth={2.4} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                      20 دقيقة
                    </span>
                  </div>
                </div>
                <ChevronLeft size={20} style={{ color: 'var(--ink-3)' }} aria-hidden="true" />
              </Link>
            </div>
          </>
        )}

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <Info size={16} strokeWidth={2.2} aria-hidden />
          <span>الاستشارات الطبية لا تُغني عن زيارة الطبيب في الحالات الطارئة.</span>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
