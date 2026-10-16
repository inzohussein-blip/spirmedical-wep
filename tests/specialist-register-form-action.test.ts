/**
 * @jest-environment node
 */

/**
 * 🩺 `registerSpecialistForm`: خطأُ التحقّق يعود قيمةً لا توجيهاً.
 *
 * التوجيهُ إلى `?error=` كان يُعيد تركيبَ صفحة التسجيل فتُمحى الحقولُ والهويّةُ المختارة
 * (قِيس في متصفّحٍ حقيقيّ بعرض 360) — فيعيد المختصُّ كلَّ شيء لخطأٍ واحد.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const e = new Error('NEXT_REDIRECT') as Error & { digest: string };
    e.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw e;
  },
}));
jest.mock('@/lib/rate-limit', () => ({ checkRateLimit: async () => ({ allowed: false, retryAfterSeconds: 60 }) }));
jest.mock('@/lib/auth/request-helpers', () => ({
  ...jest.requireActual('@/lib/auth/request-helpers'),
  getClientIp: async () => '1.2.3.4',
}));

it('🚨 رفضٌ (حدّ المحاولات) ← { error } لا توجيه', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-placeholder-0000000000';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key-placeholder-00000000';
  const { registerSpecialistForm } = require('@/app/(auth)/register/actions');
  await expect(registerSpecialistForm(new FormData())).resolves.toEqual({
    error: 'محاولات كثيرة، حاول بعد 60 ثانية',
  });
});

it('توجيهُ النجاح يمرّ كما هو (يُعاد رميُه)', () => {
  const src = readFileSync(join(process.cwd(), 'src/app/(auth)/register/actions.ts'), 'utf8');
  const body = src.slice(src.indexOf('export async function registerSpecialistForm'));
  expect(body.slice(0, body.indexOf('\n}\n'))).toMatch(/throw err;/);
});

it('🚨 الصفحةُ تستدعي نسخةَ النموذج وتعرض خطأها', () => {
  const src = readFileSync(join(process.cwd(), 'src/app/(auth)/register/specialist/SpecialistRegisterClient.tsx'), 'utf8');
  expect(src).toMatch(/await registerSpecialistForm\(fd\)/);
  expect(src).toMatch(/setErrors\(\{ submit: result\.error \}\)/);
});
