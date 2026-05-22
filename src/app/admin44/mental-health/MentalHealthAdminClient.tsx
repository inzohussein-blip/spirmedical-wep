'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Shield } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { useConfirm } from '@/components/ui';
import {
  createMentalSpecialist,
  updateMentalSpecialist,
  deleteMentalSpecialist,
  toggleMentalActive,
  toggleMentalVerified,
} from './actions';

interface Specialist {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  bio: string | null;
  years_experience: number;
  specialist_type: 'psychiatrist' | 'psychologist' | 'therapist' | 'counselor' | 'family_therapist';
  specialties: string[];
  languages: string[];
  cities: string[];
  available_online: boolean;
  available_in_clinic: boolean;
  online_session_price: number;
  clinic_session_price: number;
  session_duration_minutes: number;
  rating_avg: number;
  rating_count: number;
  total_sessions: number;
  is_active: boolean;
  is_verified: boolean;
  accepts_emergency: boolean;
}

const TYPE_LABELS = {
  psychiatrist: 'طبيب نفسي',
  psychologist: 'أخصائي نفسي',
  therapist: 'معالج نفسي',
  counselor: 'مرشد نفسي',
  family_therapist: 'معالج عائلي',
};

const EMPTY: Partial<Specialist> = {
  full_name: '',
  title: 'د.',
  gender: 'male',
  bio: '',
  years_experience: 5,
  specialist_type: 'psychologist',
  specialties: [],
  languages: ['ar'],
  cities: ['بغداد'],
  available_online: true,
  available_in_clinic: true,
  online_session_price: 50000,
  clinic_session_price: 75000,
  session_duration_minutes: 50,
  is_active: true,
  is_verified: false,
  accepts_emergency: false,
};

