import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../../../(auth)/login/actions';
import { PROVIDER_META, isProviderType } from '@/lib/providers';
import ProviderAccountForm from './ProviderAccountForm';

export const metadata = { title: 'حسابي · نافذة الخدمة' };
export const dynamic = 'force-dynamic';

export default async function ProviderAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: p } = await supabase
    .from('users')
    .select('full_name, phone, provider_type, clinic_name, clinic_city, governorate')
    .eq('id', user.id)
    .single();
  const meta = isProviderType(p?.provider_type) ? PROVIDER_META[p.provider_type] : null;

  return (
    <main className="app-screen">
      <div className="scr-content pv">
        <h1 className="pv-title">حسابي</h1>
        <p className="pv-note">{meta ? `نوعُ الحساب: ${meta.label} — يغيّره المدير وحده.` : 'معاينةُ المدير.'}</p>
        <ProviderAccountForm
          clinicName={p?.clinic_name ?? ''}
          city={p?.clinic_city ?? ''}
          governorate={p?.governorate ?? ''}
          ownerName={p?.full_name ?? ''}
          nameLabel={meta?.nameLabel ?? 'اسمُ المنشأة'}
        />
        <form action={signOut}>
          <button type="submit" className="pv-btn pv-btn-ghost">تسجيل الخروج</button>
        </form>
      </div>
    </main>
  );
}
