import Link from 'next/link';
import {
  IconArrowRight as ArrowRight,
  IconBuildingHospital as Hospital,
  IconPill as Pill,
  IconCalculator as Calculator,
  IconStethoscope as Stethoscope,
  IconFirstAidKit as FirstAid,
  IconChevronLeft as ChevronLeft,
  IconLock as Lock,
} from '@tabler/icons-react';
import { ICON_TONES } from '@/lib/icons';

export const metadata = {
  title: 'الخدمات · Spir Medical',
  description: 'الأدلّةُ والأدواتُ المتاحة للزائر بلا تسجيل',
};

/**
 * 🧭 تبويبُ «الخدمات» للزائر — كان يشير إلى /guest/services ولا صفحةَ فيه (404 لكلّ زائرٍ يضغطه، 29 تشرين الأول).
 * ما يتصفّحه الزائرُ بلا حساب: دليلا المستشفيات والصيدليات وأدواتُ الصحّة. والطلبُ (سحبُ الدم، التمريض) بعد التسجيل.
 */
const OPEN = [
  { href: '/guest/services/hospitals', title: 'المستشفيات', sub: 'دليل · أرقامُ التواصل والمواقع', icon: Hospital, tone: ICON_TONES.blue },
  { href: '/guest/services/pharmacies', title: 'الصيدليات', sub: 'دليل · إرشاد لا بيع', icon: Pill, tone: ICON_TONES.purple },
  { href: '/guest/tools/risk-calculator', title: 'حاسبة المخاطر الصحية', sub: 'قيّم حالتك في دقيقة', icon: Calculator, tone: ICON_TONES.amber },
  { href: '/guest/tools/symptom-checker', title: 'مدقّق الأعراض', sub: 'اختر أعراضك واحصل على توصية', icon: Stethoscope, tone: ICON_TONES.teal },
  { href: '/guest/tools/first-aid', title: 'الإسعافات الأولية', sub: 'دليل الحالات الطارئة', icon: FirstAid, tone: ICON_TONES.red },
] as const;

export default function GuestServicesPage() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} />
          </Link>
          <h1 className="scr-page-title">الخدمات</h1>
          <div className="scr-page-spacer" />
        </div>

        <div className="scr-list-stack">
          {OPEN.map(({ href, title, sub, icon: Icon, tone }) => (
            <Link key={href} href={href} className="scr-list-item scr-list-item-clickable">
              <div className="scr-list-item-icon" aria-hidden="true" style={{ background: tone.bg, color: tone.fg }}>
                <Icon size={26} strokeWidth={2} />
              </div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">{title}</div>
                <div className="scr-list-item-subtitle">{sub}</div>
              </div>
              <ChevronLeft size={20} style={{ color: 'var(--ink-3)' }} aria-hidden="true" />
            </Link>
          ))}
        </div>

        <Link href="/register" className="scr-list-item scr-list-item-clickable" style={{ marginTop: 16 }}>
          <div className="scr-list-item-icon" aria-hidden="true" style={{ background: 'var(--paper-3)', color: 'var(--ink-2)' }}>
            <Lock size={24} strokeWidth={2} />
          </div>
          <div className="scr-list-item-content">
            <div className="scr-list-item-title">سحبُ الدم والتمريض المنزليّ</div>
            <div className="scr-list-item-subtitle">أنشئ حساباً لترفع طلبك</div>
          </div>
          <ChevronLeft size={20} style={{ color: 'var(--ink-3)' }} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
