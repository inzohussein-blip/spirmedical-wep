// ═══════════════════════════════════════════════════════════════
// 🔍 صفحة بحث عن دواء (V25.7)
// ═══════════════════════════════════════════════════════════════
// تعرض كل الصيدليات التي يتوفر فيها الدواء المبحوث عنه
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';
export const metadata = { title: 'بحث عن دواء - Spir Medical' };

import SearchClient from './SearchClient';

export default function MedicationSearchPage() {
  return <SearchClient />;
}
