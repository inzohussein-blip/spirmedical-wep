'use client';

import Link from 'next/link';
import { useState } from 'react';

type RiskLevel = 'low' | 'moderate' | 'high';

interface RiskResult {
  level: RiskLevel;
  score: number;
  title: string;
  message: string;
  recommendations: string[];
}

export default function RiskCalculatorClient() {
  const [step, setStep] = useState<'form' | 'result'>('form');
  const [formData, setFormData] = useState({
    age: '',
    gender: '' as 'male' | 'female' | '',
    smoker: '' as 'yes' | 'no' | '',
    bmi: '' as 'normal' | 'overweight' | 'obese' | '',
    bloodPressure: '' as 'normal' | 'high' | 'unknown' | '',
    diabetes: '' as 'yes' | 'no' | 'unknown' | '',
    familyHistory: '' as 'yes' | 'no' | '',
  });
  const [result, setResult] = useState<RiskResult | null>(null);

  const calculateRisk = () => {
    let score = 0;
    const age = parseInt(formData.age) || 0;
    if (age > 60) score += 30;
    else if (age > 45) score += 20;
    else if (age > 30) score += 10;
    if (formData.smoker === 'yes') score += 20;
    if (formData.bmi === 'obese') score += 20;
    else if (formData.bmi === 'overweight') score += 10;
    if (formData.bloodPressure === 'high') score += 15;
    if (formData.diabetes === 'yes') score += 20;
    if (formData.familyHistory === 'yes') score += 15;

    let level: RiskLevel;
    let title: string;
    let message: string;
    let recommendations: string[];

    if (score < 30) {
      level = 'low';
      title = 'مخاطر منخفضة';
      message = 'مؤشّراتك الصحية ضمن المعدّلات الجيّدة';
      recommendations = [
        'حافظ على نمط الحياة الصحي',
        'ممارسة الرياضة ٣٠ دقيقة يومياً',
        'فحص دوري سنوي',
      ];
    } else if (score < 60) {
      level = 'moderate';
      title = 'مخاطر متوسّطة';
      message = 'يُستحسن مراجعة طبيب لتقييم شامل';
      recommendations = [
        'فحص دم شامل خلال شهر',
        'استشارة طبية مع أخصائي',
        'تعديل النظام الغذائي',
        'ممارسة الرياضة ٤٥ دقيقة يومياً',
      ];
    } else {
      level = 'high';
      title = 'مخاطر عالية';
      message = 'يُنصح بمراجعة طبيب فوراً';
      recommendations = [
        'استشارة طبية عاجلة',
        'فحوصات شاملة (قلب · سكر · كلى)',
        'متابعة دورية كل ٣ أشهر',
        'الاشتراك في برنامج طبيب العائلة',
      ];
    }

    setResult({ level, score, title, message, recommendations });
    setStep('result');
  };

  const isFormValid =
    formData.age && formData.gender && formData.smoker &&
    formData.bmi && formData.bloodPressure && formData.diabetes &&
    formData.familyHistory;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">حاسبة المخاطر</h1>
          <div className="scr-page-spacer" />
        </div>

        {step === 'form' ? (
          <div style={{ padding: '0 18px' }}>
            <div className="tool-intro">
              <div className="tool-intro-icon" aria-hidden="true">🧮</div>
              <h2>قيّم حالتك الصحية في ٣٠ ثانية</h2>
              <p>أجب على أسئلة بسيطة لتقييم مؤشّراتك الصحية وأعراضك واحصل على توصية</p>
            </div>

            <div className="tool-form">
              {/* العمر */}
              <div className="tool-field">
                <label>العمر</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="مثال: 35"
                  className="tool-input"
                />
              </div>

              {/* الجنس */}
              <RadioGroup
                label="الجنس"
                name="gender"
                value={formData.gender}
                onChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}
                options={[
                  { value: 'male', label: 'ذكر' },
                  { value: 'female', label: 'أنثى' },
                ]}
              />

              {/* التدخين */}
              <RadioGroup
                label="هل تدخّن؟"
                name="smoker"
                value={formData.smoker}
                onChange={(v) => setFormData({ ...formData, smoker: v as 'yes' | 'no' })}
                options={[
                  { value: 'no', label: 'لا' },
                  { value: 'yes', label: 'نعم' },
                ]}
              />

              {/* الوزن */}
              <RadioGroup
                label="مؤشّر كتلة الجسم"
                name="bmi"
                value={formData.bmi}
                onChange={(v) => setFormData({ ...formData, bmi: v as 'normal' | 'overweight' | 'obese' })}
                options={[
                  { value: 'normal', label: 'طبيعي' },
                  { value: 'overweight', label: 'زائد' },
                  { value: 'obese', label: 'سمنة' },
                ]}
              />

              {/* ضغط الدم */}
              <RadioGroup
                label="ضغط الدم"
                name="bp"
                value={formData.bloodPressure}
                onChange={(v) => setFormData({ ...formData, bloodPressure: v as 'normal' | 'high' | 'unknown' })}
                options={[
                  { value: 'normal', label: 'طبيعي' },
                  { value: 'high', label: 'مرتفع' },
                  { value: 'unknown', label: 'لا أعرف' },
                ]}
              />

              {/* السكري */}
              <RadioGroup
                label="السكري"
                name="diabetes"
                value={formData.diabetes}
                onChange={(v) => setFormData({ ...formData, diabetes: v as 'yes' | 'no' | 'unknown' })}
                options={[
                  { value: 'no', label: 'لا' },
                  { value: 'yes', label: 'نعم' },
                  { value: 'unknown', label: 'لا أعرف' },
                ]}
              />

              {/* تاريخ عائلي */}
              <RadioGroup
                label="تاريخ مرضي عائلي"
                name="family"
                value={formData.familyHistory}
                onChange={(v) => setFormData({ ...formData, familyHistory: v as 'yes' | 'no' })}
                options={[
                  { value: 'no', label: 'لا' },
                  { value: 'yes', label: 'نعم' },
                ]}
              />

              <button
                onClick={calculateRisk}
                disabled={!isFormValid}
                className="tool-cta"
                type="button"
              >
                احسب الآن ←
              </button>

              <div className="tool-disclaimer">
                ⚠ هذه الحاسبة لا تُغني عن الفحص الطبي. النتيجة استرشادية فقط.
              </div>
            </div>
          </div>
        ) : (
          result && (
            <div style={{ padding: '0 18px' }}>
              <div className={`risk-result risk-${result.level}`}>
                <div className="risk-result-icon" aria-hidden="true">
                  {result.level === 'low' ? '✓' : result.level === 'moderate' ? '!' : '⚠'}
                </div>
                <div className="risk-result-score">{result.score}/100</div>
                <h2 className="risk-result-title">{result.title}</h2>
                <p className="risk-result-message">{result.message}</p>
              </div>

              <div className="risk-recommendations">
                <h3>التوصيات:</h3>
                <ul>
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>
                      <span aria-hidden="true">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="risk-cta-section">
                <h3>سجّل لمتابعة صحتك بشكل أفضل</h3>
                <p>احصل على طبيب عائلة مخصّص + تذكيرات + سجل طبي</p>
                <Link href="/services/consultation" className="tool-cta">
                  إنشاء حساب جديد ←
                </Link>
                <button
                  onClick={() => {
                    setStep('form');
                    setResult(null);
                  }}
                  className="tool-secondary-btn"
                  type="button"
                >
                  إعادة الاختبار
                </button>
              </div>
            </div>
          )
        )}
      </div>

    </main>
  );
}

function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="tool-field">
      <label>{label}</label>
      <div className="tool-radio-group">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`tool-radio ${value === opt.value ? 'selected' : ''}`}
            aria-pressed={value === opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
