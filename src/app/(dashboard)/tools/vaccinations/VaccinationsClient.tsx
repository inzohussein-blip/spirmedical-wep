'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Syringe, Baby, User, Heart, Plane,
  ArrowRight, ClipboardList, Clock, Lightbulb, X,
} from 'lucide-react';

interface Vaccine {
  id: string;
  name: string;
  category: 'child' | 'adult' | 'pregnancy' | 'travel';
  age: string;
  importance: 'critical' | 'recommended' | 'optional';
  description: string;
  doses: string;
}

const CATEGORIES: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'all',       label: 'الكل',      icon: Syringe },
  { id: 'child',     label: 'الأطفال',   icon: Baby },
  { id: 'adult',     label: 'الكبار',    icon: User },
  { id: 'pregnancy', label: 'الحوامل',   icon: Heart },
  { id: 'travel',    label: 'السفر',     icon: Plane },
];

const VACCINES: Vaccine[] = [
  // الأطفال
  { id: 'v1', name: 'BCG (السل)', category: 'child', age: 'عند الولادة', importance: 'critical', description: 'لقاح ضد مرض السل (Tuberculosis). يُعطى للأطفال حديثي الولادة لحمايتهم من السل خاصةً في الرئتين.', doses: 'جرعة واحدة عند الولادة' },
  { id: 'v2', name: 'التهاب الكبد B', category: 'child', age: 'الولادة + شهرين + 6 أشهر', importance: 'critical', description: 'لحماية الكبد من فيروس التهاب الكبد B الذي قد يؤدي لتليّف الكبد وسرطانه.', doses: '3 جرعات' },
  { id: 'v3', name: 'شلل الأطفال (OPV/IPV)', category: 'child', age: '2 + 4 + 6 + 18 شهر', importance: 'critical', description: 'لقاح ضد فيروس شلل الأطفال — مرض خطير يصيب الجهاز العصبي وقد يسبب شلل دائم.', doses: '4 جرعات' },
  { id: 'v4', name: 'الثلاثي (DTaP)', category: 'child', age: '2 + 4 + 6 + 15 شهر', importance: 'critical', description: 'يحمي من 3 أمراض: الدفتيريا والتيتانوس (الكزاز) والسعال الديكي.', doses: '4 جرعات أساسية + معزّزات' },
  { id: 'v5', name: 'MMR (الحصبة)', category: 'child', age: '12 شهر + 4-6 سنوات', importance: 'critical', description: 'يحمي من الحصبة (Measles) والنكاف (Mumps) والحصبة الألمانية (Rubella).', doses: 'جرعتان' },
  { id: 'v6', name: 'جدري الماء (Varicella)', category: 'child', age: '12-15 شهر', importance: 'recommended', description: 'لقاح ضد فيروس جدري الماء الذي يسبب طفحاً جلدياً وحكة شديدة.', doses: 'جرعتان' },
  { id: 'v7', name: 'الإنفلونزا الموسمية', category: 'child', age: 'سنوياً من 6 أشهر', importance: 'recommended', description: 'يُحدّث سنوياً حسب السلالات المنتشرة. مهم للأطفال خاصة في الشتاء.', doses: 'جرعة سنوية' },

  // الكبار
  { id: 'v8', name: 'كوفيد-19 (تعزيزية)', category: 'adult', age: 'كل 6-12 شهر', importance: 'recommended', description: 'جرعات معزّزة ضد فيروس كورونا — يُنصح بها للفئات المعرّضة.', doses: 'حسب الجدولة' },
  { id: 'v9', name: 'الإنفلونزا', category: 'adult', age: 'سنوياً (خريف)', importance: 'recommended', description: 'الموصى به للجميع فوق 6 أشهر، خاصةً كبار السن وأصحاب الأمراض المزمنة.', doses: 'جرعة سنوية' },
  { id: 'v10', name: 'Tdap (الكزاز/السعال الديكي)', category: 'adult', age: 'كل 10 سنوات', importance: 'recommended', description: 'جرعة معزّزة كل 10 سنوات. مهمة بعد الإصابة بجرح ملوّث.', doses: 'كل 10 سنوات' },
  { id: 'v11', name: 'التهاب الكبد A/B', category: 'adult', age: 'حسب الحاجة', importance: 'optional', description: 'يُنصح به للمسافرين، العاملين في المجال الصحي، وأصحاب المخاطر العالية.', doses: '2-3 جرعات' },
  { id: 'v12', name: 'الالتهاب الرئوي', category: 'adult', age: '+65 سنة', importance: 'recommended', description: 'يحمي من البكتيريا المسببة للالتهاب الرئوي الحاد. مهم لكبار السن.', doses: 'جرعة أو جرعتان' },
  { id: 'v13', name: 'الهربس النطاقي (Zona)', category: 'adult', age: '+50 سنة', importance: 'recommended', description: 'يحمي من ظهور حزام النار/الزنّار — مرض جلدي مؤلم يصيب كبار السن.', doses: 'جرعتان' },

  // الحوامل
  { id: 'v14', name: 'Tdap للحامل', category: 'pregnancy', age: 'الأسبوع 27-36', importance: 'critical', description: 'يحمي الأم والجنين من السعال الديكي. يُعطى في الثلث الثالث من الحمل.', doses: 'جرعة واحدة' },
  { id: 'v15', name: 'الإنفلونزا للحامل', category: 'pregnancy', age: 'أي وقت في الحمل', importance: 'critical', description: 'آمن في جميع مراحل الحمل ويحمي الأم والجنين من المضاعفات.', doses: 'جرعة سنوية' },

  // السفر
  { id: 'v16', name: 'الحمى الصفراء', category: 'travel', age: 'حسب الوجهة', importance: 'recommended', description: 'إلزامي للسفر لأفريقيا وأمريكا الجنوبية. يُؤخذ قبل السفر بـ 10 أيام.', doses: 'جرعة واحدة (مدى الحياة)' },
  { id: 'v17', name: 'التيفوئيد', category: 'travel', age: 'حسب الوجهة', importance: 'recommended', description: 'للسفر للمناطق ذات مياه ملوّثة. يُؤخذ قبل السفر بأسبوعين.', doses: 'جرعة واحدة' },
  { id: 'v18', name: 'التهاب السحايا', category: 'travel', age: 'الحج والعمرة', importance: 'critical', description: 'إلزامي لكل من يسافر للحج والعمرة. يُؤخذ قبل السفر بـ 10 أيام.', doses: 'جرعة واحدة' },
];

