'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Shield, TrendingUp } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import AdminLocationPickerWrapper from '@/components/admin/AdminLocationPickerWrapper';
import {
  createNutritionist,
  updateNutritionist,
  deleteNutritionist,
  toggleNutritionActive,
  toggleNutritionVerified,
} from './actions';

interface Nutritionist {
  id: string;
  full_name: string;
  title: string;
  gender: 'male' | 'female' | null;
  bio: string | null;
  years_experience: number;
  specialties: string[];
  languages: string[];
  cities: string[];
  available_online: boolean;
  available_in_clinic: boolean;
  initial_consultation_price: number;
  follow_up_price: number;
  monthly_plan_price: number;
  // 🆕 V31: إحداثيات العيادة (للظهور على الخريطة)
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  rating_avg: number;
  rating_count: number;
  total_clients: number;
  success_rate: number;
  is_active: boolean;
  is_verified: boolean;
}

const EMPTY: Partial<Nutritionist> = {
  full_name: '',
  title: 'د.',
  gender: 'female',
  bio: '',
  years_experience: 5,
  specialties: [],
  languages: ['ar'],
  cities: ['بغداد'],
  available_online: true,
  available_in_clinic: true,
  initial_consultation_price: 30000,
  follow_up_price: 15000,
  monthly_plan_price: 100000,
  success_rate: 85,
  is_active: true,
  is_verified: false,
};

