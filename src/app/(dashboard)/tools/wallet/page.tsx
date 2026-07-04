// ═══════════════════════════════════════════════════════════════
// 💰 المحفظة + نقاط الولاء (V25.11)
// ═══════════════════════════════════════════════════════════════
// تم استبدال Mock Data بنظام حقيقي
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WalletClient from './WalletClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'المحفظة - Spir Medical' };

export default async function WalletPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // جلب بيانات المستخدم
  const { data: profile } = await supabase
    .from('users')
    .select('wallet_balance, loyalty_points, loyalty_tier')
    .eq('id', user.id)
    .single();

  // جلب آخر 20 معاملة
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const walletBalance = (profile as { wallet_balance?: number })?.wallet_balance ?? 0;
  const loyaltyPoints = (profile as { loyalty_points?: number })?.loyalty_points ?? 0;
  const loyaltyTier = (profile as { loyalty_tier?: string })?.loyalty_tier ?? 'silver';

  return (
    <WalletClient
      walletBalance={walletBalance}
      loyaltyPoints={loyaltyPoints}
      loyaltyTier={loyaltyTier}
      transactions={transactions || []}
    />
  );
}
