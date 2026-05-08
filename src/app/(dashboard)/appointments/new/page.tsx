'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppointmentWizard from '@/components/appointments/AppointmentWizard';
import { createAppointmentV2 } from './actions';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: any) {
    if (!data.service || !data.slot) {
      setError('بيانات ناقصة');
      return;
    }

    const result = await createAppointmentV2({
      service_id: data.service.id,
      service_name: data.service.nameAr,
      scheduled_at: data.slot.id, // ISO date
      address: data.service.needsAddress ? data.address : undefined,
      notes: data.notes || undefined,
      estimated_price: data.service.basePrice,
      duration: data.service.duration,
      needs_address: data.service.needsAddress,
      otp_channel: 'whatsapp', // أو 'telegram' حسب اختيار المستخدم
      otp_verified: true, // تم التحقق في الخطوة ٤
    });

    if (result.success) {
      // عرض success animation ثم redirect
      router.push(`/appointments?new=${result.appointmentId}`);
    } else {
      setError(result.error || 'حدث خطأ');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper, #F4EFE2)', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--white, #FFFFFF)',
        borderBottom: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/appointments" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--paper-2, #EDE6D3)',
            border: '1px solid var(--line, rgba(15, 26, 28, 0.08))',
            borderRadius: '100px',
            padding: '7px 14px',
            fontSize: '13px',
            color: 'var(--ink-2, #1F2A2C)',
            textDecoration: 'none',
            fontWeight: 600,
          }}>
            <span>←</span><span>العودة</span>
          </Link>
          <h1 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
            حجز جديد
          </h1>
          <div style={{ width: '70px' }} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          maxWidth: '720px',
          margin: '16px auto 0',
          padding: '0 20px',
        }}>
          <div style={{
            background: 'var(--rose-soft, #F0D7D8)',
            color: 'var(--rose, #A82E3D)',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        </div>
      )}

      {/* Wizard */}
      <div style={{ padding: '20px' }}>
        <AppointmentWizard
          userPhone="" // مر userPhone من الـ session
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
