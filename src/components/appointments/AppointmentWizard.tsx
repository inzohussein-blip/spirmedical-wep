'use client';

import { useState } from 'react';
import { SERVICES, CATEGORIES, formatPrice, formatDuration, type Service } from '@/lib/services/services-data';
import { generateAvailableDates, generateTimeSlotsForDate, groupTimeSlots, formatDateRelative, toArabicDigits, type TimeSlot } from '@/lib/services/time-slots';
import OtpChannelSelector from './OtpChannelSelector';
import UserLocationPickerWrapper from '@/components/maps/UserLocationPickerWrapper';
import {
  Calendar, MapPin, Lightbulb, Monitor, Clock, FileText, ChevronUp,
} from 'lucide-react';

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
  onSubmit: (data: BookingData) => Promise<void>;
}

export default function AppointmentWizard({ userPhone = '', onSubmit }: Props) {
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

  // التنقّل بين الخطوات
  const canGoNext = (() => {
    if (step === 1) return data.service !== null;
    if (step === 2) return data.slot !== null;
    if (step === 3) {
      if (data.service?.needsAddress) return data.address.length >= 10;
      return true;
    }
    return false;
  })();

  const goNext = () => {
    if (!canGoNext) return;
    if (step < 4) setStep((step + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleConfirm = async () => {
    if (!otpVerified) return;
    setSubmitting(true);
    try {
      await onSubmit(data);
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
          <div className="services-list">
            {SERVICES
              .filter((s) => !selectedCategory || s.category === selectedCategory)
              .filter((s) => s.available)
              .map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setData({ ...data, service })}
                  className={`service-card ${data.service?.id === service.id ? 'selected' : ''}`}
                >
                  <div className="service-icon">{service.emoji}</div>
                  <div className="service-info">
                    <div className="service-header">
                      <h3>{service.nameAr}</h3>
                      {service.badge && (
                        <span className={`service-badge badge-${service.badgeColor || 'emerald'}`}>
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p className="service-desc">{service.description}</p>
                    <div className="service-meta">
                      <span className="service-price">من {formatPrice(service.basePrice)}</span>
                      <span className="service-duration" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} strokeWidth={2.2} />
                        {formatDuration(service.duration)}
                      </span>
                    </div>
                  </div>
                  <div className="service-radio">
                    {data.service?.id === service.id ? '●' : '○'}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* === STEP 2: اختيار الوقت === */}
      {step === 2 && (
        <div className="step-content">
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
                          onClick={() => setData({ ...data, slot })}
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
        </div>
      )}

      {/* === STEP 3: العنوان والملاحظات === */}
      {step === 3 && (
        <div className="step-content">
          {data.service?.needsAddress ? (
            <>
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
                }}
                height={280}
                label="عنوان الخدمة"
                description="اضغط على الخريطة أو استخدم GPS لتحديد موقعك"
                showAddress
                showGovernorate
              />
            </>
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

          <div className="field-group">
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
            <div className="field-group">
              <label>رقم الهاتف للتواصل *</label>
              <div className="phone-input-wrap">
                <span className="phone-prefix">🇮🇶 +964</span>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="7XX XXX XXXX"
                  maxLength={11}
                />
              </div>
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
                  <a href="/legal/terms" target="_blank"> شروط الخدمة</a>
                </label>
              </div>
            </>
          )}
        </div>
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
              disabled={!canGoNext}
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
          background: var(--paper-3, #FAF6EB);
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
          background: var(--paper-2, #EDE6D3);
          color: var(--ink-3, #6E7878);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .wizard-step-circle.active {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
        }
        .wizard-step-circle.done {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
        }
        .wizard-step-line {
          flex: 1;
          height: 3px;
          background: var(--paper-2, #EDE6D3);
          margin: 0 8px;
          border-radius: 100px;
          transition: all 0.3s;
        }
        .wizard-step-line.active {
          background: var(--emerald, #0E5C4D);
        }

        .wizard-step-info {
          text-align: center;
          margin-bottom: 18px;
        }
        .wizard-step-num {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .wizard-step-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--ink, #0F1A1C);
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
          transition: all 0.15s;
        }
        .category-pill.active {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
        }
        .services-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .service-card {
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
        .service-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.1);
        }
        .service-card.selected {
          border-color: var(--emerald, #0E5C4D);
          background: var(--emerald-soft, #D9E5DF);
        }
        .service-icon {
          width: 56px;
          height: 56px;
          background: var(--paper-2, #EDE6D3);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .service-card.selected .service-icon {
          background: var(--emerald, #0E5C4D);
        }
        .service-info { flex: 1; min-width: 0; }
        .service-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .service-header h3 {
          font-size: 14px;
          font-weight: 800;
          margin: 0;
        }
        .service-badge {
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 100px;
          font-weight: 800;
        }
        .badge-emerald { background: var(--emerald, #0E5C4D); color: var(--paper-3, #FAF6EB); }
        .badge-amber { background: var(--amber, #B8540C); color: var(--paper-3, #FAF6EB); }
        .badge-rose { background: var(--rose, #A82E3D); color: var(--paper-3, #FAF6EB); }
        .service-desc {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
          margin: 0 0 6px;
          line-height: 1.5;
        }
        .service-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
        }
        .service-price {
          font-weight: 800;
          color: var(--emerald, #0E5C4D);
        }
        .service-duration {
          color: var(--ink-3, #6E7878);
        }
        .service-radio {
          font-size: 22px;
          color: var(--ink-4, #A4ACAA);
          flex-shrink: 0;
        }
        .service-card.selected .service-radio {
          color: var(--emerald, #0E5C4D);
        }

        /* Step 2: Time */
        .info-banner {
          background: var(--emerald-soft, #D9E5DF);
          color: var(--emerald-deep, #073B30);
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
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
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
          background: var(--paper-3, #FAF6EB);
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
          border-color: var(--emerald, #0E5C4D);
          background: var(--white, #FFFFFF);
        }
        .time-slot.active {
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
          border-color: var(--emerald, #0E5C4D);
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
          background: var(--amber, #B8540C);
        }
        .empty-hint {
          text-align: center;
          padding: 30px;
          color: var(--ink-3, #6E7878);
          font-size: 13px;
        }

        /* Step 3: Details */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-group label {
          font-size: 12px;
          font-weight: 700;
        }
        .field-group input,
        .field-group textarea {
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
        .field-group input:focus,
        .field-group textarea:focus {
          border-color: var(--emerald, #0E5C4D);
        }
        .field-hint {
          font-size: 11px;
          color: var(--ink-3, #6E7878);
        }
        .field-counter {
          font-size: 10px;
          color: var(--ink-3, #6E7878);
          text-align: left;
          font-family: 'JetBrains Mono', monospace;
        }
        .gps-btn {
          background: var(--amber-soft, #F0DBC2);
          color: var(--amber, #B8540C);
          border: 1px solid var(--amber, #B8540C);
          border-radius: 10px;
          padding: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 4px;
        }
        .online-banner {
          background: var(--emerald-soft, #D9E5DF);
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
          color: var(--emerald-deep, #073B30);
        }
        .online-banner p {
          font-size: 12px;
          margin: 0;
          color: var(--emerald-deep, #073B30);
        }
        .phone-input-wrap {
          display: flex;
          gap: 8px;
        }
        .phone-prefix {
          background: var(--paper-2, #EDE6D3);
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
          background: var(--emerald-soft, #D9E5DF);
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
          color: var(--ink-3, #6E7878);
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
          color: var(--ink-3, #6E7878);
          font-weight: 600;
          flex-shrink: 0;
        }
        .summary-value {
          font-size: 13px;
          font-weight: 700;
          text-align: left;
        }
        .summary-price {
          background: var(--emerald-soft, #D9E5DF);
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
          color: var(--emerald-deep, #073B30);
        }
        .summary-price-row strong {
          font-size: 18px;
          font-weight: 900;
          font-family: 'JetBrains Mono', monospace;
        }
        .summary-price-note {
          font-size: 10px;
          color: var(--emerald-deep, #073B30);
          opacity: 0.8;
          margin-top: 4px;
        }
        .confirm-checkbox {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: var(--paper-2, #EDE6D3);
          border-radius: 11px;
          font-size: 12px;
        }
        .confirm-checkbox label {
          color: var(--ink-2, #1F2A2C);
          cursor: pointer;
        }
        .confirm-checkbox a {
          color: var(--emerald, #0E5C4D);
          font-weight: 700;
          text-decoration: none;
        }

        /* Actions */
        .wizard-actions {
          display: flex;
          gap: 8px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--line, rgba(15, 26, 28, 0.08));
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
          background: var(--emerald, #0E5C4D);
          color: var(--paper-3, #FAF6EB);
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
          background: var(--emerald-deep, #073B30);
        }
        .btn-secondary {
          background: var(--white, #FFFFFF);
          border: 1px solid var(--line, rgba(15, 26, 28, 0.08));
          color: var(--ink, #0F1A1C);
        }
      `}</style>
    </div>
  );
}
