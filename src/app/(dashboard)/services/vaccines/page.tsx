// ═══════════════════════════════════════════════════════════════
// 💉 V25.50: Vaccines Service - List Page
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ServiceDetailHeader from '@/components/dashboard-v3/ServiceDetailHeader';
import InfoCardV3 from '@/components/dashboard-v3/InfoCardV3';
import {
  IconArrowLeft, IconVaccineBottle, IconBabyCarriage, IconUser,
  IconPlane, IconVirus, IconCalendar, IconInfoCircle,
} from '@tabler/icons-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'اللقاحات · سباير ميديكال',
  description: 'احجز لقاحاتك بسهولة - لقاحات الأطفال والبالغين والسفر',
};

interface Vaccine {
  id: string;
  name_ar: string;
  category: string;
  doses_required: number;
  recommended_age_months: number | null;
  price: number;
  is_free: boolean;
  is_mandatory: boolean;
  diseases: string[];
  description: string | null;
  icon: string;
}

const CATEGORY_META: Record<string, { label: string; Icon: TablerIcon; color: string; bg: string }> = {
  pediatric: { label: 'لقاحات الأطفال', Icon: IconBabyCarriage, color: '#FF6D00', bg: '#FFF3E0' },
  adult: { label: 'لقاحات البالغين', Icon: IconUser, color: '#01875F', bg: '#E6F3EF' },
  travel: { label: 'لقاحات السفر', Icon: IconPlane, color: '#1A73E8', bg: '#E8F0FE' },
  covid: { label: 'كوفيد-19', Icon: IconVirus, color: '#C71C56', bg: '#FCE8E6' },
  seasonal: { label: 'موسمية', Icon: IconCalendar, color: '#FBBC04', bg: '#FEF7E0' },
  optional: { label: 'اختيارية', Icon: IconVaccineBottle, color: '#9334E6', bg: '#F3E8FD' },
};

