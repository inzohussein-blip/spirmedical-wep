'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  ArrowRight, Search, MapPin, Phone, Map, Clock, Pill,
  CheckCircle2, XCircle, Filter, AlertCircle, Building2,
  MessageCircle, Star, Package,
} from 'lucide-react';
import ShareButton from '@/components/pwa/ShareButton';

interface Pharmacy {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string | null;
  phone: string;
  whatsapp: string | null;
  is_24h: boolean;
  opens_at: string | null;
  closes_at: string | null;
  is_verified: boolean;
  rating_avg: number;
  rating_count: number;
  description: string | null;
  has_emergency_section: boolean;
  accepts_insurance: boolean;
}

interface Medication {
  id: string;
  name_ar: string;
  name_en: string | null;
  generic_name: string | null;
  manufacturer: string | null;
  category: string;
  form: string | null;
  strength: string | null;
  package_size: string | null;
  requires_prescription: boolean;
  image_url: string | null;
}

interface InventoryItem {
  id: string;
  is_available: boolean;
  custom_price: number | null;
  brand_variant: string | null;
  notes: string | null;
  medication: Medication | null;
}

interface Props {
  pharmacy: Pharmacy;
  inventory: InventoryItem[];
}

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  analgesic:        { label: 'مسكنات', emoji: '💊' },
  antibiotic:       { label: 'مضادات حيوية', emoji: '🦠' },
  antihypertensive: { label: 'ضغط الدم', emoji: '❤️' },
  antidiabetic:     { label: 'السكري', emoji: '🩸' },
  cardiac:          { label: 'القلب', emoji: '💗' },
  respiratory:      { label: 'الجهاز التنفسي', emoji: '🫁' },
  gastric:          { label: 'الجهاز الهضمي', emoji: '🍽️' },
  dermatological:   { label: 'الجلد', emoji: '🧴' },
  vitamin:          { label: 'فيتامينات', emoji: '🌿' },
  cosmetic:         { label: 'مستحضرات تجميل', emoji: '✨' },
  baby:             { label: 'الأطفال', emoji: '👶' },
  first_aid:        { label: 'إسعافات', emoji: '🩹' },
  other:            { label: 'أخرى', emoji: '📦' },
};

