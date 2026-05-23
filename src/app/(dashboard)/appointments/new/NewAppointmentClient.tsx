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
import { createAppointmentV2, createBloodDrawOrder } from './actions';
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
      partner_lab_id: null, // الـ static labs ليست في DB - سنُحدّث لاحقاً
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
    } else {
      setError(result.error || 'حدث خطأ');
    }
  }

  // ─── Handler لـ NursingFlow (V25.5) ───
  async function handleNursingSubmit(data: NursingSubmission) {
    setError(null);

    // بناء ملاحظات منظّمة تحتوي على كل التفاصيل
    const noteParts: string[] = [
      '═══════ تفاصيل خدمة التمريض ═══════',
      `[الإجراء] ${data.procedure_label}`,
      `[تفضيل الكادر] ${
        data.nurse_gender_preference === 'female' ? 'ممرضة (أنثى)' :
        data.nurse_gender_preference === 'male' ? 'ممرض (ذكر)' : 'لا فرق'
      }`,
    ];

    // التحسس الدوائي
    const allergyList: string[] = [];
    if (data.allergy_form.penicillin) allergyList.push('البنسلين');
    if (data.allergy_form.sulfa) allergyList.push('السلفا');
    if (data.allergy_form.aspirin) allergyList.push('الأسبرين');
    if (data.allergy_form.iodine) allergyList.push('اليود');
    if (data.allergy_form.latex) allergyList.push('اللاتكس');
    if (data.allergy_form.other) allergyList.push(data.allergy_form.other);

    if (allergyList.length > 0) {
      noteParts.push(`[⚠️ تحسسات دوائية] ${allergyList.join('، ')}`);
    } else {
      noteParts.push('[التحسس] لا توجد تحسسات معروفة');
    }

    // الوصفة
    if (data.prescription_skipped) {
      noteParts.push('[⚠️ الوصفة] لا توجد وصفة - سيراها الممرض في الموقع');
    } else if (data.prescription_image_url) {
      noteParts.push('[✓ الوصفة] تم رفعها بنجاح');
    }

    // الأمراض المعدية
    if (data.infectious_disease_alert) {
      const infList: string[] = [];
      if (data.infectious_disease_alert.hepatitis_b) infList.push('التهاب الكبد B');
      if (data.infectious_disease_alert.hepatitis_c) infList.push('التهاب الكبد C');
      if (data.infectious_disease_alert.hiv) infList.push('HIV');
      if (data.infectious_disease_alert.covid) infList.push('كوفيد-19');
      if (data.infectious_disease_alert.tb) infList.push('السل');
      if (data.infectious_disease_alert.other) infList.push(data.infectious_disease_alert.other);

      if (infList.length > 0) {
        noteParts.push(`[🦠 تنبيه عدوى] ${infList.join('، ')} - يلزم احتياطات الحماية`);
      }
    }

    // الجدولة الدورية
    if (data.recurring_schedule?.enabled) {
      noteParts.push(
        `[🔁 جدولة دورية] كل ${data.recurring_schedule.interval_hours} ساعة` +
        (data.recurring_schedule.end_date ? ` حتى ${data.recurring_schedule.end_date}` : '')
      );
    }

    // الملاحظات
    if (data.notes) {
      noteParts.push(`[ملاحظات] ${data.notes}`);
    }

    const combinedNotes = noteParts.join('\n');

    const result = await createAppointmentV2({
      service_id: 'home-nursing',
      service_name: `${nursingService.nameAr} - ${data.procedure_label}`,
      scheduled_at: data.scheduledAt,
      address: data.address,
      notes: combinedNotes,

      duration: nursingService.duration,
      needs_address: true,
      otp_channel: 'whatsapp',
      otp_verified: true,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      // ✨ V25.8: Family member
      family_member_id: data.family_member_id ?? null,
    });

    if (result.success) {
      track('booking_completed', {
        service_type: 'home-nursing',
        appointment_id: result.appointmentId,
        total_price: data.totalPrice,
        for_family_member: !!data.family_member_id,
      });
      router.push(`/appointments/${result.appointmentId}?new=1`);
    } else {
      setError(result.error || 'حدث خطأ');
    }
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
    } else {
      setError(result.error || 'حدث خطأ');
    }
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
