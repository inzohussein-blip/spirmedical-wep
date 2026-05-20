'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit3, Trash2, X, Save, Loader2, Search, Pill,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { createMedication, updateMedication, deleteMedication } from './actions';

interface Medication {
  id: string;
  name_ar: string;
  name_en: string | null;
  generic_name: string | null;
  manufacturer: string | null;
  country_of_origin: string | null;
  category: string;
  form: string | null;
  strength: string | null;
  unit_type: string | null;
  package_size: string | null;
  requires_prescription: boolean;
  is_controlled: boolean;
  side_effects: string | null;
  contraindications: string | null;
}

interface Props {
  medications: Medication[];
}

const CATEGORIES = [
  { id: 'analgesic', label: 'مسكنات', emoji: '💊' },
  { id: 'antibiotic', label: 'مضادات حيوية', emoji: '🦠' },
  { id: 'antihypertensive', label: 'ضغط الدم', emoji: '❤️' },
  { id: 'antidiabetic', label: 'السكري', emoji: '🩸' },
  { id: 'cardiac', label: 'القلب', emoji: '💗' },
  { id: 'respiratory', label: 'الجهاز التنفسي', emoji: '🫁' },
  { id: 'gastric', label: 'الجهاز الهضمي', emoji: '🍽️' },
  { id: 'dermatological', label: 'الجلد', emoji: '🧴' },
  { id: 'vitamin', label: 'فيتامينات', emoji: '🌿' },
  { id: 'cosmetic', label: 'تجميل', emoji: '✨' },
  { id: 'baby', label: 'الأطفال', emoji: '👶' },
  { id: 'first_aid', label: 'إسعافات', emoji: '🩹' },
  { id: 'other', label: 'أخرى', emoji: '📦' },
];

const FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'suppository', 'patch'];
const FORM_LABELS: Record<string, string> = {
  tablet: 'قرص', capsule: 'كبسولة', syrup: 'شراب', injection: 'حقنة',
  ointment: 'مرهم', drops: 'قطرة', inhaler: 'بخاخ', suppository: 'لبوس', patch: 'لاصقة',
};

