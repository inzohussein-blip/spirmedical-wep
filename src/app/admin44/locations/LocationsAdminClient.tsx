'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Trash2, Plus, Search, MapPin, X, Loader2, Check,
  Filter, AlertCircle,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { useConfirm } from '@/components/ui';
import AdminLocationPickerWrapper from '@/components/admin/AdminLocationPickerWrapper';
import UnifiedLocationsMapWrapper from '@/components/admin/UnifiedLocationsMapWrapper';
import {
  toggleLocationActive,
  deleteLocation,
  createQuickLocation,
} from './actions';
import type { UnifiedLocation, LocationSource } from './types';

const SOURCES: { value: LocationSource; label: string; emoji: string }[] = [
  { value: 'hospitals', label: 'مستشفيات', emoji: '🏥' },
  { value: 'pharmacies', label: 'صيدليات', emoji: '💊' },
  { value: 'dental_clinics', label: 'أسنان', emoji: '🦷' },
  { value: 'optical_stores', label: 'نظّارات', emoji: '👓' },
  { value: 'mental_health_specialists', label: 'صحة نفسية', emoji: '🧠' },
  { value: 'nutritionists', label: 'تغذية', emoji: '🥗' },
  { value: 'doctors', label: 'أطباء', emoji: '🩺' },
];

const CITIES = ['بغداد', 'البصرة', 'النجف', 'أربيل', 'الموصل', 'كركوك', 'الحلة', 'كربلاء', 'الناصرية', 'السليمانية'];

interface Props {
  initialLocations: UnifiedLocation[];
}

