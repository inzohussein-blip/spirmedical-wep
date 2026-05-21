'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit, Trash2, Star, CheckCircle2, XCircle, Search } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import {
  createDentalClinic,
  updateDentalClinic,
  deleteDentalClinic,
  toggleDentalActive,
  toggleDentalFeatured,
} from './actions';

interface DentalClinic {
  id: string;
  name: string;
  description: string | null;
  city: string;
  district: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  doctor_count: number;
  doctor_names: string[];
  specialties: string[];
  cleaning_price_min: number;
  cleaning_price_max: number;
  filling_price_min: number;
  filling_price_max: number;
  implant_price_min: number;
  implant_price_max: number;
  offers_cleaning: boolean;
  offers_fillings: boolean;
  offers_extraction: boolean;
  offers_implants: boolean;
  offers_orthodontics: boolean;
  offers_whitening: boolean;
  offers_pediatric: boolean;
  offers_emergency: boolean;
  working_hours: string | null;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
}

interface Props {
  initialClinics: DentalClinic[];
}

const EMPTY_CLINIC: Partial<DentalClinic> = {
  name: '',
  description: '',
  city: 'بغداد',
  district: '',
  address: '',
  phone: '',
  whatsapp: '',
  doctor_count: 1,
  doctor_names: [],
  specialties: [],
  cleaning_price_min: 15000,
  cleaning_price_max: 30000,
  filling_price_min: 20000,
  filling_price_max: 50000,
  implant_price_min: 500000,
  implant_price_max: 1500000,
  offers_cleaning: true,
  offers_fillings: true,
  offers_extraction: true,
  offers_implants: false,
  offers_orthodontics: false,
  offers_whitening: false,
  offers_pediatric: false,
  offers_emergency: false,
  working_hours: '',
  is_active: true,
  is_verified: false,
  is_featured: false,
};