export default function MedicationsAdminClient({ medications }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Medication | null>(null);

  const filtered = useMemo(() => {
    return medications.filter((m) => {
      const s = !searchQuery ||
        m.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.generic_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const c = !filterCat || m.category === filterCat;
      return s && c;
    });
  }, [medications, searchQuery, filterCat]);

  const handleDelete = (m: Medication) => {
    if (!confirm(`حذف "${m.name_ar}" من الكتالوج؟ سيُحذف من كل الصيدليات.`)) return;
    startTransition(async () => {
      const r = await deleteMedication(m.id);
      if (r.success) { toast.success('تم الحذف'); router.refresh(); }
      else toast.error(r.error || 'فشل');
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setEditing(null); setShowModal(true); }} style={primaryBtn()}>
          <Plus size={16} /> إضافة دواء
        </button>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: 12, top: 12, color: 'var(--ink-3)' }} />
          <input
            type="search"
            placeholder="ابحث (عربي/إنجليزي/علمي)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>

        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={selectStyle}>
          <option value="">كل الفئات</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {medications.length === 0 ? 'لم تُسجّل أدوية بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--paper-3)' }}>
                <th style={thStyle}>الدواء</th>
                <th style={thStyle}>الفئة</th>
                <th style={thStyle}>الشكل</th>
                <th style={thStyle}>الجرعة</th>
                <th style={thStyle}>الشركة</th>
                <th style={thStyle}>وصفة؟</th>
                <th style={thStyle}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const catMeta = CATEGORIES.find(c => c.id === m.category);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 800 }}>{m.name_ar}</div>
                      {m.name_en && <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{m.name_en}</div>}
                      {m.generic_name && <div style={{ fontSize: 9, color: 'var(--ink-3)', fontStyle: 'italic' }}>({m.generic_name})</div>}
                    </td>
                    <td style={tdStyle}>{catMeta?.emoji} {catMeta?.label}</td>
                    <td style={tdStyle}>{m.form ? FORM_LABELS[m.form] : '—'}</td>
                    <td style={tdStyle}>{m.strength || '—'}</td>
                    <td style={tdStyle}>{m.manufacturer || '—'}</td>
                    <td style={tdStyle}>
                      {m.requires_prescription ? (
                        <span style={{ padding: '2px 6px', background: 'var(--amber-soft)', color: 'var(--amber)', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>📋 وصفة</span>
                      ) : (
                        <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>—</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditing(m); setShowModal(true); }} aria-label="تعديل" style={iconBtn()}>
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => handleDelete(m)} disabled={isPending} aria-label="حذف" style={{ ...iconBtn(), background: 'var(--rose-soft)', color: 'var(--rose)' }}>
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
        <MedicationModal
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

function MedicationModal({
  editing, isPending, startTransition, onClose, onSaved,
}: {
  editing: Medication | null;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameAr, setNameAr] = useState(editing?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(editing?.name_en ?? '');
  const [generic, setGeneric] = useState(editing?.generic_name ?? '');
  const [manufacturer, setManufacturer] = useState(editing?.manufacturer ?? '');
  const [country, setCountry] = useState(editing?.country_of_origin ?? '');
  const [category, setCategory] = useState(editing?.category ?? 'other');
  const [form, setForm] = useState(editing?.form ?? 'tablet');
  const [strength, setStrength] = useState(editing?.strength ?? '');
  const [packageSize, setPackageSize] = useState(editing?.package_size ?? '');
  const [requiresPrescription, setRequiresPrescription] = useState(editing?.requires_prescription ?? false);
  const [isControlled, setIsControlled] = useState(editing?.is_controlled ?? false);
  const [sideEffects, setSideEffects] = useState(editing?.side_effects ?? '');

  const handleSave = () => {
    if (!nameAr.trim()) { toast.error('الاسم بالعربية مطلوب'); return; }

    startTransition(async () => {
      const data = {
        name_ar: nameAr.trim(),
        name_en: nameEn.trim() || null,
        generic_name: generic.trim() || null,
        manufacturer: manufacturer.trim() || null,
        country_of_origin: country.trim() || null,
        category,
        form: form || null,
        strength: strength.trim() || null,
        package_size: packageSize.trim() || null,
        requires_prescription: requiresPrescription,
        is_controlled: isControlled,
        side_effects: sideEffects.trim() || null,
      };

      const result = editing
        ? await updateMedication(editing.id, data)
        : await createMedication(data);

      if (result.success) {
        toast.success(editing ? 'تم التحديث' : 'تمت الإضافة');
        onSaved();
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  return (
    <div style={modalOverlay()} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={modalContent()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>
            {editing ? 'تعديل دواء' : 'إضافة دواء'}
          </h3>
          <button onClick={onClose} aria-label="إغلاق" style={closeBtn()}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="الاسم بالعربية *">
            <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="بنادول" style={inputStyle} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Panadol" style={inputStyle} />
          </Field>
        </div>

        <Field label="الاسم العلمي (Generic)">
          <input type="text" value={generic} onChange={(e) => setGeneric(e.target.value)} placeholder="Paracetamol" style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="الشركة المُصنّعة">
            <input type="text" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="GSK" style={inputStyle} />
          </Field>
          <Field label="بلد المنشأ">
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="England" style={inputStyle} />
          </Field>
        </div>

        <Field label="الفئة *">
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
          </select>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Field label="الشكل">
            <select value={form} onChange={(e) => setForm(e.target.value)} style={inputStyle}>
              {FORMS.map((f) => <option key={f} value={f}>{FORM_LABELS[f]}</option>)}
            </select>
          </Field>
          <Field label="الجرعة">
            <input type="text" value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="500mg" style={inputStyle} />
          </Field>
          <Field label="العبوة">
            <input type="text" value={packageSize} onChange={(e) => setPackageSize(e.target.value)} placeholder="20 قرص" style={inputStyle} />
          </Field>
        </div>

        <Field label="الآثار الجانبية">
          <textarea value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <CheckLabel checked={requiresPrescription} onChange={setRequiresPrescription} label="📋 يحتاج وصفة" />
          <CheckLabel checked={isControlled} onChange={setIsControlled} label="⚠️ مراقَب" />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={secondaryBtn()}>إلغاء</button>
          <button onClick={handleSave} disabled={isPending} style={primaryBtnFull()}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {editing ? 'حفظ' : 'إضافة'}
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '10px', textAlign: 'start', fontWeight: 800, fontSize: 11, color: 'var(--ink-3)', borderBottom: '1px solid var(--line)' };
const tdStyle: React.CSSProperties = { padding: '12px 10px', verticalAlign: 'middle' };
const selectStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'var(--white)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--white)' };

function primaryBtn(): React.CSSProperties {
  return { padding: '10px 16px', background: 'var(--emerald)', color: 'var(--paper-3)', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 };
}
function primaryBtnFull(): React.CSSProperties { return { ...primaryBtn(), flex: 2, justifyContent: 'center', padding: 12 }; }
function secondaryBtn(): React.CSSProperties {
  return { flex: 1, padding: 12, background: 'var(--paper-3)', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 };
}
function iconBtn(): React.CSSProperties {
  return { width: 26, height: 26, background: 'var(--paper-3)', color: 'var(--ink-2)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
}
function closeBtn(): React.CSSProperties {
  return { width: 32, height: 32, background: 'var(--paper-3)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
}
function modalOverlay(): React.CSSProperties {
  return { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' };
}
function modalContent(): React.CSSProperties {
  return { background: 'var(--paper)', width: '100%', maxWidth: 600, borderRadius: 14, padding: 20, marginTop: 20 };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 3 }}>{label}</label>
      {children}
    </div>
  );
}

function CheckLabel({ checked, onChange, label }: { checked: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
