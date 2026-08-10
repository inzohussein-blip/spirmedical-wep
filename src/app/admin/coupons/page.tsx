import { createClient } from '@/lib/supabase/server';
import { oneOfOr } from '@/lib/format/vocabulary';
import CouponsClient from './CouponsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الكوبونات · إدارة',
};

const DISCOUNT_TYPE = ['percentage', 'fixed'] as const;

export default async function CouponsPage() {
  const supabase = createClient();

  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>🎁 الكوبونات</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
        {coupons?.length ?? 0} كوبون
      </p>

      <CouponsClient
        coupons={(coupons ?? []).map((c) => ({
          id: c.id,
          code: c.code,
          description: c.description,
          discountType: oneOfOr(DISCOUNT_TYPE, c.discount_type, 'fixed'),
          createdAt: c.created_at ?? '',
          discountValue: c.discount_value,
          validUntil: c.valid_until,
          maxUses: c.max_uses,
          usedCount: c.used_count,
          isActive: c.is_active,
        }))}
      />
    </>
  );
}
