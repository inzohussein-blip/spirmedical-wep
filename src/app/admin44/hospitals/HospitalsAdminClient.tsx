'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit3, Trash2, CheckCircle2, X, Save, Loader2, Search,
  MapPin, Eye, EyeOff,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { createHospital, updateHospital, deleteHospital, toggleHospitalActive } from './actions';

interface Hospital {
  id: string;
  name: string;
  name_en: string | null;
  type: 'government' | 'private' | 'health_center' | 'specialized';
  city: string;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  phone_emergency: string | null;
  whatsapp: string | null;
  is_24h: boolean;
  visiting_hours: string | null;
  departments: string[] | null;
  has_emergency: boolean;
  has_ambulance: boolean;
  has_pharmacy: boolean;
  has_lab: boolean;
  has_radiology: boolean;
  beds_count: number | null;
  icu_beds_count: number | null;
  description: string | null;
  is_active: boolean;
  is_verified: boolean;
}

interface Props { hospitals: Hospital[] }

const TYPES = [
  { id: 'government', label: 'حكومي', emoji: '🏛️' },
  { id: 'private', label: 'أهلي', emoji: '🏥' },
  { id: 'health_center', label: 'مركز صحي', emoji: '🏪' },
  { id: 'specialized', label: 'تخصصي', emoji: '🔬' },
];

const CITIES = ['بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل', 'كركوك', 'بابل', 'ذي قار', 'الأنبار', 'ديالى', 'صلاح الدين', 'واسط', 'القادسية', 'المثنى', 'دهوك', 'السليمانية', 'ميسان'];

const DEPARTMENTS = [
  { id: 'emergency', label: 'طوارئ' },
  { id: 'cardiology', label: 'قلبية' },
  { id: 'pediatrics', label: 'أطفال' },
  { id: 'maternity', label: 'نسائية وولادة' },
  { id: 'surgery', label: 'جراحة' },
  { id: 'orthopedics', label: 'عظام' },
  { id: 'oncology', label: 'أورام' },
  { id: 'icu', label: 'عناية مركزة' },
  { id: 'lab', label: 'مختبر' },
  { id: 'radiology', label: 'أشعة' },
  { id: 'pharmacy', label: 'صيدلية' },
  { id: 'neurology', label: 'أعصاب' },
  { id: 'urology', label: 'بولية' },
  { id: 'dermatology', label: 'جلدية' },
  { id: 'psychiatry', label: 'نفسية' },
];

