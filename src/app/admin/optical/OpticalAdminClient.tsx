'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit, Trash2, Star, CheckCircle2, XCircle, Search } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { useConfirm } from '@/components/ui';
import AdminLocationPickerWrapper from '@/components/admin/AdminLocationPickerWrapper';
import {
  createOpticalStore,
  updateOpticalStore,
  deleteOpticalStore,
  toggleOpticalActive,
  toggleOpticalFeatured,
} from './actions';

interface OpticalStore {
  id: string;
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  brands: string[];
  exam_price: number;
  offers_eye_exam: boolean;
  offers_contact_lenses: boolean;
  frame_price_min: number;
  frame_price_max: number;
  lens_price_min: number;
  lens_price_max: number;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  working_hours: string | null;
}

const EMPTY: Partial<OpticalStore> = {
  name: '',
  city: 'بغداد',
  brands: [],
  exam_price: 10000,
  offers_eye_exam: true,
  offers_contact_lenses: false,
  frame_price_min: 25000,
  frame_price_max: 500000,
  lens_price_min: 30000,
  lens_price_max: 200000,
  is_active: true,
  is_verified: false,
  is_featured: false,
};

export default function OpticalAdminClient({ initialStores }: { initialStores: OpticalStore[] }) {
  const [stores] = useState(initialStores);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();
  const { confirm, ConfirmDialog } = useConfirm();

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'حذف المتجر',
      message: `هل تريد حذف "${name}" نهائياً؟ لا يمكن التراجع.`,
      variant: 'danger',
      confirmText: 'احذف نهائياً',
    });
    if (!ok) return;
    startTransition(async () => {
      const r = await deleteOpticalStore(id);
      if (r.ok) { toast.success('تم'); window.location.reload(); }
      else toast.error(r.error || 'فشل');
    });
  };

  return (
    <div>
      <ConfirmDialog />
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="الإجمالي" value={stores.length} color="var(--ink-2)" />
        <StatCard label="نشطة" value={stores.filter(s => s.is_active).length} color="var(--emerald)" />
        <StatCard label="مميّزة" value={stores.filter(s => s.is_featured).length} color="var(--amber)" />
        <StatCard label="عدسات لاصقة" value={stores.filter(s => s.offers_contact_lenses).length} color="#3B82F6" />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--ink-3)" />
          <input
            type="search"
            placeholder="ابحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit' }}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{ padding: '10px 16px', background: 'var(--emerald)', color: 'var(--paper-3)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />إضافة متجر
        </button>
      </div>

      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--paper-3)' }}>
              <th style={thStyle}>الاسم</th>
              <th style={thStyle}>المدينة</th>
              <th style={thStyle}>العلامات</th>
              <th style={thStyle}>الخدمات</th>
              <th style={thStyle}>التقييم</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  {s.is_featured && <span style={{ fontSize: 10, color: 'var(--amber)' }}>⭐</span>}
                </td>
                <td style={tdStyle}>{s.city}{s.district && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.district}</div>}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {s.brands.slice(0, 3).map((b, i) => <Badge key={i}>{b}</Badge>)}
                    {s.brands.length > 3 && <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>+{s.brands.length - 3}</span>}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {s.offers_eye_exam && <Badge>فحص</Badge>}
                    {s.offers_contact_lenses && <Badge>عدسات</Badge>}
                  </div>
                </td>
                <td style={tdStyle}>{s.rating_count > 0 ? `⭐ ${s.rating_avg.toFixed(1)}` : '—'}</td>
                <td style={tdStyle}>{s.is_active ? <CheckCircle2 size={16} color="var(--emerald)" /> : <XCircle size={16} color="var(--ink-3)" />}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <IconButton onClick={() => startTransition(async () => { await toggleOpticalFeatured(s.id, !s.is_featured); window.location.reload(); })} title="تمييز" color={s.is_featured ? 'var(--amber)' : 'var(--ink-3)'}>
                      <Star size={14} fill={s.is_featured ? 'var(--amber)' : 'none'} />
                    </IconButton>
                    <IconButton onClick={() => startTransition(async () => { await toggleOpticalActive(s.id, !s.is_active); window.location.reload(); })} title={s.is_active ? 'إيقاف' : 'تفعيل'} color={s.is_active ? 'var(--emerald)' : 'var(--ink-3)'}>
                      {s.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </IconButton>
                    <IconButton onClick={() => setEditingId(s.id)} title="تعديل" color="#3B82F6">
                      <Edit size={14} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(s.id, s.name)} title="حذف" color="var(--rose)">
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>👓 لا توجد متاجر</div>}
      </div>

      {(showCreate || editingId) && (
        <StoreModal
          store={editingId ? stores.find((s) => s.id === editingId) || null : null}
          onClose={() => { setShowCreate(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

function StoreModal({ store, onClose }: { store: OpticalStore | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<OpticalStore>>(store || EMPTY);
  const [isSaving, setIsSaving] = useState(false);
  const [brandsText, setBrandsText] = useState((store?.brands || []).join(', '));

  const handleSubmit = async () => {
    if (!form.name || !form.city) { toast.error('الاسم والمدينة مطلوبان'); return; }
    setIsSaving(true);
    const brands = brandsText.split(',').map(b => b.trim()).filter(Boolean);
    const input = { ...form, brands };
    const result = store ? await updateOpticalStore(store.id, input) : await createOpticalStore(input);
    if (result.ok) { toast.success(store ? 'تم التحديث' : 'تم الإضافة'); window.location.reload(); }
    else { toast.error(result.error || 'فشلت العملية'); setIsSaving(false); }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
          {store ? '✏️ تعديل متجر' : '➕ إضافة متجر'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="الاسم *">
            <input type="text" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </Field>

          <Field label="الوصف">
            <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="المدينة *">
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle}>
                {['بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="المنطقة">
              <input type="text" value={form.district || ''} onChange={(e) => setForm({ ...form, district: e.target.value })} style={inputStyle} />
            </Field>
          </div>

          <Field label="هاتف">
            <input type="text" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+9647707000000" style={inputStyle} />
          </Field>

          {/* 🆕 V31: اختيار موقع المتجر من الخريطة */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#2C2C2A' }}>
              📍 حدّد الموقع على الخريطة
            </label>
            <AdminLocationPickerWrapper
              initialLat={form.latitude ?? null}
              initialLng={form.longitude ?? null}
              markerType="optical"
              onChange={(la, ln) => setForm({ ...form, latitude: la, longitude: ln })}
              onAddressDetected={(addr) => { if (!form.address) setForm((f) => ({ ...f, address: addr })); }}
            />
          </div>

          <Field label="العلامات التجارية (مفصولة بفاصلة)">
            <input type="text" value={brandsText} onChange={(e) => setBrandsText(e.target.value)} placeholder="Ray-Ban, Oakley, Persol" style={inputStyle} />
          </Field>

          <Field label="ساعات العمل">
            <input type="text" value={form.working_hours || ''} onChange={(e) => setForm({ ...form, working_hours: e.target.value })} style={inputStyle} />
          </Field>

          {/* Prices */}
          <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💰 الأسعار (د.ع)</div>
            <Field label="سعر فحص النظر">
              <input type="number" value={form.exam_price || 0} onChange={(e) => setForm({ ...form, exam_price: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <Field label="إطارات (من)">
                <input type="number" value={form.frame_price_min || 0} onChange={(e) => setForm({ ...form, frame_price_min: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
              <Field label="إطارات (إلى)">
                <input type="number" value={form.frame_price_max || 0} onChange={(e) => setForm({ ...form, frame_price_max: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <Field label="عدسات (من)">
                <input type="number" value={form.lens_price_min || 0} onChange={(e) => setForm({ ...form, lens_price_min: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
              <Field label="عدسات (إلى)">
                <input type="number" value={form.lens_price_max || 0} onChange={(e) => setForm({ ...form, lens_price_max: parseInt(e.target.value) || 0 })} style={inputStyle} />
              </Field>
            </div>
          </div>

          {/* Services */}
          <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🔧 الخدمات</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              <label style={checkboxLabelStyle}>
                <input type="checkbox" checked={form.offers_eye_exam ?? true} onChange={(e) => setForm({ ...form, offers_eye_exam: e.target.checked })} />
                فحص نظر
              </label>
              <label style={checkboxLabelStyle}>
                <input type="checkbox" checked={form.offers_contact_lenses ?? false} onChange={(e) => setForm({ ...form, offers_contact_lenses: e.target.checked })} />
                عدسات لاصقة
              </label>
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              نشطة
            </label>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.is_verified ?? false} onChange={(e) => setForm({ ...form, is_verified: e.target.checked })} />
              موثّقة ✓
            </label>
            <label style={checkboxLabelStyle}>
              <input type="checkbox" checked={form.is_featured ?? false} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              مميّزة ⭐
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} disabled={isSaving} style={{ padding: '10px 18px', background: 'var(--white)', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>إلغاء</button>
          <button type="button" onClick={handleSubmit} disabled={isSaving} style={{ padding: '10px 18px', background: 'var(--emerald)', color: 'var(--paper-3)', border: 'none', borderRadius: 10, cursor: isSaving ? 'wait' : 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800 }}>
            {isSaving ? 'جاري...' : (store ? 'تحديث' : 'إضافة')}
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

function Badge({ children, color = 'var(--ink-2)' }: { children: React.ReactNode; color?: string }) {
  return <span style={{ fontSize: 9, padding: '2px 6px', background: 'var(--paper-3)', color, borderRadius: 100, fontWeight: 700 }}>{children}</span>;
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
