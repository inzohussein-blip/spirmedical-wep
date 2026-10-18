/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🤖 Search Console: «تمّ الحظر باستخدام robots.txt» (16 تشرين الأول)
 *
 * كان robots.txt يحجب صفحاتِ التطبيق، والصفحاتُ العامّة تربط بها: يكتشفها Google ولا يزحفها،
 * فتُعدّ «محظورة» — أو «مُفهرَسة رغم الحظر» لأنّه لا يرى أيَّ noindex خلف الحظر. وكانت كلُّ صفحةٍ
 * تُرسَل بـ`X-Robots-Tag: index, follow` (vercel.json)، حتى `/login`.
 *
 * الآن: robots.txt يحجب `/api/` وحده (والإدارةُ لا تُذكر — تُخفى بـ404 وnoindex)، وما ليس عامّاً يُرسَل بـ`noindex` من proxy.ts.
 */
jest.mock('@/lib/supabase/middleware', () => ({
  updateSession: jest.fn(async () => NextResponse.next()),
}));

const ROOT = process.cwd();
const robots = require('@/app/robots').default;
const { proxy } = require('@/proxy');
const { isIndexablePath } = require('@/lib/seo/indexable');

const req = (path: string) => new NextRequest(new URL(path, 'https://www.spir-medical.com'), { headers: { host: 'www.spir-medical.com' } });

describe('🤖 robots.txt لا يحجب ما تربط به الصفحاتُ العامّة', () => {
  const r = robots();
  const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
  const disallows = new Set(rules.flatMap((x: { disallow?: string | string[] }) => [x.disallow ?? []].flat()));

  it.each(['/login', '/register', '/register/specialist', '/appointments/', '/services/', '/guest/', '/dashboard/'])(
    '🚨 %s غيرُ محجوب',
    (p) => expect(disallows.has(p)).toBe(false),
  );

  // لوحةُ الإدارة لا تُذكر في robots.txt (18 تشرين الأول): يقرؤه الجميع فكان يُعلن مسارَها، وهي «غير موجودة»
  // لغير المدير و`noindex` على كلّ حال (lib/auth/admin-gate.ts)
  it('/api/ محجوب، و/api/og مسموح، ولا ذكرَ للإدارة', () => {
    expect(disallows.has('/api/')).toBe(true);
    expect([...disallows].some((d) => String(d).includes('admin'))).toBe(false);
    const google = rules.find((x: { userAgent?: string | string[] }) => [x.userAgent].flat().includes('Googlebot'));
    expect([google.allow].flat()).toContain('/api/og');
  });

  it('لا Host ولا سطرٌ مكرَّر في مجموعة Googlebot', () => {
    expect(r.host).toBeUndefined();
    const google = rules.find((x: { userAgent?: string | string[] }) => [x.userAgent].flat().includes('Googlebot'));
    const allow = [google.allow].flat();
    expect(new Set(allow).size).toBe(allow.length);
  });
});

describe('🔎 noindex لما ليس عامّاً — من proxy', () => {
  it.each(['/login', '/register/specialist', '/appointments/new', '/services/hospitals', '/dashboard', '/guest', '/admin-login', '/forgot'])(
    '🚨 %s ← noindex',
    async (p) => {
      expect(isIndexablePath(p)).toBe(false);
      const res = await proxy(req(p));
      expect(res.headers.get('X-Robots-Tag')).toMatch(/noindex/);
    },
  );

  it.each(['/', '/about', '/home-blood-draw', '/faq', '/contact', '/blog', '/blog/x', '/legal/privacy', '/help/install'])(
    '%s يُفهرَس — بلا noindex',
    async (p) => {
      expect(isIndexablePath(p)).toBe(true);
      const res = await proxy(req(p));
      expect(res.headers.get('X-Robots-Tag')).toBeNull();
    },
  );

  it('🚨 vercel.json لا يفرض «index, follow» على كلّ صفحة', () => {
    expect(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).not.toMatch(/X-Robots-Tag/);
  });
});
