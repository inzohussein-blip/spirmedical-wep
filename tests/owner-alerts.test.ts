/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🚨 بريدٌ للمالك حين يتعطّل عملٌ مُجدوَل
 *
 * في 25 أيلول فشلت رسائلُ واتساب كلُّها (توكن Meta مرفوض) ولم يعلم أحد:
 * المسارُ أعاد 200 لأنّ «فشلَ التسليم» ليس عطلاً فيه. الآن:
 *   • كلُّ مسار كرون ملفوفٌ بـ`withCronAlert` (5xx أو استثناء → بريد).
 *   • والمعالجُ يُنبّه عند أيّ تسليمٍ فاشل، بنصّ آخر خطأ.
 */

const fetchMock = jest.fn();
const realFetch = global.fetch;

beforeEach(() => {
  jest.resetModules();
  fetchMock.mockReset().mockResolvedValue(new Response('{}', { status: 200 }));
  global.fetch = fetchMock as unknown as typeof fetch;
  process.env.RESEND_API_KEY = 're_test';
  process.env.ADMIN_OWNER_EMAIL = 'owner@example.com';
});
afterAll(() => { global.fetch = realFetch; });

const req = (path = '/api/cron/x') => {
  const { NextRequest } = require('next/server');
  return new NextRequest(`https://spir-medical.com${path}`);
};
const sentBodies = () => fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

describe('alertOwner', () => {
  it('🚨 يرسل إلى ADMIN_OWNER_EMAIL عبر Resend', async () => {
    const { alertOwner } = await import('@/lib/ops/alert-owner');
    expect(await alertOwner('اختبار', ['سطر'])).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails');
    expect(sentBodies()[0]).toMatchObject({ to: 'owner@example.com', subject: '[Spir] اختبار' });
    expect(sentBodies()[0].text).toContain('سطر');
  });

  it('يصمت بلا إعداد ولا يرمي', async () => {
    delete process.env.ADMIN_OWNER_EMAIL;
    const { alertOwner } = await import('@/lib/ops/alert-owner');
    expect(await alertOwner('x', [])).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('عطلُ Resend لا يرمي', async () => {
    fetchMock.mockRejectedValue(new Error('network'));
    const { alertOwner } = await import('@/lib/ops/alert-owner');
    await expect(alertOwner('x', [])).resolves.toBe(false);
  });
});

describe('withCronAlert', () => {
  it.each([
    [500, 1],
    [503, 1],
    [200, 0],
    [401, 0],
  ])('🚨 حالة %i → %i بريد', async (status, emails) => {
    const { withCronAlert } = await import('@/lib/ops/alert-owner');
    const h = withCronAlert('x', async () => new Response('{"error":"rpc_failed"}', { status }));
    const res = await h(req());
    expect(res.status).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(emails);
    if (emails) expect(sentBodies()[0].text).toContain('rpc_failed');
  });

  it('🚨 استثناءٌ مرميّ → بريد و500', async () => {
    const { withCronAlert } = await import('@/lib/ops/alert-owner');
    const h = withCronAlert('x', async () => { throw new Error('boom'); });
    const res = await h(req());
    expect(res.status).toBe(500);
    expect(sentBodies()[0].text).toContain('boom');
  });
});

describe('كلُّ مسارٍ مُجدوَلٍ ملفوف', () => {
  const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'));
  const paths: string[] = vercel.crons.map((c: { path: string }) => c.path);

  it.each(paths)('🚨 %s', (p) => {
    const src = readFileSync(join(process.cwd(), 'src/app', p, 'route.ts'), 'utf8');
    expect(src).toMatch(/export const GET = withCronAlert\('/);
    expect(src).not.toMatch(/export async function GET\(/);
  });
});

describe('المعالج يُنبّه عند فشل التسليم', () => {
  async function runRoute(result: Record<string, unknown>) {
    process.env.CRON_SECRET = 'cron-secret-123456';
    jest.doMock('@/lib/notifications-processor', () => ({
      processNotificationQueue: async () => result,
    }));
    const { GET } = await import('@/app/api/notifications/process/route');
    const { NextRequest } = require('next/server');
    return GET(new NextRequest('https://spir-medical.com/api/notifications/process', {
      headers: { authorization: 'Bearer cron-secret-123456' },
    }));
  }

  it('🚨 رسائلُ فاشلة → بريدٌ بنصّ آخر خطأ، والمسار 200', async () => {
    const res = await runRoute({ processed: 3, succeeded: 0, failed: 3, cancelled: 0, lastError: 'Authentication Error' });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentBodies()[0].subject).toContain('3 من 3');
    expect(sentBodies()[0].text).toContain('Authentication Error');
  });

  it('لا إخفاق → لا بريد', async () => {
    await runRoute({ processed: 2, succeeded: 2, failed: 0, cancelled: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('🚨 المعالج يُرجع نصَّ آخر خطأ', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/notifications-processor.ts'), 'utf8');
    expect(src).toMatch(/onError\?\.\(result\.error \?\? 'unknown'\)/);
    expect(src).toMatch(/return \{ processed: messages\.length, succeeded, failed, cancelled, lastError \}/);
  });
});
