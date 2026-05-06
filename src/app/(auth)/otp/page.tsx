import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { verifyOtp } from '../login/actions';

const searchParamsSchema = z.object({
  phone: z.string().min(10).max(20),
  error: z.string().max(500).optional(),
});

export default function OtpPage({
  searchParams,
}: {
  searchParams: { phone?: string; error?: string };
}) {
  const params = searchParamsSchema.safeParse(searchParams);

  if (!params.success) {
    redirect('/login');
  }

  const { phone, error } = params.data;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald font-serif-italic text-3xl font-medium text-paper-3">
            س
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold">Spir Medical</span>
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>تحقّق من رقم هاتفك</CardTitle>
            <CardDescription>
              أُرسل رمز مكوّن من ٦ أرقام إلى{' '}
              <span dir="ltr" className="inline-block font-mono font-bold text-ink">
                {phone}
              </span>
            </CardDescription>
          </CardHeader>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-rose-soft px-4 py-3 text-sm font-bold text-rose"
            >
              {error}
            </div>
          )}

          <form action={verifyOtp} className="flex flex-col gap-5">
            <input type="hidden" name="phone" value={phone} />
            <Input
              label="رمز التحقق"
              type="text"
              name="token"
              placeholder="000000"
              dir="ltr"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              minLength={6}
              pattern="\d{6}"
              inputMode="numeric"
              required
              autoComplete="one-time-code"
              autoFocus
            />

            <Button type="submit" fullWidth size="lg">
              تحقّق ←
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-3">
            لم يصلك الرمز؟{' '}
            <Link href="/login" className="font-bold text-emerald hover:underline">
              إعادة الإرسال
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
