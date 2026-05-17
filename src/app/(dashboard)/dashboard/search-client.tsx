'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="scr-search" role="search">
      <div className="scr-search-icon" aria-hidden="true">⌕</div>
      <input
        type="search"
        placeholder="ابحث عن خدمة، طبيب، أو فحص..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="البحث"
      />
      <button
        type="button"
        className="scr-search-shortcut"
        aria-label="بحث صوتي"
      >
        🎤
      </button>
    </form>
  );
}
