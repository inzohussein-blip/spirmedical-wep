'use client';

import { useState } from 'react';
import { Search, Star, User, MapPin, Phone, Calendar, Activity } from 'lucide-react';

interface Nurse {
  id: string;
  full_name: string | null;
  phone: string | null;
  governorate: string | null;
  gender: string | null;
  approval_status: string;
  created_at: string;
  ratingAvg: number;
  ratingCount: number;
  totalVisits: number;
}

interface Props {
  nurses: Nurse[];
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  approved: { label: 'موافَق عليه', bg: '#E1F5EE', color: '#04342C' },
  pending: { label: 'قيد المراجعة', bg: '#FAEEDA', color: '#412402' },
  rejected: { label: 'مرفوض', bg: '#FCEBEB', color: '#791F1F' },
  suspended: { label: 'موقوف', bg: '#F3F4F6', color: '#374151' },
};

export default function NursesAdminClient({ nurses }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'visits' | 'rating' | 'recent'>('visits');

  const filtered = nurses
    .filter((n) => {
      if (statusFilter && n.approval_status !== statusFilter) return false;
      if (genderFilter && n.gender !== genderFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          n.full_name?.toLowerCase().includes(q) ||
          n.phone?.includes(q) ||
          n.governorate?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'visits') return b.totalVisits - a.totalVisits;
      if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} strokeWidth={2.2} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--ink-3)',
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid var(--line)',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'var(--white)',
          }}
        >
          <option value="">كل الحالات</option>
          <option value="approved">موافَق</option>
          <option value="pending">قيد المراجعة</option>
          <option value="rejected">مرفوض</option>
          <option value="suspended">موقوف</option>
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid var(--line)',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'var(--white)',
          }}
        >
          <option value="">كل الأجناس</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'visits' | 'rating' | 'recent')}
          style={{
            padding: '10px 12px',
            border: '1px solid var(--line)',
            borderRadius: 10,
            fontSize: 13,
            fontFamily: 'inherit',
            background: 'var(--white)',
          }}
        >
          <option value="visits">الأكثر زيارات</option>
          <option value="rating">الأعلى تقييماً</option>
          <option value="recent">الأحدث تسجيلاً</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
            <User size={48} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>لا توجد نتائج</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)' }}>
                <th style={th}>الممرض</th>
                <th style={th}>المحافظة</th>
                <th style={th}>الهاتف</th>
                <th style={th}>الزيارات</th>
                <th style={th}>التقييم</th>
                <th style={th}>الحالة</th>
                <th style={th}>تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((nurse) => {
                const status = STATUS_META[nurse.approval_status] ?? STATUS_META.pending;
                const regDate = new Date(nurse.created_at).toLocaleDateString('ar-IQ', { 
                  day: 'numeric', month: 'short', year: 'numeric' 
                });
                
                return (
                  <tr key={nurse.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: nurse.gender === 'female' ? '#FCEBEB' : '#E1EBFA',
                          color: nurse.gender === 'female' ? '#A32D2D' : '#1E40AF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700,
                        }}>
                          {nurse.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {nurse.full_name || 'بدون اسم'}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                            {nurse.gender === 'female' ? '♀ أنثى' : '♂ ذكر'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={td}>
                      {nurse.governorate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-2)' }}>
                          <MapPin size={12} strokeWidth={2.2} aria-hidden />
                          {nurse.governorate}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={td}>
                      {nurse.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)' }}>
                          <Phone size={11} strokeWidth={2.2} aria-hidden />
                          {nurse.phone}
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, fontWeight: 700 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Activity size={12} strokeWidth={2.2} style={{ color: 'var(--emerald)' }} aria-hidden />
                        {nurse.totalVisits}
                      </div>
                    </td>
                    <td style={td}>
                      {nurse.ratingCount > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Star size={12} fill="#A57100" stroke="#A57100" aria-hidden />
                          <strong>{nurse.ratingAvg.toFixed(1)}</strong>
                          <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>({nurse.ratingCount})</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>—</span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 10,
                        fontWeight: 700,
                        background: status.bg,
                        color: status.color,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: 11, color: 'var(--ink-3)' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} strokeWidth={2.2} aria-hidden />
                        {regDate}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: 10,
  textAlign: 'right',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--ink-2)',
};

const td: React.CSSProperties = {
  padding: 10,
};
