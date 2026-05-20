'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Edit3, Trash2, CheckCircle2, XCircle, Save, X,
  Loader2, Filter, Star, MapPin, Award, Eye, EyeOff,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import {
  createDoctor, updateDoctor, deleteDoctor, toggleDoctorActive, verifyDoctor,
} from './actions';

interface Doctor {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  specialty: string;
  sub_specialty: string | null;
  years_experience: number;
  home_visit_price: number;
  video_consult_price: number;
  monthly_subscription_price: number | null;
  yearly_subscription_price: number | null;
  clinic_city: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  bio: string | null;
  languages: string[];
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  is_verified: boolean;
  available_for_home_visit: boolean;
  available_for_video: boolean;
  available_for_clinic: boolean;
  qualifications: string[] | null;
  avatar_url: string | null;
  created_at: string;
}

interface Props {
  doctors: Doctor[];
}

const SPECIALTIES = [
  { id: 'family_medicine', label: 'طب عائلة', emoji: '👨‍👩‍👧‍👦' },
  { id: 'pediatrics', label: 'أطفال', emoji: '👶' },
  { id: 'internal', label: 'باطنية', emoji: '🩺' },
  { id: 'cardiology', label: 'قلبية', emoji: '❤️' },
  { id: 'gynecology', label: 'نسائية', emoji: '👩' },
  { id: 'orthopedics', label: 'عظام', emoji: '🦴' },
  { id: 'dermatology', label: 'جلدية', emoji: '🧴' },
  { id: 'psychiatry', label: 'نفسية', emoji: '🧠' },
  { id: 'general', label: 'طب عام', emoji: '⚕️' },
];

const CITIES = ['بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل', 'كركوك', 'بابل'];

