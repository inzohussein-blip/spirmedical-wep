'use client';

import { useState, useTransition } from 'react';
import { upsertLab, toggleLabActive, toggleLabFeatured, deleteLab } from './actions';
import { 
  Plus, Edit, Trash2, Star, Power, MapPin, Phone, 
  Building2, X, Save, Search, CheckCircle2,
} from 'lucide-react';

interface PartnerLab {
  id: string;
  name_ar: string;
  name_en: string | null;
  city: string;
  governorate: string | null;
  phone: string | null;
  is_active: boolean;
  is_featured: boolean;
  total_orders: number;
  rating_avg: number;
  rating_count: number;
  specialties: string[] | null;
}

interface Props {
  labs: PartnerLab[];
}

const SPECIALTIES_OPTIONS = [
  { value: 'general', label: 'عام' },
  { value: 'cardiac', label: 'قلب' },
  { value: 'diabetes', label: 'سكري' },
  { value: 'thyroid', label: 'غدة درقية' },
  { value: 'hormones', label: 'هرمونات' },
  { value: 'kidney', label: 'كلى' },
  { value: 'liver', label: 'كبد' },
  { value: 'genetic', label: 'وراثي' },
];

const CITIES = [
  'بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف', 'كربلاء', 'السليمانية', 'كركوك',
  'بابل', 'القادسية', 'ميسان', 'ذي قار', 'المثنى', 'واسط', 'صلاح الدين', 'ديالى', 'الأنبار', 'دهوك',
];

