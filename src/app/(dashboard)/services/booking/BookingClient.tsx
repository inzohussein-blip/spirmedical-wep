'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Calendar, Clock, MapPin, Phone, MessageCircle,
  CheckCircle2, Loader2, User, Star, Info,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';
import { createServiceBooking } from './actions';
import type { BookingProvider } from './page';

interface Props {
  provider: BookingProvider;
  serviceLabel: string;
  userPhone: string;
  userName: string;
}

export default function BookingClient({ provider, serviceLabel, userPhone, userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'details' | 'datetime' | 'confirm' | 'success'>('details');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [phone, setPhone] = useState(userPhone);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // V25.47: structured fields
  const [dentalProcedure, setDentalProcedure] = useState<string>('');
  const [opticalService, setOpticalService] = useState<string>('');

  // قيم افتراضية: غداً 10:00 ص
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const isOnlineService = provider.type === 'mental-health' && provider.packageType === 'online';
  const isClinicService = provider.type === 'dental' || provider.type === 'optical';

  // الـ steps
  const nextStep = () => {
    haptic.light();
    const errs: string[] = [];

    if (step === 'details') {
      if (phone.trim().length < 10) errs.push('أدخل رقم هاتف صحيح');
      if (!isOnlineService && isClinicService && !address.trim()) {
        // address optional for clinic visits (نزور المركز)
      }
      setErrors(errs);
      if (errs.length === 0) setStep('datetime');
      else haptic.error();
    } else if (step === 'datetime') {
      if (!date) errs.push('اختر التاريخ');
      if (!time) errs.push('اختر الوقت');
      setErrors(errs);
      if (errs.length === 0) setStep('confirm');
      else haptic.error();
    }
  };

  const prevStep = () => {
    haptic.light();
    if (step === 'datetime') setStep('details');
    if (step === 'confirm') setStep('datetime');
  };

  const handleSubmit = async () => {
    haptic.medium();
    setIsSubmitting(true);
    setErrors([]);

    try {
      const scheduledAt = `${date}T${time}:00`;
      const result = await createServiceBooking({
        service_type: provider.type,
        provider_id: provider.id,
        provider_name: provider.name,
        scheduled_at: scheduledAt,
        user_phone: phone,
        notes,
        package_type: provider.packageType,
        package_price: provider.packagePrice,
        address: isOnlineService ? undefined : address,
        // V25.47: structured fields
                dental_procedure_type: (dentalProcedure || undefined) as any,
                optical_service_type: (opticalService || undefined) as any,
      });

      if (result.ok) {
        haptic.success();
        setStep('success');
      } else {
        haptic.error();
        toast.error(result.error || 'فشل الحجز');
        setIsSubmitting(false);
      }
    } catch {
      haptic.error();
      toast.error('حدث خطأ');
      setIsSubmitting(false);
    }
  };

  // ─── Success Screen ───
  if (step === 'success') {
    return (
      <main className="app-screen">
        <div className="scr-content" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
        }}>
          <div style={{
            width: 100, height: 100,
            background: 'var(--emerald-soft)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}>
            <CheckCircle2 size={60} color="var(--emerald)" />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
            تم الحجز بنجاح! 🎉
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24, lineHeight: 1.7, maxWidth: 320 }}>
            سيتم التواصل معك خلال 24 ساعة لتأكيد الموعد.
            <br />
            ستجد التفاصيل في قسم &quot;طلباتي&quot;.
          </p>

          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 320 }}>
            <Link
              href="/appointments"
              style={{
                flex: 1,
                padding: '12px 18px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              عرض طلباتي
            </Link>
            <Link
              href="/dashboard"
              style={{
                flex: 1,
                padding: '12px 18px',
                background: 'var(--white)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              الرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-screen">
      <div className="scr-content" style={{ paddingBottom: 100 }}>
        {/* Header */}
        <div className="scr-page-header">
          <button
            type="button"
            onClick={() => step === 'details' ? router.back() : prevStep()}
            className="scr-back-btn"
            aria-label="رجوع"
          >
            <ArrowRight size={20} strokeWidth={2.2} />
          </button>
          <h1 className="scr-page-title" style={{ fontSize: 16 }}>
            {serviceLabel}
          </h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          padding: '0 4px',
        }}>
          {['details', 'datetime', 'confirm'].map((s, i) => {
            const isActive = step === s;
            const isPast = ['details', 'datetime', 'confirm'].indexOf(step) > i;
            return (
              <div key={s} style={{
                flex: 1,
                height: 4,
                background: isActive || isPast ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 2,
                transition: 'background 0.3s',
              }} />
            );
          })}
        </div>

        {/* Provider info card (always visible) */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--emerald-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={22} color="var(--emerald)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 2 }}>
                {provider.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} />
                {provider.city}{provider.district ? ` · ${provider.district}` : ''}
              </div>
            </div>
          </div>

          {/* Package info (mental + nutrition) */}
          {provider.packageLabel && (
            <div style={{
              background: 'var(--emerald-soft)',
              borderRadius: 8,
              padding: '8px 10px',
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {provider.packageLabel}
              </span>
              <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--emerald)' }}>
                {provider.packagePrice?.toLocaleString('ar-IQ')} د.ع
              </span>
            </div>
          )}

          {provider.meta.priceRange && !provider.packageLabel && (
            <div style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              marginTop: 6,
              padding: '6px 10px',
              background: 'var(--paper-3)',
              borderRadius: 6,
            }}>
              💰 {provider.meta.priceRange}
            </div>
          )}
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{
            background: 'var(--rose-soft)',
            color: 'var(--rose)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 14,
            fontSize: 12,
            lineHeight: 1.7,
          }}>
            {errors.map((e, i) => <div key={i}>• {e}</div>)}
          </div>
        )}

        {/* ─── Step 1: Details ─── */}
        {step === 'details' && (
          <div>
            <SectionTitle>📞 رقم التواصل</SectionTitle>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXXXXXX"
              style={inputStyle}
            />

            {!isOnlineService && (
              <>
                <SectionTitle style={{ marginTop: 14 }}>
                  📍 {isClinicService ? 'الموقع (اختياري - للتذكير)' : 'العنوان'}
                </SectionTitle>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isClinicService ? 'موقعك التقريبي للتذكير...' : 'العنوان الكامل (محافظة + منطقة + شارع)'}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </>
            )}

            {/* V25.47: Dental Procedure Selector */}
            {provider.type === 'dental' && (
              <>
                <SectionTitle style={{ marginTop: 14 }}>🦷 نوع الإجراء</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {[
                    { id: 'cleaning', label: 'تنظيف الأسنان' },
                    { id: 'filling', label: 'حشوة' },
                    { id: 'extraction', label: 'قلع' },
                    { id: 'root_canal', label: 'علاج عصب' },
                    { id: 'crown', label: 'تركيب تاج' },
                    { id: 'orthodontics', label: 'تقويم' },
                    { id: 'whitening', label: 'تبييض' },
                    { id: 'consultation', label: 'استشارة' },
                  ].map((proc) => {
                    const selected = dentalProcedure === proc.id;
                    return (
                      <button
                        key={proc.id}
                        type="button"
                        onClick={() => setDentalProcedure(proc.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: selected ? '#0F6E56' : 'var(--line)',
                          background: selected ? '#0F6E56' : 'var(--white)',
                          color: selected ? 'white' : 'var(--ink-2)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {proc.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* V25.47: Optical Service Selector */}
            {provider.type === 'optical' && (
              <>
                <SectionTitle style={{ marginTop: 14 }}>👓 نوع الخدمة</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {[
                    { id: 'eye_exam', label: 'فحص نظر' },
                    { id: 'prescription_lenses', label: 'نظارة طبية' },
                    { id: 'sunglasses', label: 'نظارة شمسية' },
                    { id: 'contact_lenses', label: 'عدسات لاصقة' },
                    { id: 'frames_only', label: 'إطار فقط' },
                    { id: 'consultation', label: 'استشارة' },
                  ].map((svc) => {
                    const selected = opticalService === svc.id;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => setOpticalService(svc.id)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: selected ? '#0F6E56' : 'var(--line)',
                          background: selected ? '#0F6E56' : 'var(--white)',
                          color: selected ? 'white' : 'var(--ink-2)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {svc.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <SectionTitle style={{ marginTop: 14 }}>📝 ملاحظات (اختياري)</SectionTitle>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل تريد ذكرها..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />

            {provider.meta.services && provider.meta.services.length > 0 && (
              <div style={{
                background: 'var(--paper-3)',
                borderRadius: 10,
                padding: 12,
                marginTop: 16,
                fontSize: 12,
                color: 'var(--ink-2)',
                lineHeight: 1.7,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>الخدمات المتوفّرة:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {provider.meta.services.map((s, i) => (
                    <span key={i} style={{
                      padding: '3px 8px',
                      background: 'var(--white)',
                      borderRadius: 100,
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Date & Time ─── */}
        {step === 'datetime' && (
          <div>
            <SectionTitle>📅 التاريخ</SectionTitle>
            <input
              type="date"
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />

            <SectionTitle style={{ marginTop: 14 }}>⏰ الوقت</SectionTitle>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
            }}>
              {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { haptic.selection(); setTime(t); }}
                  style={{
                    padding: '10px 6px',
                    background: time === t ? 'var(--emerald)' : 'var(--white)',
                    color: time === t ? 'var(--paper-3)' : 'var(--ink-2)',
                    border: '1px solid',
                    borderColor: time === t ? 'var(--emerald)' : 'var(--line)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{
              background: 'var(--amber-soft)',
              borderRadius: 10,
              padding: 12,
              marginTop: 14,
              fontSize: 11,
              color: 'var(--ink-2)',
              lineHeight: 1.7,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
            }}>
              <Info size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                هذا حجز <strong>مبدئي</strong> - سيتم التواصل معك خلال 24 ساعة لتأكيد الوقت النهائي.
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 3: Confirm ─── */}
        {step === 'confirm' && (
          <div>
            <SectionTitle>✓ مراجعة الحجز</SectionTitle>

            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 14,
            }}>
              <ReviewRow label="الخدمة" value={serviceLabel} />
              <ReviewRow label="الموفّر" value={provider.name} />
              {provider.packageLabel && (
                <ReviewRow label="الباقة" value={provider.packageLabel} />
              )}
              <ReviewRow
                label="التاريخ"
                value={new Date(`${date}T${time}`).toLocaleDateString('ar-IQ', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
              <ReviewRow label="الوقت" value={time} />
              <ReviewRow label="الهاتف" value={phone} />
              {address && <ReviewRow label="العنوان" value={address} />}
              {notes && <ReviewRow label="ملاحظات" value={notes} />}
              {provider.packagePrice && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0 0',
                  borderTop: '1px solid var(--line)',
                  marginTop: 10,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>الإجمالي:</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--emerald)' }}>
                    {provider.packagePrice.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              )}
            </div>

            <div style={{
              background: 'var(--emerald-soft)',
              borderRadius: 10,
              padding: 12,
              fontSize: 11,
              color: 'var(--ink-2)',
              lineHeight: 1.7,
              marginBottom: 14,
            }}>
              💡 الدفع <strong>كاش</strong> في موعد الزيارة. لن نطلب أي مبلغ مسبقاً.
            </div>
          </div>
        )}

        {/* Sticky bottom button */}
        <div style={{
          position: 'fixed',
          bottom: 64,
          insetInline: 0,
          maxWidth: 480,
          margin: '0 auto',
          padding: 16,
          background: 'linear-gradient(to top, var(--paper) 70%, transparent)',
        }}>
          <button
            type="button"
            onClick={step === 'confirm' ? handleSubmit : nextStep}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: 14,
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 14,
              cursor: isSubmitting ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(15, 107, 88, 0.3)',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                جاري الحجز...
              </>
            ) : step === 'confirm' ? (
              <>
                <CheckCircle2 size={16} />
                تأكيد الحجز
              </>
            ) : (
              <>
                التالي
                <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
              </>
            )}
          </button>

          {/* WhatsApp alternative */}
          {step === 'details' && provider.whatsapp && (
            <a
              href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`السلام عليكم - أود حجز موعد ${serviceLabel} عبر Spir Medical`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => haptic.light()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 8,
                padding: 10,
                background: 'var(--white)',
                color: 'var(--emerald)',
                border: '1px solid var(--emerald)',
                borderRadius: 12,
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <MessageCircle size={14} />
              أو احجز مباشرة عبر WhatsApp
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────
function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 800,
      color: 'var(--ink-2)',
      marginBottom: 6,
      ...style,
    }}>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: 12,
      gap: 12,
    }}>
      <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>{label}:</span>
      <span style={{ color: 'var(--ink-2)', fontWeight: 700, textAlign: 'end' }}>{value}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  background: 'var(--white)',
};
