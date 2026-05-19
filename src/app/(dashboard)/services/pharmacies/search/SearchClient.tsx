'use client';

import Link from 'next/link';
import { useState, useEffect, useTransition } from 'react';
import {
  ArrowRight, Search, Pill, MapPin, CheckCircle2, Phone,
  AlertCircle, Loader2, Package,
} from 'lucide-react';
import { searchMedicationAvailability } from './actions';

interface SearchResult {
  medication: {
    id: string;
    name_ar: string;
    name_en: string | null;
    generic_name: string | null;
    manufacturer: string | null;
    strength: string | null;
    image_url: string | null;
  };
  available_pharmacies: Array<{
    inventory_id: string;
    pharmacy_id: string;
    pharmacy_name: string;
    city: string;
    district: string;
    phone: string;
    is_24h: boolean;
    custom_price: number | null;
    brand_variant: string | null;
    notes: string | null;
  }>;
}

const CITIES = ['الكل', 'بغداد', 'البصرة', 'الموصل', 'النجف', 'كربلاء', 'أربيل'];

export default function SearchClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const performSearch = (query: string, city: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    startTransition(async () => {
      const found = await searchMedicationAvailability(
        query.trim(),
        city === 'الكل' ? null : city
      );
      setResults(found);
      setHasSearched(true);
    });
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery, selectedCity);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCity]);

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
          <h1 className="scr-page-title">بحث عن دواء</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          سنعرض لك الصيدليات التي يتوفر فيها الدواء
        </p>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon" aria-hidden="true">
            {isPending ? (
              <Loader2 size={16} strokeWidth={2.4} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} strokeWidth={2.4} />
            )}
          </div>
          <input
            type="search"
            placeholder="اسم الدواء (مثلاً: بنادول، Panadol)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* City filter */}
        <div className="scr-filter-pills">
          {CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`scr-filter-pill ${selectedCity === city ? 'active' : ''}`}
            >
              {city}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          {/* Empty state */}
          {!hasSearched && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
              }}
            >
              <Pill
                size={56}
                color="var(--ink-3)"
                strokeWidth={1.5}
                style={{ marginBottom: 12, opacity: 0.5 }}
              />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>
                ابدأ بكتابة اسم الدواء
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  marginTop: 6,
                  lineHeight: 1.6,
                }}
              >
                مثال: بنادول، Augmentin، حبوب ضغط، شراب سعال
              </p>
            </div>
          )}

          {/* No results */}
          {hasSearched && !isPending && results.length === 0 && (
            <div
              style={{
                padding: 24,
                background: 'var(--rose-soft)',
                borderRadius: 12,
                textAlign: 'center',
              }}
            >
              <AlertCircle size={32} color="var(--rose)" style={{ marginBottom: 8 }} />
              <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--rose)' }}>
                لم نجد &quot;{searchQuery}&quot; متوفّراً
              </h3>
              <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
                {selectedCity !== 'الكل'
                  ? 'جرّب تغيير المدينة أو اسم الدواء'
                  : 'لا توجد صيدليات تعرضه حالياً - اتصل بصيدلية مباشرة'}
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--ink-3)' }}>
                {results.length} {results.length === 1 ? 'دواء' : 'أدوية'} متوفّر/ة
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.map((result) => (
                  <div
                    key={result.medication.id}
                    style={{
                      background: 'var(--white)',
                      borderRadius: 14,
                      border: '1px solid var(--line)',
                      padding: 14,
                    }}
                  >
                    {/* Medication header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                        paddingBottom: 10,
                        borderBottom: '1px solid var(--line)',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: 'var(--emerald-soft)',
                          color: 'var(--emerald)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {result.medication.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={result.medication.image_url}
                            alt={result.medication.name_ar}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 10,
                            }}
                          />
                        ) : (
                          <Pill size={24} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 900 }}>
                          {result.medication.name_ar}
                          {result.medication.strength && (
                            <span style={{ fontSize: 12, color: 'var(--ink-3)', marginInlineStart: 6 }}>
                              {result.medication.strength}
                            </span>
                          )}
                        </div>
                        {result.medication.name_en && (
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                            {result.medication.name_en}
                            {result.medication.manufacturer && ` · ${result.medication.manufacturer}`}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          background: 'var(--emerald)',
                          color: 'var(--paper-3)',
                          borderRadius: 100,
                          flexShrink: 0,
                        }}
                      >
                        {result.available_pharmacies.length} صيدلية
                      </span>
                    </div>

                    {/* Available pharmacies */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.available_pharmacies.map((p) => (
                        <Link
                          key={p.inventory_id}
                          href={`/services/pharmacies/${p.pharmacy_id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: 10,
                            background: 'var(--paper-3)',
                            borderRadius: 10,
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <CheckCircle2
                            size={18}
                            color="var(--emerald)"
                            fill="var(--emerald-soft)"
                            strokeWidth={2.2}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>
                              {p.pharmacy_name}
                              {p.is_24h && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    marginInlineStart: 6,
                                    padding: '2px 6px',
                                    background: 'var(--emerald)',
                                    color: 'var(--paper-3)',
                                    borderRadius: 4,
                                    fontWeight: 800,
                                  }}
                                >
                                  ٢٤/٧
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'var(--ink-3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 1,
                              }}
                            >
                              <MapPin size={10} />
                              {p.city} · {p.district}
                              {p.brand_variant && (
                                <span
                                  style={{
                                    marginInlineStart: 6,
                                    padding: '1px 6px',
                                    background: 'var(--emerald-soft)',
                                    color: 'var(--emerald)',
                                    borderRadius: 4,
                                    fontWeight: 700,
                                  }}
                                >
                                  {p.brand_variant}
                                </span>
                              )}
                            </div>
                            {p.notes && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: 'var(--ink-3)',
                                  marginTop: 2,
                                  fontStyle: 'italic',
                                }}
                              >
                                💬 {p.notes}
                              </div>
                            )}
                          </div>
                          {p.custom_price && (
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: 'var(--emerald)',
                                flexShrink: 0,
                              }}
                            >
                              {p.custom_price.toLocaleString('ar-IQ')} د.ع
                            </div>
                          )}
                          <a
                            href={`tel:${p.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="اتصال"
                            style={{
                              width: 32,
                              height: 32,
                              background: 'var(--emerald)',
                              color: 'var(--paper-3)',
                              borderRadius: 8,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Phone size={14} />
                          </a>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 80 }} />
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