export default function LocationsAdminClient({ initialLocations }: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<LocationSource | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'no-coords'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // ─── الإحصاءات ───
  const stats = useMemo(() => {
    const total = initialLocations.length;
    const active = initialLocations.filter((l) => l.is_active).length;
    const hidden = total - active;
    const noCoords = initialLocations.filter((l) => l.latitude == null || l.longitude == null).length;
    return { total, active, hidden, noCoords };
  }, [initialLocations]);

  // ─── الفلترة ───
  const filtered = useMemo(() => {
    return initialLocations.filter((loc) => {
      if (sourceFilter !== 'all' && loc.source !== sourceFilter) return false;
      if (statusFilter === 'active' && !loc.is_active) return false;
      if (statusFilter === 'hidden' && loc.is_active) return false;
      if (statusFilter === 'no-coords' && loc.latitude != null && loc.longitude != null) return false;
      if (search) {
        const q = search.toLowerCase();
        const inName = loc.name.toLowerCase().includes(q);
        const inCity = (loc.city ?? '').toLowerCase().includes(q);
        if (!inName && !inCity) return false;
      }
      return true;
    });
  }, [initialLocations, sourceFilter, statusFilter, search]);

  // المواقع التي لها إحداثيات (للخريطة)
  const mapLocations = useMemo(
    () => filtered.filter((l) => l.latitude != null && l.longitude != null),
    [filtered]
  );

  // ─── الإجراءات ───
  function handleToggle(loc: UnifiedLocation) {
    startTransition(async () => {
      const res = await toggleLocationActive(loc.source, loc.id, !loc.is_active);
      if (res.ok) {
        toast.success(loc.is_active ? 'تم إخفاء الموقع' : 'تم إظهار الموقع');
        router.refresh();
      } else {
        toast.error(res.error || 'فشل التحديث');
      }
    });
  }

  async function handleDelete(loc: UnifiedLocation) {
    const ok = await confirm({
      title: 'حذف الموقع',
      message: `هل تريد حذف "${loc.name}" نهائياً؟ لا يمكن التراجع.`,
      confirmText: 'حذف',
      variant: 'danger',
    });
    if (!ok) return;

    startTransition(async () => {
      const res = await deleteLocation(loc.source, loc.id);
      if (res.ok) {
        toast.success('تم الحذف');
        router.refresh();
      } else {
        toast.error(res.error || 'فشل الحذف');
      }
    });
  }

  return (
    <div>
      {/* ─── الإحصاءات ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <StatCard value={stats.total} label="إجمالي المواقع" color="#185FA5" />
        <StatCard value={stats.active} label="ظاهرة" color="#0F6E56" />
        <StatCard value={stats.hidden} label="مخفية" color="#9AA0A6" />
        <StatCard value={stats.noCoords} label="بدون إحداثيات" color="#B06000" />
      </div>

      {/* ─── الخريطة الموحّدة ─── */}
      <div style={{ marginBottom: 16 }}>
        <UnifiedLocationsMapWrapper locations={mapLocations} height={380} />
        <p style={{ fontSize: 11, color: '#888780', margin: '6px 2px 0' }}>
          📍 الخريطة تعرض {mapLocations.length} موقعاً (التي لها إحداثيات) ضمن الفلتر الحالي
        </p>
      </div>

      {/* ─── شريط الأدوات ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: '#888780' }} aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المدينة..."
            style={{ width: '100%', padding: '10px 38px 10px 12px', border: '1.5px solid #E8E6DE', borderRadius: 10, fontSize: 14, fontFamily: 'inherit' }}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#01875F', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={16} aria-hidden /> إضافة موقع
        </button>
      </div>

      {/* ─── فلاتر النوع ─── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        <FilterPill active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')}>
          الكل ({initialLocations.length})
        </FilterPill>
        {SOURCES.map((s) => {
          const count = initialLocations.filter((l) => l.source === s.value).length;
          return (
            <FilterPill key={s.value} active={sourceFilter === s.value} onClick={() => setSourceFilter(s.value)}>
              {s.emoji} {s.label} ({count})
            </FilterPill>
          );
        })}
      </div>

      {/* ─── فلاتر الحالة ─── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} small>الكل</FilterPill>
        <FilterPill active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} small>👁 ظاهرة</FilterPill>
        <FilterPill active={statusFilter === 'hidden'} onClick={() => setStatusFilter('hidden')} small>🚫 مخفية</FilterPill>
        <FilterPill active={statusFilter === 'no-coords'} onClick={() => setStatusFilter('no-coords')} small>⚠️ بدون إحداثيات</FilterPill>
      </div>

      {/* ─── الجدول ─── */}
      <div style={{ fontSize: 12, color: '#888780', marginBottom: 8 }}>
        عرض {filtered.length} من {initialLocations.length} موقع
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888780' }}>
          <MapPin size={36} style={{ opacity: 0.4 }} aria-hidden />
          <div style={{ marginTop: 8 }}>لا توجد مواقع مطابقة</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((loc) => (
            <LocationRow
              key={`${loc.source}-${loc.id}`}
              loc={loc}
              isPending={isPending}
              onToggle={() => handleToggle(loc)}
              onDelete={() => handleDelete(loc)}
            />
          ))}
        </div>
      )}

      {/* ─── Modal إضافة موقع ─── */}
      {showAddModal && (
        <AddLocationModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); router.refresh(); }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}

