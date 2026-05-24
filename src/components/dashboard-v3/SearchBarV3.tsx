'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconSearch, IconMicrophone } from '@tabler/icons-react';

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
      router.push(`/services?q=${encodeURIComponent(query.trim())}`);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        margin: '0 14px 14px',
        background: '#F1F3F4',
        borderRadius: 14,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
      }}
    >
      <IconSearch size={18} stroke={2} color="#5F6368" style={{ flexShrink: 0 }} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={isPending}
        style={{
          flex: 1,
          background: 'transparent',
          border: 0,
          outline: 'none',
          fontSize: 13,
          fontFamily: 'inherit',
          color: '#202124',
          minWidth: 0,
        }}
      />
      <button
        type="button"
        aria-label="بحث صوتي"
        style={{
          background: 'transparent',
          border: 0,
          padding: 4,
          cursor: 'pointer',
          color: '#01875F',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconMicrophone size={18} stroke={2} />
      </button>
    </form>
  );
}