export default function DentalAdminClient({ initialClinics }: Props) {
  const [clinics] = useState(initialClinics);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`حذف عيادة "${name}" نهائياً؟`)) return;
    startTransition(async () => {
      const result = await deleteDentalClinic(id);
      if (result.ok) {
        toast.success('تم الحذف');
        window.location.reload();
      } else {
        toast.error(result.error || 'فشل الحذف');
      }
    });
  };

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleDentalActive(id, !current);
      window.location.reload();
    });
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleDentalFeatured(id, !current);
      window.location.reload();
    });
  };

  return (
    <div>
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        <StatCard label="الإجمالي" value={clinics.length} color="var(--ink-2)" />
        <StatCard label="نشطة" value={clinics.filter(c => c.is_active).length} color="var(--emerald)" />
        <StatCard label="مميّزة" value={clinics.filter(c => c.is_featured).length} color="var(--amber)" />
        <StatCard label="موثّقة" value={clinics.filter(c => c.is_verified).length} color="#3B82F6" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{
          flex: 1,
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <Search size={16} color="var(--ink-3)" />
          <input
            type="search"
            placeholder="ابحث عن عيادة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
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
          إضافة عيادة
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--paper-3)' }}>
              <th style={thStyle}>الاسم</th>
              <th style={thStyle}>المدينة</th>
              <th style={thStyle}>الأطباء</th>
              <th style={thStyle}>التقييم</th>
              <th style={thStyle}>الخدمات</th>
              <th style={thStyle}>الحالة</th>
              <th style={thStyle}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  {c.is_featured && <span style={{ fontSize: 10, color: 'var(--amber)' }}>⭐ مميّزة</span>}
                </td>
                <td style={tdStyle}>
                  {c.city}
                  {c.district && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{c.district}</div>}
                </td>
                <td style={tdStyle}>{c.doctor_count}</td>
                <td style={tdStyle}>
                  {c.rating_count > 0 ? (
                    <span>⭐ {c.rating_avg.toFixed(1)} ({c.rating_count})</span>
                  ) : (
                    <span style={{ color: 'var(--ink-3)' }}>—</span>
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {c.offers_implants && <Badge>زراعة</Badge>}
                    {c.offers_orthodontics && <Badge>تقويم</Badge>}
                    {c.offers_pediatric && <Badge>أطفال</Badge>}
                    {c.offers_emergency && <Badge color="var(--rose)">طوارئ</Badge>}
                  </div>
                </td>
                <td style={tdStyle}>
                  {c.is_active ? (
                    <CheckCircle2 size={16} color="var(--emerald)" />
                  ) : (
                    <XCircle size={16} color="var(--ink-3)" />
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <IconButton
                      onClick={() => handleToggleFeatured(c.id, c.is_featured)}
                      title="تمييز"
                      color={c.is_featured ? 'var(--amber)' : 'var(--ink-3)'}
                    >
                      <Star size={14} fill={c.is_featured ? 'var(--amber)' : 'none'} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleToggleActive(c.id, c.is_active)}
                      title={c.is_active ? 'إيقاف' : 'تفعيل'}
                      color={c.is_active ? 'var(--emerald)' : 'var(--ink-3)'}
                    >
                      {c.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    </IconButton>
                    <IconButton
                      onClick={() => setEditingId(c.id)}
                      title="تعديل"
                      color="#3B82F6"
                    >
                      <Edit size={14} />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(c.id, c.name)}
                      title="حذف"
                      color="var(--rose)"
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
            🦷 لا توجد عيادات
          </div>
        )}
      </div>

      {/* Modal للإضافة/التعديل */}
      {(showCreate || editingId) && (
        <ClinicModal
          clinic={editingId ? clinics.find((c) => c.id === editingId) || null : null}
          onClose={() => {
            setShowCreate(false);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function ClinicModal({ clinic, onClose }: { clinic: DentalClinic | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<DentalClinic>>(clinic || EMPTY_CLINIC);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.city) {
      toast.error('الاسم والمدينة مطلوبان');
      return;
    }

    setIsSaving(true);
    try {
      const input = {
        name: form.name!,
        description: form.description || null,
        city: form.city!,
        district: form.district || null,
        address: form.address || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        doctor_count: form.doctor_count || 1,
        doctor_names: form.doctor_names || [],
        specialties: form.specialties || [],
        cleaning_price_min: form.cleaning_price_min || 15000,
        cleaning_price_max: form.cleaning_price_max || 30000,
        filling_price_min: form.filling_price_min || 20000,
        filling_price_max: form.filling_price_max || 50000,
        implant_price_min: form.implant_price_min || 500000,
        implant_price_max: form.implant_price_max || 1500000,
        offers_cleaning: form.offers_cleaning ?? true,
        offers_fillings: form.offers_fillings ?? true,
        offers_extraction: form.offers_extraction ?? true,
        offers_implants: form.offers_implants ?? false,
        offers_orthodontics: form.offers_orthodontics ?? false,
        offers_whitening: form.offers_whitening ?? false,
        offers_pediatric: form.offers_pediatric ?? false,
        offers_emergency: form.offers_emergency ?? false,
        working_hours: form.working_hours || null,
        is_active: form.is_active ?? true,
        is_verified: form.is_verified ?? false,
        is_featured: form.is_featured ?? false,
      };

      const result = clinic
        ? await updateDentalClinic(clinic.id, input)
        : await createDentalClinic(input);

      if (result.ok) {
        toast.success(clinic ? 'تم التحديث' : 'تم الإضافة');
        window.location.reload();
      } else {
        toast.error(result.error || 'فشلت العملية');
        setIsSaving(false);
      }
    } catch {
      toast.error('حدث خطأ');
      setIsSaving(false);
    }
  };

  return (
    <div style={modalOverlay}>
      <div style={modalContent}>
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
          {clinic ? '✏️ تعديل عيادة' : '➕ إضافة عيادة'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="الاسم *">
            <input
              type="text"
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <Field label="الوصف">
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="المدينة *">
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={inputStyle}
              >
                {['بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'].map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </Field>
            <Field label="المنطقة">
              <input
                type="text"
                value={form.district || ''}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="العنوان">
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="هاتف">
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+9647707000000"
                style={inputStyle}
              />
            </Field>
            <Field label="عدد الأطباء">
              <input
                type="number"
                value={form.doctor_count || 1}
                onChange={(e) => setForm({ ...form, doctor_count: parseInt(e.target.value) || 1 })}
                min={1}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="ساعات العمل">
            <input
              type="text"
              value={form.working_hours || ''}
              onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
              placeholder="يومياً 9ص - 9م"
              style={inputStyle}
            />
          </Field>

          {/* Pricing */}
          <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>💰 الأسعار (د.ع)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <Field label="تنظيف (من)">
                <input
                  type="number"
                  value={form.cleaning_price_min || 0}
                  onChange={(e) => setForm({ ...form, cleaning_price_min: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </Field>
              <Field label="تنظيف (إلى)">
                <input
                  type="number"
                  value={form.cleaning_price_max || 0}
                  onChange={(e) => setForm({ ...form, cleaning_price_max: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="زراعة (من)">
                <input
                  type="number"
                  value={form.implant_price_min || 0}
                  onChange={(e) => setForm({ ...form, implant_price_min: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </Field>
              <Field label="زراعة (إلى)">
                <input
                  type="number"
                  value={form.implant_price_max || 0}
                  onChange={(e) => setForm({ ...form, implant_price_max: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>

          {/* Services */}
          <div style={{ background: 'var(--paper-3)', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🦷 الخدمات</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {[
                { key: 'offers_cleaning', label: 'تنظيف' },
                { key: 'offers_fillings', label: 'حشوات' },
                { key: 'offers_extraction', label: 'خلع' },
                { key: 'offers_implants', label: 'زراعة' },
                { key: 'offers_orthodontics', label: 'تقويم' },
                { key: 'offers_whitening', label: 'تبييض' },
                { key: 'offers_pediatric', label: 'أطفال' },
                { key: 'offers_emergency', label: 'طوارئ' },
              ].map((s) => (
                <label key={s.key} style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={form[s.key as keyof typeof form] as boolean || false}
                    onChange={(e) => setForm({ ...form, [s.key]: e.target.checked })}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              نشطة
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.is_verified ?? false}
                onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
              />
              موثّقة ✓
            </label>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={form.is_featured ?? false}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              مميّزة ⭐
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            style={{
              padding: '10px 18px',
              background: 'var(--white)',
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
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              padding: '10px 18px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 10,
              cursor: isSaving ? 'wait' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {isSaving ? 'جاري الحفظ...' : (clinic ? 'تحديث' : 'إضافة')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: 14,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Badge({ children, color = 'var(--ink-2)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: 9,
      padding: '2px 6px',
      background: 'var(--paper-3)',
      color,
      borderRadius: 100,
      fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

function IconButton({ children, onClick, title, color }: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        background: 'transparent',
        border: '1px solid var(--line)',
        borderRadius: 6,
        cursor: 'pointer',
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, color: 'var(--ink-2)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  textAlign: 'start',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--ink-2)',
  borderBottom: '1px solid var(--line)',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 10px',
  fontSize: 12,
  color: 'var(--ink-2)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  background: 'var(--white)',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 100,
};

const modalContent: React.CSSProperties = {
  background: 'var(--paper)',
  borderRadius: 16,
  padding: 20,
  maxWidth: 600,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
};
