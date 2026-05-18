'use client';

// ═══════════════════════════════════════════════════════════════════
// BloodDrawFlow v2 - الواجهة الكاملة لسحب الدم والتحاليل
// ═══════════════════════════════════════════════════════════════════
// بناء حسب رؤية صاحب المشروع:
// 1. شريط بحث في الأعلى + chips للتحاليل الأكثر طلباً
// 2. بيانات المريض (عمر/حالة/جنس - اختياري + موقع + موبايل)
// 3. المختبر (سحب أفقي للمختبرات الشريكة + خيار "لا يهم")
// 4. الموعد (date picker + time picker بسيط)
// 5. زر طلب الفحص
// ═══════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/Toaster';
import {
  Droplet, Search, Star, User, MapPin, Building2, Calendar,
  TestTube, Clock, CheckCircle2, BarChart3, Lock, X, Loader2,
  AlertTriangle, Lightbulb,
} from 'lucide-react';
import {
  BLOOD_TESTS,
  TEST_BUNDLES,
  type BloodTest,
  searchTests,
  needsFasting,
  longestResultTime,
  formatTestPrice,
  calculateBundleDiscount,
} from '@/lib/services/blood-tests-data';
import { ALL_LABS, ANY_LAB, type Lab } from '@/lib/services/labs-data';

const BLOOD_DRAW_PRICE = 15000;

export interface BloodDrawSubmission {
  testIds: string[];
  bundleId: string | null;
  labId: string;
  patientAge: string;
  patientGender: 'male' | 'female' | '';
  patientCondition: string;
  address: string;
  phone: string;
  scheduledAt: string;     // ISO datetime
  totalPrice: number;
  needsFasting: boolean;
  fastingHours: number;
  resultTime: string;
  // ✨ V25: إحداثيات GPS (لو التقطها المستخدم)
  location_lat?: number;
  location_lng?: number;
  location_accuracy_m?: number;
}

