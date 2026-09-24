'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch } from '@tabler/icons-react';

interface Props {
  placeholder?: string;
}

export default function SearchBarV3({ 
  placeholder = 'ابحث عن خدمة، طبيب، أو فحص...' 
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(() => {
      // كان يوجّه إلى `/services?q=` — وتلك الصفحة لا تستقبل `searchParams`
      // إطلاقاً، فيُلقى ما كتبه المستخدم في المهمَل ويصل خريطةً عامّة.
      // وصفحة البحث الحقيقية `/search` تقرأ `q` ولم يكن يشير إليها شيء.
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      style={{
        margin: '0 14px 14px',
        background: '#F1F3F4',
        borderRadius: 14,
        // لا حشوةَ رأسيّة: الحقلُ يملأ الارتفاع كلّه. كان ~٢١px داخل صندوقٍ
        // ~٦٤px، فاللمسُ فوقه أو تحته لا يُركّزه.
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 48,
      }}
    >
      <IconSearch size={18} stroke={2} color="#5F6368" style={{ flexShrink: 0 }} aria-hidden="true" />
      {/* لا زرَّ «بحث صوتي»: كان بلا onClick — عنصرٌ ظاهرٌ مُسمّى لا يفعل
          شيئاً. ومفتاحُ الإملاء في لوحة مفاتيح الهاتف يعمل في هذا الحقل. */}
      <input
        type="search"
        enterKeyHint="search"
        aria-label="ابحث عن خدمة أو طبيب أو فحص"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={isPending}
        style={{
          flex: 1,
          alignSelf: 'stretch',
          minHeight: 48,
          padding: '12px 0',
          background: 'transparent',
          border: 0,
          outline: 'none',
          fontSize: 13,
          fontFamily: 'inherit',
          color: '#202124',
          minWidth: 0,
        }}
      />
    </form>
  );
}
