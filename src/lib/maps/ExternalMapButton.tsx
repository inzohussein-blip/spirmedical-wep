'use client';

import { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { MAP_PROVIDERS, buildMapUrl, type Coords, type MapProvider } from '@/lib/maps/providers';

/**
 * ════════════════════════════════════════════════════════════════════
 * 📍 ExternalMapButton (V25.37)
 * ════════════════════════════════════════════════════════════════════
 *
 * زرّ "موقع" يفتح bottom sheet
 * مع 4 خيارات: Google Maps / Waze / Apple Maps / OpenStreetMap
 *
 * Usage:
 *   <ExternalMapButton
 *     lat={33.31}
 *     lng={44.36}
 *     label="صيدلية الشفاء"
 *     variant="compact" | "full"
 *   />
 * ════════════════════════════════════════════════════════════════════
 */

interface Props {
  lat: number | null | undefined;
  lng: number | null | undefined;
  label?: string;
  description?: string;
  variant?: 'compact' | 'full';
  className?: string;
}

const PROVIDER_BRAND_COLORS: Record<MapProvider, string> = {
  google: '#4285F4',
  waze: '#33CCFF',
  apple: '#000000',
  osm: '#7EBC6F',
};

export default function ExternalMapButton({
  lat,
  lng,
  label,
  description,
  variant = 'compact',
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);

  // لو ما في موقع، نُخفي الزر
  if (lat == null || lng == null) return null;

  const coords: Coords = { lat, lng };

  const handleOpen = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setOpen(true);
  };

  const handleProviderClick = (provider: MapProvider) => {
    const url = buildMapUrl(provider, coords, label);
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleOpen}
          className={`ext-map-btn ext-map-btn-compact ${className}`}
          aria-label="فتح الموقع"
        >
          <MapPin size={14} aria-hidden />
          <span>موقع</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className={`ext-map-btn ext-map-btn-full ${className}`}
        >
          <MapPin size={16} aria-hidden />
          <span>افتح الموقع</span>
          <ExternalLink size={14} aria-hidden style={{ opacity: 0.6, marginInlineStart: 'auto' }} />
        </button>
      )}

      {open && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="ext-map-backdrop"
            aria-label="إغلاق"
            onClick={() => setOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="ext-map-sheet" role="dialog" aria-modal="true">
            <div className="ext-map-sheet-handle" aria-hidden="true" />

            <div className="ext-map-sheet-header">
              {label && <h3 className="ext-map-sheet-title">{label}</h3>}
              <p className="ext-map-sheet-desc">
                <MapPin size={12} aria-hidden style={{ verticalAlign: '-2px' }} />
                {' '}
                {description || 'افتح الموقع في تطبيقك المفضّل'}
              </p>
            </div>

            <div className="ext-map-providers">
              {MAP_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderClick(p.id)}
                  className="ext-map-provider"
                >
                  <span
                    className="ext-map-provider-icon"
                    style={{ background: `${PROVIDER_BRAND_COLORS[p.id]}15`, color: PROVIDER_BRAND_COLORS[p.id] }}
                    aria-hidden="true"
                  >
                    {p.id === 'google' && <GoogleMapsIcon />}
                    {p.id === 'waze' && <WazeIcon />}
                    {p.id === 'apple' && <AppleMapsIcon />}
                    {p.id === 'osm' && <OSMIcon />}
                  </span>
                  <span className="ext-map-provider-label">{p.label}</span>
                  <ExternalLink size={14} aria-hidden style={{ opacity: 0.4 }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ext-map-cancel"
            >
              إلغاء
            </button>
          </div>
        </>
      )}
    </>
  );
}

/* ── Icons inline (لا تعتمد على libraries) ── */

function GoogleMapsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C7.6 2 4 5.6 4 10c0 5.5 7 12 8 12s8-6.5 8-12c0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
    </svg>
  );
}

function WazeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 16c0 3 2 5 7 5s7-2 7-5"/>
      <circle cx="8" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
      <path d="M3 11C3 6 7 3 12 3s9 3 9 8c0 3-2 5-4 6"/>
    </svg>
  );
}

function AppleMapsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 11l-7 4-7-4V6l7-4 7 4v5zm0 0v6l-7 4-7-4v-6"/>
    </svg>
  );
}

function OSMIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 6v16l7-3 8 3 7-3V3l-7 3-8-3-7 3z"/>
      <line x1="8" y1="3" x2="8" y2="19"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  );
}
