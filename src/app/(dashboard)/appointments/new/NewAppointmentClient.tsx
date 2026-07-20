'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppointmentWizard from '@/components/appointments/AppointmentWizard';
import BloodDrawFlow, { type BloodDrawSubmission } from '@/components/appointments/BloodDrawFlow';
import NursingFlow, { type NursingSubmission } from '@/components/appointments/NursingFlow';
import { SERVICES } from '@/lib/services/services-data';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import { ALL_LABS } from '@/lib/services/labs-data';
import { createAppointmentV2, createBloodDrawOrder, createNursingAppointment } from './actions';
import { track } from '@/lib/analytics';
import { FlaskConical, AlertTriangle, Briefcase, MessageCircle, Syringe } from 'lucide-react';

interface Props {
  service: string;
  userPhone: string;
  userAddress: string;
  clinicId?: string;
  consultationType?: string;
  /** ✨ V25.1: المواقع المحفوظة للمستخدم */
  savedLocations?: Array<{
    id: string;
    label: string;
    icon: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

export default function NewAppointmentClient({ service, userPhone, userAddress, clinicId, consultationType, savedLocations = [] }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const isBloodDrawFlow = service === 'blood-draw';
  const isNursingFlow = service === 'home-nursing';
  const bloodDrawService = SERVICES.find((s) => s.id === 'blood-draw')!;
  const nursingService = SERVICES.find((s) => s.id === 'home-nursing')!;

  // ─── Handler لـ BloodDrawFlow (الواجهة الجديدة الكاملة) ───
  async function handleBloodDrawSubmit(data: BloodDrawSubmission) {
    setError(null);

    // ─── V25.43: استخدام createBloodDrawOrder الجديد ───
    // بدل ما نحفظ كل البيانات في notes كنص، نستخدم structured columns
    // في جدول lab_orders + ربط مع appointments
    
    const lab = ALL_LABS.find((l) => l.id === data.labId);
    
    // notes اختياري - فقط معلومات المريض المهمّة
    const customNotes: string[] = [];
    if (data.patientCondition) {
      customNotes.push(`الحالة الطبية: ${data.patientCondition}`);
    }
    if (data.needsFasting) {
      customNotes.push(`⚠️ صيام ${data.fastingHours} ساعة قبل سحب الدم`);
    }

    const result = await createBloodDrawOrder({
      // البيانات الأساسية
      scheduled_at: data.scheduledAt,
      address: data.address,
      otp_channel: 'whatsapp',
      otp_verified: true,
      duration: bloodDrawService.duration,
      
      // التحاليل (structured)
      test_ids: data.testIds,
      bundle_id: data.bundleId,
      
      // المختبر (structured)
      partner_lab_id: null, // يُحلّ من الـ slug في الـ action (migration 47)
      lab_slug: data.labId, // 🆕 V31: slug للبحث عن المختبر الحقيقي
      lab_name_snapshot: lab?.nameAr || 'لم يُحدّد',
      
      // بيانات المريض (structured)
      patient_age: data.patientAge ? parseInt(data.patientAge) : undefined,
      patient_gender: data.patientGender || undefined,
      patient_condition: data.patientCondition || undefined,
      
      // الصيام
      needs_fasting: data.needsFasting,
      fasting_hours: data.fastingHours,
      
      // التسعير
      draw_fee: 15000,
      tests_total: data.totalPrice - 15000,
      discount: 0,
      total_price: data.totalPrice,
      
      // متوقع النتيجة (نُحسب من resultTime لاحقاً)
      expected_result_at: undefined,
      
      // اختياري
      family_member_id: data.family_member_id ?? null,
      notes: customNotes.length > 0 ? customNotes.join('\n') : undefined,
      
      // GPS
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      location_accuracy_m: data.location_accuracy_m,
    });

    if (result.success) {
      track('booking_completed', {
        service_type: 'blood-draw',
        appointment_id: result.appointment_id,
        lab_order_id: result.lab_order_id,
        total_price: data.totalPrice,
        test_count: data.testIds.length,
        for_family_member: !!data.family_member_id,
      });
      router.push(`/appointments/${result.appointment_id}?new=1`);
      return;
    }

    // فشل: banner عام + إرجاع أخطاء الحقول لتُبرز داخل النموذج
    setError(result.error || 'حدث خطأ');
    const fieldErrors = (result as { fieldErrors?: Record<string, string> }).fieldErrors;
    return { ok: false as const, error: result.error, fieldErrors };
  }

  // ─── Handler لـ NursingFlow (V25.5) ───
  async function handleNursingSubmit(data: NursingSubmission) {
    setError(null);

    // ─── V25.44: استخدام createNursingAppointment الجديد ───
    // يحفظ كل البيانات في columns بدلاً من text داخل notes
    
    const result = await createNursingAppointment({
      // الأساسيات
      scheduled_at: data.scheduledAt,
      address: data.address,
      otp_channel: 'whatsapp',
      otp_verified: true,
      duration: nursingService.duration,
      total_price: data.totalPrice,
      
      // إجراء التمريض (structured)
      procedure_type: data.procedure_type,
      procedure_label: data.procedure_label,
      
      // الكادر (structured)
      nurse_gender_preference: data.nurse_gender_preference || 'any',
      
      // التحسس (structured JSONB)
      allergy_form: data.allergy_form,
      
      // الوصفة (structured)
      prescription_image_url: data.prescription_image_url,
      prescription_skipped: data.prescription_skipped,
      
      // الأمراض المعدية (structured JSONB)
      infectious_disease_alert: data.infectious_disease_alert,
      
      // الجدولة الدورية (structured JSONB)
      recurring_schedule: data.recurring_schedule,
      
      // notes إضافية
      notes: data.notes,
      
      // family
      family_member_id: data.family_member_id ?? null,
      
      // GPS
      location_lat: data.location_lat,
      location_lng: data.location_lng,
    });

    if (result.success) {
      track('booking_completed', {
        service_type: 'home-nursing',
        appointment_id: result.appointment_id,
        procedure_type: data.procedure_type,
        total_price: data.totalPrice,
        for_family_member: !!data.family_member_id,
        has_recurring: !!data.recurring_schedule?.enabled,
      });
      router.push(`/appointments/${result.appointment_id}?new=1`);
      return;
    }

    // فشل: banner عام + إرجاع أخطاء الحقول لتُبرز داخل النموذج
    setError(result.error || 'حدث خطأ');
    const fieldErrors = (result as { fieldErrors?: Record<string, string> }).fieldErrors;
    return { ok: false as const, error: result.error, fieldErrors };
  }

  // ─── Handler للخدمات الأخرى (الـ wizard التقليدي) ───
  async function handleGenericSubmit(data: {
    service: { id: string; nameAr: string; basePrice: number; duration: number; needsAddress: boolean };
    slot: { id: string };
    address?: string;
    notes?: string;
  }) {
    if (!data.service || !data.slot) {
      setError('بيانات ناقصة');
      return;
    }

    const result = await createAppointmentV2({
      service_id: data.service.id,
      service_name: data.service.nameAr,
      scheduled_at: data.slot.id,
      address: data.service.needsAddress ? data.address : undefined,
      notes: data.notes || undefined,

      duration: data.service.duration,
      needs_address: data.service.needsAddress,
      otp_channel: 'whatsapp',
      otp_verified: true,
    });

    if (result.success) {
      router.push(`/appointments?new=${result.appointmentId}`);
      return;
    }

    // فشل: banner عام + إعادة تعيين مفاتيح أخطاء الخادم لمفاتيح حقول الـ wizard
    setError(result.error || 'حدث خطأ');
    const raw = (result as { fieldErrors?: Record<string, string> }).fieldErrors;
    let fieldErrors: Record<string, string> | undefined;
    if (raw) {
      fieldErrors = {};
      for (const [k, v] of Object.entries(raw)) {
        const mapped = k === 'service_type' ? 'service' : k === 'scheduled_at' ? 'slot' : k;
        fieldErrors[mapped] = v;
      }
    }
    return { ok: false as const, error: result.error, fieldErrors };
  }

  return (
    <div className="scr-content">
      {/* Back button (لأن الـ AppShell موجود فوق) */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--paper-2, #EDE6D3)',
            border: '1px solid var(--line)',
            borderRadius: '100px',
            padding: '6px 12px',
            fontSize: '12px',
            color: 'var(--ink-2)',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          <span>←</span><span>الرئيسية</span>
        </Link>
        <h1 style={{
          fontSize: '15px',
          fontWeight: 800,
          margin: 0,
          flex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {isBloodDrawFlow ? (
            <>
              <FlaskConical size={18} strokeWidth={1.9} style={{ color: 'var(--emerald)' }} />
              سحب دم + تحاليل
            </>
          ) : isNursingFlow ? (
            <>
              <Syringe size={18} strokeWidth={1.9} style={{ color: 'var(--emerald)' }} />
              التمريض المنزلي
            </>
          ) : 'حجز جديد'}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--rose-soft, #F0D7D8)',
          color: 'var(--rose, #A82E3D)',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <AlertTriangle size={14} strokeWidth={2.2} /><span>{error}</span>
        </div>
      )}

      {/* Clinic preselect banner */}
      {clinicId && (
        <div style={{
          background: 'var(--emerald-soft, #D9E5DF)',
          color: 'var(--emerald-deep, #073B30)',
          padding: '12px 14px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <Briefcase size={16} strokeWidth={2} />
          <span>تم اختيار العيادة (#{clinicId}). أكمل الحجز.</span>
        </div>
      )}

      {/* Consultation type banner */}
      {consultationType && (
        <div style={{
          background: 'var(--amber-soft, #F0DBC2)',
          color: '#6B3A08',
          padding: '12px 14px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '12px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <MessageCircle size={16} strokeWidth={2} />
          <span>نوع الاستشارة: {consultationType === 'general' ? 'عامة' : consultationType === 'my-doctor' ? 'طبيبي المختار' : consultationType === 'specialist' ? 'متخصصة' : consultationType === 'video' ? 'بالفيديو' : consultationType}</span>
        </div>
      )}

      {/* Content */}
      {isBloodDrawFlow ? (
        <BloodDrawFlow
          userPhone={userPhone}
          userAddress={userAddress}
          onSubmit={handleBloodDrawSubmit}
          savedLocations={savedLocations}
        />
      ) : isNursingFlow ? (
        <NursingFlow
          userPhone={userPhone}
          userAddress={userAddress}
          onSubmit={handleNursingSubmit}
          savedLocations={savedLocations}
        />
      ) : (
        <AppointmentWizard
          userPhone={userPhone}
          onSubmit={handleGenericSubmit as never}
        />
      )}
    </div>
  );
}
