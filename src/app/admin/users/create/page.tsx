/**
 * ═══════════════════════════════════════════════════════════════
 * /admin/users/create — إنشاء حساب جديد
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreateUserClient from './CreateUserClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'إنشاء حساب جديد · إدارة',
};

export default async function CreateUserPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  // تحقّق من الصلاحيات
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    redirect('/admin');
  }

  return <CreateUserClient callerRole={profile.role} />;
}
