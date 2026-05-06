import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { signOut } from '../(auth)/login/actions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ink text-paper-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber font-serif-italic text-2xl font-medium text-paper-3">
              س
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold">Spir Medical</span>
              <span className="text-xs text-amber-soft">لوحة الإدارة</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm hover:bg-paper-3/10"
            >
              ← لوحة المستخدم
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-paper-3/20 px-4 py-2 text-sm font-bold hover:bg-paper-3/10"
              >
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