export default function HospitalsAdminClient({ hospitals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Hospital | null>(null);

  const filtered = useMemo(() => {
    return hospitals.filter((h) => {
      const s = !searchQuery || h.name.toLowerCase().includes(searchQuery.toLowerCase());
      const t = !filterType || h.type === filterType;
      const c = !filterCity || h.city === filterCity;
      return s && t && c;
    });
  }, [hospitals, searchQuery, filterType, filterCity]);

  const handleDelete = (h: Hospital) => {
    if (!confirm(`حذف "${h.name}" نهائياً؟`)) return;
    startTransition(async () => {
      const r = await deleteHospital(h.id);
      if (r.success) { toast.success('تم الحذف'); router.refresh(); }
      else toast.error(r.error || 'فشل');
    });
  };

  const handleToggle = (h: Hospital) => {
    startTransition(async () => {
      const r = await toggleHospitalActive(h.id, !h.is_active);
      if (r.success) { toast.success(h.is_active ? 'تم الإيقاف' : 'تم التفعيل'); router.refresh(); }
      else toast.error(r.error || 'فشل');
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowModal(true); }}
          style={primaryBtn()}
        >
          <Plus size={16} /> إضافة مستشفى
        </button>

        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: 12, top: 12, color: 'var(--ink-3)' }} />
          <input
            type="search"
            placeholder="ابحث عن مستشفى..."
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

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">كل الأنواع</option>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
        </select>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={selectStyle}>
          <option value="">كل المدن</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'var(--white)', borderRadius: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {hospitals.length === 0 ? 'لم تُسجّل مستشفيات بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--white)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--paper-3)' }}>
                <th style={thStyle}>المستشفى</th>
                <th style={thStyle}>النوع</th>
                <th style={thStyle}>المدينة</th>
                <th style={thStyle}>الخدمات</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => {
                const typeMeta = TYPES.find(t => t.id === h.type);
                return (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 800 }}>
                        {h.name}
                        {h.is_verified && <CheckCircle2 size={11} color="var(--emerald)" style={{ marginInlineStart: 4 }} />}
                      </div>
                      {h.district && (
                        <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{h.district}</div>
                      )}
                    </td>
                    <td style={tdStyle}>{typeMeta?.emoji} {typeMeta?.label}</td>
                    <td style={tdStyle}>{h.city}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', fontSize: 9 }}>
                        {h.has_emergency && <span style={featureTag('var(--rose)')}>طوارئ</span>}
                        {h.is_24h && <span style={featureTag('var(--emerald)')}>٢٤/٧</span>}
                        {h.has_lab && <span style={featureTag('var(--ink-3)')}>مختبر</span>}
                        {h.has_radiology && <span style={featureTag('var(--ink-3)')}>أشعة</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px',
                        background: h.is_active ? 'var(--emerald-soft)' : 'var(--rose-soft)',
                        color: h.is_active ? 'var(--emerald)' : 'var(--rose)',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                      }}>
                        {h.is_active ? 'نشط' : 'معطّل'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditing(h); setShowModal(true); }} aria-label="تعديل" style={iconBtn()}>
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => handleToggle(h)} disabled={isPending} aria-label={h.is_active ? 'إيقاف' : 'تفعيل'} style={iconBtn()}>
                          {h.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button onClick={() => handleDelete(h)} disabled={isPending} aria-label="حذف" style={{ ...iconBtn(), background: 'var(--rose-soft)', color: 'var(--rose)' }}>
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
        <HospitalModal
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

// ═══════════════════════════════════════════════════════════════
function HospitalModal({
  editing, isPending, startTransition, onClose, onSaved,
}: {
  editing: Hospital | null;
  isPending: boolean;
  startTransition: React.TransitionStartFunction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? '');
  const [nameEn, setNameEn] = useState(editing?.name_en ?? '');
  const [type, setType] = useState<Hospital['type']>(editing?.type ?? 'private');
  const [city, setCity] = useState(editing?.city ?? 'بغداد');
  const [district, setDistrict] = useState(editing?.district ?? '');
  const [address, setAddress] = useState(editing?.address ?? '');
  const [lat, setLat] = useState(editing?.latitude?.toString() ?? '');
  const [lng, setLng] = useState(editing?.longitude?.toString() ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? '');
  const [phoneEmergency, setPhoneEmergency] = useState(editing?.phone_emergency ?? '');
  const [whatsapp, setWhatsapp] = useState(editing?.whatsapp ?? '');
  const [is24h, setIs24h] = useState(editing?.is_24h ?? false);
  const [visitingHours, setVisitingHours] = useState(editing?.visiting_hours ?? '');
  const [departments, setDepartments] = useState<string[]>(editing?.departments ?? []);
  const [hasEmergency, setHasEmergency] = useState(editing?.has_emergency ?? false);
  const [hasAmbulance, setHasAmbulance] = useState(editing?.has_ambulance ?? false);
  const [hasPharmacy, setHasPharmacy] = useState(editing?.has_pharmacy ?? false);
  const [hasLab, setHasLab] = useState(editing?.has_lab ?? false);
  const [hasRadiology, setHasRadiology] = useState(editing?.has_radiology ?? false);
  const [bedsCount, setBedsCount] = useState(editing?.beds_count?.toString() ?? '');
  const [icuBeds, setIcuBeds] = useState(editing?.icu_beds_count?.toString() ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');

  const toggleDept = (d: string) => {
    setDepartments(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('الاسم مطلوب'); return; }
    if (!city) { toast.error('المدينة مطلوبة'); return; }

    startTransition(async () => {
      const data = {
        name: name.trim(),
        name_en: nameEn.trim() || null,
        type, city,
        district: district.trim() || null,
        address: address.trim() || null,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lng ? parseFloat(lng) : null,
        phone: phone.trim() || null,
        phone_emergency: phoneEmergency.trim() || null,
        whatsapp: whatsapp.trim() || null,
        is_24h: is24h,
        visiting_hours: visitingHours.trim() || null,
        departments: departments.length > 0 ? departments : null,
        has_emergency: hasEmergency,
        has_ambulance: hasAmbulance,
        has_pharmacy: hasPharmacy,
        has_lab: hasLab,
        has_radiology: hasRadiology,
        beds_count: bedsCount ? parseInt(bedsCount) : null,
        icu_beds_count: icuBeds ? parseInt(icuBeds) : null,
        description: description.trim() || null,
      };

      const result = editing
        ? await updateHospital(editing.id, data)
        : await createHospital(data);

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
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 20, overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)', width: '100%', maxWidth: 700,
          borderRadius: 14, padding: 20, marginTop: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, flex: 1 }}>
            {editing ? 'تعديل مستشفى' : 'إضافة مستشفى جديد'}
          </h3>
          <button onClick={onClose} aria-label="إغلاق" style={closeBtn()}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="الاسم بالعربية *">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مستشفى ابن سينا" style={inputStyle} />
          </Field>
          <Field label="الاسم بالإنجليزية">
            <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Ibn Sina Hospital" style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="النوع *">
            <select value={type} onChange={(e) => setType(e.target.value as Hospital['type'])} style={inputStyle}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
            </select>
          </Field>
          <Field label="المدينة *">
            <select value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="المنطقة">
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="الكرادة" style={inputStyle} />
          </Field>
        </div>

        <Field label="العنوان الكامل">
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="شارع 62، قرب جامع..." style={inputStyle} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="خط العرض (latitude)">
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="33.3026" style={inputStyle} />
          </Field>
          <Field label="خط الطول (longitude)">
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="44.4097" style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="الهاتف">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXXX" style={inputStyle} />
          </Field>
          <Field label="هاتف الطوارئ">
            <input type="tel" value={phoneEmergency} onChange={(e) => setPhoneEmergency(e.target.value)} placeholder="07XXXXXXXXX" style={inputStyle} />
          </Field>
          <Field label="WhatsApp">
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="9647XXXXXXXXX" style={inputStyle} />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <Field label="ساعات الزيارة">
            <input type="text" value={visitingHours} onChange={(e) => setVisitingHours(e.target.value)} placeholder="10:00 - 12:00 ص" style={inputStyle} />
          </Field>
          <Field label="عدد الأسرّة">
            <input type="number" value={bedsCount} onChange={(e) => setBedsCount(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="أسرّة العناية">
            <input type="number" value={icuBeds} onChange={(e) => setIcuBeds(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <Field label="الوصف">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        {/* Features */}
        <div style={{ marginTop: 12, padding: 12, background: 'var(--paper-3)', borderRadius: 10 }}>
          <h4 style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px' }}>الخدمات</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <CheckLabel checked={is24h} onChange={setIs24h} label="٢٤/٧" />
            <CheckLabel checked={hasEmergency} onChange={setHasEmergency} label="طوارئ" />
            <CheckLabel checked={hasAmbulance} onChange={setHasAmbulance} label="إسعاف" />
            <CheckLabel checked={hasPharmacy} onChange={setHasPharmacy} label="صيدلية" />
            <CheckLabel checked={hasLab} onChange={setHasLab} label="مختبر" />
            <CheckLabel checked={hasRadiology} onChange={setHasRadiology} label="أشعة" />
          </div>
        </div>

        {/* Departments */}
        <div style={{ marginTop: 12 }}>
          <h4 style={{ fontSize: 12, fontWeight: 800, margin: '0 0 8px' }}>الأقسام</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {DEPARTMENTS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDept(d.id)}
                style={{
                  padding: '6px 10px',
                  background: departments.includes(d.id) ? 'var(--emerald)' : 'var(--white)',
                  color: departments.includes(d.id) ? 'var(--paper-3)' : 'var(--ink-2)',
                  border: '1px solid',
                  borderColor: departments.includes(d.id) ? 'var(--emerald)' : 'var(--line)',
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={secondaryBtn()}>إلغاء</button>
          <button type="button" onClick={handleSave} disabled={isPending} style={primaryBtnFull()}>
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
function featureTag(color: string): React.CSSProperties {
  return { padding: '2px 6px', background: `${color}15`, color, borderRadius: 4, fontWeight: 700 };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
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
