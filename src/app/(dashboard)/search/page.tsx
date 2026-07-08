import SearchClient from './SearchClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'البحث - Spir Medical',
  description: 'ابحث في الخدمات الطبية والفحوصات والأدوات',
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return <SearchClient initialQuery={searchParams.q ?? ''} />;
}
