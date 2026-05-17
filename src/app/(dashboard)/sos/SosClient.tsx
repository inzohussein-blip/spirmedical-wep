'use client';

import { useState } from 'react';
import {
  MapPin, CheckCircle2, AlertTriangle, Loader2, AlertOctagon,
} from 'lucide-react';

interface Props {
  userName: string;
  userPhone: string;
}

export default function SosClient({ userName, userPhone }: Props) {
  const [status, setStatus] = useState<'idle' | 'fetching' | 'ready' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  function getLocation() {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    setStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ready');
      },
      (err) => {
        setStatus('error');
        setErrorMsg(err.code === 1 ? 'تم رفض إذن الموقع' : 'تعذّر تحديد الموقع');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function sendLocation() {
    if (!coords) return;
    const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const message = `[طوارئ]\nالاسم: ${userName || 'مستخدم سباير ميديكال'}\nالموبايل: ${userPhone || '—'}\nالموقع: ${mapsUrl}`;
    // فتح WhatsApp مع الرسالة جاهزة
    const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(wa, '_blank');
  }

  return (
    <button
      type="button"
      onClick={status === 'ready' ? sendLocation : getLocation}
      className="sos-gps-card"
      style={{ cursor: 'pointer', width: '100%' }}
    >
      <div className="sos-gps-icon" aria-hidden="true">
        {status === 'fetching' ? (
          <Loader2 size={24} strokeWidth={2.2} style={{ animation: 'spin-smooth 1s linear infinite' }} />
        ) : status === 'ready' ? (
          <CheckCircle2 size={24} strokeWidth={2.2} />
        ) : status === 'error' ? (
          <AlertTriangle size={24} strokeWidth={2.2} />
        ) : (
          <MapPin size={24} strokeWidth={2.2} />
        )}
      </div>
      <div className="sos-gps-content">
        <div className="sos-gps-title">
          {status === 'idle' && 'إرسال موقعي للإسعاف'}
          {status === 'fetching' && 'جارٍ تحديد الموقع...'}
          {status === 'ready' && 'موقعي جاهز · اضغط للمشاركة'}
          {status === 'error' && 'تعذّر تحديد الموقع'}
        </div>
        <div className="sos-gps-sub">
          {status === 'idle' && 'تحديد GPS تلقائي + مشاركة'}
          {status === 'fetching' && 'يستغرق ثوانٍ معدودة'}
          {status === 'ready' && coords && `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
          {status === 'error' && errorMsg}
        </div>
      </div>
      <div className="sos-gps-arrow" aria-hidden="true">←</div>
    </button>
  );
}