export default function DoctorsAdminClient({ doctors }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'unverified'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch = !searchQuery ||
        d.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpec = !filterSpec || d.specialty === filterSpec;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && d.is_active) ||
        (filterStatus === 'inactive' && !d.is_active) ||
        (filterStatus === 'unverified' && !d.is_verified);
      return matchesSearch && matchesSpec && matchesStatus;
    });
  }, [doctors, searchQuery, filterSpec, filterStatus]);

  const handleDelete = (d: Doctor) => {
    if (!confirm(`حذف "${d.title} ${d.full_name}" نهائياً؟`)) return;
    startTransition(async () => {
      const result = await deleteDoctor(d.id);
      if (result.success) {
        toast.success('تم الحذف');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  const handleToggleActive = (d: Doctor) => {
    startTransition(async () => {
      const result = await toggleDoctorActive(d.id, !d.is_active);
      if (result.success) {
        toast.success(d.is_active ? 'تم الإيقاف' : 'تم التفعيل');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  const handleVerify = (d: Doctor) => {
    startTransition(async () => {
      const result = await verifyDoctor(d.id);
      if (result.success) {
        toast.success('تم التوثيق');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  return (
    <div>
      {/* Add button + filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowModal(true); }}
          style={{
            padding: '10px 16px',
            background: 'var(--emerald)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} />
          إضافة طبيب
        </button>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: 12, top: 12, color: 'var(--ink-3)' }} />
          <input
            type="search"
            placeholder="ابحث عن طبيب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              border: '1px solid var(--line)',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <select
          value={filterSpec}
          onChange={(e) => setFilterSpec(e.target.value)}
          style={selectStyle}
        >
          <option value="">كل التخصصات</option>
          {SPECIALTIES.map((s) => (
            <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          style={selectStyle}
        >
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">معطّل</option>
          <option value="unverified">غير موثّق</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {doctors.length === 0 ? 'لم يُسجّل أطباء بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--paper-3)' }}>
                <th style={thStyle}>الطبيب</th>
                <th style={thStyle}>التخصص</th>
                <th style={thStyle}>المدينة</th>
                <th style={thStyle}>الزيارة</th>
                <th style={thStyle}>الاشتراك</th>
                <th style={thStyle}>تقييم</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const specMeta = SPECIALTIES.find((s) => s.id === d.specialty);
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: d.gender === 'female' ? '#FDE7E9' : 'var(--emerald-soft)',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {d.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800 }}>
                            {d.title} {d.full_name}
                            {d.is_verified && <CheckCircle2 size={11} color="var(--emerald)" style={{ marginInlineStart: 4 }} />}
                          </div>
                          {d.years_experience > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                              {d.years_experience} سنة خبرة
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {specMeta?.emoji} {specMeta?.label || d.specialty}
                    </td>
                    <td style={tdStyle}>
                      {d.clinic_city || '—'}
                    </td>
                    <td style={tdStyle}>
                      {d.home_visit_price ? `${d.home_visit_price.toLocaleString('ar-IQ')} د.ع` : '—'}
                    </td>
                    <td style={tdStyle}>
                      {d.monthly_subscription_price
                        ? `${d.monthly_subscription_price.toLocaleString('ar-IQ')}/شهر`
                        : '—'}
                    </td>
                    <td style={tdStyle}>
                      {d.rating_count > 0 ? (
                        <span>⭐ {d.rating_avg.toFixed(1)} ({d.rating_count})</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          padding: '2px 8px',
                          background: d.is_active ? 'var(--emerald-soft)' : 'var(--rose-soft)',
                          color: d.is_active ? 'var(--emerald)' : 'var(--rose)',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        {d.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => { setEditing(d); setShowModal(true); }}
                          aria-label="تعديل"
                          style={iconBtnStyle()}
                        >
                          <Edit3 size={12} />
                        </button>
                        {!d.is_verified && (
                          <button
                            type="button"
                            onClick={() => handleVerify(d)}
                            disabled={isPending}
                            aria-label="توثيق"
                            style={{ ...iconBtnStyle(), background: 'var(--emerald-soft)', color: 'var(--emerald)' }}
                            title="توثيق"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(d)}
                          disabled={isPending}
                          aria-label={d.is_active ? 'إيقاف' : 'تفعيل'}
                          style={iconBtnStyle()}
                          title={d.is_active ? 'إيقاف' : 'تفعيل'}
                        >
                          {d.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          disabled={isPending}
                          aria-label="حذف"
                          style={{ ...iconBtnStyle(), background: 'var(--rose-soft)', color: 'var(--rose)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <DoctorModal
          editing={editing}
          isPending={isPending}
          startTransition={startTransition}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px',
  textAlign: 'start',
  fontWeight: 800,
  fontSize: 11,
  color: 'var(--ink-3)',
  borderBottom: '1px solid var(--line)',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  verticalAlign: 'middle',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'inherit',
  background: 'var(--white)',
};

function iconBtnStyle(): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    background: 'var(--paper-3)',
    color: 'var(--ink-2)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

// ═══════════════════════════════════════════════════════════════
// Modal
// ═══════════════════════════════════════════════════════════════
function DoctorModal({
  editing,
  isPending,
  startTransition,
  onClose,
  onSaved,
}: {
  editing: Doctor | null;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(editing?.full_name ?? '');
  const [title, setTitle] = useState(editing?.title ?? 'د.');
  const [gender, setGender] = useState<'male' | 'female' | ''>(editing?.gender ?? '');
  const [specialty, setSpecialty] = useState(editing?.specialty ?? 'family_medicine');
  const [subSpecialty, setSubSpecialty] = useState(editing?.sub_specialty ?? '');
  const [years, setYears] = useState(editing?.years_experience?.toString() ?? '0');
  const [city, setCity] = useState(editing?.clinic_city ?? '');
  const [address, setAddress] = useState(editing?.clinic_address ?? '');
  const [phone, setPhone] = useState(editing?.clinic_phone ?? '');
  const [bio, setBio] = useState(editing?.bio ?? '');
  const [qualifications, setQualifications] = useState(editing?.qualifications?.join('\n') ?? '');
  const [languages, setLanguages] = useState(editing?.languages?.join(',') ?? 'ar');
  const [homePrice, setHomePrice] = useState(editing?.home_visit_price?.toString() ?? '0');
  const [videoPrice, setVideoPrice] = useState(editing?.video_consult_price?.toString() ?? '0');
  const [monthlyPrice, setMonthlyPrice] = useState(editing?.monthly_subscription_price?.toString() ?? '');
  const [yearlyPrice, setYearlyPrice] = useState(editing?.yearly_subscription_price?.toString() ?? '');
  const [availableHome, setAvailableHome] = useState(editing?.available_for_home_visit ?? true);
  const [availableVideo, setAvailableVideo] = useState(editing?.available_for_video ?? true);

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }

    startTransition(async () => {
      const data = {
        full_name: fullName.trim(),
        title,
        gender: gender || null,
        specialty,
        sub_specialty: subSpecialty.trim() || null,
        years_experience: parseInt(years) || 0,
        clinic_city: city || null,
        clinic_address: address.trim() || null,
        clinic_phone: phone.trim() || null,
        bio: bio.trim() || null,
        qualifications: qualifications.split('\n').map(s => s.trim()).filter(Boolean),
        languages: languages.split(',').map(s => s.trim()).filter(Boolean),
        home_visit_price: parseFloat(homePrice) || 0,
        video_consult_price: parseFloat(videoPrice) || 0,
        monthly_subscription_price: monthlyPrice ? parseFloat(monthlyPrice) : null,
        yearly_subscription_price: yearlyPrice ? parseFloat(yearlyPrice) : null,
        available_for_home_visit: availableHome,
        available_for_video: availableVideo,
      };

      const result = editing
        ? await updateDoctor(editing.id, data)
        : await createDoctor(data);

      if (result.success) {
        toast.success(editing ? 'تم التحديث' : 'تمت الإضافة');
        onSaved();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: 20,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          width: '100%',
          maxWidth: 600,
          borderRadius: 14,
          padding: 20,
          marginTop: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>
            {editing ? 'تعديل طبيب' : 'إضافة طبيب جديد'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 32,
              height: 32,
              background: 'var(--paper-3)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="اللقب">
            <select value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle}>
              <option value="د.">د.</option>
              <option value="أ.د.">أ.د.</option>
              <option value="بروفيسور">بروفيسور</option>
            </select>
          </Field>
          <Field label="الاسم الكامل *">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="أحمد علي حسين"
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="الجنس">
            <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female' | '')} style={inputStyle}>
              <option value="">—</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </Field>
          <Field label="سنوات الخبرة">
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="التخصص *">
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={inputStyle}>
              {SPECIALTIES.map((s) => (
                <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="التخصص الدقيق">
            <input
              type="text"
              value={subSpecialty}
              onChange={(e) => setSubSpecialty(e.target.value)}
              placeholder="مثلاً: أعصاب الأطفال"
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="المدينة">
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              <option value="">—</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="الهاتف">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXXX"
              style={inputStyle}
            />
          </Field>
          <Field label="اللغات (مفصولة بـ,)">
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="ar,en,ku"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="عنوان العيادة">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="منطقة الكرادة، شارع 62"
            style={inputStyle}
          />
        </Field>

        <Field label="نبذة">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            placeholder="نبذة قصيرة عن الطبيب"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <Field label="المؤهلات (كل واحد في سطر)">
          <textarea
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            rows={3}
            placeholder={'بكالوريوس طب جامعة بغداد 2010\nبورد عربي طب عائلة 2015'}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <div style={{ marginTop: 14, padding: 12, background: 'var(--paper-3)', borderRadius: 10 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>💰 الأسعار (د.ع)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="زيارة منزلية">
              <input
                type="number"
                value={homePrice}
                onChange={(e) => setHomePrice(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="استشارة">
              <input
                type="number"
                value={videoPrice}
                onChange={(e) => setVideoPrice(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="اشتراك شهري">
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="فارغ = لا اشتراك"
                style={inputStyle}
              />
            </Field>
            <Field label="اشتراك سنوي">
              <input
                type="number"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                placeholder="فارغ = لا اشتراك"
                style={inputStyle}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={availableHome}
              onChange={(e) => setAvailableHome(e.target.checked)}
            />
            متاح للزيارات
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={availableVideo}
              onChange={(e) => setAvailableVideo(e.target.checked)}
            />
            متاح للاستشارات
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: 12,
              background: 'var(--paper-3)',
              color: 'var(--ink-2)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              flex: 2,
              padding: 12,
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 10,
              cursor: isPending ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editing ? 'حفظ التغييرات' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  background: 'var(--white)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
