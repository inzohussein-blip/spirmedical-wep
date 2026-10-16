/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 🌐 أصلٌ واحد للموقع: https://www.spir-medical.com
 *
 * قِيس على Vercel (16 تشرين الأول): `spir-medical.com` يحوّل 308 إلى `www`، فالأصلُ الحقيقيّ
 * `www`. لكنّ `metadataBase` والخريطة وrobots وJSON-LD كانت تُعلن `spir-medical.com` بلا www —
 * فكلُّ canonical يشير إلى رابطٍ يُحوَّل، وGoogle يرى الصفحةَ تُعلن أصلاً غيرَ نفسها. و
 * `spirmedical-wep.vercel.app` نسخةٌ مطابقة تُخدَم 200 بلا تحويل = محتوى مكرَّر.
 */

jest.mock('@/lib/supabase/middleware', () => ({
  updateSession: jest.fn(async () => NextResponse.next()),
}));

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('🌐 canonicalOrigin', () => {
  const { canonicalOrigin, CANONICAL_HOST } = require('@/lib/seo/origin');

  it('🚨 النطاقُ بلا www يُرفع إلى www', () => {
    expect(canonicalOrigin('https://spir-medical.com')).toBe('https://www.spir-medical.com');
    expect(canonicalOrigin('https://spir-medical.com/')).toBe('https://www.spir-medical.com');
  });

  it('غيابُ المتغيّر أو فسادُه ← www', () => {
    expect(canonicalOrigin(undefined)).toBe(`https://${CANONICAL_HOST}`);
    expect(canonicalOrigin('not a url')).toBe(`https://${CANONICAL_HOST}`);
  });

  it('أصلٌ آخر صريح (معاينة، محلّيّ) يُحترَم ويُقصّ إلى الأصل', () => {
    expect(canonicalOrigin('http://127.0.0.1:3917/x')).toBe('http://127.0.0.1:3917');
  });
});

describe('🚨 ملفّاتُ الفهرسة تقرأ الأصلَ الواحد', () => {
  const files = [
    'src/app/layout.tsx',
    'src/app/sitemap.ts',
    'src/app/robots.ts',
    'src/components/seo/StructuredData.tsx',
    'src/lib/seo/coverage.ts',
    'src/app/(marketing)/blog/[slug]/page.tsx',
  ];

  it.each(files)('%s', (f) => {
    const s = read(f);
    expect(s).toMatch(/SITE_ORIGIN/);
    expect(s).not.toMatch(/NEXT_PUBLIC_SITE_URL/);
    expect(s).not.toMatch(/https:\/\/spir-medical\.com|spirmedical-wep\.vercel\.app/);
  });
});

describe('🔁 spirmedical-wep.vercel.app ← www', () => {
  const { proxy } = require('@/proxy');
  const req = (url: string, method = 'GET') => {
    const u = new URL(url);
    return new NextRequest(u, { method, headers: { host: u.host } });
  };

  it('🚨 الصفحةُ تُحوَّل 308 بمسارها واستعلامها', async () => {
    const res = await proxy(req('https://spirmedical-wep.vercel.app/home-blood-draw?utm=x'));
    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toBe('https://www.spir-medical.com/home-blood-draw?utm=x');
  });

  it('🚨 /api لا يُحوَّل (Webhook Meta، البوّابة، الكرون)', async () => {
    const res = await proxy(req('https://spirmedical-wep.vercel.app/api/whatsapp/inbound', 'POST'));
    expect(res.headers.get('location')).toBeNull();
    const get = await proxy(req('https://spirmedical-wep.vercel.app/api/whatsapp/webhook'));
    expect(get.headers.get('location')).toBeNull();
  });

  it('🚨 POST على صفحة لا يُحوَّل (إجراءاتُ الخادم)', async () => {
    const res = await proxy(req('https://spirmedical-wep.vercel.app/login', 'POST'));
    expect(res.status).not.toBe(308);
  });

  it('النطاقُ الأصليّ يمرّ بلا تحويل', async () => {
    const res = await proxy(req('https://www.spir-medical.com/home-blood-draw'));
    expect(res.headers.get('location')).toBeNull();
  });
});