export default function PharmacyDetailClient({ pharmacy, inventory }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      if (!item.medication) return false;
      const med = item.medication;

      const matchesSearch = !searchQuery ||
        med.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !selectedCategory || med.category === selectedCategory;
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && item.is_available) ||
        (availabilityFilter === 'unavailable' && !item.is_available);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [inventory, searchQuery, selectedCategory, availabilityFilter]);

  // إحصائيات سريعة
  const availableCount = inventory.filter((i) => i.is_available).length;
  const unavailableCount = inventory.length - availableCount;

  // الفئات الموجودة فقط
  const presentCategories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => i.medication && set.add(i.medication.category));
    return Array.from(set);
  }, [inventory]);

  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div className="scr-page-header">
          <Link
            href="/services/pharmacies"
            className="scr-back-btn"
            aria-label="العودة"
          >
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title" style={{ fontSize: 16 }}>
            {pharmacy.name}
          </h1>
          <ShareButton
            variant="icon"
            size="sm"
            title={pharmacy.name}
            text={`صيدلية على Spir Medical${pharmacy.city ? ` - ${pharmacy.city}` : ''}`}
            url={`/services/pharmacies/${pharmacy.id}`}
            label="مشاركة الصيدلية"
          />
        </div>

        {/* Pharmacy Info Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--emerald) 0%, var(--emerald-deep) 100%)',
            color: 'var(--paper-3)',
            borderRadius: 18,
            padding: 18,
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative pill */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              insetInlineEnd: -20,
              width: 100,
              height: 100,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '50%',
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pill size={26} strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                {pharmacy.name}
                {pharmacy.is_verified && (
                  <CheckCircle2 size={16} fill="currentColor" />
                )}
              </h2>
              <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0' }}>
                <MapPin size={11} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 2 }} />
                {pharmacy.city} · {pharmacy.district}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              position: 'relative',
            }}
          >
            <StatPill
              icon={<Clock size={14} />}
              label={pharmacy.is_24h ? '٢٤/٧' : `${pharmacy.opens_at?.slice(0, 5)} - ${pharmacy.closes_at?.slice(0, 5)}`}
              sub="ساعات العمل"
            />
            <StatPill
              icon={<Package size={14} />}
              label={`${availableCount}`}
              sub="دواء متوفر"
            />
            {pharmacy.rating_count > 0 && (
              <StatPill
                icon={<Star size={14} fill="currentColor" />}
                label={pharmacy.rating_avg.toFixed(1)}
                sub={`${pharmacy.rating_count} تقييم`}
              />
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              position: 'relative',
            }}
          >
            <a
              href={`tel:${pharmacy.phone}`}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.2)',
                color: 'var(--paper-3)',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Phone size={14} /> اتصال
            </a>
            {pharmacy.whatsapp && (
              <a
                href={`https://wa.me/${pharmacy.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'var(--paper-3)',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <MessageCircle size={14} /> واتساب
              </a>
            )}
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(pharmacy.name + ' ' + pharmacy.district + ' ' + pharmacy.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(255,255,255,0.2)',
                color: 'var(--paper-3)',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Map size={14} /> الموقع
            </a>
          </div>
        </div>

        {/* Description */}
        {pharmacy.description && (
          <div
            style={{
              background: 'var(--white)',
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--line)',
              marginBottom: 14,
              fontSize: 12,
              color: 'var(--ink-2)',
              lineHeight: 1.6,
            }}
          >
            {pharmacy.description}
          </div>
        )}

        {/* Catalog Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={16} />
            كتالوج الأدوية
          </h3>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>
            {filtered.length} / {inventory.length}
          </span>
        </div>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 8 }}>
          <div className="scr-search-icon" aria-hidden="true">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن دواء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Availability filter */}
        <div className="scr-filter-tabs" style={{ marginBottom: 8 }}>
          {([
            { id: 'all', label: `الكل (${inventory.length})` },
            { id: 'available', label: `متوفر (${availableCount})` },
            { id: 'unavailable', label: `غير متوفر (${unavailableCount})` },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAvailabilityFilter(tab.id)}
              className={`scr-filter-tab ${availabilityFilter === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        {presentCategories.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              marginBottom: 12,
              paddingBottom: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              style={{
                padding: '6px 12px',
                background: !selectedCategory ? 'var(--emerald)' : 'var(--white)',
                color: !selectedCategory ? 'var(--paper-3)' : 'var(--ink-2)',
                border: '1px solid',
                borderColor: !selectedCategory ? 'var(--emerald)' : 'var(--line)',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              الكل
            </button>
            {presentCategories.map((cat) => {
              const meta = CATEGORIES[cat] || { label: cat, emoji: '📦' };
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    background: selectedCategory === cat ? 'var(--emerald)' : 'var(--white)',
                    color: selectedCategory === cat ? 'var(--paper-3)' : 'var(--ink-2)',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--emerald)' : 'var(--line)',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Medications list */}
        {inventory.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Package size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لم تُسجّل أدوية بعد</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              لم تقم الصيدلية بإضافة الأدوية للكتالوج بعد
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <Search size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد نتائج</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              جرّب البحث بكلمة مفتاحية مختلفة
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((item) => {
              const med = item.medication;
              if (!med) return null;
              const catMeta = CATEGORIES[med.category] || { label: med.category, emoji: '📦' };
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--white)',
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: item.is_available ? 'var(--emerald-soft)' : 'var(--line)',
                    padding: 12,
                    display: 'flex',
                    gap: 12,
                    opacity: item.is_available ? 1 : 0.6,
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      background: 'var(--paper-3)',
                      borderRadius: 10,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    {med.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={med.image_url}
                        alt={med.name_ar}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 10,
                        }}
                      />
                    ) : (
                      <span>{catMeta.emoji}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                          {med.name_ar}
                          {med.strength && (
                            <span style={{ fontSize: 11, color: 'var(--ink-3)', marginInlineStart: 4 }}>
                              {med.strength}
                            </span>
                          )}
                        </div>
                        {med.name_en && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                            {med.name_en}
                            {med.manufacturer && ` · ${med.manufacturer}`}
                          </div>
                        )}
                      </div>
                      {/* Status badge */}
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: item.is_available ? 'var(--emerald)' : 'var(--rose-soft)',
                          color: item.is_available ? 'var(--paper-3)' : 'var(--rose)',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        {item.is_available ? (
                          <><CheckCircle2 size={10} /> متوفر</>
                        ) : (
                          <><XCircle size={10} /> غير متوفر</>
                        )}
                      </span>
                    </div>

                    {/* Tags */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                        marginTop: 6,
                      }}
                    >
                      {med.form && (
                        <span style={tagStyle()}>{med.form}</span>
                      )}
                      {med.package_size && (
                        <span style={tagStyle()}>{med.package_size}</span>
                      )}
                      {med.requires_prescription && (
                        <span
                          style={{
                            ...tagStyle(),
                            background: 'var(--amber-soft)',
                            color: 'var(--amber)',
                          }}
                        >
                          📋 وصفة
                        </span>
                      )}
                      {item.brand_variant && (
                        <span
                          style={{
                            ...tagStyle(),
                            background: 'var(--emerald-soft)',
                            color: 'var(--emerald)',
                          }}
                        >
                          {item.brand_variant}
                        </span>
                      )}
                    </div>

                    {/* Notes / Price */}
                    {(item.notes || item.custom_price) && (
                      <div
                        style={{
                          marginTop: 6,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {item.notes && (
                          <span
                            style={{
                              fontSize: 10,
                              color: 'var(--ink-3)',
                              flex: 1,
                            }}
                          >
                            💬 {item.notes}
                          </span>
                        )}
                        {item.custom_price && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: 'var(--emerald)',
                            }}
                          >
                            {item.custom_price.toLocaleString('ar-IQ')} د.ع
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div
          style={{
            marginTop: 20,
            padding: 14,
            background: 'var(--amber-soft)',
            color: 'var(--amber)',
            borderRadius: 12,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>تنبيه:</strong> هذا الكتالوج إرشادي فقط. للتأكد من توفّر الدواء يُنصح بالاتصال بالصيدلية قبل الذهاب. Spir Medical لا تبيع ولا توصّل الأدوية.
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

function tagStyle(): React.CSSProperties {
  return {
    fontSize: 10,
    padding: '3px 8px',
    background: 'var(--paper-3)',
    borderRadius: 6,
    fontWeight: 700,
    color: 'var(--ink-2)',
  };
}

function StatPill({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div
      style={{
        padding: '8px 6px',
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 10,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2, opacity: 0.85 }}>
        {icon}
      </div>
      <div style={{ fontSize: 12, fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 9, opacity: 0.75, marginTop: 1 }}>{sub}</div>
    </div>
  );
}
