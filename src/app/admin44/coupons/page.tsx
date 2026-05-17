import { createClient } from '@/lib/supabase/server';
import CouponsClient from './CouponsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'الكوبونات · إدارة',
};

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
          discountType: c.discount_type,
          discountValue: c.discount_value,
          validUntil: c.valid_until,
          maxUses: c.max_uses,
          usedCount: c.used_count,
          isActive: c.is_active,
          createdAt: c.created_at,
        }))}
      />
    </>
  );
}
