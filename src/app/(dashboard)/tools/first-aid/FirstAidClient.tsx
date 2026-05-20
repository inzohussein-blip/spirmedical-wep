'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Wind, Heart, Flame, Droplet, Bone, Activity,
  ArrowRight, Phone, AlertTriangle, Lightbulb, Ambulance,
} from 'lucide-react';

interface FirstAidCase {
  id: string;
  title: string;
  icon: LucideIcon;
  severity: 'critical' | 'urgent' | 'normal';
  steps: string[];
  warning?: string;
  callEmergency?: boolean;
}

const FIRST_AID_CASES: FirstAidCase[] = [
  {
    id: 'choking',
    title: 'اختناق',
    icon: Wind,
    severity: 'critical',
    callEmergency: true,
    steps: [
      'اطلب المساعدة فوراً',
      'إذا كان المصاب واعياً، شجّعه على السعال',
      'قف خلفه وانحنِ إلى الأمام',
      'ضع قبضة يدك فوق سرته',
      'اضغط بقوة وبسرعة لأعلى وللداخل (مناورة هايمليك)',
      'كرر حتى يخرج الجسم الغريب',
    ],
    warning: 'لا تضرب الظهر إذا كان واعياً',
  },
  {
    id: 'heart-attack',
    title: 'نوبة قلبية',
    icon: Heart,
    severity: 'critical',
    callEmergency: true,
    steps: [
      'اتصل بالإسعاف ١٢٢ فوراً',
      'اجعل المصاب يجلس مرتاحاً',
      'فك الملابس الضيقة',
      'إذا كان واعياً، أعطه أسبرين 300mg لمضغه',
      'راقب التنفس والوعي',
      'كن مستعداً للإنعاش القلبي إذا فقد الوعي',
    ],
    warning: 'لا تترك المصاب وحده',
  },
  {
    id: 'burns',
    title: 'حروق',
    icon: Flame,
    severity: 'urgent',
    steps: [
      'أبعد المصاب عن مصدر الحرارة',
      'برّد الحرق بماء بارد جاري لمدة ٢٠ دقيقة',
      'لا تستخدم الثلج أو الزبدة',
      'غطِّ الحرق بقماش نظيف',
      'لا تفرقع الفقاعات',
      'راجع الطوارئ إذا الحرق كبير أو عميق',
    ],
    warning: 'الحروق على الوجه أو اليدين تستلزم رعاية طبية فورية',
  },
  {
    id: 'bleeding',
    title: 'نزيف شديد',
    icon: Droplet,
    severity: 'urgent',
    callEmergency: true,
    steps: [
      'اضغط مباشرة على الجرح بقطعة قماش نظيفة',
      'ارفع الجزء المصاب فوق مستوى القلب',
      'استمر بالضغط حتى يتوقف النزيف',
      'لا ترفع الضمادة لتفقد النزيف',
      'إذا تشبّع القماش، أضف طبقة فوقها',
      'اتصل بالإسعاف إذا لم يتوقف خلال ١٠ دقائق',
    ],
  },
  {
    id: 'fracture',
    title: 'كسور',
    icon: Bone,
    severity: 'urgent',
    steps: [
      'لا تحرّك المصاب إلا للضرورة',
      'ثبّت الكسر بأي شيء صلب (لوح، عصا)',
      'لا تحاول إعادة العظم لمكانه',
      'استخدم الثلج (مغلّفاً) لتقليل التورّم',
      'راجع المستشفى فوراً',
      'في كسور العمود الفقري، لا تحرّك المصاب نهائياً',
    ],
    warning: 'في كسور الجمجمة أو العمود الفقري، اتصل بالإسعاف فوراً',
  },
  {
    id: 'fainting',
    title: 'إغماء',
    icon: Activity,
    severity: 'normal',
    steps: [
      'ضع المصاب على ظهره',
      'ارفع ساقيه لمستوى أعلى من رأسه (٣٠ سم)',
      'فك الملابس الضيقة',
      'افحص التنفس والنبض',
      'لا تعطِه ماء حتى يستعيد وعيه كاملاً',
      'إذا لم يستعد وعيه خلال دقيقة، اتصل بالإسعاف',
    ],
  },
];

