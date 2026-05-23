'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Building2, Calendar, Clock, AlertTriangle, CheckCircle2, Stethoscope,
} from 'lucide-react';
import { createServiceBooking } from '@/app/(dashboard)/services/booking/actions';

interface Hospital {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  departments?: string[] | null;
}

interface Props {
  hospital: Hospital;
  onClose: () => void;
  userPhone?: string;
}

/**
 * ════════════════════════════════════════════════════════════════════
 * 🏥 V25.47: HospitalBookingModal
 * ════════════════════════════════════════════════════════════════════
 */

// أقسام المستشفى الشائعة (لو الـ hospital ما عنده departments محددة)
const DEFAULT_DEPARTMENTS = [
  'العيادات الخارجية',
  'الطوارئ',
  'باطنية',
  'جراحة عامة',
  'أطفال',
  'نسائية وتوليد',
  'قلبية',
  'عظام',
  'جلدية',
  'أعصاب',
  'أنف وأذن وحنجرة',
  'عيون',
];

export default function HospitalBookingModal({ hospital, onClose, userPhone }: Props) {
  const router = useRouter();
  const [department, setDepartment] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const departments = hospital.departments && hospital.departments.length > 0
    ? hospital.departments
    : DEFAULT_DEPARTMENTS;

  function handleSubmit() {
    setError(null);

    if (!department) {
      setError('يرجى اختيار القسم');
      return;
    }
    if (!scheduledDate || !scheduledTime) {
      setError('يرجى اختيار التاريخ والوقت');
      return;
    }
    if (!reason || reason.length < 5) {
      setError('يرجى إدخال سبب الزيارة');
      return;
    }

    const scheduled_at = `${scheduledDate}T${scheduledTime}:00`;
    const combinedNotes = [
      `سبب الزيارة: ${reason}`,
      notes ? `ملاحظات: ${notes}` : '',
    ].filter(Boolean).join('\n');

    startTransition(async () => {
      const result = await createServiceBooking({
        service_type: 'hospital',
        provider_id: hospital.id,
        provider_name: hospital.name,
        scheduled_at,
        user_phone: userPhone || '',
        notes: combinedNotes,
        hospital_department: department,
        address: `${hospital.name} - ${hospital.city}${hospital.district ? ' - ' + hospital.district : ''}`,
      });

      if (result.ok) {
        router.push(`/appointments/${result.appointmentId}?new=1`);
      } else {
        setError(result.error || 'حدث خطأ');
      }
    });
  }

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--white)',
          borderRadius: 16,
          padding: 20,
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              حجز موعد
            </h2>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              <Building2 size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
              {hospital.name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <X size={22} strokeWidth={2.2} />
          </button>
        </div>

        {/* القسم */}
        <div style={{ marginBottom: 14 }}>
          <label style={inputLabelStyle}>
            <Stethoscope size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
            القسم *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
            {departments.map((dept) => {
              const selected = department === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setDepartment(dept)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selected ? '#0F6E56' : 'var(--line)',
                    background: selected ? '#0F6E56' : 'var(--white)',
                    color: selected ? 'white' : 'var(--ink-2)',
                    cursor: 'pointer',
                  }}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>

        {/* التاريخ والوقت */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={inputLabelStyle}>
              <Calendar size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
              التاريخ *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDate}
              max={maxDate}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={inputLabelStyle}>
              <Clock size={11} strokeWidth={2.2} style={{ verticalAlign: -2, marginLeft: 4 }} aria-hidden />
              الوقت *
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min="08:00"
              max="20:00"
              style={inputStyle}
            />
          </div>
        </div>

        {/* سبب الزيارة */}
        <div style={{ marginBottom: 12 }}>
          <label style={inputLabelStyle}>سبب الزيارة *</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: متابعة دورية، استشارة، عملية"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        {/* ملاحظات */}
        <div style={{ marginBottom: 16 }}>
          <label style={inputLabelStyle}>ملاحظات إضافية (اختياري)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="معلومات إضافية..."
            rows={2}
            maxLength={500}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        {/* Info banner */}
        <div style={{
          padding: '10px 14px',
          background: '#E1F5EE',
          color: '#04342C',
          borderRadius: 10,
          fontSize: 11,
          marginBottom: 14,
          lineHeight: 1.6,
        }}>
          📋 سيتم التأكد من الموعد بالاتصال من المستشفى خلال 24 ساعة
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: '#FCEBEB',
            color: '#791F1F',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <AlertTriangle size={14} strokeWidth={2.5} />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          style={{
            width: '100%',
            padding: 14,
            background: '#0F6E56',
            color: 'white',
            border: 0,
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isPending ? 'جارٍ الحجز...' : (
            <>
              <CheckCircle2 size={18} strokeWidth={2.5} />
              تأكيد الحجز
            </>
          )}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
};

const inputLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--ink-2)',
  display: 'block',
  marginBottom: 6,
};
