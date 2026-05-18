'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Trash2, Star, Edit3, X, Save, Crosshair } from 'lucide-react';
import { MapPickerWrapper } from '@/components/ui/MapPickerWrapper';
import { Card, CardHeader, CardTitle, EmptyState, Badge } from '@/components/ui';
import {
  saveLocation,
  updateSavedLocation,
  deleteSavedLocation,
} from './actions';
import type { SavedLocation } from '@/types/saved-locations';
import { SAVED_LOCATION_ICONS } from '@/types/saved-locations';

interface Props {
  initialLocations: SavedLocation[];
}

export default function SavedLocationsClient({ initialLocations }: Props) {
  const router = useRouter();
  const [locations, setLocations] = useState(initialLocations);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('🏠');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const resetForm = () => {
    setLabel('');
    setIcon('🏠');
    setAddress('');
    setCoords(null);
    setError(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (loc: SavedLocation) => {
    setEditingId(loc.id);
    setLabel(loc.label);
    setIcon(loc.icon);
    setAddress(loc.address);
    setCoords({ lat: loc.lat, lng: loc.lng });
    setShowForm(true);
  };

  const handleSubmit = () => {
    setError(null);

    if (!label.trim()) {
      setError('اسم الموقع مطلوب');
      return;
    }
    if (!address.trim()) {
      setError('العنوان مطلوب');
      return;
    }
    if (!coords) {
      setError('حدّد الموقع على الخريطة');
      return;
    }

    startTransition(async () => {
      if (editingId) {
        const result = await updateSavedLocation(editingId, {
          label,
          icon,
          address,
          lat: coords.lat,
          lng: coords.lng,
        });
        if (result.success && result.location) {
          setLocations((prev) =>
            prev.map((l) => (l.id === editingId ? result.location! : l))
          );
          resetForm();
          router.refresh();
        } else {
          setError(result.message);
        }
      } else {
        const result = await saveLocation({
          label,
          icon,
          address,
          lat: coords.lat,
          lng: coords.lng,
        });
        if (result.success && result.location) {
          setLocations((prev) => [result.location!, ...prev]);
          resetForm();
          router.refresh();
        } else {
          setError(result.message);
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموقع؟')) return;

    startTransition(async () => {
      const result = await deleteSavedLocation(id);
      if (result.success) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  const togglePin = (loc: SavedLocation) => {
    startTransition(async () => {
      const result = await updateSavedLocation(loc.id, {
        is_pinned: !loc.is_pinned,
      });
      if (result.success && result.location) {
        setLocations((prev) =>
          prev.map((l) => (l.id === loc.id ? result.location! : l))
        );
        router.refresh();
      }
    });
  };

  return (
    <main className="scr">
      <div style={{ padding: '20px 16px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>📍 مواقعي المحفوظة</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
          احفظ مواقعك المتكررة (البيت، العمل) للوصول السريع
        </p>
      </div>

      {/* الأزرار العلوية */}
      <div style={{ padding: '0 16px 16px' }}>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            disabled={locations.length >= 10}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 16px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: locations.length >= 10 ? 'not-allowed' : 'pointer',
              opacity: locations.length >= 10 ? 0.5 : 1,
            }}
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>إضافة موقع جديد</span>
          </button>
        )}

        {locations.length >= 10 && (
          <p
            style={{
              fontSize: 11,
              color: 'var(--amber)',
              textAlign: 'center',
              marginTop: 8,
              fontWeight: 700,
            }}
          >
            ⚠️ وصلت للحد الأقصى (10 مواقع). احذف موقعاً قديماً للإضافة.
          </p>
        )}
      </div>

      {/* النموذج */}
      {showForm && (
        <div style={{ padding: '0 16px 16px' }}>
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>{editingId ? '✏️ تعديل موقع' : '➕ موقع جديد'}</CardTitle>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--ink-3)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </CardHeader>

            {/* الاسم */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-3)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                اسم الموقع
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="مثل: البيت، العمل، بيت الجدّة"
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* الأيقونة */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-3)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                الأيقونة
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SAVED_LOCATION_ICONS.map((opt) => (
                  <button
                    key={opt.emoji}
                    type="button"
                    onClick={() => setIcon(opt.emoji)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      border: `2px solid ${icon === opt.emoji ? 'var(--emerald)' : 'var(--line)'}`,
                      background: icon === opt.emoji ? 'var(--emerald-soft)' : 'var(--white)',
                      fontSize: 20,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    title={opt.label}
                  >
                    {opt.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* العنوان النصي */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-3)',
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                العنوان النصي
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="حي، شارع، رقم البيت..."
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* الخريطة */}
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink-3)',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                حدّد الموقع على الخريطة
              </label>
              <MapPickerWrapper
                initialLocation={coords}
                onChange={(c) => setCoords(c)}
                height={320}
              />
            </div>

            {/* الأخطاء */}
            {error && (
              <div
                style={{
                  background: 'var(--rose-soft)',
                  color: 'var(--rose)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* الأزرار */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: 'var(--emerald)',
                  color: 'var(--paper-3)',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Save size={14} strokeWidth={2.4} />
                <span>{isPending ? 'جارٍ الحفظ...' : 'حفظ'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 20px',
                  background: 'var(--white)',
                  color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* قائمة المواقع */}
      <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {locations.length === 0 ? (
          <EmptyState
            icon="📍"
            title="لا توجد مواقع محفوظة"
            description="ابدأ بحفظ مواقعك المتكررة للوصول السريع"
          />
        ) : (
          locations.map((loc) => (
            <Card key={loc.id} variant="default" size="md">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    fontSize: 28,
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--paper-3)',
                    borderRadius: 12,
                    flexShrink: 0,
                  }}
                >
                  {loc.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{loc.label}</h3>
                    {loc.is_pinned && <Badge variant="amber" size="sm" icon={<Star size={10} />}>مثبّت</Badge>}
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-3)',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {loc.address}
                  </p>
                  {loc.use_count > 0 && (
                    <p
                      style={{
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        margin: '4px 0 0',
                      }}
                    >
                      استُخدم {loc.use_count} مرة
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button
                    onClick={() => togglePin(loc)}
                    title={loc.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 'none',
                      background: loc.is_pinned ? 'var(--amber-soft)' : 'var(--paper-3)',
                      color: loc.is_pinned ? 'var(--amber)' : 'var(--ink-3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Star size={14} strokeWidth={2.4} fill={loc.is_pinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleEdit(loc)}
                    title="تعديل"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--paper-3)',
                      color: 'var(--ink-3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit3 size={14} strokeWidth={2.4} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    title="حذف"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--rose-soft)',
                      color: 'var(--rose)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
