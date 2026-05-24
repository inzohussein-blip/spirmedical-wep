'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  IconSearch, IconFilter, IconCheck, IconX, IconStar,
  IconMapPin, IconCurrencyDollar, IconEdit, IconShield,
} from '@tabler/icons-react';
import {
  toggleVerifyPhysio, toggleActivePhysio,
} from './actions';

interface Physio {
  id: string;
  full_name: string;
  title: string;
  gender: string | null;
  bio: string | null;
  years_experience: number;
  specialties: string[];
  cities: string[];
  home_visit_price: number;
  clinic_visit_price: number;
  rating_avg: number;
  rating_count: number;
  total_sessions: number;
  is_verified: boolean;
  is_active: boolean;
  available_for_home: boolean;
  available_for_clinic: boolean;
  created_at: string;
}

interface Props {
  physios: Physio[];
}

const SPECIALTY_LABELS: Record<string, string> = {
  sports: 'إصابات رياضية',
  orthopedic: 'عظام',
  neurological: 'أعصاب',
  pediatric: 'أطفال',
  geriatric: 'كبار السن',
  post_surgery: 'ما بعد العمليات',
  back_pain: 'آلام الظهر',
  joint_pain: 'آلام المفاصل',
};

export default function PhysioAdminClient({ physios: initialPhysios }: Props) {
  const [physios, setPhysios] = useState(initialPhysios);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'inactive'>('all');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return physios.filter((p) => {
      const matchSearch = !search || 
        p.full_name.toLowerCase().includes(search.toLowerCase()) ||
        p.cities.some(c => c.toLowerCase().includes(search.toLowerCase()));
      
      const matchFilter =
        filter === 'all' ||
        (filter === 'verified' && p.is_verified) ||
        (filter === 'unverified' && !p.is_verified) ||
        (filter === 'inactive' && !p.is_active);
      
      return matchSearch && matchFilter;
    });
  }, [physios, search, filter]);

  function handleVerify(id: string, currentStatus: boolean) {
    startTransition(async () => {
      const result = await toggleVerifyPhysio(id, !currentStatus);
      if (result.ok) {
        setPhysios((prev) => prev.map((p) => 
          p.id === id ? { ...p, is_verified: !currentStatus } : p
        ));
        setFeedback(currentStatus ? 'تم إلغاء الاعتماد' : 'تم الاعتماد بنجاح');
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  function handleActive(id: string, currentStatus: boolean) {
    startTransition(async () => {
      const result = await toggleActivePhysio(id, !currentStatus);
      if (result.ok) {
        setPhysios((prev) => prev.map((p) => 
          p.id === id ? { ...p, is_active: !currentStatus } : p
        ));
        setFeedback(currentStatus ? 'تم التعطيل' : 'تم التفعيل');
        setTimeout(() => setFeedback(null), 2000);
      }
    });
  }

  return (
    <div>
      {feedback && (
        <div style={{
          padding: '10px 14px',
          background: '#E6F3EF',
          color: '#04342C',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <IconCheck size={16} stroke={2.5} />
          {feedback}
        </div>
      )}

      {/* Search + Filters */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{
          flex: 1, minWidth: 240,
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: '#F1F3F4',
          borderRadius: 12,
        }}>
          <IconSearch size={18} stroke={2} color="#5F6368" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو المدينة..."
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              fontSize: 13, fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <FilterChip label="الكل" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="معتمد" active={filter === 'verified'} onClick={() => setFilter('verified')} />
          <FilterChip label="غير معتمد" active={filter === 'unverified'} onClick={() => setFilter('unverified')} />
          <FilterChip label="معطّل" active={filter === 'inactive'} onClick={() => setFilter('inactive')} />
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#5F6368', marginBottom: 12 }}>
        {filtered.length} نتيجة من {physios.length}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            background: '#FFFFFF', border: '1px dashed #DADCE0',
            borderRadius: 14, color: '#5F6368', fontSize: 14,
          }}>
            لا توجد نتائج
          </div>
        ) : filtered.map((p) => (
          <div
            key={p.id}
            style={{
              background: '#FFFFFF',
              border: '1px solid #DADCE0',
              borderRadius: 14,
              padding: 16,
              opacity: p.is_active ? 1 : 0.65,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              flexWrap: 'wrap',
            }}>
              {/* Avatar */}
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'linear-gradient(135deg, #01875F, #056559)',
                color: '#fff',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 900, fontFamily: 'Tajawal, sans-serif',
                flexShrink: 0,
              }}>
                {p.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#202124' }}>
                    {p.title} {p.full_name}
                  </h3>
                  {p.is_verified && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 2,
                      padding: '2px 8px', background: '#E8F0FE', color: '#1A73E8',
                      borderRadius: 10, fontSize: 10, fontWeight: 700,
                    }}>
                      <IconShield size={10} stroke={2.5} fill="currentColor" />
                      معتمد
                    </span>
                  )}
                  {!p.is_active && (
                    <span style={{
                      padding: '2px 8px', background: '#FCE8E6', color: '#8B1240',
                      borderRadius: 10, fontSize: 10, fontWeight: 700,
                    }}>
                      معطّل
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: '#5F6368', flexWrap: 'wrap' }}>
                  <span>
                    {p.years_experience} سنوات خبرة
                  </span>
                  {p.cities.length > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <IconMapPin size={11} stroke={2.2} />
                      {p.cities.join('، ')}
                    </span>
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <IconStar size={11} stroke={2.2} fill="#FBBC04" color="#FBBC04" />
                    {p.rating_avg.toFixed(1)} ({p.rating_count})
                  </span>
                  <span>
                    {p.total_sessions} جلسة
                  </span>
                </div>

                {p.specialties.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {p.specialties.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        style={{
                          padding: '2px 8px',
                          background: '#F1F3F4',
                          borderRadius: 8,
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#3C4043',
                        }}
                      >
                        {SPECIALTY_LABELS[s] || s}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11 }}>
                  {p.available_for_home && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#5F6368' }}>
                      <IconCurrencyDollar size={11} stroke={2.2} />
                      منزلي: <strong style={{ color: '#01875F' }}>{p.home_visit_price.toLocaleString('ar-IQ')}</strong>
                    </span>
                  )}
                  {p.available_for_clinic && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#5F6368' }}>
                      <IconCurrencyDollar size={11} stroke={2.2} />
                      عيادة: <strong style={{ color: '#01875F' }}>{p.clinic_visit_price.toLocaleString('ar-IQ')}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 110 }}>
                <button
                  type="button"
                  onClick={() => handleVerify(p.id, p.is_verified)}
                  disabled={isPending}
                  style={{
                    padding: '6px 12px',
                    background: p.is_verified ? '#FCE8E6' : '#E8F0FE',
                    color: p.is_verified ? '#8B1240' : '#1A73E8',
                    border: 0, borderRadius: 8,
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}
                >
                  {p.is_verified ? (
                    <><IconX size={12} stroke={2.5} /> إلغاء الاعتماد</>
                  ) : (
                    <><IconCheck size={12} stroke={2.5} /> اعتماد</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleActive(p.id, p.is_active)}
                  disabled={isPending}
                  style={{
                    padding: '6px 12px',
                    background: p.is_active ? '#FEF7E0' : '#E6F3EF',
                    color: p.is_active ? '#B06000' : '#04342C',
                    border: 0, borderRadius: 8,
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {p.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ 
  label, active, onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        background: active ? '#01875F' : '#F1F3F4',
        color: active ? '#FFFFFF' : '#3C4043',
        border: 0,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
