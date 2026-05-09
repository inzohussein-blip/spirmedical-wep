'use client';

import Link from 'next/link';
import { useState } from 'react';

interface FirstAidCase {
  id: string;
  title: string;
  icon: string;
  severity: 'critical' | 'urgent' | 'normal';
  steps: string[];
  warning?: string;
  callEmergency?: boolean;
}

const FIRST_AID_CASES: FirstAidCase[] = [
  {
    id: 'choking',
    title: 'اختناق',
    icon: '🫁',
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
    icon: '❤️',
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
    icon: '🔥',
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
    icon: '🩸',
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
    icon: '🦴',
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
    icon: '😵',
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

export default function FirstAidPage() {
  const [selected, setSelected] = useState<FirstAidCase | null>(null);

  if (selected) {
    return (
      <main className="app-screen">
        <div className="scr-content">
          <div className="scr-page-header">
            <button onClick={() => setSelected(null)} className="scr-back-btn" aria-label="العودة">
              <span aria-hidden="true">→</span>
            </button>
            <h1 className="scr-page-title">{selected.title}</h1>
            <div className="scr-page-spacer" />
          </div>

          <div style={{ padding: '0 18px' }}>
            <div className={`first-aid-detail-card severity-${selected.severity}`}>
              <div className="first-aid-detail-icon" aria-hidden="true">{selected.icon}</div>
              <div className="first-aid-detail-severity">
                {SEVERITY_LABELS[selected.severity]}
              </div>
            </div>

            {selected.callEmergency && (
              <a href="tel:122" className="first-aid-emergency-call">
                <span aria-hidden="true">📞</span>
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
                <span aria-hidden="true">⚠</span>
                <span>{selected.warning}</span>
              </div>
            )}

            <div className="tool-disclaimer">
              💡 هذه الإرشادات لا تُغني عن الإسعاف المهني. اتصل بالإسعاف ١٢٢ في الحالات الخطيرة.
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
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">الإسعافات الأولية</h1>
          <div className="scr-page-spacer" />
        </div>

        <div style={{ padding: '0 18px' }}>
          <div className="tool-intro">
            <div className="tool-intro-icon" aria-hidden="true">🚑</div>
            <h2>دليل سريع للحالات الطارئة</h2>
            <p>اضغط على الحالة لمعرفة خطوات الإسعاف</p>
          </div>

          <a href="tel:122" className="first-aid-quick-call">
            <span aria-hidden="true">📞</span>
            <span>اتصل بالإسعاف ١٢٢</span>
          </a>

          <div className="first-aid-grid">
            {FIRST_AID_CASES.map((caseItem) => (
              <button
                key={caseItem.id}
                onClick={() => setSelected(caseItem)}
                className={`first-aid-card severity-${caseItem.severity}`}
                type="button"
              >
                <div className="first-aid-card-icon" aria-hidden="true">{caseItem.icon}</div>
                <div className="first-aid-card-title">{caseItem.title}</div>
                <div className="first-aid-card-severity">
                  {SEVERITY_LABELS[caseItem.severity]}
                </div>
              </button>
            ))}
          </div>

          <div className="tool-disclaimer">
            ⚠ في الحالات الحرجة، اتصل بالإسعاف ١٢٢ فوراً قبل تطبيق الإسعافات الأولية.
          </div>
        </div>
      </div>

    </main>
  );
}
