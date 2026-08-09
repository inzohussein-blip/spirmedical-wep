import {
  baghdadDayWindow,
  baghdadDateString,
  BAGHDAD_UTC_OFFSET_HOURS,
} from '@/lib/time/baghdad-day';

/**
 * 🕒 اختبارات حدود اليوم بتوقيت بغداد
 *
 * دوالٌ نقيّة، فالاختبار هنا يفحص السلوك فعلاً لا مجرّد وجود النصّ.
 * الحالة التي كسرت الإنتاج: نافذة يوم UTC تمتدّ من ٠٣:٠٠ بغداد اليوم إلى
 * ٠٢:٥٩ بغداد غداً، فموعد الغد باكراً يُصنَّف «اليوم».
 */

describe('🕒 نافذة اليوم بتوقيت بغداد', () => {
  it('الإزاحة ثابتة +3 (لا توقيت صيفي في العراق)', () => {
    expect(BAGHDAD_UTC_OFFSET_HOURS).toBe(3);
  });

  it('بداية اليوم هي 21:00 UTC من اليوم السابق', () => {
    // 2026-08-09 11:00 بغداد = 08:00 UTC
    const { start } = baghdadDayWindow(new Date('2026-08-09T08:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-08-08T21:00:00.000Z');
  });

  it('نهاية اليوم هي 20:59:59.999 UTC من اليوم نفسه', () => {
    const { end } = baghdadDayWindow(new Date('2026-08-09T08:00:00.000Z'));
    expect(end.toISOString()).toBe('2026-08-09T20:59:59.999Z');
  });

  it('النافذة تساوي 24 ساعة بالضبط', () => {
    const { start, end } = baghdadDayWindow(new Date('2026-08-09T08:00:00.000Z'));
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000 - 1);
  });

  it('🚨 موعد الغد باكراً بتوقيت بغداد يقع **خارج** نافذة اليوم', () => {
    const now = new Date('2026-08-09T08:00:00.000Z');       // 11:00 بغداد
    const { start, end } = baghdadDayWindow(now);

    // 2026-08-10 01:00 بغداد = 2026-08-09 22:00 UTC
    const tomorrowEarly = new Date('2026-08-09T22:00:00.000Z');

    expect(tomorrowEarly.getTime()).toBeGreaterThan(end.getTime());
    // وبحساب UTC الساذج كان يقع **داخل** اليوم — وهذا مصدر الخلل
    const naiveEndUtc = new Date('2026-08-09T23:59:59.999Z');
    expect(tomorrowEarly.getTime()).toBeLessThan(naiveEndUtc.getTime());
    expect(start.getTime()).toBeLessThan(tomorrowEarly.getTime());
  });

  it('موعد اليوم باكراً بتوقيت بغداد يقع **داخل** النافذة', () => {
    const now = new Date('2026-08-09T08:00:00.000Z');       // 11:00 بغداد
    const { start, end } = baghdadDayWindow(now);

    // 2026-08-09 01:00 بغداد = 2026-08-08 22:00 UTC
    const todayEarly = new Date('2026-08-08T22:00:00.000Z');

    expect(todayEarly.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(todayEarly.getTime()).toBeLessThanOrEqual(end.getTime());
    // وبحساب UTC الساذج كان يقع **خارج** اليوم (قبل 00:00 UTC)
    expect(todayEarly.toISOString() < '2026-08-09T00:00:00.000Z').toBe(true);
  });

  it('تعمل بصحّة عبر حدود الشهر', () => {
    // 2026-09-01 01:00 بغداد = 2026-08-31 22:00 UTC
    const { start, end } = baghdadDayWindow(new Date('2026-08-31T22:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-08-31T21:00:00.000Z');
    expect(end.toISOString()).toBe('2026-09-01T20:59:59.999Z');
  });

  it('لحظة ما بعد منتصف الليل في بغداد تُحسب لليوم الجديد', () => {
    // 2026-08-09 00:30 بغداد = 2026-08-08 21:30 UTC
    const { start } = baghdadDayWindow(new Date('2026-08-08T21:30:00.000Z'));
    expect(start.toISOString()).toBe('2026-08-08T21:00:00.000Z');
  });
});

describe('🕒 التاريخ النصّي بتوقيت بغداد', () => {
  it('يعطي تاريخ بغداد لا تاريخ UTC بعد منتصف الليل', () => {
    // 2026-08-09 01:00 بغداد = 2026-08-08 22:00 UTC
    expect(baghdadDateString(new Date('2026-08-08T22:00:00.000Z'))).toBe('2026-08-09');
  });

  it('يطابق تاريخ UTC في منتصف النهار', () => {
    expect(baghdadDateString(new Date('2026-08-09T09:00:00.000Z'))).toBe('2026-08-09');
  });
});
