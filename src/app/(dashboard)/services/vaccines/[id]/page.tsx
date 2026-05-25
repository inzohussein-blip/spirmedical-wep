// ═══════════════════════════════════════════════════════════════
// 💉 V25.50: Vaccine Detail Page
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ServiceDetailHeader from '@/components/dashboard-v3/ServiceDetailHeader';
import InfoCardV3 from '@/components/dashboard-v3/InfoCardV3';
import {
  IconArrowLeft, IconVaccineBottle, IconAlertTriangle,
  IconCalendar, IconClock, IconInfoCircle, IconCheck,
  IconBuildingHospital,
} from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  pediatric: 'لقاحات الأطفال',
  adult: 'لقاحات البالغين',
  travel: 'لقاحات السفر',
  covid: 'كوفيد-19',
  seasonal: 'موسمية',
  optional: 'اختيارية',
};

export default async function VaccineDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  
  const vaccineRes = await supabaseAny
    .from('vaccines')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single();

  if (!vaccineRes.data) notFound();

  
  const vaccine = vaccineRes.data as {
    id: string;
    name_ar: string;
    name_en: string | null;
    category: string;
    doses_required: number;
    dose_interval_days: number | null;
    recommended_age_months: number | null;
    recommended_age_months_max: number | null;
    price: number;
    is_free: boolean;
    is_mandatory: boolean;
    diseases: string[];
    description: string | null;
    side_effects: string | null;
    icon: string | null;
  };

  
  const recordsRes = await supabaseAny
    .from('vaccination_records')
    .select('id, dose_number, administered_at, clinic_name')
    .eq('user_id', user.id)
    .eq('vaccine_id', params.id)
    .order('dose_number', { ascending: true });

  const records = (recordsRes.data as Array<{
    id: string;
    dose_number: number;
    administered_at: string;
    clinic_name: string | null;
  }>) ?? [];

  const completedDoses = records.length;
  const remainingDoses = Math.max(0, vaccine.doses_required - completedDoses);
  const isComplete = completedDoses >= vaccine.doses_required;
  const nextDoseNumber = completedDoses + 1;

  return (
    <main className="app-screen" style={{ background: '#F8F9FA' }}>
      <div className="scr-content" style={{ padding: 0 }}>
        {/* Header - V26.3 ServiceDetailHeader */}
        <ServiceDetailHeader
          backHref="/services/vaccines"
          title="تفاصيل اللقاح"
        />

        {/* Hero */}
        <div style={{
          background: vaccine.is_free 
            ? 'linear-gradient(135deg, #01875F 0%, #056559 100%)'
            : 'linear-gradient(135deg, #FF6D00 0%, #E65100 100%)',
          margin: 14,
          borderRadius: 20,
          padding: 20,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
        }}>
          <div aria-hidden style={{
            position: 'absolute', width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', top: -40, right: -40,
          }} />
          
          <div style={{ fontSize: 56, marginBottom: 8, position: 'relative' }}>
            {vaccine.icon || '💉'}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>
            {vaccine.name_ar}
          </h2>
          {vaccine.name_en && (
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
              {vaccine.name_en}
            </div>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            marginBottom: 10,
          }}>
            <IconVaccineBottle size={12} stroke={2.2} />
            {CATEGORY_LABELS[vaccine.category] || vaccine.category}
          </div>

          {vaccine.is_mandatory && (
            <div style={{
              display: 'inline-block',
              padding: '2px 10px',
              background: '#C71C56',
              borderRadius: 12,
              fontSize: 10,
              fontWeight: 700,
              marginInlineStart: 6,
            }}>
              إلزامي حكومياً
            </div>
          )}

          {/* السعر */}
          <div style={{ marginTop: 10 }}>
            {vaccine.is_free ? (
              <div style={{ fontSize: 16, fontWeight: 900 }}>
                مجاني في المراكز الحكومية ✓
              </div>
            ) : (
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                {vaccine.price.toLocaleString('ar-IQ')} <span style={{ fontSize: 12, fontWeight: 600 }}>د.ع / جرعة</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress card */}
        <div style={{ margin: '0 14px 14px' }}>
          <div style={{
            background: '#FFFFFF',
            border: '0.5px solid #DADCE0',
            borderRadius: 14,
            padding: 14,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>
                التقدّم في الجرعات
              </div>
              <div style={{ 
                fontSize: 12, fontWeight: 800, 
                color: isComplete ? '#01875F' : '#FF6D00',
              }}>
                {completedDoses} / {vaccine.doses_required}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: 8,
              background: '#F1F3F4',
              borderRadius: 4,
              overflow: 'hidden',
              marginBottom: 10,
            }}>
              <div style={{
                width: `${(completedDoses / vaccine.doses_required) * 100}%`,
                height: '100%',
                background: isComplete ? '#01875F' : '#FF6D00',
                transition: 'width 0.3s',
              }} />
            </div>

            {isComplete ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: 8,
                background: '#E6F3EF',
                borderRadius: 8,
                fontSize: 12,
                color: '#04342C',
                fontWeight: 700,
              }}>
                <IconCheck size={16} stroke={2.5} color="#01875F" />
                أكملت كل الجرعات!
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#5F6368' }}>
                متبقّي {remainingDoses} {remainingDoses === 1 ? 'جرعة' : 'جرعات'}
                {vaccine.dose_interval_days && completedDoses > 0 && (
                  <> · الفاصل {vaccine.dose_interval_days} يوم</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Doses history */}
        {records.length > 0 && (
          <div style={{ margin: '0 0 14px' }}>
            <div style={sectionTitleStyle}>الجرعات السابقة</div>
            <div style={{
              background: '#FFFFFF',
              borderTop: '1px solid #E8EAED',
              borderBottom: '1px solid #E8EAED',
            }}>
              {records.map((r) => {
                const date = new Date(r.administered_at).toLocaleDateString('ar-IQ', {
                  day: 'numeric', month: 'long', year: 'numeric',
                });
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F3F4',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#E6F3EF', color: '#01875F',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900,
                      flexShrink: 0,
                    }}>
                      ✓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>
                        الجرعة #{r.dose_number}
                      </div>
                      <div style={{ fontSize: 11, color: '#5F6368' }}>
                        <IconCalendar size={11} stroke={2.2} style={{ verticalAlign: -2, marginInlineEnd: 4 }} />
                        {date}
                        {r.clinic_name && ` · ${r.clinic_name}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {vaccine.description && (
          <InfoCardV3 title="الوصف">
            <p style={{ fontSize: 13, color: '#3C4043', margin: 0, lineHeight: 1.7 }}>
              {vaccine.description}
            </p>
          </InfoCardV3>
        )}

        {/* Diseases */}
        {vaccine.diseases && vaccine.diseases.length > 0 && (
          <InfoCardV3 title="الأمراض المُستهدفة">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {vaccine.diseases.map((d: string, i: number) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 12px',
                    background: '#FCE8E6',
                    color: '#8B1240',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </InfoCardV3>
        )}

        {/* Recommended age */}
        {vaccine.recommended_age_months !== null && (
          <InfoCardV3 title="العمر الموصى به">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconClock size={16} stroke={2.2} color="#FF6D00" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3C4043' }}>
                من {vaccine.recommended_age_months} شهر
                {vaccine.recommended_age_months_max && ` إلى ${vaccine.recommended_age_months_max} شهر`}
              </span>
            </div>
          </InfoCardV3>
        )}

        {/* Side effects */}
        {vaccine.side_effects && (
          <InfoCardV3
            title="آثار جانبية محتملة"
            titleIcon={IconAlertTriangle}
            variant="warning"
          >
            <p style={{ fontSize: 12, color: '#412402', margin: 0, lineHeight: 1.7 }}>
              {vaccine.side_effects}
            </p>
          </InfoCardV3>
        )}

        {/* CTA Buttons */}
        {!isComplete && (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link
              href={`/services/vaccines/clinics?vaccine=${vaccine.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 14,
                background: '#01875F',
                color: '#FFFFFF',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                textDecoration: 'none',
              }}
            >
              <IconBuildingHospital size={18} stroke={2.2} />
              ابحث عن مركز التطعيم
            </Link>

            <Link
              href={`/account/vaccinations/add?vaccine=${vaccine.id}&dose=${nextDoseNumber}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 12,
                background: '#FFFFFF',
                color: '#01875F',
                border: '1px solid #01875F',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              سجّل جرعة سابقة يدوياً
            </Link>
          </div>
        )}

        {/* Info banner */}
        <InfoCardV3
          variant="info"
          titleIcon={IconInfoCircle}
          title="نصيحة طبية"
          style={{ marginBottom: 80 }}
        >
          <p style={{ fontSize: 11, color: '#1967D2', margin: 0, lineHeight: 1.6 }}>
            استشر طبيبك دائماً قبل أخذ أي لقاح، خصوصاً إذا كان لديك حساسية أو حالة صحية مزمنة.
          </p>
        </InfoCardV3>
      </div>
    </main>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  padding: '0 16px 8px',
  fontSize: 11, fontWeight: 700, color: '#5F6368',
  textTransform: 'uppercase', letterSpacing: '0.3px',
};
