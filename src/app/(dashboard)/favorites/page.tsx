// ═══════════════════════════════════════════════════════════════
// ⭐ صفحة المفضّلة (V25.11)
// ═══════════════════════════════════════════════════════════════
// تم استبدال Mock Data بقاعدة بيانات حقيقية
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import FavoritesClient from './FavoritesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'المفضّلة - Spir Medical' };

export default async function FavoritesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // جلب كل المفضّلات
  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <FavoritesClient initialFavorites={favorites || []} />;
}
