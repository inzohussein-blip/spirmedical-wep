'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit3, Trash2, X, Save, Loader2, Search, Eye, EyeOff,
  Package, Phone,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { createPharmacy, updatePharmacy, deletePharmacy, togglePharmacyActive } from './actions';

interface Pharmacy {
  id: string;
  name: string;
  owner_user_id: string | null;
  city: string;
  district: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  whatsapp: string | null;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
  has_emergency_section: boolean;
  is_active: boolean;
  is_verified: boolean;
}

interface Props {
  pharmacies: Pharmacy[];
  inventoryCounts: Record<string, { total: number; available: number }>;
}

const CITIES = ['بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل', 'كركوك', 'بابل', 'ذي قار', 'الأنبار', 'ديالى'];

export default function PharmaciesAdminClient({ pharmacies, inventoryCounts }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pharmacy | null>(null);

  const filtered = useMemo(() => {
    return pharmacies.filter((p) => {
      const s = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const c = !filterCity || p.city === filterCity;
      return s && c;
    });
  }, [pharmacies, searchQuery, filterCity]);

  const handleDelete = (p: Pharmacy) => {
    if (!confirm(`حذف "${p.name}" نهائياً؟ سيتم حذف كل أدويتها أيضاً.`)) return;
    startTransition(async () => {
      const r = await deletePharmacy(p.id);
      if (r.success) { toast.success('تم الحذف'); router.refresh(); }
      else toast.error(r.error || 'فشل');
    });
  };

  const handleToggle = (p: Pharmacy) => {
    startTransition(async () => {
      const r = await togglePharmacyActive(p.id, !p.is_active);
      if (r.success) { toast.success('تم التحديث'); router.refresh(); }
      else toast.error(r.error || 'فشل');
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setEditing(null); setShowModal(true); }} style={primaryBtn()}>
          <Plus size={16} /> إضافة صيدلية
        </button>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: 12, top: 12, color: 'var(--ink-3)' }} />
          <input
            type="search"
            placeholder="ابحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>

        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={selectStyle}>
          <option value="">كل المدن</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {pharmacies.length === 0 ? 'لم تُسجّل صيدليات بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--paper-3)' }}>
                <th style={thStyle}>الصيدلية</th>
                <th style={thStyle}>الموقع</th>
                <th style={thStyle}>الهاتف</th>
                <th style={thStyle}>الكتالوج</th>
                <th style={thStyle}>المالك</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const counts = inventoryCounts[p.id];
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)', display: 'flex', gap: 4, marginTop: 2 }}>
                        {p.is_24h && <span style={{ padding: '1px 5px', background: 'var(--emerald-soft)', color: 'var(--emerald)', borderRadius: 3, fontWeight: 700 }}>٢٤/٧</span>}
                        {p.has_emergency_section && <span style={{ padding: '1px 5px', background: 'var(--rose-soft)', color: 'var(--rose)', borderRadius: 3, fontWeight: 700 }}>طوارئ</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: 12 }}>{p.city}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{p.district}</div>
                    </td>
                    <td style={tdStyle}>
                      <a href={`tel:${p.phone}`} style={{ color: 'var(--emerald)', textDecoration: 'none', fontSize: 11 }}>
                        {p.phone}
                      </a>
                    </td>
                    <td style={tdStyle}>
                      {counts ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800 }}>{counts.available}/{counts.total}</div>
                          <div style={{ fontSize: 9, color: 'var(--ink-3)' }}>متوفر/إجمالي</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, color: p.owner_user_id ? 'var(--emerald)' : 'var(--ink-3)' }}>
                        {p.owner_user_id ? '✓ مربوط' : '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', background: p.is_active ? 'var(--emerald-soft)' : 'var(--rose-soft)', color: p.is_active ? 'var(--emerald)' : 'var(--rose)', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>
                        {p.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditing(p); setShowModal(true); }} aria-label="تعديل" style={iconBtn()}>
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => handleToggle(p)} disabled={isPending} aria-label={p.is_active ? 'إيقاف' : 'تفعيل'} style={iconBtn()}>
                          {p.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => handleDelete(p)} disabled={isPending} aria-label="حذف" style={{ ...iconBtn(), background: 'var(--rose-soft)', color: 'var(--rose)' }}>
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
        <PharmacyModal
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

// Modal
function PharmacyModal({
  editing, isPending, startTransition, onClose, onSaved,
}: {
  editing: Pharmacy | null;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [city, setCity] = useState(editing?.city ?? 'بغداد');
  const [district, setDistrict] = useState(editing?.district ?? '');
  const [address, setAddress] = useState(editing?.address ?? '');
  const [lat, setLat] = useState(editing?.latitude?.toString() ?? '');
  const [lng, setLng] = useState(editing?.longitude?.toString() ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(editing?.whatsapp ?? '');
  const [is24h, setIs24h] = useState(editing?.is_24h ?? false);
  const [opensAt, setOpensAt] = useState(editing?.opens_at ?? '08:00');
  const [closesAt, setClosesAt] = useState(editing?.closes_at ?? '22:00');
  const [hasEmergency, setHasEmergency] = useState(editing?.has_emergency_section ?? false);
  const [ownerEmail, setOwnerEmail] = useState('');

  const handleSave = () => {
    if (!name.trim() || !district.trim() || !phone.trim()) {
      toast.error('الاسم والمنطقة والهاتف مطلوبة');
      return;
    }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        city,
        district: district.trim(),
        address: address.trim() || null,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lng ? parseFloat(lng) : null,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || null,
        is_24h: is24h,
        opens_at: is24h ? null : opensAt,
        closes_at: is24h ? null : closesAt,
        has_emergency_section: hasEmergency,
        owner_email: ownerEmail.trim() || null,
      };

      const result = editing
        ? await updatePharmacy(editing.id, data)
        : await createPharmacy(data);

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
            {editing ? 'تعديل صيدلية' : 'إضافة صيدلية'}
          </h3>
          <button onClick={onClose} aria-label="إغلاق" style={closeBtn()}><X size={16} /></button>
        </div>

        <Field label="اسم الصيدلية *">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="صيدلية ابن سينا" style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="المدينة *">
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المنطقة *">
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="الكرادة" style={inputStyle} />
          </Field>
        </div>

        <Field label="العنوان">
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="خط العرض">
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="33.3026" style={inputStyle} />
          </Field>
          <Field label="خط الطول">
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="44.4097" style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="الهاتف *">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXXX" style={inputStyle} />
          </Field>
          <Field label="WhatsApp">
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="9647XXXXXXXXX" style={inputStyle} />
          </Field>
        </div>

        <Field label="بريد المالك (لربط الصيدلاني)">
          <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="pharmacy@example.com" style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="افتتاح">
            <input type="time" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} disabled={is24h} style={inputStyle} />
          </Field>
          <Field label="إغلاق">
            <input type="time" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} disabled={is24h} style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <CheckLabel checked={is24h} onChange={setIs24h} label="٢٤ ساعة" />
          <CheckLabel checked={hasEmergency} onChange={setHasEmergency} label="قسم طوارئ" />
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
  return { background: 'var(--paper)', width: '100%', maxWidth: 500, borderRadius: 14, padding: 20, marginTop: 20 };
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
