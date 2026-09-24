import SearchClient from './SearchClient';
import { getServiceSwitches } from '@/lib/service-switches.server';
import { isEnabled, allSwitchableServices } from '@/lib/service-switches';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'البحث - Spir Medical',
  description: 'ابحث في الخدمات الطبية والفحوصات والأدوات',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  // البحث كان يعرض كلّ خدمةٍ في `services-v3.ts` كنتيجةٍ قابلةٍ للنقر، فكانت
  // الخدمة المطفأة تُبلَغ من هنا رغم إخفاء بطاقتها في الشبكة. نمرّر
  // المطفأةَ ليعرضها البحث «قريباً» بلا رابط.
  const switches = await getServiceSwitches();
  const disabledIds = allSwitchableServices()
    .filter((s) => !isEnabled(switches, s.id))
    .map((s) => s.id);

  return <SearchClient initialQuery={searchParams.q ?? ''} disabledIds={disabledIds} />;
}
