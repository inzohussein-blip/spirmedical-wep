import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

describe('Rate Limit', () => {
  beforeEach(() => {
    resetRateLimit('test-key');
  });

  it('يسمح بالطلب الأول', async () => {
    const result = await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('يحتسب المحاولات بشكل صحيح', async () => {
    await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    const result = await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('يمنع بعد تجاوز الحد', async () => {
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    }
    const result = await checkRateLimit('test-key', { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('مفاتيح مختلفة لها عدّادات مستقلة', async () => {
    await checkRateLimit('key-a', { max: 1, windowSeconds: 60 });
    const a = await checkRateLimit('key-a', { max: 1, windowSeconds: 60 });
    const b = await checkRateLimit('key-b', { max: 1, windowSeconds: 60 });

    expect(a.allowed).toBe(false);
    expect(b.allowed).toBe(true);
  });

  it('reset يُعيد العداد', async () => {
    await checkRateLimit('test-key', { max: 1, windowSeconds: 60 });
    let result = await checkRateLimit('test-key', { max: 1, windowSeconds: 60 });
    expect(result.allowed).toBe(false);

    resetRateLimit('test-key');
    result = await checkRateLimit('test-key', { max: 1, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
  });
});
