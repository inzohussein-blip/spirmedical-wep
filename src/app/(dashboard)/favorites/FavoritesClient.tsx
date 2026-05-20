'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Star, Heart, Trash2, Stethoscope, Building2,
  Pill, FlaskConical, ChevronLeft, Loader2, Search,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import EmptyStateV2, { type EmptyVariant } from '@/components/ui/EmptyStateV2';
import { removeFavorite } from './actions';

interface Favorite {
  id: string;
  favorite_type: 'doctor' | 'hospital' | 'pharmacy' | 'medication' | 'lab_test';
  reference_id: string;
  display_name: string | null;
  display_subtitle: string | null;
  display_icon: string | null;
  display_meta: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  initialFavorites: Favorite[];
}

const TABS = [
  { id: 'all', label: 'الكل', icon: '⭐' },
  { id: 'doctor', label: 'الأطباء', icon: '👨‍⚕️' },
  { id: 'hospital', label: 'المستشفيات', icon: '🏥' },
  { id: 'pharmacy', label: 'الصيدليات', icon: '💊' },
  { id: 'lab_test', label: 'الفحوصات', icon: '🧪' },
  { id: 'medication', label: 'الأدوية', icon: '📋' },
] as const;

const TYPE_META: Record<string, { label: string; emoji: string; color: string; href: (id: string) => string }> = {
  doctor: {
    label: 'طبيب',
    emoji: '👨‍⚕️',
    color: 'var(--emerald)',
    href: (id) => `/services/doctors/${id}`,
  },
  hospital: {
    label: 'مستشفى',
    emoji: '🏥',
    color: 'var(--amber)',
    href: (id) => `/services/hospitals/${id}`,
  },
  pharmacy: {
    label: 'صيدلية',
    emoji: '💊',
    color: 'var(--emerald)',
    href: (id) => `/services/pharmacies/${id}`,
  },
  medication: {
    label: 'دواء',
    emoji: '💊',
    color: 'var(--ink-2)',
    href: () => `/services/pharmacies/search`,
  },
  lab_test: {
    label: 'فحص',
    emoji: '🧪',
    color: 'var(--rose)',
    href: () => `/appointments/new?service=blood-draw`,
  },
};

export default function FavoritesClient({ initialFavorites }: Props) {
  const router = useRouter();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  const filtered = activeTab === 'all'
    ? favorites
    : favorites.filter((f) => f.favorite_type === activeTab);

  const counts = {
    all: favorites.length,
    doctor: favorites.filter(f => f.favorite_type === 'doctor').length,
    hospital: favorites.filter(f => f.favorite_type === 'hospital').length,
    pharmacy: favorites.filter(f => f.favorite_type === 'pharmacy').length,
    lab_test: favorites.filter(f => f.favorite_type === 'lab_test').length,
    medication: favorites.filter(f => f.favorite_type === 'medication').length,
  };

  const handleRemove = (fav: Favorite) => {
    if (!confirm(`إزالة "${fav.display_name}" من المفضّلة؟`)) return;

    startTransition(async () => {
      const result = await removeFavorite(fav.id);
      if (result.success) {
        setFavorites(favorites.filter((f) => f.id !== fav.id));
        toast.success('تمت الإزالة');
      } else {
        toast.error(result.error || 'فشلت العملية');
      }
    });
  };

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">المفضّلة</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {favorites.length === 0
            ? 'لم تُضف شيئاً بعد'
            : `${favorites.length} ${favorites.length === 1 ? 'عنصر' : 'عناصر'} محفوظ`}
        </p>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginBottom: 14,
            paddingBottom: 4,
          }}
        >
          {TABS.map((tab) => {
            const count = counts[tab.id as keyof typeof counts];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 14px',
                  background: activeTab === tab.id ? 'var(--emerald)' : 'var(--white)',
                  color: activeTab === tab.id ? 'var(--paper-3)' : 'var(--ink-2)',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'var(--emerald)' : 'var(--line)',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'var(--paper-3)',
                      padding: '0 6px',
                      borderRadius: 8,
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((fav) => {
              const meta = TYPE_META[fav.favorite_type];
              const targetHref = meta.href(fav.reference_id);

              return (
                <article
                  key={fav.id}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderInlineStartWidth: 4,
                    borderInlineStartStyle: 'solid',
                    borderInlineStartColor: meta.color,
                  }}
                >
                  <Link
                    href={targetHref}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flex: 1,
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${meta.color}15`,
                        color: meta.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                    >
                      {fav.display_icon || meta.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                          {fav.display_name || 'بدون اسم'}
                        </h3>
                        <span
                          style={{
                            fontSize: 9,
                            padding: '1px 6px',
                            background: `${meta.color}15`,
                            color: meta.color,
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                      {fav.display_subtitle && (
                        <p style={{
                          fontSize: 11,
                          color: 'var(--ink-3)',
                          margin: '2px 0 0',
                        }}>
                          {fav.display_subtitle}
                        </p>
                      )}
                      <div
                        style={{
                          fontSize: 9,
                          color: 'var(--ink-3)',
                          marginTop: 4,
                        }}
                      >
                        أُضيف {new Date(fav.created_at).toLocaleDateString('ar-IQ')}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRemove(fav)}
                    disabled={isPending}
                    aria-label="إزالة"
                    style={{
                      width: 36,
                      height: 36,
                      background: 'var(--rose-soft)',
                      color: 'var(--rose)',
                      border: 'none',
                      borderRadius: 8,
                      cursor: isPending ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════════════
function EmptyState({ activeTab }: { activeTab: string }) {
  const variantMap: Record<string, { variant: EmptyVariant; ctaLabel: string; href: string }> = {
    all: {
      variant: 'favorites',
      ctaLabel: 'تصفّح الأطباء',
      href: '/services/doctors',
    },
    doctor: {
      variant: 'doctors',
      ctaLabel: 'تصفّح الأطباء',
      href: '/services/doctors',
    },
    hospital: {
      variant: 'hospitals',
      ctaLabel: 'تصفّح المستشفيات',
      href: '/services/hospitals',
    },
    pharmacy: {
      variant: 'pharmacies',
      ctaLabel: 'تصفّح الصيدليات',
      href: '/services/pharmacies',
    },
    lab_test: {
      variant: 'tests',
      ctaLabel: 'حجز فحص',
      href: '/appointments/new?service=blood-draw',
    },
    medication: {
      variant: 'inbox',
      ctaLabel: 'بحث عن دواء',
      href: '/services/pharmacies/search',
    },
  };

  const cfg = variantMap[activeTab] || variantMap.all;

  return (
    <EmptyStateV2
      variant={cfg.variant}
      cta={{ label: cfg.ctaLabel, href: cfg.href }}
    />
  );
}