export default function MentalHealthAdminClient({ initialSpecialists }: { initialSpecialists: Specialist[] }) {
  const [list] = useState(initialSpecialists);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();
  const { confirm, ConfirmDialog } = useConfirm();

  const filtered = list.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'حذف الاختصاصي',
      message: `هل تريد حذف "${name}" نهائياً؟ لا يمكن التراجع.`,
      variant: 'danger',
      confirmText: 'احذف نهائياً',
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteMentalSpecialist(id);
      if (r.ok) { toast.success('تم'); window.location.reload(); }
      else toast.error(r.error || 'فشل');
    });
  };

  return (
    <div>
      <ConfirmDialog />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="الإجمالي" value={list.length} color="var(--ink-2)" />
        <StatCard label="نشطون" value={list.filter(s => s.is_active).length} color="var(--emerald)" />
        <StatCard label="موثّقون" value={list.filter(s => s.is_verified).length} color="#3B82F6" />
        <StatCard label="طوارئ" value={list.filter(s => s.accepts_emergency).length} color="var(--rose)" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--ink-3)" />
          <input type="search" placeholder="ابحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit' }} />
        </div>
        <button type="button" onClick={() => setShowCreate(true)} style={{ padding: '10px 16px', background: 'var(--emerald)', color: 'var(--paper-3)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />إضافة أخصائي
        </button>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--paper-3)' }}>
              <th style={thStyle}>الاسم</th>
              <th style={thStyle}>التخصّص</th>
              <th style={thStyle}>الخبرة</th>
              <th style={thStyle}>المدن</th>
              <th style={thStyle}>أسعار</th>
              <th style={thStyle}>الجلسات</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{s.title} {s.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.gender === 'female' ? 'أنثى' : 'ذكر'}</div>
                </td>
                <td style={tdStyle}><Badge>{TYPE_LABELS[s.specialist_type]}</Badge></td>
                <td style={tdStyle}>{s.years_experience} سنة</td>
                <td style={tdStyle}>{s.cities.slice(0, 2).join(', ')}{s.cities.length > 2 && `+${s.cities.length - 2}`}</td>
                <td style={tdStyle}>
                  {s.available_online && <div style={{ fontSize: 10 }}>💻 {s.online_session_price.toLocaleString('ar-IQ')}</div>}
                  {s.available_in_clinic && <div style={{ fontSize: 10 }}>🏢 {s.clinic_session_price.toLocaleString('ar-IQ')}</div>}
                </td>
                <td style={tdStyle}>{s.total_sessions}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.is_active ? <CheckCircle2 size={14} color="var(--emerald)" /> : <XCircle size={14} color="var(--ink-3)" />}
                    {s.is_verified && <Shield size={14} color="#3B82F6" />}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <IconButton onClick={() => startTransition(async () => { await toggleMentalVerified(s.id, !s.is_verified); window.location.reload(); })} title="توثيق" color={s.is_verified ? '#3B82F6' : 'var(--ink-3)'}>
                      <Shield size={14} />
                    </IconButton>
                    <IconButton onClick={() => startTransition(async () => { await toggleMentalActive(s.id, !s.is_active); window.location.reload(); })} title={s.is_active ? 'إيقاف' : 'تفعيل'} color={s.is_active ? 'var(--emerald)' : 'var(--ink-3)'}>
                      {s.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </IconButton>
                    <IconButton onClick={() => setEditingId(s.id)} title="تعديل" color="#3B82F6">
                      <Edit size={14} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(s.id, s.full_name)} title="حذف" color="var(--rose)">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>🧠 لا يوجد أخصائيون</div>}
      </div>

      {(showCreate || editingId) && (
        <SpecialistModal
          specialist={editingId ? list.find((s) => s.id === editingId) || null : null}
          onClose={() => { setShowCreate(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

function SpecialistModal({ specialist, onClose }: { specialist: Specialist | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Specialist>>(specialist || EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [specialtiesText, setSpecialtiesText] = useState((specialist?.specialties || []).join(', '));
  const [citiesText, setCitiesText] = useState((specialist?.cities || ['بغداد']).join(', '));

  const handleSubmit = async () => {
    if (!form.full_name) { toast.error('الاسم مطلوب'); return; }
    setIsSaving(true);
    const input = {
      ...form,
      specialties: specialtiesText.split(',').map(s => s.trim()).filter(Boolean),
      cities: citiesText.split(',').map(c => c.trim()).filter(Boolean),
    };
    const result = specialist ? await updateMentalSpecialist(specialist.id, input) : await createMentalSpecialist(input);
    if (result.ok) { toast.success(specialist ? 'تم التحديث' : 'تم الإضافة'); window.location.reload(); }
    else { toast.error(result.error || 'فشلت العملية'); setIsSaving(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
          {specialist ? '✏️ تعديل أخصائي' : '➕ إضافة أخصائي'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
            <Field label="اللقب">
              <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle}>
                <option value="د.">د.</option>
                <option value="أ.">أ.</option>
                <option value="أ.د.">أ.د.</option>
              </select>
            </Field>
            <Field label="الاسم *">
              <input type="text" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={inputStyle} />
            </Field>
          </div>

          <Field label="السيرة الذاتية">
            <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="النوع">
              <select value={form.specialist_type} onChange={(e) => setForm({ ...form, specialist_type: e.target.value as Specialist['specialist_type'] })} style={inputStyle}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="الجنس">
              <select value={form.gender || 'male'} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} style={inputStyle}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="سنوات الخبرة">
              <input type="number" value={form.years_experience || 0} onChange={(e) => setForm({ ...form, years_experience: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </Field>
            <Field label="مدة الجلسة (دقيقة)">
              <input type="number" value={form.session_duration_minutes || 50} onChange={(e) => setForm({ ...form, session_duration_minutes: parseInt(e.target.value) || 50 })} style={inputStyle} />
            </Field>
          </div>

          <Field label="التخصّصات (مفصولة بفاصلة)">
            <input type="text" value={specialtiesText} onChange={(e) => setSpecialtiesText(e.target.value)} placeholder="anxiety, depression, trauma" style={inputStyle} />
          </Field>

          <Field label="المدن (مفصولة بفاصلة)">
            <input type="text" value={citiesText} onChange={(e) => setCitiesText(e.target.value)} placeholder="بغداد, البصرة" style={inputStyle} />
          </Field>

          <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💰 الأسعار (د.ع)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="جلسة أونلاين">
                <input type="number" value={form.online_session_price || 0} onChange={(e) => setForm({ ...form, online_session_price: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
              <Field label="جلسة عيادة">
                <input type="number" value={form.clinic_session_price || 0} onChange={(e) => setForm({ ...form, clinic_session_price: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.available_online ?? true} onChange={(e) => setForm({ ...form, available_online: e.target.checked })} />
              💻 أونلاين
            </label>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.available_in_clinic ?? true} onChange={(e) => setForm({ ...form, available_in_clinic: e.target.checked })} />
              🏢 عيادة
            </label>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.accepts_emergency ?? false} onChange={(e) => setForm({ ...form, accepts_emergency: e.target.checked })} />
              🚨 طوارئ
            </label>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              نشط
            </label>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.is_verified ?? false} onChange={(e) => setForm({ ...form, is_verified: e.target.checked })} />
              موثّق ✓
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={isSaving} style={{ padding: '10px 18px', background: 'var(--white)', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>إلغاء</button>
          <button type="button" onClick={handleSubmit} disabled={isSaving} style={{ padding: '10px 18px', background: 'var(--emerald)', color: 'var(--paper-3)', border: 'none', borderRadius: 10, cursor: isSaving ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800 }}>
            {isSaving ? 'جاري...' : (specialist ? 'تحديث' : 'إضافة')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers (same as before) ────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
    <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{label}</div>
  </div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--emerald-soft)', color: 'var(--emerald)', borderRadius: 100, fontWeight: 700 }}>{children}</span>;
}

function IconButton({ children, onClick, title, color }: { children: React.ReactNode; onClick: () => void; title: string; color: string }) {
  return <button type="button" onClick={onClick} title={title} style={{ width: 28, height: 28, background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--ink-2)' }}>{label}</label>{children}</div>;
}

const thStyle: React.CSSProperties = { padding: '12px 10px', textAlign: 'start', fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', borderBottom: '1px solid var(--line)' };
const tdStyle: React.CSSProperties = { padding: '12px 10px', fontSize: 12, color: 'var(--ink-2)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--white)' };
const checkboxLabelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' };
const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 100 };
const modalContent: React.CSSProperties = { background: 'var(--paper)', borderRadius: 16, padding: 20, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' };
