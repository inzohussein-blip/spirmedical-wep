'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Home, Building2, Video, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createDoctorAppointment } from '@/app/(dashboard)/services/doctors/[id]/actions';
import HapticButton from '@/components/pwa/HapticButton';

interface Doctor {
  id: string;
  full_name: string;
  title: string;
  available_for_home_visit: boolean;
  available_for_clinic: boolean;
  available_for_video: boolean;
  home_visit_price: number;
  video_consult_price: number;
  clinic_name?: string | null;
  clinic_address?: string | null;
}

interface Props {
  doctor: Doctor;
  defaultType?: 'home_visit' | 'clinic_visit' | 'video' | 'follow_up';
  onClose: () => void;
  userAddress?: string;
}

const TYPE_META: Record<string, { label: string; icon: typeof Home; color: string; description: string }> = {
  home_visit: { 
    label: 'زيارة منزلية', 
    icon: Home, 
    color: '#0F6E56',
    description: 'الطبيب يزورك في منزلك',
  },
  clinic_visit: { 
    label: 'زيارة عيادة', 
    icon: Building2, 
    color: '#A57100',
    description: 'تزور الطبيب في عيادته',
  },
  video: { 
    label: 'استشارة فيديو', 
    icon: Video, 
    color: '#1D9E75',
    description: 'مكالمة فيديو عبر الإنترنت',
  },
  follow_up: { 
    label: 'متابعة', 
    icon: Calendar, 
    color: '#6B7280',
    description: 'متابعة موعد سابق',
  },
};

export default function DoctorBookingModal({ doctor, defaultType, onClose, userAddress }: Props) {
  const router = useRouter();
  const [type, setType] = useState<'home_visit' | 'clinic_visit' | 'video' | 'follow_up'>(
    defaultType || 
    (doctor.available_for_home_visit ? 'home_visit' :
     doctor.available_for_clinic ? 'clinic_visit' :
     doctor.available_for_video ? 'video' : 'follow_up')
  );
  
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [address, setAddress] = useState(userAddress || '');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // الأنواع المتاحة
  const availableTypes = [
    doctor.available_for_home_visit && 'home_visit',
    doctor.available_for_clinic && 'clinic_visit',
    doctor.available_for_video && 'video',
  ].filter(Boolean) as string[];

  // السعر
  const price = type === 'home_visit' ? doctor.home_visit_price :
                type === 'video' ? doctor.video_consult_price :
                type === 'clinic_visit' ? 25000 :
                10000;

  function handleSubmit() {
    setError(null);
    
    // Validation
    if (!scheduledDate || !scheduledTime) {
      setError('يرجى اختيار التاريخ والوقت');
      return;
    }
    
    if (!chiefComplaint || chiefComplaint.length < 5) {
      setError('يرجى إدخال سبب الزيارة');
      return;
    }
    
    if (type === 'home_visit' && (!address || address.length < 10)) {
      setError('يرجى إدخال عنوان مفصّل للزيارة المنزلية');
      return;
    }

    const scheduled_at = `${scheduledDate}T${scheduledTime}:00`;
    
    const medications = currentMedications
      .split('\n')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
    
    startTransition(async () => {
      const result = await createDoctorAppointment({
        doctor_id: doctor.id,
        appointment_type: type,
        scheduled_at,
        address: type === 'home_visit' ? address : undefined,
        chief_complaint: chiefComplaint,
        current_medications: medications.length > 0 ? medications : undefined,
        notes: notes || undefined,
      });
      
      if (result.success) {
        router.push(`/appointments/${result.appointment_id}?new=1`);
      } else {
        setError(result.error || 'حدث خطأ');
      }
    });
  }

  // التاريخ الأدنى = غداً
  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
              مع {doctor.title} {doctor.full_name}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <X size={22} strokeWidth={2.2} />
          </button>
        </div>

        {/* نوع الموعد */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
            نوع الموعد
          </label>
          <div style={{ display: 'grid', gap: 8 }}>
            {availableTypes.map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              const isSelected = type === t;
              const typePrice = t === 'home_visit' ? doctor.home_visit_price :
                                t === 'video' ? doctor.video_consult_price : 25000;
              
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t as 'home_visit' | 'clinic_visit' | 'video')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: isSelected ? meta.color : 'var(--white)',
                    color: isSelected ? 'white' : 'var(--ink)',
                    border: `2px solid ${isSelected ? meta.color : 'var(--line)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'right',
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} aria-hidden />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{meta.label}</div>
                    <div style={{ fontSize: 10, opacity: isSelected ? 0.9 : 0.6 }}>{meta.description}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>
                    {typePrice.toLocaleString('ar-IQ')} د.ع
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* التاريخ والوقت */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              التاريخ *
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={minDate}
              max={maxDate}
              style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              الوقت *
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min="08:00"
              max="22:00"
              style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* العنوان (للزيارة المنزلية) */}
        {type === 'home_visit' && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              العنوان المفصّل *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: بغداد، الكاظمية، شارع الإمام، عمارة 123، شقة 5"
              rows={2}
              style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        )}

        {/* سبب الزيارة */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
            سبب الزيارة *
          </label>
          <input
            type="text"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="مثال: ألم في الصدر، فحص دوري، استشارة"
            maxLength={200}
            style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>

        {/* الأدوية الحالية */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
            الأدوية الحالية (اختياري)
          </label>
          <textarea
            value={currentMedications}
            onChange={(e) => setCurrentMedications(e.target.value)}
            placeholder="اكتب كل دواء في سطر منفصل"
            rows={2}
            style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        {/* ملاحظات إضافية */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
            ملاحظات إضافية (اختياري)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي معلومة إضافية تريد الطبيب أن يعرفها"
            rows={2}
            maxLength={500}
            style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        {/* السعر النهائي */}
        <div style={{
          padding: 12,
          background: 'var(--paper-2)',
          borderRadius: 10,
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>
            السعر الإجمالي
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0F6E56' }}>
            {price.toLocaleString('ar-IQ')} د.ع
          </span>
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
        <HapticButton
          type="button"
          hapticStrength="success"
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
          {isPending ? (
            'جارٍ الحجز...'
          ) : (
            <>
              <CheckCircle2 size={18} strokeWidth={2.5} />
              تأكيد الحجز · {price.toLocaleString('ar-IQ')} د.ع
            </>
          )}
        </HapticButton>
      </div>
    </div>
  );
}
