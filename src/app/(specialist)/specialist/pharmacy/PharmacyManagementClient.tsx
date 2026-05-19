'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Plus, Trash2, Edit3, Check, X, CheckCircle2, XCircle,
  Pill, Package, TrendingUp, Eye, Save, ArrowRight, Filter,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import {
  toggleMedicationAvailability,
  addMedicationToInventory,
  updateInventoryItem,
  removeFromInventory,
} from './actions';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
}

interface Medication {
  id: string;
  name_ar: string;
  name_en: string | null;
  generic_name?: string | null;
  manufacturer: string | null;
  category: string;
  form?: string | null;
  strength: string | null;
  package_size?: string | null;
  requires_prescription?: boolean;
}

interface InventoryItem {
  id: string;
  is_available: boolean;
  custom_price: number | null;
  brand_variant: string | null;
  notes: string | null;
  searched_count: number;
  added_at: string;
  medication: Medication | null;
}

interface Props {
  pharmacy: Pharmacy;
  inventory: InventoryItem[];
  allMedications: Medication[];
}

export default function PharmacyManagementClient({
  pharmacy,
  inventory,
  allMedications,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  // Filter inventory
  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      if (!item.medication) return false;
      const m = item.medication;
      const matchesSearch = !searchQuery ||
        m.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.name_en?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'available' && item.is_available) ||
        (filter === 'unavailable' && !item.is_available);
      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchQuery, filter]);

  // Stats
  const stats = useMemo(() => ({
    total: inventory.length,
    available: inventory.filter((i) => i.is_available).length,
    unavailable: inventory.filter((i) => !i.is_available).length,
    totalSearches: inventory.reduce((sum, i) => sum + i.searched_count, 0),
  }), [inventory]);

  const handleToggleAvailable = (item: InventoryItem) => {
    startTransition(async () => {
      const result = await toggleMedicationAvailability(item.id, !item.is_available);
      if (result.success) {
        toast.success(item.is_available ? 'تم وضع علامة غير متوفر' : 'تم وضع علامة متوفر');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل التحديث');
      }
    });
  };

  const handleRemove = (item: InventoryItem) => {
    if (!confirm(`هل تريد حذف "${item.medication?.name_ar}" من الكتالوج؟`)) return;
    startTransition(async () => {
      const result = await removeFromInventory(item.id);
      if (result.success) {
        toast.success('تم الحذف');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل الحذف');
      }
    });
  };

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">إدارة الصيدلية</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Pharmacy Info */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--emerald), var(--emerald-deep))',
            color: 'var(--paper-3)',
            padding: 16,
            borderRadius: 14,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pill size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>
                {pharmacy.name}
              </h2>
              <p style={{ fontSize: 11, opacity: 0.85, margin: '2px 0 0' }}>
                {pharmacy.city} · {pharmacy.district}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
            }}
          >
            <StatBox label="إجمالي" value={stats.total} />
            <StatBox label="متوفر" value={stats.available} highlight />
            <StatBox label="غير متوفر" value={stats.unavailable} />
            <StatBox label="بحوث" value={stats.totalSearches} icon="📊" />
          </div>
        </div>

        {/* Actions bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} />
            إضافة دواء للكتالوج
          </button>
        </div>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 10 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث في كتالوج صيدليتك..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="scr-filter-tabs" style={{ marginBottom: 12 }}>
          {([
            { id: 'all', label: `الكل (${stats.total})` },
            { id: 'available', label: `متوفر (${stats.available})` },
            { id: 'unavailable', label: `غير متوفر (${stats.unavailable})` },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`scr-filter-tab ${filter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Package size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">
              {inventory.length === 0 ? 'كتالوج فارغ' : 'لا توجد نتائج'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              {inventory.length === 0
                ? 'ابدأ بإضافة الأدوية المتوفرة لديك'
                : 'جرّب تغيير الفلتر'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((item) => {
              const m = item.medication;
              if (!m) return null;

              return (
                <InventoryRow
                  key={item.id}
                  item={item}
                  medication={m}
                  isEditing={editingId === item.id}
                  isPending={isPending}
                  onToggle={() => handleToggleAvailable(item)}
                  onEdit={() => setEditingId(item.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onRemove={() => handleRemove(item)}
                  onSave={(updates) => {
                    startTransition(async () => {
                      const result = await updateInventoryItem(item.id, updates);
                      if (result.success) {
                        toast.success('تم الحفظ');
                        setEditingId(null);
                        router.refresh();
                      } else {
                        toast.error(result.error || 'فشل الحفظ');
                      }
                    });
                  }}
                />
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddMedicationModal
          pharmacyId={pharmacy.id}
          allMedications={allMedications}
          inventoryIds={new Set(inventory.map((i) => i.medication?.id).filter(Boolean) as string[])}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
// Helper components
// ═══════════════════════════════════════════════════════════════

function StatBox({ label, value, highlight, icon }: {
  label: string;
  value: number;
  highlight?: boolean;
  icon?: string;
}) {
  return (
    <div
      style={{
        background: highlight ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
        padding: 8,
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      {icon && <div style={{ fontSize: 14, marginBottom: 2 }}>{icon}</div>}
      <div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 10, opacity: 0.85 }}>{label}</div>
    </div>
  );
}

function InventoryRow({
  item,
  medication,
  isEditing,
  isPending,
  onToggle,
  onEdit,
  onCancelEdit,
  onRemove,
  onSave,
}: {
  item: InventoryItem;
  medication: Medication;
  isEditing: boolean;
  isPending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onRemove: () => void;
  onSave: (updates: { custom_price?: number | null; brand_variant?: string | null; notes?: string | null }) => void;
}) {
  const [price, setPrice] = useState(item.custom_price?.toString() ?? '');
  const [variant, setVariant] = useState(item.brand_variant ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');

  return (
    <div
      style={{
        background: 'var(--white)',
        border: '1px solid',
        borderColor: item.is_available ? 'var(--emerald-soft)' : 'var(--line)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        {/* Toggle button */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isPending}
          aria-label={item.is_available ? 'متوفر' : 'غير متوفر'}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: item.is_available ? 'var(--emerald)' : 'var(--rose-soft)',
            color: item.is_available ? 'var(--paper-3)' : 'var(--rose)',
            border: 'none',
            cursor: isPending ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {item.is_available ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>
            {medication.name_ar}
            {medication.strength && (
              <span style={{ fontSize: 11, color: 'var(--ink-3)', marginInlineStart: 4 }}>
                {medication.strength}
              </span>
            )}
          </div>
          {medication.name_en && (
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>
              {medication.name_en}
            </div>
          )}
          {medication.manufacturer && (
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
              {medication.manufacturer}
            </div>
          )}
          {item.searched_count > 0 && (
            <div
              style={{
                fontSize: 10,
                color: 'var(--emerald)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 700,
              }}
            >
              <Eye size={10} /> {item.searched_count} عملية بحث
            </div>
          )}

          {/* Edit mode */}
          {isEditing && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="البديل المتوفر (مثلاً: Panadol)"
                style={inputStyle}
              />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="السعر (د.ع) - اختياري"
                style={inputStyle}
              />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ملاحظات (مثلاً: العلبة الكبيرة فقط)"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() =>
                    onSave({
                      custom_price: price ? parseFloat(price) : null,
                      brand_variant: variant.trim() || null,
                      notes: notes.trim() || null,
                    })
                  }
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'var(--emerald)',
                    color: 'var(--paper-3)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 11,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <Save size={12} /> حفظ
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--paper-3)',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Display mode (not editing) */}
          {!isEditing && (item.brand_variant || item.custom_price || item.notes) && (
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 4,
                fontSize: 10,
              }}
            >
              {item.brand_variant && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: 'var(--emerald-soft)',
                    color: 'var(--emerald)',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  {item.brand_variant}
                </span>
              )}
              {item.custom_price && (
                <span
                  style={{
                    padding: '2px 6px',
                    background: 'var(--amber-soft)',
                    color: 'var(--amber)',
                    borderRadius: 4,
                    fontWeight: 700,
                  }}
                >
                  {item.custom_price.toLocaleString('ar-IQ')} د.ع
                </span>
              )}
              {item.notes && (
                <span style={{ color: 'var(--ink-3)' }}>
                  💬 {item.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              type="button"
              onClick={onEdit}
              aria-label="تعديل"
              style={{
                width: 32,
                height: 32,
                background: 'var(--paper-3)',
                color: 'var(--ink-2)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit3 size={14} />
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={isPending}
              aria-label="حذف"
              style={{
                width: 32,
                height: 32,
                background: 'var(--rose-soft)',
                color: 'var(--rose)',
                border: 'none',
                borderRadius: 6,
                cursor: isPending ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'inherit',
};

// ═══════════════════════════════════════════════════════════════
// Add Medication Modal
// ═══════════════════════════════════════════════════════════════
function AddMedicationModal({
  pharmacyId,
  allMedications,
  inventoryIds,
  onClose,
  onAdded,
}: {
  pharmacyId: string;
  allMedications: Medication[];
  inventoryIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const available = useMemo(
    () => allMedications.filter((m) => !inventoryIds.has(m.id)),
    [allMedications, inventoryIds]
  );

  const filtered = useMemo(() => {
    if (!searchQuery) return available.slice(0, 50);
    return available.filter((m) =>
      m.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [available, searchQuery]);

  const handleAdd = (medicationId: string) => {
    startTransition(async () => {
      const result = await addMedicationToInventory(pharmacyId, medicationId);
      if (result.success) {
        toast.success('تمت الإضافة');
        onAdded();
      } else {
        toast.error(result.error || 'فشل الإضافة');
      }
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          borderRadius: '20px 20px 0 0',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, flex: 1 }}>
            إضافة دواء للكتالوج
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 32,
              height: 32,
              background: 'var(--paper-3)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن دواء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>
              {available.length === 0 ? 'كل الأدوية موجودة بالفعل' : 'لا توجد نتائج'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAdd(m.id)}
                  disabled={isPending}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 10,
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    cursor: isPending ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'start',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: 'var(--emerald-soft)',
                      color: 'var(--emerald)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Pill size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>
                      {m.name_ar}
                      {m.strength && (
                        <span style={{ fontSize: 10, color: 'var(--ink-3)', marginInlineStart: 4 }}>
                          {m.strength}
                        </span>
                      )}
                    </div>
                    {m.name_en && (
                      <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                        {m.name_en}
                        {m.manufacturer && ` · ${m.manufacturer}`}
                      </div>
                    )}
                  </div>
                  <Plus size={16} color="var(--emerald)" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