const SEVERITY_LABELS = {
  critical: 'حرجة',
  urgent: 'عاجلة',
  normal: 'عادية',
};

export default function FirstAidClient() {
  const [selected, setSelected] = useState<FirstAidCase | null>(null);

  // فتح الـ case تلقائياً عند الوصول مع hash (مثلاً من SOS)
  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const found = FIRST_AID_CASES.find((c) => c.id === hash);
        if (found) setSelected(found);
      }
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  if (selected) {
    const SelectedIcon = selected.icon;
    return (
      <main className="app-screen">
        <div className="scr-content">
          <div className="scr-page-header">
            <button onClick={() => setSelected(null)} className="scr-back-btn" aria-label="العودة">
              <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
            </button>
            <h1 className="scr-page-title">{selected.title}</h1>
            <div className="scr-page-spacer" />
          </div>

          <div style={{ padding: '0 18px' }}>
            <div className={`first-aid-detail-card severity-${selected.severity}`}>
              <div className="first-aid-detail-icon" aria-hidden="true">
                <SelectedIcon size={42} strokeWidth={2} />
              </div>
              <div className="first-aid-detail-severity">
                {SEVERITY_LABELS[selected.severity]}
              </div>
            </div>

            {selected.callEmergency && (
              <a href="tel:122" className="first-aid-emergency-call">
                <Phone size={20} strokeWidth={2.2} aria-hidden />
                <div>
                  <div className="first-aid-emergency-title">اتصل بالإسعاف فوراً</div>
                  <div className="first-aid-emergency-number">١٢٢</div>
                </div>
              </a>
            )}

            <div className="first-aid-steps">
              <h3>خطوات الإسعاف:</h3>
              <ol>
                {selected.steps.map((step, i) => (
                  <li key={i}>
                    <span className="step-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {selected.warning && (
              <div className="first-aid-warning">
                <AlertTriangle size={16} strokeWidth={2.4} aria-hidden />
                <span>{selected.warning}</span>
              </div>
            )}

            <div className="tool-disclaimer">
              <Lightbulb size={14} strokeWidth={2.2} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 4 }} />
              هذه الإرشادات لا تُغني عن الإسعاف المهني. اتصل بالإسعاف ١٢٢ في الحالات الخطيرة.
            </div>
          </div>
        </div>

      </main>
    );
  }

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">الإسعافات الأولية</h1>
          <div className="scr-page-spacer" />
        </div>

        <div style={{ padding: '0 18px' }}>
          <div className="tool-intro">
            <div className="tool-intro-icon" aria-hidden="true">
              <Ambulance size={42} strokeWidth={2} />
            </div>
            <h2>دليل سريع للحالات الطارئة</h2>
            <p>اضغط على الحالة لمعرفة خطوات الإسعاف</p>
          </div>

          <a href="tel:122" className="first-aid-quick-call">
            <Phone size={18} strokeWidth={2.2} aria-hidden />
            <span>اتصل بالإسعاف ١٢٢</span>
          </a>

          <div className="first-aid-grid">
            {FIRST_AID_CASES.map((caseItem) => {
              const Icon = caseItem.icon;
              return (
                <button
                  key={caseItem.id}
                  onClick={() => setSelected(caseItem)}
                  className={`first-aid-card severity-${caseItem.severity}`}
                  type="button"
                >
                  <div className="first-aid-card-icon" aria-hidden="true">
                    <Icon size={32} strokeWidth={2} />
                  </div>
                  <div className="first-aid-card-title">{caseItem.title}</div>
                  <div className="first-aid-card-severity">
                    {SEVERITY_LABELS[caseItem.severity]}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="tool-disclaimer">
            <AlertTriangle size={14} strokeWidth={2.4} aria-hidden style={{ verticalAlign: '-2px', marginLeft: 4 }} />
            في الحالات الحرجة، اتصل بالإسعاف ١٢٢ فوراً قبل تطبيق الإسعافات الأولية.
          </div>
        </div>
      </div>

    </main>
  );
}
