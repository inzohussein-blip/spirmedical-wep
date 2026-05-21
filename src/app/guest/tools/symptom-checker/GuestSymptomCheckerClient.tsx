'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Symptom {
  id: string;
  label: string;
  category: 'general' | 'chest' | 'digestive' | 'neurological';
}

const SYMPTOMS: Symptom[] = [
  // عامة
  { id: 'fever', label: 'حرارة', category: 'general' },
  { id: 'fatigue', label: 'إرهاق', category: 'general' },
  { id: 'cough', label: 'سعال', category: 'general' },
  { id: 'sore-throat', label: 'التهاب حلق', category: 'general' },
  { id: 'body-pain', label: 'ألم جسم', category: 'general' },
  // صدر
  { id: 'chest-pain', label: 'ألم صدر', category: 'chest' },
  { id: 'shortness-breath', label: 'ضيق تنفّس', category: 'chest' },
  { id: 'palpitations', label: 'خفقان', category: 'chest' },
  // هضمي
  { id: 'nausea', label: 'غثيان', category: 'digestive' },
  { id: 'diarrhea', label: 'إسهال', category: 'digestive' },
  { id: 'stomach-pain', label: 'ألم بطن', category: 'digestive' },
  { id: 'vomiting', label: 'قيء', category: 'digestive' },
  // عصبي
  { id: 'headache', label: 'صداع', category: 'neurological' },
  { id: 'dizziness', label: 'دوخة', category: 'neurological' },
  { id: 'blurred-vision', label: 'عدم وضوح الرؤية', category: 'neurological' },
];

const CATEGORIES = [
  { id: 'general', label: 'عامة', icon: '🌡️' },
  { id: 'chest', label: 'الصدر', icon: '❤️' },
  { id: 'digestive', label: 'الجهاز الهضمي', icon: '🍽️' },
  { id: 'neurological', label: 'الجهاز العصبي', icon: '🧠' },
];

interface Recommendation {
  urgency: 'emergency' | 'urgent' | 'moderate' | 'mild';
  title: string;
  message: string;
  specialist: string;
  action: string;
}

export default function GuestSymptomCheckerClient() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);

  const toggleSymptom = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const getRecommendation = (): Recommendation => {
    const ids = Array.from(selected);
    const hasChest = ids.some(id =>
      SYMPTOMS.find(s => s.id === id)?.category === 'chest'
    );
    const hasNeurological = ids.includes('blurred-vision') || ids.includes('dizziness');
    const count = selected.size;

    // طوارئ
    if ((ids.includes('chest-pain') && ids.includes('shortness-breath')) ||
        (hasNeurological && ids.includes('chest-pain'))) {
      return {
        urgency: 'emergency',
        title: 'حالة طارئة محتملة',
        message: 'الأعراض تستوجب تقييماً طبياً فورياً',
        specialist: 'إسعاف فوري ١٢٢',
        action: 'اتصل بالإسعاف الآن',
      };
    }

    // عاجل
    if (hasChest || count >= 5) {
      return {
        urgency: 'urgent',
        title: 'يُستحسن استشارة عاجلة',
        message: 'يُنصح بمراجعة طبيب خلال ٢٤ ساعة',
        specialist: ids.includes('chest-pain') ? 'طبيب قلب' : 'طبيب باطنية',
        action: 'احجز استشارة طبية',
      };
    }

    // متوسط
    if (count >= 3) {
      return {
        urgency: 'moderate',
        title: 'مراجعة طبيب موصى بها',
        message: 'الأعراض قد تستدعي تقييماً طبياً خلال ٢-٣ أيام',
        specialist: 'طبيب عام',
        action: 'احجز موعد',
      };
    }

    // خفيف
    return {
      urgency: 'mild',
      title: 'أعراض بسيطة',
      message: 'يمكن المتابعة منزلياً مع المراقبة',
      specialist: 'صيدلي',
      action: 'استشر صيدلي',
    };
  };

  const recommendation = showResult ? getRecommendation() : null;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/guest" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">مدقّق الأعراض</h1>
          <div className="scr-page-spacer" />
        </div>

        {!showResult ? (
          <div style={{ padding: '0 18px' }}>
            <div className="tool-intro">
              <div className="tool-intro-icon" aria-hidden="true">🔍</div>
              <h2>اختر الأعراض التي تشعر بها</h2>
              <p>سنُوصيك بأنسب خطوة لحالتك</p>
            </div>

            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="symptom-category">
                <div className="symptom-category-title">
                  <span aria-hidden="true">{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <div className="symptom-chips">
                  {SYMPTOMS.filter(s => s.category === cat.id).map((symptom) => (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`symptom-chip ${selected.has(symptom.id) ? 'selected' : ''}`}
                      aria-pressed={selected.has(symptom.id)}
                    >
                      {symptom.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="symptom-summary">
              <span>المُختار: <strong>{selected.size}</strong></span>
            </div>

            <button
              onClick={() => setShowResult(true)}
              disabled={selected.size === 0}
              className="tool-cta"
              type="button"
            >
              احصل على التوصية ←
            </button>

            <div className="tool-disclaimer">
              ⚠ مدقّق الأعراض أداة استرشادية ولا يُغني عن الفحص الطبي.
            </div>
          </div>
        ) : (
          recommendation && (
            <div style={{ padding: '0 18px' }}>
              <div className={`recommendation-card recommendation-${recommendation.urgency}`}>
                <div className="recommendation-icon" aria-hidden="true">
                  {recommendation.urgency === 'emergency' ? '🚨' :
                   recommendation.urgency === 'urgent' ? '⚠️' :
                   recommendation.urgency === 'moderate' ? '⏰' : '✓'}
                </div>
                <h2>{recommendation.title}</h2>
                <p>{recommendation.message}</p>
                <div className="recommendation-specialist">
                  <span>التخصص الموصى به:</span>
                  <strong>{recommendation.specialist}</strong>
                </div>
              </div>

              <div className="symptom-list-summary">
                <h3>الأعراض المُدخَلة ({selected.size}):</h3>
                <div className="symptom-chips">
                  {Array.from(selected).map((id) => {
                    const symptom = SYMPTOMS.find(s => s.id === id);
                    return symptom ? (
                      <span key={id} className="symptom-chip-readonly">{symptom.label}</span>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="risk-cta-section">
                <h3>{recommendation.action}</h3>
                <p>سجّل الآن لحجز استشارة فورية</p>
                <Link href="/register" className="tool-cta">
                  إنشاء حساب وحجز ←
                </Link>
                {recommendation.urgency === 'emergency' && (
                  <Link href="/guest/sos" className="tool-emergency-btn">
                    🚨 طوارئ SOS
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowResult(false);
                    setSelected(new Set());
                  }}
                  className="tool-secondary-btn"
                  type="button"
                >
                  إعادة الفحص
                </button>
              </div>
            </div>
          )
        )}
      </div>

    </main>
  );
}
