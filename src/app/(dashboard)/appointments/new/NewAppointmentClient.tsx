'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppointmentWizard from '@/components/appointments/AppointmentWizard';
import BloodDrawFlow, { type BloodDrawSubmission } from '@/components/appointments/BloodDrawFlow';
import { SERVICES } from '@/lib/services/services-data';
import { BLOOD_TESTS } from '@/lib/services/blood-tests-data';
import { ALL_LABS } from '@/lib/services/labs-data';
import { createAppointmentV2 } from './actions';
import { FlaskConical, AlertTriangle, Briefcase, MessageCircle } from 'lucide-react';

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
  const bloodDrawService = SERVICES.find((s) => s.id === 'blood-draw')!;

  // ─── Handler لـ BloodDrawFlow (الواجهة الجديدة الكاملة) ───
  async function handleBloodDrawSubmit(data: BloodDrawSubmission) {
    setError(null);

    // بناء نص ملاحظات منظّم وقابل للقراءة
    const lab = ALL_LABS.find((l) => l.id === data.labId);
    const testsList = data.testIds
      .map((id) => {
        const t = BLOOD_TESTS.find((bt) => bt.id === id);
        return t ? `• ${t.nameAr} (${t.code})` : '';
      })
      .filter(Boolean)
      .join('\n');

    const noteParts: string[] = [
      '═══════ تفاصيل الطلب ═══════',
      `[التحاليل المطلوبة]\n${testsList}`,
      `[المختبر] ${lab?.nameAr || 'لم يُحدّد'}`,
    ];

    if (data.patientAge) noteParts.push(`[العمر] ${data.patientAge} سنة`);
    if (data.patientGender) {
      noteParts.push(`[الجنس] ${data.patientGender === 'male' ? 'ذكر' : 'أنثى'}`);
    }
    if (data.patientCondition) noteParts.push(`[الحالة] ${data.patientCondition}`);
    if (data.needsFasting) {
      noteParts.push(`[تنبيه] صيام ${data.fastingHours} ساعة قبل سحب الدم`);
    }
    noteParts.push(`[وقت النتيجة] ${data.resultTime}`);

    const combinedNotes = noteParts.join('\n\n');

    const result = await createAppointmentV2({
      service_id: 'blood-draw',
      service_name: bloodDrawService.nameAr,
      scheduled_at: data.scheduledAt,
      address: data.address,
      notes: combinedNotes,

      duration: bloodDrawService.duration,
      needs_address: true,
      otp_channel: 'whatsapp',
      otp_verified: true, // المستخدم مسجّل دخول = متحقَّق منه
      // ✨ V25: تمرير GPS coordinates لو التقطها المستخدم
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      location_accuracy_m: data.location_accuracy_m,
    });

    if (result.success) {
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
      ) : (
        <AppointmentWizard
          userPhone={userPhone}
          onSubmit={handleGenericSubmit as never}
        />
      )}
    </div>
  );
}
