import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '../(auth)/login/actions';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald font-serif-italic text-2xl font-medium text-paper-3">
              س
            </div>
            <span className="font-extrabold">Spir Medical</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2"
            >
              لوحة التحكم
            </Link>
            <Link
              href="/appointments"
              className="rounded-lg px-4 py-2 text-sm font-bold text-ink-2 hover:bg-paper-2"
            >
              الحجوزات
            </Link>
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                className="rounded-lg px-4 py-2 text-sm font-bold text-amber hover:bg-amber-soft"
              >
                الإدارة
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-3 md:inline-block">
              {profile?.full_name ?? 'مستخدم'}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-ink/10 px-4 py-2 text-sm font-bold hover:bg-paper-2"
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
