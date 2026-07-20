'use client';

import { useState, useTransition } from 'react';
import { updateProfile } from './actions';
import { useFormErrors } from '@/lib/forms/useFormErrors';
import MissingFieldsSummary from '@/components/forms/MissingFieldsSummary';
import FieldError from '@/components/forms/FieldError';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const PROFILE_FIELD_LABELS: Record<string, string> = { fullName: 'الاسم الكامل' };

const GOVERNORATES = [
  'بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف', 'كربلاء',
  'السليمانية', 'كركوك', 'دهوك', 'ديالى', 'الأنبار', 'صلاح الدين',
  'بابل', 'القادسية', 'واسط', 'المثنى', 'ميسان', 'ذي قار',
];

interface Props {
  initialFullName: string;
  initialPhone: string;
  initialGovernorate: string;
  initialEmail: string;
}

export default function EditProfileClient({ initialFullName, initialPhone, initialGovernorate, initialEmail }: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [governorate, setGovernorate] = useState(initialGovernorate);
  const [email, setEmail] = useState(initialEmail);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fe = useFormErrors(['fullName']);

  function handleSubmit() {
    setError('');
    setSuccess(false);
    // ✨ تحقّق على مستوى الحقل
    if (fullName.trim().length < 2) {
      fe.setErrors({ fullName: 'أدخل الاسم الكامل (حرفان على الأقل)' });
      fe.focusFirst({ fullName: 'x' });
      return;
    }
    fe.clearAll();
    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName,
        governorate,
        email: email || undefined,
      });
      if (!result.ok) {
        setError(result.error || 'تعذّر حفظ التعديلات');
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={{ marginTop: 16 }}>
      <div className="auth-field" ref={fe.registerRef('fullName')}>
        <label className="auth-field-label">الاسم الكامل *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); fe.clearError('fullName'); }}
          className={`auth-input ${fe.hasError('fullName') ? 'error' : ''}`}
          aria-invalid={fe.hasError('fullName')}
          required
          minLength={2}
        />
        <FieldError message={fe.fieldErrors.fullName} />
      </div>

      <div className="auth-field">
        <label className="auth-field-label">رقم الهاتف</label>
        <input type="tel" value={initialPhone} className="auth-input" disabled />
        <div className="auth-field-hint">لا يمكن تغيير الرقم. تواصل مع الدعم.</div>
      </div>

      <div className="auth-field">
        <label className="auth-field-label">المحافظة *</label>
        <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="auth-input">
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="auth-field">
        <label className="auth-field-label">البريد الإلكتروني (اختياري)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="auth-input"
        />
      </div>

      {error && (
        <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} strokeWidth={2.4} />
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={14} strokeWidth={2.4} />
          تم حفظ التعديلات بنجاح
        </div>
      )}

      <MissingFieldsSummary
        fields={fe.missingFields}
        labels={PROFILE_FIELD_LABELS}
        errors={fe.fieldErrors}
        onJump={fe.jumpTo}
      />

      <button type="submit" className="auth-cta" disabled={isPending}>
        {isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </form>
  );
}