export default async function VaccinesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      
      select: (cols: string) => any;
    };
  };

  
  const res = await supabaseAny
    .from('vaccines')
    .select('id, name_ar, category, doses_required, recommended_age_months, price, is_free, is_mandatory, diseases, description, icon')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const allVaccines = ((res.data ?? []) as unknown) as Vaccine[];

  // تجميع حسب الفئة
  const byCategory: Record<string, Vaccine[]> = {};
  allVaccines.forEach((v) => {
    if (!byCategory[v.category]) byCategory[v.category] = [];
    byCategory[v.category].push(v);
  });

  // إحصاءات
  const totalCount = allVaccines.length;
  const freeCount = allVaccines.filter((v) => v.is_free).length;
  const pediatricCount = byCategory.pediatric?.length || 0;

  return (
    <main className="app-screen" style={{ background: '#F8F9FA' }}>
      <div className="scr-content" style={{ padding: 0 }}>
        {/* Header - V26.3 ServiceDetailHeader */}
        <ServiceDetailHeader
          backHref="/services"
          title="💉 اللقاحات"
          rightAction={
            <Link
              href="/tools/vaccinations"
              aria-label="جدول التطعيمات"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#F1F3F4',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#202124', textDecoration: 'none',
              }}
            >
              <IconVaccineBottle size={20} stroke={2} />
            </Link>
          }
        />

        {/* Hero info card */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6D00 0%, #E65100 100%)',
          margin: 14,
          borderRadius: 20,
          padding: 18,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div aria-hidden style={{
            position: 'absolute', width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', top: -30, right: -30,
          }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', position: 'relative' }}>
            <div style={{
              width: 54, height: 54, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconVaccineBottle size={28} stroke={1.75} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                احمِ نفسك وعائلتك
              </h2>
              <p style={{ fontSize: 12, opacity: 0.95, margin: '4px 0 0', lineHeight: 1.5 }}>
                {totalCount} لقاح متاح · {freeCount} منها مجاني حكومياً
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8, margin: '0 14px 14px',
        }}>
          <StatBox icon={IconVaccineBottle} value={totalCount} label="لقاح" color="#FF6D00" bg="#FFF3E0" />
          <StatBox icon={IconBabyCarriage} value={pediatricCount} label="للأطفال" color="#01875F" bg="#E6F3EF" />
          <StatBox icon={IconInfoCircle} value={freeCount} label="مجاني" color="#1A73E8" bg="#E8F0FE" />
        </div>

        {/* CTA - جدول التطعيمات */}
        <Link
          href="/tools/vaccinations"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            margin: '0 14px 16px',
            padding: 14,
            background: '#E6F3EF',
            border: '1px solid #01875F',
            borderRadius: 14,
            textDecoration: 'none',
          }}
        >
          <IconCalendar size={26} stroke={1.75} color="#01875F" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#04342C' }}>
              جدول التطعيمات الوطني
            </div>
            <div style={{ fontSize: 11, color: '#0F6E56' }}>
              تابع جرعات طفلك حسب العمر
            </div>
          </div>
          <IconArrowLeft size={18} stroke={2} color="#01875F" />
        </Link>

        {/* Vaccines by category */}
        {Object.entries(byCategory).map(([category, items]) => {
          const meta = CATEGORY_META[category];
          if (!meta) return null;
          const CatIcon = meta.Icon;

          return (
            <div key={category} style={{ marginBottom: 20 }}>
              <div style={{
                padding: '0 16px 8px',
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, color: '#5F6368',
                textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>
                <CatIcon size={14} stroke={2.2} color={meta.color} />
                {meta.label}
                <span style={{ marginInlineStart: 'auto', fontSize: 10, color: '#80868B' }}>
                  {items.length}
                </span>
              </div>

              <div style={{
                background: '#FFFFFF',
                borderTop: '1px solid #E8EAED',
                borderBottom: '1px solid #E8EAED',
              }}>
                {items.map((vaccine) => (
                  <Link
                    key={vaccine.id}
                    href={`/services/vaccines/${vaccine.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderBottom: '1px solid #F1F3F4',
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: meta.bg,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}>
                      {vaccine.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#202124' }}>
                          {vaccine.name_ar}
                        </div>
                        {vaccine.is_mandatory && (
                          <span style={{
                            padding: '1px 6px',
                            background: '#FCE8E6', color: '#8B1240',
                            borderRadius: 8, fontSize: 9, fontWeight: 700,
                          }}>
                            إلزامي
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#5F6368', marginTop: 2 }}>
                        {vaccine.doses_required} جرعة
                        {vaccine.recommended_age_months !== null && (
                          <> · من عمر {vaccine.recommended_age_months} شهر</>
                        )}
                      </div>
                      {vaccine.diseases && vaccine.diseases.length > 0 && (
                        <div style={{ fontSize: 10, color: '#80868B', marginTop: 2 }}>
                          ضد: {vaccine.diseases.slice(0, 3).join('، ')}
                          {vaccine.diseases.length > 3 && '...'}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      {vaccine.is_free ? (
                        <span style={{
                          padding: '3px 10px',
                          background: '#E6F3EF', color: '#01875F',
                          borderRadius: 10, fontSize: 10, fontWeight: 700,
                        }}>
                          مجاني
                        </span>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#01875F' }}>
                          {vaccine.price.toLocaleString('ar-IQ')} د.ع
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* Info banner */}
        <InfoCardV3
          variant="info"
          titleIcon={IconInfoCircle}
          title="ملاحظة هامّة"
          style={{ marginBottom: 80 }}
        >
          <p style={{ fontSize: 11, color: '#1967D2', margin: 0, lineHeight: 1.6 }}>
            اللقاحات الحكومية مجانية في مراكز الرعاية الصحية الأولية. للقاحات الأخرى، تواصل مع المراكز الخاصة المعتمدة.
          </p>
        </InfoCardV3>
      </div>
    </main>
  );
}

function StatBox({ 
  icon: Icon, value, label, color, bg 
}: {
  icon: TablerIcon;
  value: number;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '0.5px solid #DADCE0',
      borderRadius: 14,
      padding: 12,
      textAlign: 'center',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: bg, color, margin: '0 auto 6px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} stroke={2} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: '#202124' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#5F6368', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: '50%',
  background: '#F1F3F4',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: '#202124', textDecoration: 'none',
};

const titleStyle: React.CSSProperties = {
  fontSize: 17, fontWeight: 800, margin: 0, color: '#202124',
};
