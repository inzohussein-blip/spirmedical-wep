// ═══════════════════════════════════════════════════════════════
// 👤 V26.1 - Account Page (Design System V3)
// ═══════════════════════════════════════════════════════════════

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../../(auth)/login/actions';
import ServiceDetailHeader from '@/components/dashboard-v3/ServiceDetailHeader';
import {
  IconHistory, IconFlask, IconVaccine, IconClipboardList,
  IconHeartbeat, IconUsers, IconSettings, IconMapPin,
  IconLanguage, IconBell, IconBellRinging, IconHelp,
  IconInfoCircle, IconFileText, IconEdit, IconLogout,
  IconRefresh, IconArrowLeft, IconHeart, IconPill,
  IconClipboardCheck, IconPhone, IconCalendar,
} from '@tabler/icons-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'حسابي · سباير ميديكال',
};

interface SectionItem {
  id: string;
  Icon: TablerIcon;
  color: string;
  bg: string;
  title: string;
  desc: string;
  href: string;
}

const SECTION_RECORDS: SectionItem[] = [
  { id: 'history', Icon: IconHistory, color: '#5F6368', bg: '#F1F3F4', title: 'الطلبات السابقة', desc: 'سجل تحاليلك واستشاراتك', href: '/appointments?status=completed' },
  { id: 'lab-history', Icon: IconFlask, color: '#01875F', bg: '#E6F3EF', title: 'سجل التحاليل', desc: 'كل فحوصاتك المختبرية', href: '/account/lab-history' },
  { id: 'nursing-history', Icon: IconVaccine, color: '#B06000', bg: '#FEF7E0', title: 'سجل التمريض', desc: 'زياراتك التمريضية المنزلية', href: '/account/nursing-history' },
  { id: 'prescriptions', Icon: IconClipboardList, color: '#9334E6', bg: '#F3E8FD', title: 'الوصفات', desc: 'وصفاتك الطبية مؤرشفة', href: '/account/prescriptions' },
  { id: 'medications', Icon: IconPill, color: '#1A73E8', bg: '#E8F0FE', title: 'أدويتي', desc: 'الأدوية المعتادة والتذكير', href: '/account/medications' },
  { id: 'pharmacy-reservations', Icon: IconClipboardCheck, color: '#9334E6', bg: '#F3E8FD', title: 'حجوزات الأدوية', desc: 'طلباتك من الصيدليات', href: '/account/pharmacy-reservations' },
  { id: 'medical-record', Icon: IconHeartbeat, color: '#EA4335', bg: '#FCE8E6', title: 'سجلي الطبي', desc: 'تاريخك الصحي ومؤشراتك', href: '/account/medical-record' },
  { id: 'family', Icon: IconUsers, color: '#FF6D00', bg: '#FFF3E0', title: 'أفراد العائلة', desc: 'سجّل خدمات لعائلتك', href: '/account/family' },
  { id: 'favorites', Icon: IconHeart, color: '#C71C56', bg: '#FCE8E6', title: 'المفضّلة', desc: 'الأماكن المحفوظة للوصول السريع', href: '/account/favorites' },
];

const SECTION_SETTINGS: SectionItem[] = [
  { id: 'settings', Icon: IconSettings, color: '#5F6368', bg: '#F1F3F4', title: 'الإعدادات', desc: 'اللغة · الإشعارات · المظهر', href: '/account/settings' },
  { id: 'locations', Icon: IconMapPin, color: '#EA4335', bg: '#FCE8E6', title: 'مواقعي المحفوظة', desc: 'البيت · العمل · مواقع متكررة', href: '/account/locations' },
  { id: 'language', Icon: IconLanguage, color: '#1A73E8', bg: '#E8F0FE', title: 'اللغة', desc: 'عربي · English · کوردی', href: '/account/settings#language' },
  { id: 'notifications', Icon: IconBell, color: '#FBBC04', bg: '#FEF7E0', title: 'الإشعارات', desc: 'إدارة التنبيهات', href: '/account/notifications' },
  { id: 'push-notifications', Icon: IconBellRinging, color: '#7C4DFF', bg: '#EDE7F6', title: 'إشعارات التطبيق', desc: 'فعّل إشعارات Push', href: '/account/notifications/settings' },
];

const SECTION_HELP: SectionItem[] = [
  { id: 'help', Icon: IconHelp, color: '#00BCD4', bg: '#E0F7FA', title: 'مساعدة والدعم', desc: 'تواصل معنا · أسئلة شائعة', href: '/account/help' },
  { id: 'about', Icon: IconInfoCircle, color: '#5F6368', bg: '#F1F3F4', title: 'حول التطبيق', desc: 'الإصدار · الفريق', href: '/about' },
  { id: 'legal', Icon: IconFileText, color: '#5F6368', bg: '#F1F3F4', title: 'الشروط والخصوصية', desc: 'الاتفاقية وإخلاء المسؤولية', href: '/legal/terms' },
];

