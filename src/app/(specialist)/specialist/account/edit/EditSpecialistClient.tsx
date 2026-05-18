'use client';

import { useState, useTransition } from 'react';
import { updateSpecialistProfile } from './actions';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const GOVERNORATES = [
  'بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف', 'كربلاء',
  'السليمانية', 'كركوك', 'دهوك', 'ديالى', 'الأنبار', 'صلاح الدين',
  'بابل', 'القادسية', 'واسط', 'المثنى', 'ميسان', 'ذي قار',
];

interface Props {
  initialFullName: string;
  initialPhone: string;
  initialEmail: string;
  initialGovernorate: string;
  initialBio: string;
  initialYearsExp: number | null;
}

export default function EditSpecialistClient({
  initialFullName, initialPhone, initialEmail, initialGovernorate, initialBio, initialYearsExp,
}: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [governorate, setGovernorate] = useState(initialGovernorate);
  const [email, setEmail] = useState(initialEmail);
  const [bio, setBio] = useState(initialBio);
  const [yearsExp, setYearsExp] = useState<string>(initialYearsExp?.toString() ?? '');

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    setError('');
    setSuccess(false);
    startTransition(async () => {
      const result = await updateSpecialistProfile({
        full_name: fullName,
        governorate,
        email: email || undefined,
        specialist_bio: bio || undefined,
        specialist_years_exp: yearsExp ? parseInt(yearsExp) : undefined,
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
      <div className="auth-field">
        <label className="auth-field-label">الاسم الكامل *</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="auth-input" required minLength={2} />
      </div>

      <div className="auth-field">
        <label className="auth-field-label">رقم الهاتف</label>
        <input type="tel" value={initialPhone} className="auth-input" disabled />
        <div className="auth-field-hint">لا يمكن تغيير الرقم. تواصل مع الدعم.</div>
      </div>

      <div className="auth-field">
        <label className="auth-field-label">المحافظة *</label>
        <select value={governorate} onChange={(e) => setGovernorate(e.target.value)} className="auth-input">
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div className="auth-field">
        <label className="auth-field-label">البريد الإلكتروني (اختياري)</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="auth-input" />
      </div>

      <div className="auth-field">
        <label className="auth-field-label">سنوات الخبرة</label>
        <input type="number" min="0" max="60" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="5" className="auth-input" />
      </div>

      <div className="auth-field">
        <label className="auth-field-label">السيرة الذاتية</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="نبذة قصيرة عنك، خبراتك، اختصاصاتك الفرعية..."
          rows={4}
          className="auth-input"
          style={{ resize: 'vertical' }}
        />
        <div className="auth-field-hint">يظهر للمرضى عند الحجز</div>
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

      <button type="submit" className="auth-cta" disabled={isPending}>
        {isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
      </button>
    </form>
  );
}