export default function VaccinationsClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selected, setSelected] = useState<Vaccine | null>(null);

  const filtered = selectedCategory === 'all' ? VACCINES : VACCINES.filter(v => v.category === selectedCategory);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">جدول التطعيمات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">دليل شامل لـ {VACCINES.length} لقاحاً إلزامياً واختيارياً</p>

        <div className="scr-info-banner">
          <Lightbulb size={14} strokeWidth={2.2} aria-hidden />
          <span>اضغط على أي لقاح لمعرفة التفاصيل والجرعات</span>
        </div>

        {/* الفئات */}
        <div className="scr-pills" style={{ marginBottom: 16 }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`scr-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                <Icon size={13} strokeWidth={2.2} aria-hidden />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* قائمة اللقاحات */}
        <div className="scr-list-stack">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelected(v)}
              className="scr-list-item scr-list-item-clickable"
              style={{ width: '100%', textAlign: 'right', border: '1px solid var(--line)', cursor: 'pointer', background: 'var(--white)' }}
            >
              <div className="scr-list-item-icon" aria-hidden="true">
                <Syringe size={22} strokeWidth={2} />
              </div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">{v.name}</div>
                <div className="scr-list-item-subtitle">{v.age}</div>
                <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                  {v.importance === 'critical' && <span className="scr-tag scr-tag-emergency">إلزامي</span>}
                  {v.importance === 'recommended' && <span className="scr-tag scr-tag-amber">موصى به</span>}
                  {v.importance === 'optional' && <span className="scr-tag">اختياري</span>}
                </div>
              </div>
              <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
            </button>
          ))}
        </div>

        {/* روابط ذات صلة */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">روابط ذات صلة</div>
        </div>

        <div className="scr-list-stack">
          <Link href="/account/medical-record" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <ClipboardList size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">سجلي الطبي</div>
              <div className="scr-list-item-subtitle">سجّل اللقاحات اللي أخذتها</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
          <Link href="/account/reminders" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Clock size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">إضافة تذكير لقاح</div>
              <div className="scr-list-item-subtitle">لا تنسَ موعد الجرعة التالية</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
        </div>
      </div>

      {/* Dialog تفاصيل اللقاح */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)', borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 20, width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <Syringe size={38} strokeWidth={2} />
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ background: 'var(--paper-2)', border: 0, width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="إغلاق"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 4px' }}>{selected.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>{selected.age}</div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {selected.importance === 'critical' && <span className="scr-tag scr-tag-emergency">إلزامي</span>}
              {selected.importance === 'recommended' && <span className="scr-tag scr-tag-amber">موصى به</span>}
              {selected.importance === 'optional' && <span className="scr-tag">اختياري</span>}
            </div>

            <div style={{ background: 'var(--paper-3)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 4 }}>الوصف</div>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.7 }}>{selected.description}</div>
            </div>

            <div style={{ background: 'var(--paper-3)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 4 }}>الجرعات</div>
              <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={14} strokeWidth={2.2} />
                {selected.doses}
              </div>
            </div>

            <Link
              href="/account/reminders"
              onClick={() => setSelected(null)}
              className="scr-empty-cta"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
            >
              <Clock size={16} strokeWidth={2.2} />
              أضف تذكير لهذا اللقاح
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
