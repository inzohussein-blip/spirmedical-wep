import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SosClient from './SosClient';

export const metadata = {
  title: 'طوارئ SOS · سباير ميديكال',
};

export const dynamic = 'force-dynamic';

const EMERGENCY_NUMBERS = [
  { id: '122', icon: '🚑', name: 'الإسعاف الفوري', number: '122', desc: 'الإسعاف الطبي العام' },
  { id: '104', icon: '🚓', name: 'الشرطة', number: '104', desc: 'حالات الجريمة والأمن' },
  { id: '115', icon: '🚒', name: 'الإطفاء', number: '115', desc: 'الحرائق والكوارث' },
  { id: '139', icon: '☎️', name: 'النجدة', number: '139', desc: 'النجدة العامة' },
];

const QUICK_TIPS = [
  { id: 't1', icon: '🫁', title: 'اختناق', href: '/tools/first-aid#choking' },
  { id: 't2', icon: '❤️', title: 'نوبة قلبية', href: '/tools/first-aid#heart-attack' },
  { id: 't3', icon: '🩸', title: 'نزيف', href: '/tools/first-aid#bleeding' },
  { id: 't4', icon: '🔥', title: 'حروق', href: '/tools/first-aid#burns' },
];

export default async function SosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userName = '';
  let userPhone = '';
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    userName = profile?.full_name || '';
    userPhone = profile?.phone || '';
  }

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">طوارئ SOS</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* زر طوارئ كبير */}
        <a href="tel:122" className="sos-big-button">
          <div className="sos-big-icon" aria-hidden="true">🚨</div>
          <div className="sos-big-content">
            <div className="sos-big-title">اتصل بالإسعاف الآن</div>
            <div className="sos-big-number">١٢٢</div>
          </div>
        </a>

        {/* GPS مفعّل للمستخدم المسجل */}
        <SosClient userName={userName} userPhone={userPhone} />

        {/* أرقام الطوارئ */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">أرقام الطوارئ</div>
        </div>
        <div className="emergency-numbers-grid">
          {EMERGENCY_NUMBERS.map((e) => (
            <a key={e.id} href={`tel:${e.number}`} className="emergency-number-card">
              <div className="emergency-icon" aria-hidden="true">{e.icon}</div>
              <div className="emergency-name">{e.name}</div>
              <div className="emergency-number">{e.number}</div>
              <div className="emergency-desc">{e.desc}</div>
            </a>
          ))}
        </div>

        {/* إسعافات سريعة */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">إسعافات سريعة</div>
        </div>
        <div className="quick-tips-grid">
          {QUICK_TIPS.map((tip) => (
            <Link key={tip.id} href={tip.href} className="quick-tip-card">
              <div className="quick-tip-icon" aria-hidden="true">{tip.icon}</div>
              <div className="quick-tip-title">{tip.title}</div>
            </Link>
          ))}
        </div>

        <div className="tool-disclaimer" style={{ marginTop: 16 }}>
          ⚠ في حالة الخطر، اتصل بـ ١٢٢ أولاً قبل أي إجراء آخر.
        </div>
      </div>
    </main>
  );
}