export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone, role, governorate, created_at')
    .eq('id', user.id)
    .single();

  const fullName = profile?.full_name || 'مستخدم';
  const initial = fullName.charAt(0);
  const phone = profile?.phone || '';
  const phoneDisplay = phone.startsWith('+964')
    ? `0${phone.slice(4, 7)} ${phone.slice(7, 10)} ${phone.slice(10)}`
    : phone;
  const roleLabel = profile?.role === 'specialist' ? 'أخصائي' : 'مراجع';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  // Stats
  
  const supabaseAny = supabase as unknown as {
    from: (t: string) => {
      select: (cols: string, opts?: { count?: 'exact'; head?: boolean }) => {
        eq: (col: string, val: string) => Promise<{ count: number | null }>;
      };
    };
  };

  
  const apptsRes = await supabaseAny.from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const apptsCount = apptsRes.count ?? 0;

  
  const favsRes = await supabaseAny.from('service_favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  const favsCount = favsRes.count ?? 0;

  return (
    <main className="app-screen" style={{ background: '#F8F9FA' }}>
      <div className="scr-content" style={{ padding: 0 }}>
        {/* Header - V26.3 ServiceDetailHeader */}
        <ServiceDetailHeader
          backHref="/dashboard"
          title="حسابي"
          rightAction={
            <Link
              href="/account/settings"
              aria-label="الإعدادات"
              style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#F1F3F4',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#202124', textDecoration: 'none',
              }}
            >
              <IconSettings size={20} stroke={2} />
            </Link>
          }
        />

        {/* Profile Card - V3 Hero style */}
        <div style={{
          background: 'linear-gradient(135deg, #01875F 0%, #056559 100%)',
          margin: 14,
          borderRadius: 20,
          padding: 18,
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div aria-hidden style={{
            position: 'absolute', width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', top: -40, right: -40,
          }} />

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', position: 'relative' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#E6F3EF', color: '#01875F',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, fontFamily: 'Tajawal, sans-serif',
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontSize: 18, fontWeight: 800, margin: '0 0 4px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fullName}
              </h2>
              <div style={{
                display: 'inline-block', padding: '2px 10px',
                background: 'rgba(255,255,255,0.18)', borderRadius: 12,
                fontSize: 10, fontWeight: 700,
              }}>
                {roleLabel}
              </div>
              {phoneDisplay && (
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconPhone size={11} stroke={2.2} />
                  {phoneDisplay}
                </div>
              )}
              {memberSince && (
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconCalendar size={11} stroke={2.2} />
                  عضو منذ {memberSince}
                </div>
              )}
            </div>
          </div>

          <Link
            href="/account/edit"
            style={{
              marginTop: 14,
              padding: '8px 14px',
              background: 'rgba(255,255,255,0.18)',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: '#FFFFFF',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              position: 'relative',
            }}
          >
            <IconEdit size={14} stroke={2.2} />
            تعديل المعلومات
          </Link>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 8, margin: '0 14px 14px',
        }}>
          <Link href="/appointments" style={statCardStyle}>
            <IconClipboardList size={22} stroke={1.75} color="#01875F" />
            <div style={statValueStyle}>{apptsCount}</div>
            <div style={statLabelStyle}>طلب</div>
          </Link>
          <Link href="/account/favorites" style={statCardStyle}>
            <IconHeart size={22} stroke={1.75} color="#C71C56" />
            <div style={statValueStyle}>{favsCount}</div>
            <div style={statLabelStyle}>مفضّل</div>
          </Link>
        </div>

        {/* Sections */}
        <SectionGroup title="السجلات والتاريخ" items={SECTION_RECORDS} />
        <SectionGroup title="الإعدادات" items={SECTION_SETTINGS} />
        <SectionGroup title="مساعدة ومعلومات" items={SECTION_HELP} />

        {/* Logout */}
        <div style={{ padding: '12px 14px 14px' }}>
          <Link
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 12,
              background: '#FFFFFF',
              border: '1px solid #DADCE0',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              color: '#3C4043',
              textDecoration: 'none',
              marginBottom: 8,
            }}
          >
            <IconRefresh size={16} stroke={2} />
            تحويل لحساب آخر
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: 12,
                background: '#FCE8E6',
                border: 0,
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                color: '#8B1240',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <IconLogout size={16} stroke={2.2} />
              تسجيل الخروج
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '20px 14px 80px',
          fontSize: 10, color: '#80868B', lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>Spir Medical · سباير ميديكال</div>
          <div>الإصدار 1.0.0 · صنع بعناية في بغداد 🇮🇶</div>
        </div>
      </div>
    </main>
  );
}

function SectionGroup({ title, items }: { title: string; items: SectionItem[] }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        padding: '0 16px 6px',
        fontSize: 11, fontWeight: 700, color: '#5F6368',
        textTransform: 'uppercase', letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      <div style={{ background: '#FFFFFF', borderTop: '1px solid #E8EAED', borderBottom: '1px solid #E8EAED' }}>
        {items.map((item) => {
          const ItemIcon = item.Icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                textDecoration: 'none',
                color: 'inherit',
                borderBottom: '1px solid #F1F3F4',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: item.bg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <ItemIcon size={20} stroke={1.75} color={item.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#202124' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: '#5F6368', marginTop: 1 }}>
                  {item.desc}
                </div>
              </div>
              <IconArrowLeft size={16} stroke={2} color="#80868B" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const statCardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '0.5px solid #DADCE0',
  borderRadius: 14,
  padding: 14,
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: '#202124',
  fontFamily: 'JetBrains Mono, monospace',
  marginTop: 4,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#5F6368',
  fontWeight: 600,
};
