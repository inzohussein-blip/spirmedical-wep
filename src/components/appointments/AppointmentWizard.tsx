'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SERVICES, CATEGORIES, formatPrice, formatDuration, type Service } from '@/lib/services/services-data';
import { generateAvailableDates, generateTimeSlotsForDate, groupTimeSlots, formatDateRelative, toArabicDigits, type TimeSlot } from '@/lib/services/time-slots';
import OtpChannelSelector from './OtpChannelSelector';
import UserLocationPickerWrapper from '@/components/maps/UserLocationPickerWrapper';
import {
  Calendar, MapPin, Lightbulb, Monitor, Clock, FileText, ChevronUp,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';
import { submitErrorMessage } from '@/lib/forms/submit-error';
import { useFormErrors, type FieldErrors } from '@/lib/forms/useFormErrors';
import MissingFieldsSummary from '@/components/forms/MissingFieldsSummary';
import FieldError from '@/components/forms/FieldError';
import { APPOINTMENT_FIELD_LABELS } from '@/lib/validations/appointment';

/** نتيجة الإرسال — تسمح بعرض أخطاء الحقول القادمة من الخادم. */
export interface WizardSubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

// ملاحظة: الـ Wizard هذا للخدمات العامة فقط (تمريض، مغذي، استشارات، إلخ)
// لسحب الدم والتحاليل: استخدم BloodDrawFlow بدلاً منه

type Step = 1 | 2 | 3 | 4;

interface BookingData {
  service: Service | null;
  date: Date | null;
  slot: TimeSlot | null;
  address: string;
  notes: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  governorate?: string;
}

interface Props {
  userPhone?: string; // الرقم المُسجّل (إن وجد)
  onSubmit: (data: BookingData) => Promise<WizardSubmitResult | void>;
}

/**
 * خدماتٌ لها تدفّقٌ مخصّص في الصفحة نفسها. اختيارُها هنا كان يُكمل حجزاً عامّاً
 * بلا اختيار تحاليل ولا إجراءٍ تمريضيّ، فيصل الطلبُ ناقصاً إلى المختبر.
 */
export const DEDICATED_FLOW_SERVICES = ['blood-draw', 'home-nursing'] as const;

export default function AppointmentWizard({ userPhone = '', onSubmit }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [otpVerified, setOtpVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState<BookingData>({
    service: null,
    date: null,
    slot: null,
    address: '',
    notes: '',
    phone: userPhone,
    latitude: null,
    longitude: null,
    governorate: '',
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const availableDates = generateAvailableDates(7);

  // ✨ أخطاء الحقول (بدل زرّ «التالي» المُعطَّل الصامت)
  const fe = useFormErrors(['service', 'slot', 'address', 'phone']);

  // يتحقّق من حقول الخطوة الحالية عند «التالي»
  const validateStep = (s: Step): FieldErrors => {
    const errs: FieldErrors = {};
    if (s === 1 && !data.service) errs.service = 'اختر خدمة للمتابعة';
    if (s === 2 && !data.slot) errs.slot = 'اختر موعداً متاحاً';
    if (s === 3) {
      if (data.service?.needsAddress && data.address.trim().length < 10) {
        errs.address = 'أدخل عنواناً مفصّلاً (محافظة + منطقة + شارع)';
      }
      if (!data.service?.needsAddress && data.phone === '' && userPhone === '') {
        errs.phone = 'أدخل رقم هاتف للتواصل';
      }
    }
    return errs;
  };

  const goNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      fe.setErrors(errs);
      fe.focusFirst(errs);
      haptic.error();
      return;
    }
    fe.clearAll();
    if (step < 4) setStep((step + 1) as Step);
  };

  const goBack = () => {
    fe.clearAll();
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleConfirm = async () => {
    if (!otpVerified) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(data);
      if (res && res.ok === false && res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
        fe.setErrors(res.fieldErrors);
        // ارجع لخطوة العنوان/الخدمة إن كان الخطأ هناك
        if (res.fieldErrors.service) setStep(1);
        else if (res.fieldErrors.slot) setStep(2);
        else if (res.fieldErrors.address) setStep(3);
      }
    } catch (err) {
      // انقطاع الشبكة يرمي من فعل الخادم — بدون التقاطه لا يرى المستخدم شيئاً
      toast.error(submitErrorMessage(err), 'تعذّر الإرسال');
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wizard">
      {/* Progress Bar */}
      <div className="wizard-progress">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="wizard-progress-row">
            <div className={`wizard-step-circle ${step >= s ? 'active' : ''} ${step > s ? 'done' : ''}`}>
              {step > s ? '✓' : toArabicDigits(s)}
            </div>
            {s < 4 && (
              <div className={`wizard-step-line ${step > s ? 'active' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <div className="wizard-step-info">
        <div className="wizard-step-num">الخطوة {toArabicDigits(step)} من ٤</div>
        <div className="wizard-step-title">
          {step === 1 && 'اختر الخدمة'}
          {step === 2 && 'اختر الوقت'}
          {step === 3 && (data.service?.needsAddress ? 'العنوان والتفاصيل' : 'تفاصيل إضافية')}
          {step === 4 && 'التأكيد'}
        </div>
      </div>

      {/* === STEP 1: اختيار الخدمة === */}
      {step === 1 && (
        <div className="step-content">
          {/* فلاتر الفئات */}
          <div className="category-filters">
            <button
              className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              الكل
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                className={`category-pill ${selectedCategory === key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(key)}
              >
                {cat.emoji} {cat.name}
              </button>
            ))}
          </div>

          {/* قائمة الخدمات */}
          <div className="aw-services-list" ref={fe.registerRef('service')}>
            {SERVICES
              .filter((s) => !selectedCategory || s.category === selectedCategory)
              .filter((s) => s.available)
              .map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    if ((DEDICATED_FLOW_SERVICES as readonly string[]).includes(service.id)) {
                      router.push(`/appointments/new?service=${service.id}`);
                      return;
                    }
                    setData({ ...data, service });
                    fe.clearError('service');
                  }}
                  className={`aw-service-card ${data.service?.id === service.id ? 'selected' : ''}`}
                  aria-pressed={data.service?.id === service.id}
                >
                  <div className="aw-service-icon" aria-hidden="true">{service.emoji}</div>
                  <div className="aw-service-info">
                    <div className="aw-service-header">
                      <h3>{service.nameAr}</h3>
                      {service.badge && (
                        <span className={`aw-service-badge badge-${service.badgeColor || 'emerald'}`}>
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p className="aw-service-desc">{service.description}</p>
                    <div className="aw-service-meta">
                      <span className="aw-service-price">من {formatPrice(service.basePrice)}</span>
                      <span className="aw-service-duration" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} strokeWidth={2.2} />
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="aw-service-radio" aria-hidden="true">
                    {data.service?.id === service.id ? '●' : '○'}
                  </div>
                </button>
              ))}
          </div>
          <FieldError message={fe.fieldErrors.service} />
        </div>
      )}

      {/* === STEP 2: اختيار الوقت === */}
      {step === 2 && (
        <div className="step-content" ref={fe.registerRef('slot')}>
          <div className="info-banner">
            <Calendar size={16} strokeWidth={2.2} aria-hidden />
            <span>{data.service?.nameAr} · مدة الجلسة {formatDuration(data.service?.duration || 60)}</span>
          </div>

          {/* اختيار اليوم */}
          <div className="dates-scroll">
            {availableDates.map((d) => {
              const isSelected = data.date?.toDateString() === d.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => setData({ ...data, date: d, slot: null })}
                  className={`date-pill ${isSelected ? 'active' : ''}`}
                >
                  <div className="date-pill-day">{formatDateRelative(d)}</div>
                  <div className="date-pill-num">{toArabicDigits(d.getDate())}</div>
                </button>
              );
            })}
          </div>

          {/* فترات الوقت */}
          {data.date && (
            <div className="time-groups">
              {groupTimeSlots(generateTimeSlotsForDate(data.date, data.service?.duration || 60)).map((group) => (
                <div key={group.label} className="time-group">
                  <div className="time-group-header">
                    <span>{group.emoji}</span>
                    <span>{group.label}</span>
                  </div>
                  <div className="time-slots-grid">
                    {group.slots.map((slot) => {
                      const isSelected = data.slot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => { setData({ ...data, slot }); fe.clearError('slot'); }}
                          className={`time-slot ${isSelected ? 'active' : ''} ${!slot.available ? 'disabled' : ''} ${slot.isPopular ? 'popular' : ''}`}
                        >
                          {slot.displayTime}
                          {slot.isPopular && slot.available && <span className="popular-dot" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!data.date && (
            <div className="empty-hint" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ChevronUp size={14} strokeWidth={2.2} aria-hidden />
              اختر يوماً من الأيام أعلاه
            </div>
          )}
          <FieldError message={fe.fieldErrors.slot} />
        </div>
      )}

      {/* === STEP 3: العنوان والملاحظات === */}
      {step === 3 && (
        <div className="step-content">
          {data.service?.needsAddress ? (
            <div ref={fe.registerRef('address')}>
              <UserLocationPickerWrapper
                initialLocation={{
                  latitude: data.latitude ?? undefined,
                  longitude: data.longitude ?? undefined,
                  address: data.address,
                  governorate: data.governorate,
                }}
                onLocationChange={(loc) => {
                  setData((prev) => ({
                    ...prev,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address: loc.address,
                    governorate: loc.governorate,
                  }));
                  if (loc.address && loc.address.trim().length >= 10) fe.clearError('address');
                }}
                height={280}
                label="عنوان الخدمة"
                description="اضغط على الخريطة أو استخدم GPS لتحديد موقعك"
                showAddress
                showGovernorate
              />
              <FieldError message={fe.fieldErrors.address} />
            </div>
          ) : (
            <div className="online-banner">
              <div className="online-icon">
                <Monitor size={28} strokeWidth={2} />
              </div>
              <div>
                <h3>خدمة عن بُعد</h3>
                <p>سنرسل لك رابط المكالمة قبل الموعد بـ ١٥ دقيقة</p>
              </div>
            </div>
          )}

          <div className="aw-field-group">
            <label>ملاحظات إضافية (اختياري)</label>
            <textarea
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="أي معلومات تريد مشاركتها مع مزوّد الخدمة..."
              rows={3}
              maxLength={1000}
            />
            <div className="field-counter">{toArabicDigits(data.notes.length)}/١٠٠٠</div>
          </div>

          {!data.service?.needsAddress && data.phone === '' && (
            <div className="aw-field-group" ref={fe.registerRef('phone')}>
              <label>رقم الهاتف للتواصل *</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">🇮🇶 +964</span>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => { setData({ ...data, phone: e.target.value.replace(/\D/g, '') }); fe.clearError('phone'); }}
                  placeholder="7XX XXX XXXX"
                  maxLength={11}
                />
              </div>
              <FieldError message={fe.fieldErrors.phone} />
            </div>
          )}
        </div>
      )}

      {/* === STEP 4: التأكيد + OTP === */}
      {step === 4 && (
        <div className="step-content">
          {!otpVerified ? (
            <OtpChannelSelector
              phone={data.phone || userPhone}
              purpose="appointment"
              onVerified={() => setOtpVerified(true)}
              onCancel={() => setStep(3)}
            />
          ) : (
            <>
              {/* ملخّص الحجز */}
              <div className="summary-card">
                <div className="summary-header">
                  <div className="summary-icon">{data.service?.emoji}</div>
                  <div>
                    <h3>{data.service?.nameAr}</h3>
                    <p>{data.service?.description}</p>
                  </div>
                </div>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span className="summary-label">
                      <Calendar size={13} strokeWidth={2.2} aria-hidden />
                      <span>التاريخ والوقت</span>
                    </span>
                    <span className="summary-value">
                      {data.slot && `${data.slot.displayDate} · ${data.slot.displayTime}`}
                    </span>
                  </div>

                  {data.service?.needsAddress && (
                    <div className="summary-row">
                      <span className="summary-label">
                        <MapPin size={13} strokeWidth={2.2} aria-hidden />
                        <span>العنوان</span>
                      </span>
                      <span className="summary-value">{data.address}</span>
                    </div>
                  )}

                  <div className="summary-row">
                    <span className="summary-label">
                      <Clock size={13} strokeWidth={2.2} aria-hidden />
                      <span>المدة المتوقعة</span>
                    </span>
                    <span className="summary-value">{formatDuration(data.service?.duration || 60)}</span>
                  </div>

                  {data.notes && (
                    <div className="summary-row">
                      <span className="summary-label">
                        <FileText size={13} strokeWidth={2.2} aria-hidden />
                        <span>ملاحظات</span>
                      </span>
                      <span className="summary-value">{data.notes}</span>
                    </div>
                  )}

                </div>

                <div className="summary-price">
                  <div className="summary-price-row">
                    <span>السعر التقديري</span>
                    <strong>{formatPrice(data.service?.basePrice || 0)}</strong>
                  </div>
                  <div className="summary-price-note" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={12} strokeWidth={2.2} aria-hidden />
                    السعر النهائي قد يختلف حسب المتطلبات الفعلية
                  </div>
                </div>
              </div>

              {/* تأكيد + شروط */}
              <div className="confirm-checkbox">
                <input type="checkbox" id="confirm-terms" defaultChecked />
                <label htmlFor="confirm-terms">
                  أؤكّد أن المعلومات صحيحة وأوافق على
                  <a href="/legal/terms" target="_blank" rel="noopener noreferrer"> شروط الخدمة</a>
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {/* صندوق «الحقول الناقصة» */}
      {(step !== 4 || otpVerified) && (
        <MissingFieldsSummary
          fields={fe.missingFields}
          labels={APPOINTMENT_FIELD_LABELS}
          errors={fe.fieldErrors}
          onJump={fe.jumpTo}
        />
      )}

      {/* أزرار التنقّل */}
      {(step !== 4 || otpVerified) && (
        <div className="wizard-actions">
          {step > 1 && (
            <button type="button" onClick={goBack} className="btn-secondary">
              ← السابق
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={goNext}
              className="btn-primary"
            >
              التالي ←
            </button>
          )}
          {step === 4 && otpVerified && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="btn-primary btn-confirm"
            >
              {submitting ? 'جارٍ التأكيد...' : '✓ تأكيد الحجز'}
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .wizard {
          background: var(--paper-3, #FFFFFF);
          padding: 16px;
          border-radius: 16px;
          max-width: 720px;
          margin: 0 auto;
        }

        /* Progress */
        .wizard-progress {
          display: flex;
          align-items: center;
          padding: 0 8px 18px;
        }
        .wizard-progress-row {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .wizard-progress-row:last-child { flex: 0; }
        .wizard-step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
          background: var(--paper-2, #F1F3F4);
          color: var(--ink-3, #5F6368);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .wizard-step-circle.active {
          background: var(--emerald, #01875F);
          color: var(--paper-3, #FFFFFF);
          border-color: var(--emerald, #01875F);
        }
        .wizard-step-circle.done {
          background: var(--emerald, #01875F);
          color: var(--paper-3, #FFFFFF);
        }
        .wizard-step-line {
          flex: 1;
          height: 3px;
          background: var(--paper-2, #F1F3F4);
          margin: 0 8px;
          border-radius: 100px;
          transition: all 0.3s;
        }
        .wizard-step-line.active {
          background: var(--emerald, #01875F);
        }

        .wizard-step-info {
          text-align: center;
          margin-bottom: 18px;
        }
        .wizard-step-num {
          font-size: 11px;
          color: var(--ink-3, #5F6368);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .wizard-step-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--ink, #202124);
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Step 1: Categories + Services */
        .category-filters {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none;
        }
        .category-filters::-webkit-scrollbar { display: none; }
        .category-pill {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 100px;
          padding: 7px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          min-height: 40px;
          transition: all 0.15s;
        }
        .category-pill.active {
          background: var(--emerald, #01875F);
          color: var(--paper-3, #FFFFFF);
          border-color: var(--emerald, #01875F);
        }
        .aw-services-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .aw-service-card {
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 16px;
          padding: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: right;
        }
        .aw-service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.1);
        }
        .aw-service-card.selected {
          border-color: var(--emerald, #01875F);
          background: var(--emerald-soft, #E6F3EF);
        }
        .aw-service-icon {
          width: 56px;
          height: 56px;
          background: var(--paper-2, #F1F3F4);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .aw-service-card.selected .aw-service-icon {
          background: var(--emerald, #01875F);
        }
        .aw-service-info { flex: 1; min-width: 0; }
        .aw-service-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .aw-service-header h3 {
          font-size: 14px;
          font-weight: 800;
          margin: 0;
        }
        .aw-service-badge {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 100px;
          font-weight: 800;
        }
        .badge-emerald { background: var(--emerald, #01875F); color: var(--paper-3, #FFFFFF); }
        .badge-amber { background: var(--amber, #B06000); color: var(--paper-3, #FFFFFF); }
        .badge-rose { background: var(--rose, #C71C56); color: var(--paper-3, #FFFFFF); }
        .aw-service-desc {
          font-size: 11px;
          color: var(--ink-3, #5F6368);
          margin: 0 0 6px;
          line-height: 1.5;
        }
        .aw-service-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
        }
        .aw-service-price {
          font-weight: 800;
          color: var(--emerald, #01875F);
        }
        .aw-service-duration {
          color: var(--ink-3, #5F6368);
        }
        .aw-service-radio {
          font-size: 22px;
          color: var(--ink-4, #80868B);
          flex-shrink: 0;
        }
        .aw-service-card.selected .aw-service-radio {
          color: var(--emerald, #01875F);
        }

        /* Step 2: Time */
        .info-banner {
          background: var(--emerald-soft, #E6F3EF);
          color: var(--emerald-deep, #056559);
          padding: 10px 14px;
          border-radius: 11px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dates-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none;
        }
        .dates-scroll::-webkit-scrollbar { display: none; }
        .date-pill {
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 14px;
          padding: 10px 16px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s;
          min-width: 76px;
          text-align: center;
        }
        .date-pill.active {
          background: var(--emerald, #01875F);
          color: var(--paper-3, #FFFFFF);
          border-color: var(--emerald, #01875F);
        }
        .date-pill-day {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .date-pill-num {
          font-size: 20px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .time-groups {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .time-group {
          background: var(--white, #FFFFFF);
          border-radius: 14px;
          padding: 14px;
        }
        .time-group-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .time-slot {
          background: var(--paper-3, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 10px;
          padding: 9px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: all 0.15s;
        }
        .time-slot:hover:not(.disabled):not(.active) {
          border-color: var(--emerald, #01875F);
          background: var(--white, #FFFFFF);
        }
        .time-slot.active {
          background: var(--emerald, #01875F);
          color: var(--paper-3, #FFFFFF);
          border-color: var(--emerald, #01875F);
        }
        .time-slot.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          text-decoration: line-through;
        }
        .popular-dot {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--amber, #B06000);
        }
        .empty-hint {
          text-align: center;
          padding: 30px;
          color: var(--ink-3, #5F6368);
          font-size: 13px;
        }

        /* Step 3: Details */
        .aw-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .aw-field-group label {
          font-size: 12px;
          font-weight: 700;
        }
        .aw-field-group input,
        .aw-field-group textarea {
          background: var(--white, #FFFFFF);
          border: 1.5px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
          resize: vertical;
        }
        .aw-field-group input:focus,
        .aw-field-group textarea:focus {
          border-color: var(--emerald, #01875F);
        }
        .field-hint {
          font-size: 11px;
          color: var(--ink-3, #5F6368);
        }
        .field-counter {
          font-size: 11px;
          color: var(--ink-3, #5F6368);
          text-align: left;
          font-family: 'JetBrains Mono', monospace;
        }
        .gps-btn {
          background: var(--amber-soft, #FEF7E0);
          color: var(--amber, #B06000);
          border: 1px solid var(--amber, #B06000);
          border-radius: 10px;
          padding: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 4px;
        }
        .online-banner {
          background: var(--emerald-soft, #E6F3EF);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .online-icon { font-size: 32px; }
        .online-banner h3 {
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 4px;
          color: var(--emerald-deep, #056559);
        }
        .online-banner p {
          font-size: 12px;
          margin: 0;
          color: var(--emerald-deep, #056559);
        }
        .phone-input-wrap {
          display: flex;
          gap: 8px;
        }
        .phone-prefix {
          background: var(--paper-2, #F1F3F4);
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
        }
        .phone-input-wrap input { flex: 1; }

        /* Step 4: Summary */
        .summary-card {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .summary-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--line, rgba(15, 26, 28, 0.08));
        }
        .summary-icon {
          width: 56px;
          height: 56px;
          background: var(--emerald-soft, #E6F3EF);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        .summary-header h3 {
          font-size: 16px;
          font-weight: 800;
          margin: 0 0 3px;
        }
        .summary-header p {
          font-size: 11px;
          color: var(--ink-3, #5F6368);
          margin: 0;
        }
        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }
        .summary-label {
          font-size: 12px;
          color: var(--ink-3, #5F6368);
          font-weight: 600;
          flex-shrink: 0;
        }
        .summary-value {
          font-size: 13px;
          font-weight: 700;
          text-align: left;
        }
        .summary-price {
          background: var(--emerald-soft, #E6F3EF);
          border-radius: 12px;
          padding: 14px;
          margin-top: 4px;
        }
        .summary-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 700;
          color: var(--emerald-deep, #056559);
        }
        .summary-price-row strong {
          font-size: 18px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .summary-price-note {
          font-size: 11px;
          color: var(--emerald-deep, #056559);
          opacity: 0.8;
          margin-top: 4px;
        }
        .confirm-checkbox {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: var(--paper-2, #F1F3F4);
          border-radius: 11px;
          font-size: 12px;
        }
        .confirm-checkbox label {
          color: var(--ink-2, #3C4043);
          cursor: pointer;
        }
        .confirm-checkbox a {
          color: var(--emerald, #01875F);
          font-weight: 700;
          text-decoration: none;
        }

        /* Actions */
        /* لاصقٌ في الأسفل: كانت قائمةُ الخدمات أربعَ شاشات و«التالي» في
           آخرها، فيختار المريضُ خدمةً ثمّ يبحث عن الزرّ. */
        .wizard-actions {
          position: sticky;
          bottom: 0;
          z-index: 5;
          display: flex;
          gap: 8px;
          margin: 24px -16px -16px;
          padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
          background: var(--paper-3, #FFFFFF);
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          border-radius: 0 0 16px 16px;
          box-shadow: 0 -6px 16px -10px rgba(15, 26, 28, 0.25);
        }
        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 13px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          border: 0;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--emerald, #01875F);
          color: var(--paper-3, #FFFFFF);
          box-shadow: 0 6px 16px -4px rgba(14, 92, 77, 0.4);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-confirm {
          background: var(--emerald-deep, #056559);
        }
        .btn-secondary {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          color: var(--ink, #202124);
        }
      `}</style>
    </div>
  );
}
