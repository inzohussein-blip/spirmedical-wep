// ═══════════════════════════════════════════════════════════════
// 🏆 صفحة المكافآت - Loyalty + Referral (V25.22)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RewardsClient from './RewardsClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'المكافآت والإحالات - Spir Medical',
  description: 'برنامج الولاء + كود الإحالة الخاص بك',
};

export default async function RewardsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // بيانات المستخدم
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, loyalty_points, loyalty_tier, wallet_balance')
    .eq('id', user.id)
    .single();

  // معالم الولاء
  const { data: milestones } = await supabase
    .from('loyalty_milestones')
    .select('*')
    .eq('is_active', true)
    .order('min_points', { ascending: true });

  // كود الإحالة
  const { data: referralCode } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // الإحالات الناجحة
  const { data: referrals, count: referralCount } = await supabase
    .from('referrals')
    .select('id, status, created_at, referrer_reward', { count: 'exact' })
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <RewardsClient
      userId={user.id}
      userName={profile?.full_name || ''}
      loyaltyPoints={profile?.loyalty_points || 0}
      currentTier={profile?.loyalty_tier || 'silver'}
      walletBalance={profile?.wallet_balance || 0}
      milestones={milestones || []}
      referralCode={referralCode?.code || null}
      referrals={referrals || []}
      referralCount={referralCount || 0}
    />
  );
}
