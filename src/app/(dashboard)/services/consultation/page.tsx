import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, MessageCircle, Stethoscope, Target, Video, Clock, Info,
} from 'lucide-react';

export const metadata = {
  title: 'استشارة طبية · سباير ميديكال',
};

type ConsultationKind = 'general' | 'my-doctor' | 'specialist' | 'video';

const ICON_MAP: Record<ConsultationKind, LucideIcon> = {
  general: MessageCircle,
  'my-doctor': Stethoscope,
  specialist: Target,
  video: Video,
};

const CONSULTATION_TYPES: Array<{
  id: ConsultationKind;
  title: string;
  desc: string;
  response_time: string;
}> = [
  { id: 'general',   title: 'استشارة عامة',      desc: 'أرسل سؤالك ويرد عليك أول طبيب متاح',         response_time: '~ ١٥ دقيقة' },
  { id: 'my-doctor', title: 'طبيبي المختار',     desc: 'استشر طبيبك السابق مباشرةً (إن وُجد)',          response_time: 'حسب طبيبك' },
  { id: 'specialist',title: 'استشارة متخصصة',    desc: 'اختر اختصاصاً محدداً (قلب، أعصاب، أطفال...)',   response_time: '~ ٣٠ دقيقة' },
  { id: 'video',     title: 'استشارة بالفيديو',  desc: 'مكالمة فيديو مباشرة مع الطبيب',                response_time: 'حسب الجدولة' },
];

export default function ConsultationPage() {
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

        <p className="scr-page-subtitle">تواصل مع طبيب الآن · ١٢ طبيب متاح</p>

        <div className="scr-section-head" style={{ marginTop: 8 }}>
          <div className="scr-section-title">اختر نوع الاستشارة</div>
        </div>

        <div className="scr-list-stack">
          {CONSULTATION_TYPES.map((c) => {
            const Icon = ICON_MAP[c.id];
            return (
              <Link key={c.id} href={`/appointments/new?service=consultation&type=${c.id}`} className="scr-list-item scr-list-item-clickable">
                <div className="scr-list-item-icon" aria-hidden="true">
                  <Icon size={28} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{c.title}</div>
                  <div className="scr-list-item-subtitle">{c.desc}</div>
                  <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                    <span className="scr-tag">
                      <Clock size={11} strokeWidth={2.4} aria-hidden style={{ verticalAlign: '-1px', marginLeft: 2 }} />
                      {c.response_time}
                    </span>
                  </div>
                </div>
                <div style={{ color: 'var(--ink-3)', fontSize: 20 }} aria-hidden="true">←</div>
              </Link>
            );
          })}
        </div>

        <div className="scr-info-banner" style={{ marginTop: 16 }}>
          <Info size={16} strokeWidth={2.2} aria-hidden />
          <span>الاستشارات الطبية لا تُغني عن زيارة الطبيب في الحالات الطارئة.</span>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