export default function NutritionAdminClient({ initialNutritionists }: { initialNutritionists: Nutritionist[] }) {
  const [list] = useState(initialNutritionists);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = list.filter((n) =>
    n.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    startTransition(async () => {
      const r = await deleteNutritionist(id);
      if (r.ok) { toast.success('تم'); window.location.reload(); }
      else toast.error(r.error || 'فشل');
    });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="الإجمالي" value={list.length} color="var(--ink-2)" />
        <StatCard label="نشطون" value={list.filter(n => n.is_active).length} color="var(--emerald)" />
        <StatCard label="موثّقون" value={list.filter(n => n.is_verified).length} color="#3B82F6" />
        <StatCard label="عملاء" value={list.reduce((sum, n) => sum + n.total_clients, 0)} color="var(--amber)" />
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
              <th style={thStyle}>الخبرة</th>
              <th style={thStyle}>المدن</th>
              <th style={thStyle}>الباقات</th>
              <th style={thStyle}>العملاء</th>
              <th style={thStyle}>النجاح</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => (
              <tr key={n.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{n.title} {n.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{n.gender === 'female' ? 'أنثى' : 'ذكر'}</div>
                </td>
                <td style={tdStyle}>{n.years_experience} سنة</td>
                <td style={tdStyle}>{n.cities.slice(0, 2).join(', ')}</td>
                <td style={tdStyle}>
                  <div style={{ fontSize: 9 }}>💬 {n.initial_consultation_price.toLocaleString('ar-IQ')}</div>
                  <div style={{ fontSize: 9 }}>📅 {n.monthly_plan_price.toLocaleString('ar-IQ')}</div>
                </td>
                <td style={tdStyle}>{n.total_clients}</td>
                <td style={tdStyle}>
                  {n.success_rate > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--emerald)', fontWeight: 700 }}>
                      <TrendingUp size={12} />{n.success_rate}%
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {n.is_active ? <CheckCircle2 size={14} color="var(--emerald)" /> : <XCircle size={14} color="var(--ink-3)" />}
                    {n.is_verified && <Shield size={14} color="#3B82F6" />}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <IconButton onClick={() => startTransition(async () => { await toggleNutritionVerified(n.id, !n.is_verified); window.location.reload(); })} title="توثيق" color={n.is_verified ? '#3B82F6' : 'var(--ink-3)'}>
                      <Shield size={14} />
                    </IconButton>
                    <IconButton onClick={() => startTransition(async () => { await toggleNutritionActive(n.id, !n.is_active); window.location.reload(); })} title={n.is_active ? 'إيقاف' : 'تفعيل'} color={n.is_active ? 'var(--emerald)' : 'var(--ink-3)'}>
                      {n.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </IconButton>
                    <IconButton onClick={() => setEditingId(n.id)} title="تعديل" color="#3B82F6">
                      <Edit size={14} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(n.id, n.full_name)} title="حذف" color="var(--rose)">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>🥗 لا يوجد أخصائيون</div>}
      </div>

      {(showCreate || editingId) && (
        <NutritionistModal
          nutritionist={editingId ? list.find((n) => n.id === editingId) || null : null}
          onClose={() => { setShowCreate(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

function NutritionistModal({ nutritionist, onClose }: { nutritionist: Nutritionist | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Nutritionist>>(nutritionist || EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [specialtiesText, setSpecialtiesText] = useState((nutritionist?.specialties || []).join(', '));
  const [citiesText, setCitiesText] = useState((nutritionist?.cities || ['بغداد']).join(', '));

  const handleSubmit = async () => {
    if (!form.full_name) { toast.error('الاسم مطلوب'); return; }
    setIsSaving(true);
    const input = {
      ...form,
      specialties: specialtiesText.split(',').map(s => s.trim()).filter(Boolean),
      cities: citiesText.split(',').map(c => c.trim()).filter(Boolean),
    };
    const result = nutritionist ? await updateNutritionist(nutritionist.id, input) : await createNutritionist(input);
    if (result.ok) { toast.success(nutritionist ? 'تم التحديث' : 'تم الإضافة'); window.location.reload(); }
    else { toast.error(result.error || 'فشلت العملية'); setIsSaving(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
          {nutritionist ? '✏️ تعديل أخصائي' : '➕ إضافة أخصائي'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10 }}>
            <Field label="اللقب">
              <select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle}>
                <option value="د.">د.</option>
                <option value="أ.">أ.</option>
              </select>
            </Field>
            <Field label="الاسم *">
              <input type="text" value={form.full_name || ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={inputStyle} />
            </Field>
          </div>

          <Field label="السيرة الذاتية">
            <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Field label="الجنس">
              <select value={form.gender || 'female'} onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })} style={inputStyle}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </Field>
            <Field label="الخبرة (سنة)">
              <input type="number" value={form.years_experience || 0} onChange={(e) => setForm({ ...form, years_experience: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </Field>
            <Field label="معدّل نجاح %">
              <input type="number" min={0} max={100} value={form.success_rate || 0} onChange={(e) => setForm({ ...form, success_rate: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </Field>
          </div>

          <Field label="التخصّصات (مفصولة بفاصلة)">
            <input type="text" value={specialtiesText} onChange={(e) => setSpecialtiesText(e.target.value)} placeholder="weight_loss, diabetes, pcos" style={inputStyle} />
          </Field>

          <Field label="المدن (مفصولة بفاصلة)">
            <input type="text" value={citiesText} onChange={(e) => setCitiesText(e.target.value)} placeholder="بغداد, البصرة" style={inputStyle} />
          </Field>

          {/* 🆕 V31: موقع العيادة على الخريطة (اختياري) */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2C2C2A' }}>
              📍 موقع العيادة على الخريطة (اختياري)
            </label>
            <AdminLocationPickerWrapper
              initialLat={form.latitude ?? null}
              initialLng={form.longitude ?? null}
              markerType="nutrition"
              onChange={(la, ln) => setForm({ ...form, latitude: la, longitude: ln })}
              onAddressDetected={(addr) => { if (!form.address) setForm((f) => ({ ...f, address: addr })); }}
            />
          </div>

          <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💰 الباقات (د.ع)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <Field label="استشارة">
                <input type="number" value={form.initial_consultation_price || 0} onChange={(e) => setForm({ ...form, initial_consultation_price: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
              <Field label="متابعة">
                <input type="number" value={form.follow_up_price || 0} onChange={(e) => setForm({ ...form, follow_up_price: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
              <Field label="شهرية">
                <input type="number" value={form.monthly_plan_price || 0} onChange={(e) => setForm({ ...form, monthly_plan_price: parseInt(e.target.value) || 0 })} style={inputStyle} />
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
            {isSaving ? 'جاري...' : (nutritionist ? 'تحديث' : 'إضافة')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, padding: 14, textAlign: 'center' }}>
    <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{label}</div>
  </div>;
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