interface Props {
  userPhone?: string;
  userAddress?: string;
  onSubmit: (data: BloodDrawSubmission) => Promise<void>;
  /** ✨ V25.1: قائمة المواقع المحفوظة للمستخدم */
  savedLocations?: Array<{
    id: string;
    label: string;
    icon: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

// ─────────────────────────────────────────────────────────────────
// Helper: الحصول على الحد الأدنى للتاريخ (الغد)
// ─────────────────────────────────────────────────────────────────
function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function getMaxDate(): string {
  const max = new Date();
  max.setDate(max.getDate() + 14); // أقصى 14 يوم
  return max.toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────────────────────────

export default function BloodDrawFlow({
  userPhone = '',
  userAddress = '',
  onSubmit,
  savedLocations = [],
}: Props) {
  // ─── State ───
  const [query, setQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // بيانات المريض
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [condition, setCondition] = useState('');
  const [address, setAddress] = useState(userAddress);
  const [phone, setPhone] = useState(userPhone);
  // ✨ V25: GPS coordinates (لو التقطها المستخدم)
  const [gpsLocation, setGpsLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
  } | null>(null);

  // المختبر والموعد
  const [labId, setLabId] = useState<string>(ANY_LAB.id);
  const [date, setDate] = useState(getMinDate());
  const [time, setTime] = useState('09:00');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Computed ───
  const filteredSuggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return searchTests(q).slice(0, 5);
  }, [query]);

  const popularTests = useMemo(
    () => BLOOD_TESTS.filter((t) => t.popular),
    []
  );

  const allTests = useMemo(
    () => BLOOD_TESTS.filter((t) => !popularTests.find(p => p.id === t.id)),
    [popularTests]
  );

  // حساب السعر والتفاصيل
  const { discount, subtotal, total } = useMemo(
    () => calculateBundleDiscount(selectedTests),
    [selectedTests]
  );
  const fasting = useMemo(() => needsFasting(selectedTests), [selectedTests]);
  const resultTime = useMemo(
    () => selectedTests.length > 0 ? longestResultTime(selectedTests) : '',
    [selectedTests]
  );
  const totalWithDrawing = total + BLOOD_DRAW_PRICE;

  // المختبر المختار
  const selectedLab = useMemo(
    () => ALL_LABS.find((l) => l.id === labId) || ANY_LAB,
    [labId]
  );

  // ─── Validation ───
  const canSubmit =
    selectedTests.length > 0 &&
    address.trim().length >= 15 &&
    phone.trim().length >= 10 &&
    date &&
    time;

  // ─── Handlers ───
  const toggleTest = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const removeTest = (testId: string) => {
    setSelectedTests((prev) => prev.filter((id) => id !== testId));
  };

  const handleSubmit = async () => {
    const errs: string[] = [];
    if (selectedTests.length === 0) errs.push('اختر تحليلاً واحداً على الأقل');
    if (address.trim().length < 15) errs.push('أدخل عنواناً مفصّلاً (محافظة + منطقة + شارع)');
    if (phone.trim().length < 10) errs.push('أدخل رقم هاتف صحيح');
    if (!date) errs.push('اختر تاريخ سحب الدم');
    if (!time) errs.push('اختر وقت سحب الدم');
    setErrors(errs);
    if (errs.length > 0) return;

    const scheduledAt = `${date}T${time}:00`;
    setSubmitting(true);
    try {
      await onSubmit({
        testIds: selectedTests,
        bundleId: null,
        labId,
        patientAge: age,
        patientGender: gender,
        patientCondition: condition,
        address,
        phone,
        scheduledAt,
        totalPrice: totalWithDrawing,
        needsFasting: fasting.required,
        fastingHours: fasting.hours,
        resultTime,
        // ✨ V25: نُمرّر GPS coordinates إذا توفّرت
        location_lat: gpsLocation?.lat,
        location_lng: gpsLocation?.lng,
        location_accuracy_m: gpsLocation?.accuracy,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // GPS للموقع
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast.warning('متصفحك لا يدعم تحديد الموقع');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // ✨ V25: نحفظ الإحداثيات في state ليتم إرسالها لقاعدة البيانات
        setGpsLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
        });
        // ونعرضها في العنوان أيضاً (لرؤية المستخدم)
        setAddress((prev) =>
          prev + (prev ? ' · ' : '') +
          `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        );
      },
      () => toast.warning('لم نستطع تحديد موقعك. أدخل العنوان يدوياً.'),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="bd-v2">
      {/* ═══ Hero ═══ */}
      <div className="bd-hero">
        <div className="bd-hero-icon">
          <Droplet size={26} strokeWidth={2} fill="currentColor" />
        </div>
        <div className="bd-hero-text">
          <h2>سحب الدم والتحاليل</h2>
          <p>فني مختبر معتمد يأتي لباب بيتك مع تحاليلك</p>
        </div>
      </div>

      {/* ═══ 1. شريط البحث + التحاليل ═══ */}
      <div className="bd-card">
        <div className="bd-search-wrap">
          <span className="bd-search-icon">
            <Search size={16} strokeWidth={2.4} aria-hidden />
          </span>
          <input
            ref={searchRef}
            type="search"
            className="bd-search-input"
            placeholder="ابحث: سكر، تراكمي، مقاومة أنسولين، فيتامين د..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="bd-search-clear"
              onClick={() => setQuery('')}
              aria-label="مسح"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggestions: لما يكتب */}
        {query && filteredSuggestions.length > 0 && (
          <div className="bd-suggestions">
            {filteredSuggestions.map((test) => {
              const isSel = selectedTests.includes(test.id);
              return (
                <button
                  key={test.id}
                  type="button"
                  className={`bd-suggestion ${isSel ? 'selected' : ''}`}
                  onClick={() => {
                    toggleTest(test.id);
                    setQuery('');
                    searchRef.current?.focus();
                  }}
                >
                  <span className="bd-sug-emoji">{test.emoji}</span>
                  <div className="bd-sug-text">
                    <div className="bd-sug-name">{test.nameAr}</div>
                    <div className="bd-sug-meta">
                      <span className="bd-sug-code">{test.code}</span>
                      <span>·</span>
                      <span>{formatTestPrice(test.price)}</span>
                    </div>
                  </div>
                  <span className="bd-sug-action">{isSel ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* لا نتائج */}
        {query && filteredSuggestions.length === 0 && (
          <div className="bd-no-results">
            لا توجد نتائج لـ &quot;{query}&quot; · جرّب كلمة أخرى
          </div>
        )}

        {/* Chips: الأكثر طلباً (لما الـ search فاضي) */}
        {!query && (
          <>
            <div className="bd-section-label">
              <Star size={13} strokeWidth={2.4} fill="currentColor" aria-hidden />
              <span>الأكثر طلباً</span>
            </div>
            <div className="bd-chips-scroll">
              {popularTests.map((test) => {
                const isSel = selectedTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    type="button"
                    className={`bd-chip ${isSel ? 'selected' : ''}`}
                    onClick={() => toggleTest(test.id)}
                  >
                    <span className="bd-chip-emoji">{test.emoji}</span>
                    <span className="bd-chip-name">{test.nameAr}</span>
                    <span className="bd-chip-price">{(test.price / 1000)}ك</span>
                  </button>
                );
              })}
            </div>

            <div className="bd-section-label bd-section-label-2">تحاليل أخرى</div>
            <div className="bd-chips-scroll">
              {allTests.map((test) => {
                const isSel = selectedTests.includes(test.id);
                return (
                  <button
                    key={test.id}
                    type="button"
                    className={`bd-chip ${isSel ? 'selected' : ''}`}
                    onClick={() => toggleTest(test.id)}
                  >
                    <span className="bd-chip-emoji">{test.emoji}</span>
                    <span className="bd-chip-name">{test.nameAr}</span>
                    <span className="bd-chip-price">{(test.price / 1000)}ك</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* المختار: قائمة سريعة */}
        {selectedTests.length > 0 && (
          <div className="bd-selected-list">
            <div className="bd-selected-head">
              <strong>التحاليل المختارة ({selectedTests.length})</strong>
              {discount > 0 && (
                <span className="bd-discount-badge">خصم {Math.round((discount / subtotal) * 100)}%</span>
              )}
            </div>
            <div className="bd-selected-items">
              {selectedTests.map((id) => {
                const t = BLOOD_TESTS.find((bt) => bt.id === id);
                if (!t) return null;
                return (
                  <div key={id} className="bd-selected-item">
                    <span className="bd-sel-emoji">{t.emoji}</span>
                    <span className="bd-sel-name">{t.nameAr}</span>
                    <span className="bd-sel-price">{formatTestPrice(t.price)}</span>
                    <button
                      type="button"
                      className="bd-sel-remove"
                      onClick={() => removeTest(id)}
                      aria-label="حذف"
                    >
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══ 2. بيانات المريض ═══ */}
      <div className="bd-card">
        <h3 className="bd-card-title">
          <User size={18} strokeWidth={2.2} aria-hidden />
          <span>بيانات المريض</span>
        </h3>

        {/* العمر + الجنس */}
        <div className="bd-row-2">
          <div className="bd-field">
            <label>العمر <span className="bd-optional">(اختياري)</span></label>
            <input
              type="number"
              min="1"
              max="120"
              className="bd-input"
              placeholder="35"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="bd-field">
            <label>الجنس</label>
            <div className="bd-toggle">
              <button
                type="button"
                className={`bd-toggle-btn ${gender === 'male' ? 'active' : ''}`}
                onClick={() => setGender('male')}
              >
                ♂ ذكر
              </button>
              <button
                type="button"
                className={`bd-toggle-btn ${gender === 'female' ? 'active' : ''}`}
                onClick={() => setGender('female')}
              >
                ♀ أنثى
              </button>
            </div>
          </div>
        </div>

        {/* الحالة المرضية */}
        <div className="bd-field">
          <label>
            الحالة المرضية <span className="bd-optional">(اختياري)</span>
          </label>
          <input
            type="text"
            className="bd-input"
            placeholder="مثال: مريض سكري، حامل، حساسية معينة..."
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            maxLength={150}
          />
        </div>

        {/* العنوان */}
        <div className="bd-field">
          <label>
            عنوان السحب <span className="bd-required">*</span>
          </label>

          {/* ✨ V25.1: المواقع المحفوظة (إن وُجدت) */}
          {savedLocations.length > 0 && (
            <div className="bd-saved-locations">
              <div className="bd-saved-label">
                <MapPin size={11} strokeWidth={2.4} />
                <span>اختر من مواقعك المحفوظة:</span>
              </div>
              <div className="bd-saved-chips">
                {savedLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className="bd-saved-chip"
                    onClick={() => {
                      setAddress(loc.address);
                      setGpsLocation({
                        lat: loc.lat,
                        lng: loc.lng,
                        accuracy: 10,
                      });
                      toast.success(`تم اختيار: ${loc.label}`);
                    }}
                    title={`${loc.address}`}
                  >
                    <span className="bd-saved-icon">{loc.icon}</span>
                    <span>{loc.label}</span>
                  </button>
                ))}
              </div>
              <style jsx>{`
                .bd-saved-locations {
                  margin-bottom: 12px;
                  padding: 10px 12px;
                  background: var(--emerald-soft);
                  border-radius: 10px;
                  border: 1px solid var(--emerald);
                }
                .bd-saved-label {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 11px;
                  font-weight: 800;
                  color: var(--emerald-deep);
                  margin-bottom: 8px;
                }
                .bd-saved-chips {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 6px;
                }
                .bd-saved-chip {
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 6px 10px;
                  background: var(--white);
                  border: 1px solid var(--emerald);
                  border-radius: 100px;
                  font-size: 11px;
                  font-weight: 700;
                  color: var(--emerald-deep);
                  cursor: pointer;
                  transition: all 0.15s;
                  font-family: inherit;
                }
                .bd-saved-chip:hover {
                  background: var(--emerald);
                  color: var(--paper-3);
                  transform: translateY(-1px);
                }
                .bd-saved-icon {
                  font-size: 14px;
                  line-height: 1;
                }
              `}</style>
            </div>
          )}

          <textarea
            className="bd-textarea"
            rows={2}
            placeholder="مثال: بغداد - الكرادة - شارع 14 - عمارة 8 - شقة 3"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={300}
          />
          <button
            type="button"
            className="bd-gps-btn"
            onClick={handleUseGPS}
          >
            <MapPin size={14} strokeWidth={2.2} aria-hidden />
            <span>استخدم موقعي الحالي (GPS)</span>
          </button>
        </div>

        {/* رقم الموبايل */}
        <div className="bd-field">
          <label>
            رقم الموبايل <span className="bd-required">*</span>
          </label>
          <div className="bd-phone-wrap">
            <span className="bd-phone-prefix">🇮🇶 +964</span>
            <input
              type="tel"
              className="bd-input bd-phone-input"
              placeholder="7XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
              maxLength={11}
            />
          </div>
          {userPhone && (
            <div className="bd-hint">
              ✓ تم ملء الرقم تلقائياً من حسابك
            </div>
          )}
        </div>
      </div>

      {/* ═══ 3. المختبر ═══ */}
      <div className="bd-card">
        <h3 className="bd-card-title">
          <Building2 size={18} strokeWidth={2.2} aria-hidden />
          <span>اختر المختبر</span>
        </h3>
        <p className="bd-card-sub">
          المختبرات الشريكة المعتمدة في العراق
        </p>

        <div className="bd-labs-scroll">
          {ALL_LABS.map((lab) => {
            const isSel = labId === lab.id;
            const isAny = lab.id === 'any';
            return (
              <button
                key={lab.id}
                type="button"
                className={`bd-lab-card ${isSel ? 'selected' : ''} ${isAny ? 'is-any' : ''}`}
                onClick={() => setLabId(lab.id)}
              >
                <div className="bd-lab-emoji">{lab.emoji}</div>
                <div className="bd-lab-name">{lab.nameAr}</div>
                <div className="bd-lab-city">{lab.city}</div>
                {!isAny && lab.rating > 0 && (
                  <div className="bd-lab-rating">
                    <Star size={11} strokeWidth={2.4} fill="currentColor" aria-hidden />
                    <span>{lab.rating} · {lab.reviewsCount}+ تقييم</span>
                  </div>
                )}
                <div className="bd-lab-time">
                  <Clock size={11} strokeWidth={2.4} aria-hidden />
                  <span>{lab.resultTime}</span>
                </div>
                {isSel && (
                  <div className="bd-lab-check">
                    <CheckCircle2 size={11} strokeWidth={2.4} aria-hidden />
                    <span>مختار</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ 4. الموعد ═══ */}
      <div className="bd-card">
        <h3 className="bd-card-title">
          <Calendar size={18} strokeWidth={2.2} aria-hidden />
          <span>موعد سحب الدم</span>
        </h3>

        <div className="bd-row-2">
          <div className="bd-field">
            <label>
              التاريخ <span className="bd-required">*</span>
            </label>
            <input
              type="date"
              className="bd-input bd-date-input"
              value={date}
              min={getMinDate()}
              max={getMaxDate()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="bd-field">
            <label>
              الساعة <span className="bd-required">*</span>
            </label>
            <input
              type="time"
              className="bd-input bd-time-input"
              value={time}
              min="07:00"
              max="20:00"
              step="1800"
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="bd-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={13} strokeWidth={2.2} aria-hidden />
          ساعات العمل: 7 صباحاً - 8 مساءً · مواعيد متاحة من الغد
        </div>

        {/* تذكير صيام */}
        {fasting.required && selectedTests.length > 0 && (
          <div className="bd-fasting-box">
            <span className="bd-fasting-icon">
              <AlertTriangle size={16} strokeWidth={2.4} aria-hidden />
            </span>
            <div>
              <strong>صيام مطلوب</strong>
              <p>
                يجب الصيام عن الطعام والشراب (ماء مسموح) لمدة{' '}
                <strong>{fasting.hours} ساعة</strong> قبل سحب الدم.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══ أخطاء ═══ */}
      {errors.length > 0 && (
        <div className="bd-errors">
          {errors.map((e, i) => (
            <div key={i} className="bd-error">
              <AlertTriangle size={13} strokeWidth={2.4} aria-hidden />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Sticky Footer للسعر والإرسال ═══ */}
      <div className={`bd-sticky-footer ${!canSubmit ? 'bd-sticky-footer-compact' : ''}`}>
        {selectedTests.length > 0 && canSubmit && (
          <div className="bd-price-card">
            <div className="bd-price-line">
              <span>التحاليل ({selectedTests.length})</span>
              <span>{formatTestPrice(total)}</span>
            </div>
            <div className="bd-price-line">
              <span>زيارة فني المختبر</span>
              <span>{formatTestPrice(BLOOD_DRAW_PRICE)}</span>
            </div>
            <div className="bd-price-line bd-price-total">
              <span>الإجمالي</span>
              <strong>{formatTestPrice(totalWithDrawing)}</strong>
            </div>
            {resultTime && (
              <div className="bd-result-eta">
                <BarChart3 size={14} strokeWidth={2.2} aria-hidden />
                <span>النتيجة جاهزة خلال <strong>{resultTime}</strong> من السحب</span>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="bd-submit-btn"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <><Loader2 size={16} strokeWidth={2.2} style={{ animation: 'spin-smooth 1s linear infinite' }} /> جارٍ إرسال الطلب...</>
          ) : !canSubmit ? (
            'أكمل البيانات أعلاه'
          ) : (
            <><CheckCircle2 size={16} strokeWidth={2.2} /> اطلب الفحص</>
          )}
        </button>

        {canSubmit && (
          <div className="bd-trust-row">
            <Lock size={12} strokeWidth={2.2} aria-hidden />
            <span>معلوماتك مشفّرة · صناعة عراقية ·</span>
            <Star size={12} strokeWidth={2.4} fill="currentColor" aria-hidden />
            <span>معتمد طبياً</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .bd-v2 {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 130px;
          position: relative;
        }

        /* ─── HERO ─── */
        .bd-hero {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, var(--emerald-deep, #073B30), var(--emerald, #0E5C4D));
          color: var(--paper-3, #FAF6EB);
          border-radius: 16px;
          box-shadow: 0 8px 22px -8px rgba(7, 59, 48, 0.4);
        }
        .bd-hero-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
        }
        .bd-hero-text h2 {
          font-size: 15px;
          font-weight: 800;
          margin: 0 0 3px;
        }
        .bd-hero-text p {
          font-size: 11px;
          opacity: 0.85;
          margin: 0;
        }

        /* ─── CARDS ─── */
        .bd-card {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 14px;
          padding: 14px;
        }
        .bd-card-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--ink, #0F1A1C);
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bd-card-sub {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          margin: 0 0 12px;
        }

        /* ─── SEARCH BAR ─── */
        .bd-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .bd-search-icon {
          position: absolute;
          right: 12px;
          font-size: 14px;
          pointer-events: none;
        }
        .bd-search-input {
          width: 100%;
          background: var(--paper-3, #FAF6EB);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 12px;
          padding: 12px 38px 12px 14px;
          font-size: 13px;
          font-family: inherit;
          color: var(--ink, #0F1A1C);
          outline: none;
          transition: border-color 0.15s;
        }
        .bd-search-input:focus {
          border-color: var(--emerald, #0E5C4D);
          background: var(--white, #FFFFFF);
        }
        .bd-search-clear {
          position: absolute;
          left: 10px;
          background: var(--paper-2, #EDE6D3);
          border: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 10px;
          cursor: pointer;
          color: var(--ink-2, #1F2A2C);
        }

        /* ─── SUGGESTIONS ─── */
        .bd-suggestions {
          background: var(--paper-3, #FAF6EB);
          border-radius: 12px;
          padding: 6px;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bd-suggestion {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: var(--white, #FFFFFF);
          border: 0;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.12s;
          text-align: right;
        }
        .bd-suggestion:hover {
          background: var(--emerald-soft, #D9E5DF);
        }
        .bd-suggestion.selected {
          background: var(--emerald-soft, #D9E5DF);
          border: 1.5px solid var(--emerald, #0E5C4D);
        }
        .bd-sug-emoji {
          font-size: 20px;
          flex-shrink: 0;
        }
        .bd-sug-text {
          flex: 1;
          text-align: right;
        }
        .bd-sug-name {
          font-size: 12px;
          font-weight: 800;
          color: var(--ink, #0F1A1C);
        }
        .bd-sug-meta {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
          display: flex;
          gap: 5px;
          margin-top: 2px;
        }
        .bd-sug-code {
          background: var(--emerald-soft, #D9E5DF);
          color: var(--emerald, #0E5C4D);
          padding: 1px 6px;
          border-radius: 100px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }
        .bd-sug-action {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .bd-no-results {
          padding: 14px;
          text-align: center;
          font-size: 12px;
          color: var(--ink-3, #6E7878);
          background: var(--paper-3, #FAF6EB);
          border-radius: 10px;
          margin-top: 8px;
        }

        /* ─── SECTION LABEL ─── */
        .bd-section-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-2, #1F2A2C);
          margin: 14px 0 8px;
        }
        .bd-section-label-2 {
          margin-top: 16px;
        }

        /* ─── CHIPS (horizontal scroll) ─── */
        .bd-chips-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 6px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .bd-chips-scroll::-webkit-scrollbar {
          display: none;
        }
        .bd-chip {
          flex-shrink: 0;
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s;
          min-width: 92px;
        }
        .bd-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.1);
        }
        .bd-chip.selected {
          background: var(--emerald-soft, #D9E5DF);
          border-color: var(--emerald, #0E5C4D);
        }
        .bd-chip-emoji {
          font-size: 20px;
        }
        .bd-chip-name {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink, #0F1A1C);
          text-align: center;
          line-height: 1.3;
        }
        .bd-chip-price {
          font-size: 10px;
          font-weight: 800;
          color: var(--emerald, #0E5C4D);
          font-family: 'JetBrains Mono', monospace;
        }

        /* ─── SELECTED LIST ─── */
        .bd-selected-list {
          background: var(--emerald-soft, #D9E5DF);
          border-radius: 12px;
          padding: 12px;
          margin-top: 14px;
        }
        .bd-selected-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .bd-selected-head strong {
          font-size: 12px;
          color: var(--emerald-deep, #073B30);
        }
        .bd-discount-badge {
          background: var(--amber, #B8540C);
          color: var(--paper-3, #FAF6EB);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 100px;
          font-weight: 800;
        }
        .bd-selected-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .bd-selected-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          background: var(--white, #FFFFFF);
          border-radius: 8px;
        }
        .bd-sel-emoji {
          font-size: 16px;
          flex-shrink: 0;
        }
        .bd-sel-name {
          flex: 1;
          font-size: 12px;
          font-weight: 700;
        }
        .bd-sel-price {
          font-size: 11px;
          font-weight: 800;
          color: var(--emerald, #0E5C4D);
          font-family: 'JetBrains Mono', monospace;
        }
        .bd-sel-remove {
          background: var(--rose-soft, #F0D7D8);
          color: var(--rose, #A82E3D);
          border: 0;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 10px;
          cursor: pointer;
          font-weight: 800;
        }

        /* ─── FIELDS ─── */
        .bd-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .bd-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 12px;
        }
        .bd-field:last-child {
          margin-bottom: 0;
        }
        .bd-field label {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink-2, #1F2A2C);
        }
        .bd-optional {
          font-size: 9px;
          color: var(--ink-3, #6E7878);
          font-weight: 600;
        }
        .bd-required {
          color: var(--rose, #A82E3D);
        }
        .bd-input,
        .bd-textarea {
          width: 100%;
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          font-family: inherit;
          color: var(--ink, #0F1A1C);
          outline: none;
          transition: border-color 0.15s;
        }
        .bd-input:focus,
        .bd-textarea:focus {
          border-color: var(--emerald, #0E5C4D);
        }
        .bd-textarea {
          resize: vertical;
          line-height: 1.5;
        }
        .bd-hint {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
          margin-top: 4px;
        }

        /* ─── TOGGLE (gender) ─── */
        .bd-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          background: var(--paper-2, #EDE6D3);
          padding: 3px;
          border-radius: 10px;
        }
        .bd-toggle-btn {
          padding: 8px;
          background: transparent;
          border: 0;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-3, #6E7878);
          cursor: pointer;
          transition: all 0.15s;
        }
        .bd-toggle-btn.active {
          background: var(--white, #FFFFFF);
          color: var(--ink, #0F1A1C);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        /* ─── PHONE ─── */
        .bd-phone-wrap {
          display: flex;
          align-items: stretch;
        }
        .bd-phone-prefix {
          background: var(--paper-2, #EDE6D3);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-left: 0;
          border-radius: 10px 0 0 10px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          color: var(--ink-2, #1F2A2C);
          white-space: nowrap;
        }
        .bd-phone-input {
          border-right: 0;
          border-radius: 0 10px 10px 0;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ─── GPS BUTTON ─── */
        .bd-gps-btn {
          background: var(--paper-2, #EDE6D3);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 10px;
          padding: 9px 14px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-2, #1F2A2C);
          cursor: pointer;
          margin-top: 6px;
          width: 100%;
        }
        .bd-gps-btn:hover {
          background: var(--paper-3, #FAF6EB);
        }

        /* ─── LABS (horizontal scroll) ─── */
        .bd-labs-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 4px 0 8px;
          scrollbar-width: none;
        }
        .bd-labs-scroll::-webkit-scrollbar {
          display: none;
        }
        .bd-lab-card {
          flex-shrink: 0;
          width: 150px;
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 14px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: right;
          position: relative;
        }
        .bd-lab-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.12);
        }
        .bd-lab-card.selected {
          border-color: var(--emerald, #0E5C4D);
          background: var(--emerald-soft, #D9E5DF);
        }
        .bd-lab-card.is-any {
          background: linear-gradient(135deg, var(--amber-soft, #F0DBC2), var(--paper-3, #FAF6EB));
          border-color: var(--amber, #B8540C);
        }
        .bd-lab-card.is-any.selected {
          background: var(--amber, #B8540C);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--amber, #B8540C);
        }
        .bd-lab-emoji {
          font-size: 26px;
          margin-bottom: 2px;
        }
        .bd-lab-name {
          font-size: 12px;
          font-weight: 800;
          line-height: 1.3;
        }
        .bd-lab-city {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
        }
        .bd-lab-card.selected .bd-lab-city {
          color: var(--emerald-deep, #073B30);
        }
        .bd-lab-card.is-any.selected .bd-lab-city {
          color: var(--paper-3, #FAF6EB);
          opacity: 0.85;
        }
        .bd-lab-rating {
          font-size: 10px;
          color: var(--amber, #B8540C);
          font-weight: 700;
          margin-top: 3px;
        }
        .bd-lab-time {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
          margin-top: 3px;
        }
        .bd-lab-card.selected .bd-lab-time {
          color: var(--emerald-deep, #073B30);
        }
        .bd-lab-card.is-any.selected .bd-lab-time {
          color: var(--paper-3, #FAF6EB);
          opacity: 0.85;
        }
        .bd-lab-check {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          font-size: 9px;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 100px;
        }
        .bd-lab-card.is-any.selected .bd-lab-check {
          background: var(--paper-3, #FAF6EB);
          color: var(--amber, #B8540C);
        }

        /* ─── DATE/TIME ─── */
        .bd-date-input,
        .bd-time-input {
          font-family: 'JetBrains Mono', monospace;
          color-scheme: light;
        }

        /* ─── FASTING ─── */
        .bd-fasting-box {
          display: flex;
          gap: 10px;
          background: var(--amber-soft, #F0DBC2);
          border: 1px solid var(--amber, #B8540C);
          border-radius: 11px;
          padding: 11px;
          margin-top: 10px;
        }
        .bd-fasting-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        .bd-fasting-box strong {
          display: block;
          color: var(--amber, #B8540C);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 3px;
        }
        .bd-fasting-box p {
          font-size: 11px;
          color: var(--ink-2, #1F2A2C);
          margin: 0;
          line-height: 1.5;
        }

        /* ─── ERRORS ─── */
        .bd-errors {
          background: var(--rose-soft, #F0D7D8);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .bd-error {
          display: flex;
          gap: 6px;
          color: var(--rose, #A82E3D);
          font-size: 11px;
          font-weight: 700;
        }

        /* ─── STICKY FOOTER (داخل حدود التطبيق 480px) ─── */
        .bd-sticky-footer {
          position: fixed;
          bottom: 64px; /* فوق الـ bottom-nav مباشرة */
          left: 0;
          right: 0;
          margin: 0 auto;
          width: 100%;
          max-width: 480px;
          background: var(--white, #FFFFFF);
          padding: 10px 14px 12px;
          z-index: 35;
          box-sizing: border-box;
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          transition: all 0.2s ease;
        }
        /* الحالة المضغوطة: شريط نحيف ملتصق بالأسفل */
        .bd-sticky-footer-compact {
          padding: 6px 14px 8px;
          background: var(--paper-2, #F4EFE2);
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.06));
          box-shadow: none;
        }
        .bd-price-card {
          background: var(--paper-3, #FAF6EB);
          border-radius: 11px;
          padding: 10px 12px;
          margin-bottom: 10px;
        }
        .bd-price-line {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 11px;
          color: var(--ink-2, #1F2A2C);
        }
        .bd-price-total {
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          padding-top: 6px;
          margin-top: 4px;
        }
        .bd-price-total span:first-child {
          font-size: 12px;
          font-weight: 800;
        }
        .bd-price-total strong {
          font-size: 16px;
          font-weight: 800;
          color: var(--emerald, #0E5C4D);
          font-family: 'JetBrains Mono', monospace;
        }
        .bd-result-eta {
          font-size: 10px;
          color: var(--emerald-deep, #073B30);
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed var(--line, rgba(15, 26, 28, 0.08));
        }
        .bd-submit-btn {
          width: 100%;
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border: 0;
          border-radius: 12px;
          padding: 13px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 6px 16px -4px rgba(14, 92, 77, 0.4);
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .bd-submit-btn:hover:not(:disabled) {
          background: var(--emerald-deep, #073B30);
          transform: translateY(-1px);
        }
        .bd-submit-btn:disabled {
          background: transparent;
          color: var(--ink-3, #6E7878);
          padding: 4px;
          font-size: 11px;
          font-weight: 600;
          border-radius: 0;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .bd-trust-row {
          text-align: center;
          font-size: 9px;
          color: var(--ink-3, #6E7878);
          margin-top: 7px;
        }
      `}</style>
    </div>
  );
}
