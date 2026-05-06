import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { sendOtp } from './actions';

const searchParamsSchema = z.object({
  error: z.string().max(500).optional(),
  redirect: z.string().max(500).optional(),
});

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  // Validation للـ searchParams (حماية من XSS عبر الـ URL)
  const params = searchParamsSchema.safeParse(searchParams);
  const error = params.success ? params.data.error : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald font-serif-italic text-3xl font-medium text-paper-3">
            س
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold">Spir Medical</span>
            <span className="text-xs text-ink-3">سباير ميديكال</span>
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل رقم هاتفك لنرسل لك رمز التحقق
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

          <form action={sendOtp} className="flex flex-col gap-5">
            <Input
              label="رقم الهاتف"
              type="tel"
              name="phone"
              placeholder="07XX XXX XXXX"
              dir="ltr"
              className="text-left"
              required
              autoComplete="tel"
              autoFocus
            />

            <Button type="submit" fullWidth size="lg">
              إرسال الرمز ←
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-3">
            بتسجيلك، أنت توافق على{' '}
            <Link href="#" className="text-emerald underline">
              شروط الاستخدام
            </Link>{' '}
            و{' '}
            <Link href="#" className="text-emerald underline">
              سياسة الخصوصية
            </Link>
          </p>
        </Card>

        <p className="mt-6 text-center text-sm text-ink-3">
          <Link href="/" className="hover:text-ink">
            ← العودة للرئيسية
          </Link>
        </p>
      </div>
    </main>
  );
}