export default function LabsAdminClient({ labs }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLab, setEditingLab] = useState<PartnerLab | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter
  const filteredLabs = labs.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name_ar.toLowerCase().includes(q) ||
      l.city.toLowerCase().includes(q) ||
      (l.phone && l.phone.includes(q))
    );
  });

  function handleToggleActive(id: string) {
    startTransition(async () => {
      await toggleLabActive(id);
    });
  }

  function handleToggleFeatured(id: string) {
    startTransition(async () => {
      await toggleLabFeatured(id);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`هل أنت متأكّد من حذف "${name}"؟`)) return;
    startTransition(async () => {
      const result = await deleteLab(id);
      if (result.ok) {
        setFeedback('تم الحذف');
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: 10, 
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search 
            size={16} 
            strokeWidth={2.2}
            style={{ 
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-3)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث عن مختبر..."
            style={{
              width: '100%',
              padding: '10px 40px 10px 12px',
              border: '1px solid var(--line)',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </div>
        
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          style={{
            padding: '10px 18px',
            background: '#0F6E56',
            color: 'white',
            border: 0,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          إضافة مختبر
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: '10px 14px',
          background: '#E1F5EE',
          color: '#04342C',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <CheckCircle2 size={14} strokeWidth={2.5} />
          {feedback}
        </div>
      )}

      {/* Labs table */}
      <div style={{ 
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {filteredLabs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
            <Building2 size={48} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد مختبرات بعد'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>المختبر</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>المدينة</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>التواصل</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>الطلبات</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>التقييم</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>الحالة</th>
                <th style={{ padding: 10, textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredLabs.map((lab) => (
                <tr key={lab.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lab.is_featured && (
                        <Star size={12} fill="#A57100" stroke="#A57100" aria-hidden />
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{lab.name_ar}</div>
                        {lab.name_en && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{lab.name_en}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-2)' }}>
                      <MapPin size={12} strokeWidth={2.2} aria-hidden />
                      {lab.city}
                    </div>
                  </td>
                  <td style={{ padding: 10 }}>
                    {lab.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)' }}>
                        <Phone size={11} strokeWidth={2.2} aria-hidden />
                        {lab.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: 10, fontWeight: 700 }}>{lab.total_orders}</td>
                  <td style={{ padding: 10 }}>
                    <span style={{ fontSize: 12 }}>
                      ⭐ {lab.rating_avg.toFixed(1)} <span style={{ color: 'var(--ink-3)' }}>({lab.rating_count})</span>
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                      background: lab.is_active ? '#E1F5EE' : '#FCEBEB',
                      color: lab.is_active ? '#04342C' : '#791F1F',
                    }}>
                      {lab.is_active ? '✓ نشط' : '✗ معطّل'}
                    </span>
                  </td>
                  <td style={{ padding: 10 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => setEditingLab(lab)}
                        title="تعديل"
                        style={{ background: 'var(--paper-2)', border: 0, padding: 6, borderRadius: 6, cursor: 'pointer' }}
                      >
                        <Edit size={12} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(lab.id)}
                        title="مميّز"
                        style={{ background: 'var(--paper-2)', border: 0, padding: 6, borderRadius: 6, cursor: 'pointer' }}
                      >
                        <Star 
                          size={12} 
                          strokeWidth={2.2}
                          fill={lab.is_featured ? '#A57100' : 'none'}
                          stroke={lab.is_featured ? '#A57100' : 'currentColor'}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(lab.id)}
                        title={lab.is_active ? 'تعطيل' : 'تفعيل'}
                        style={{ background: 'var(--paper-2)', border: 0, padding: 6, borderRadius: 6, cursor: 'pointer' }}
                      >
                        <Power size={12} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lab.id, lab.name_ar)}
                        title="حذف"
                        style={{ background: '#FCEBEB', color: '#A32D2D', border: 0, padding: 6, borderRadius: 6, cursor: 'pointer' }}
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal */}
      {(editingLab || showCreate) && (
        <LabEditModal
          lab={editingLab}
          onClose={() => {
            setEditingLab(null);
            setShowCreate(false);
          }}
          onSaved={() => {
            setEditingLab(null);
            setShowCreate(false);
            setFeedback('تم الحفظ');
            setTimeout(() => setFeedback(null), 2000);
          }}
          isPending={isPending}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

// ─── Edit Modal ───
function LabEditModal({
  lab,
  onClose,
  onSaved,
  isPending,
  startTransition,
}: {
  lab: PartnerLab | null;
  onClose: () => void;
  onSaved: () => void;
  isPending: boolean;
  startTransition: (callback: () => void) => void;
}) {
  const [formData, setFormData] = useState({
    name_ar: lab?.name_ar || '',
    name_en: lab?.name_en || '',
    city: lab?.city || 'بغداد',
    governorate: lab?.governorate || '',
    phone: lab?.phone || '',
    specialties: lab?.specialties || [],
    is_active: lab?.is_active ?? true,
    is_featured: lab?.is_featured ?? false,
  });

  function toggleSpecialty(value: string) {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(value)
        ? prev.specialties.filter((s) => s !== value)
        : [...prev.specialties, value],
    }));
  }

  function handleSave() {
    if (!formData.name_ar.trim()) {
      alert('الاسم العربي مطلوب');
      return;
    }
    
    startTransition(async () => {
      const result = await upsertLab(lab?.id, formData);
      if (result.ok) {
        onSaved();
      } else {
        alert(result.error || 'فشل الحفظ');
      }
    });
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16,
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            {lab ? 'تعديل مختبر' : 'إضافة مختبر جديد'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer' }}>
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              الاسم العربي *
            </label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              placeholder="مختبر التحاليل الذهبي"
              style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
              English Name
            </label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              placeholder="Golden Lab"
              style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
                المدينة *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 4 }}>
                الهاتف
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="07700000000"
                style={{ width: '100%', padding: 10, border: '1px solid var(--line)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
              التخصصات
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SPECIALTIES_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleSpecialty(s.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: formData.specialties.includes(s.value) ? '#0F6E56' : 'var(--line)',
                    background: formData.specialties.includes(s.value) ? '#0F6E56' : 'var(--white)',
                    color: formData.specialties.includes(s.value) ? 'white' : 'var(--ink-2)',
                    cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, padding: 10, background: 'var(--paper-2)', borderRadius: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              نشط
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              />
              مميّز ⭐
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            style={{
              flex: 1,
              padding: 12,
              background: '#0F6E56',
              color: 'white',
              border: 0,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Save size={16} strokeWidth={2.2} />
            {isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              padding: '12px 20px',
              background: 'var(--paper-3)',
              color: 'var(--ink-2)',
              border: 0,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
