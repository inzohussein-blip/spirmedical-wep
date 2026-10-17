'use client';

import { useState } from 'react';
import {
  IconSearch as Search, IconStar as Star, IconUser as User,
} from '@tabler/icons-react';
import { DataTable, StatusPill } from '@/components/admin-ui';

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

      <DataTable<Nurse>
        rows={filtered}
        rowKey={(n) => n.id}
        empty={<><User size={40} strokeWidth={1.4} style={{ opacity: 0.35 }} aria-hidden /><div>لا توجد نتائج</div></>}
        columns={[
          { key: 'name', header: 'الممرض', primary: true, render: (n) => (
            <span className="aui-person">
              <span className={`aui-avatar ${n.gender === 'female' ? 'aui-tone-rose' : 'aui-tone-violet'}`}>{n.full_name?.[0] || '?'}</span>
              <span className="aui-row-text">
                <span className="aui-row-title">{n.full_name || 'بدون اسم'}</span>
                <span className="aui-row-sub">{n.gender === 'female' ? 'أنثى' : 'ذكر'}</span>
              </span>
            </span>
          ) },
          { key: 'status', header: 'الحالة', render: (n) => <StatusPill status={n.approval_status} labels={{ pending: 'قيد المراجعة' }} /> },
          { key: 'gov', header: 'المحافظة', render: (n) => n.governorate ?? '—' },
          { key: 'phone', header: 'الهاتف', render: (n) => n.phone ? <a href={`tel:${n.phone}`} dir="ltr" className="aui-link">{n.phone}</a> : '—' },
          { key: 'visits', header: 'الزيارات', render: (n) => <strong>{n.totalVisits}</strong> },
          { key: 'rating', header: 'التقييم', render: (n) => n.ratingCount > 0
            ? <span className="aui-inline"><Star size={14} fill="#A57100" stroke="#A57100" aria-hidden /><strong>{n.ratingAvg.toFixed(1)}</strong><span className="aui-muted">({n.ratingCount})</span></span>
            : <span className="aui-muted">لا تقييم</span> },
          { key: 'date', header: 'تاريخ التسجيل', render: (n) => new Date(n.created_at).toLocaleDateString('ar-IQ-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' }) },
        ]}
      />
    </div>
  );
}
