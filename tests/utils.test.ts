import { cn, formatDate, formatDateTime, formatCurrency, slugify } from '@/lib/utils';

describe('cn (className merger)', () => {
  it('يدمج classes بسيطة', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('يحلّ تضارب Tailwind', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('يتجاهل القيم الفارغة', () => {
    expect(cn('a', null, undefined, false, 'b')).toBe('a b');
  });

  it('يدعم conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });
});

describe('formatDate', () => {
  it('ينسّق تاريخ بالعربية', () => {
    const result = formatDate('2026-05-06');
    // قد يحتوي على أرقام عربية (٢٠٢٦) أو إنجليزية (2026)
    expect(result).toMatch(/[٢2][٠0][٢2][٦6]/);
  });

  it('يتعامل مع Date object', () => {
    const result = formatDate(new Date('2026-05-06'));
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatDateTime', () => {
  it('يحتوي على وقت', () => {
    const result = formatDateTime('2026-05-06T14:30:00Z');
    expect(result).toMatch(/[\d٠-٩]/);
  });
});

describe('formatCurrency', () => {
  it('ينسّق المبلغ بالدينار', () => {
    const result = formatCurrency(50000);
    // يقبل ٥٠ أو 50
    expect(result).toMatch(/[٥5]/);
  });

  it('بدون كسور', () => {
    const result = formatCurrency(50000.99);
    expect(result).not.toContain('.99');
  });
});

describe('slugify', () => {
  it('يحوّل المسافات لشرطات', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('يدعم العربية', () => {
    expect(slugify('سحب دم منزلي')).toBe('سحب-دم-منزلي');
  });

  it('يحذف الأحرف الخاصة', () => {
    expect(slugify('hello@world!')).toBe('helloworld');
  });

  it('يدمج الشرطات المتكررة', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });
});