// ════════════════════════════════════════════════════
// المكوّنات الفرعية
// ════════════════════════════════════════════════════

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6DE', borderRadius: 12, padding: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#5F5E5A', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function FilterPill({ active, onClick, children, small }: {
  active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: small ? '5px 10px' : '7px 13px',
        borderRadius: 100,
        border: `1px solid ${active ? '#01875F' : '#E8E6DE'}`,
        background: active ? '#01875F' : '#fff',
        color: active ? '#fff' : '#5F5E5A',
        fontSize: small ? 11.5 : 12.5,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function LocationRow({ loc, isPending, onToggle, onDelete }: {
  loc: UnifiedLocation; isPending: boolean; onToggle: () => void; onDelete: () => void;
}) {
  const hasCoords = loc.latitude != null && loc.longitude != null;
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
        background: '#fff', border: '1px solid #E8E6DE', borderRadius: 12,
        opacity: loc.is_active ? 1 : 0.6,
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{loc.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#2C2C2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {loc.name}
        </div>
        <div style={{ fontSize: 12, color: '#888780', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>{loc.label}</span>
          {loc.city && <span>· {loc.city}</span>}
          {!hasCoords && (
            <span style={{ color: '#B06000', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <AlertCircle size={11} aria-hidden /> بدون إحداثيات
            </span>
          )}
        </div>
      </div>

      {/* badge الحالة */}
      <span
        style={{
          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 7,
          background: loc.is_active ? '#E1F5EE' : '#F1F3F4',
          color: loc.is_active ? '#085041' : '#5F6368', flexShrink: 0,
        }}
      >
        {loc.is_active ? 'ظاهر' : 'مخفي'}
      </span>

      {/* أزرار */}
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        title={loc.is_active ? 'إخفاء' : 'إظهار'}
        style={iconBtnStyle(loc.is_active ? '#B06000' : '#0F6E56')}
      >
        {loc.is_active ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        title="حذف"
        style={iconBtnStyle('#C71C56')}
      >
        <Trash2 size={16} aria-hidden />
      </button>
    </div>
  );
}

function AddLocationModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [source, setSource] = useState<LocationSource>('hospitals');
  const [name, setName] = useState('');
  const [city, setCity] = useState('بغداد');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const cfg = SOURCES.find((s) => s.value === source)!;

  async function handleSave() {
    if (!name.trim()) { toast.error('الاسم مطلوب'); return; }
    if (lat == null || lng == null) { toast.error('حدّد الموقع على الخريطة'); return; }

    setSaving(true);
    const res = await createQuickLocation({ source, name: name.trim(), city, latitude: lat, longitude: lng });
    setSaving(false);

    if (res.ok) {
      toast.success('تمت إضافة الموقع');
      onSuccess();
    } else {
      toast.error(res.error || 'فشل الإضافة');
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 16, overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%',
          marginTop: 24, padding: 20, maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>➕ إضافة موقع جديد</h2>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#888780' }}>
            <X size={22} aria-hidden />
          </button>
        </div>

        {/* نوع الخدمة */}
        <label style={labelStyle}>نوع الخدمة</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSource(s.value)}
              style={{
                padding: '7px 12px', borderRadius: 10,
                border: `1.5px solid ${source === s.value ? '#01875F' : '#E8E6DE'}`,
                background: source === s.value ? '#E6F3EF' : '#fff',
                color: source === s.value ? '#01875F' : '#5F5E5A',
                fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {/* الاسم */}
        <label style={labelStyle}>الاسم *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`اسم ${cfg.label}`}
          style={fieldStyle}
        />

        {/* المدينة */}
        <label style={labelStyle}>المدينة</label>
        <select value={city} onChange={(e) => setCity(e.target.value)} style={fieldStyle}>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* الخريطة */}
        <label style={labelStyle}>📍 حدّد الموقع على الخريطة *</label>
        <AdminLocationPickerWrapper
          markerType={cfg.value === 'doctors' ? 'doctor' : cfg.value === 'mental_health_specialists' ? 'mental-health' : cfg.value === 'nutritionists' ? 'nutrition' : cfg.value === 'dental_clinics' ? 'dental' : cfg.value === 'optical_stores' ? 'optical' : cfg.value === 'pharmacies' ? 'pharmacy' : 'hospital'}
          onChange={(la, ln) => { setLat(la); setLng(ln); }}
        />

        <div style={{ background: '#FAEEDA', border: '1px solid #E8C77A', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#633806', marginTop: 12 }}>
          💡 هذه إضافة سريعة بالحقول الأساسية. لإضافة كل التفاصيل (الأسعار، الخدمات...) استخدم لوحة إدارة {cfg.label} المخصّصة.
        </div>

        {/* أزرار */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #E8E6DE', background: '#fff', color: '#5F5E5A', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#01875F', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden /> : <Check size={16} aria-hidden />}
            {saving ? 'جارٍ الحفظ...' : 'إضافة الموقع'}
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = (color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 36, height: 36, borderRadius: 9, border: '1px solid #E8E6DE',
  background: '#fff', color, cursor: 'pointer', flexShrink: 0,
});

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 4, color: '#2C2C2A',
};

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1.5px solid #E8E6DE',
  borderRadius: 10, fontSize: 14, fontFamily: 'inherit', marginBottom: 14, background: '#fff',
};
