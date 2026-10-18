import { readFileSync } from 'fs';
import { join } from 'path';
import { render, screen, fireEvent, act } from '@testing-library/react';

/**
 * ⚛️ مراجعةُ تحذيرات React Compiler (16 تشرين الأول) — ما كان منها عطلاً حقيقيّاً:
 *
 * ① العمر بـ`/ 365.25 يوماً`: يومَ الميلاد بعد سنةٍ غير كبيسة يُعرض أقلَّ بسنة.
 * ② حدودُ حقول التاريخ من `toISOString()` (UTC): بين 00:00 و03:00 بغداد يقترح التمريضُ «الأمس».
 * ③ شاشةُ قفل PIN: انقطاعُ الشبكة أثناء التحقّق يُبقي لوحةَ الأرقام معطّلةً إلى الأبد.
 * ④ خريطةُ الخدمات: معالجُ `load` التقط القائمةَ المفلترة من الرسم الأوّل.
 * ⑤ القواعدُ التي أُصلحت مواضعُها أخطاءٌ في ESLint كي لا تعود.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('① العمرُ بالتقويم لا بالقسمة', () => {
  const { ageInYears } = require('@/lib/time/baghdad-day');

  it('🚨 يومَ الميلاد بعد سنةٍ غير كبيسة: سنةٌ كاملة (القسمة تعطي 0)', () => {
    expect(ageInYears('2001-03-01', new Date('2002-03-01T12:00:00Z'))).toBe(1);
  });

  it('قبل يوم الميلاد بيوم: لم تكتمل السنة', () => {
    expect(ageInYears('2000-10-17', new Date('2026-10-16T12:00:00Z'))).toBe(25);
  });

  it('🚨 بيومِ بغداد: 22:00 UTC هي 01:00 من يوم الميلاد في بغداد', () => {
    expect(ageInYears('2000-10-17', new Date('2026-10-16T22:00:00Z'))).toBe(26);
  });

  it('تاريخٌ غائب أو غير صالح ← null', () => {
    expect(ageInYears(null)).toBeNull();
    expect(ageInYears('غير معروف')).toBeNull();
  });

  it('🚨 لا قسمةَ على 365.25 في الكود', () => {
    for (const f of [
      'src/app/(dashboard)/account/family/FamilyClient.tsx',
      'src/app/(dashboard)/consultations/[id]/ConsultationClient.tsx',
      'src/components/family/FamilyMemberPicker.tsx',
      'src/components/family/FamilyTargetBadge.tsx',
    ]) {
      expect(read(f)).not.toMatch(/365\.25/);
      expect(read(f)).toMatch(/ageInYears\(/);
    }
  });
});

describe('② حدودُ حقول التاريخ بيوم بغداد', () => {
  const { baghdadDateOffset } = require('@/lib/time/baghdad-day');

  it('🚨 22:30 UTC هي 01:30 من اليوم التالي في بغداد', () => {
    const now = new Date('2026-10-16T22:30:00Z');
    expect(baghdadDateOffset(0, now)).toBe('2026-10-17');
    expect(baghdadDateOffset(1, now)).toBe('2026-10-18');
    expect(baghdadDateOffset(30, now)).toBe('2026-11-16');
  });

  it.each([
    'src/components/appointments/BloodDrawFlow.tsx',
    'src/components/appointments/NursingFlow.tsx',
    'src/components/doctors/DoctorBookingModal.tsx',
    'src/components/hospitals/HospitalBookingModal.tsx',
    'src/components/pharmacies/PharmacyReservationModal.tsx',
    'src/app/(dashboard)/services/booking/BookingClient.tsx',
    'src/app/(dashboard)/account/family/FamilyClient.tsx',
  ])('🚨 %s: لا تاريخَ UTC في حقول التاريخ', (f) => {
    const src = read(f);
    expect(src).not.toMatch(/toISOString\(\)\.split\('T'\)\[0\]/);
    expect(src).toMatch(/baghdadDateOffset\(/);
  });
});

describe('③ شاشةُ قفل PIN لا تتجمّد عند انقطاع الشبكة', () => {
  const verifyPin = jest.fn();
  jest.doMock('@/lib/services/pin-actions', () => ({ verifyPin: (...a: unknown[]) => verifyPin(...a) }));
  const PinLockScreen = require('@/components/security/PinLockScreen').default;

  const press = (d: string) => fireEvent.click(screen.getByRole('button', { name: d }));

  beforeEach(() => verifyPin.mockReset());

  it('🚨 رميُ التحقّق ← رسالةٌ واللوحةُ تعمل من جديد', async () => {
    verifyPin.mockRejectedValue(new Error('Failed to fetch'));
    render(<PinLockScreen onUnlock={() => {}} />);
    for (const d of ['1', '2', '3', '4']) await act(async () => press(d)); // نقرةٌ لكلّ رسم، كالإصبع

    expect(verifyPin).toHaveBeenCalledWith('1234');
    expect(await screen.findByText(/تعذّر التحقّق/)).toBeTruthy();
    expect((screen.getByRole('button', { name: '5' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('رمزٌ صحيح ← يُفتح مرّةً واحدة', async () => {
    verifyPin.mockResolvedValue({ ok: true });
    const onUnlock = jest.fn();
    render(<PinLockScreen onUnlock={onUnlock} />);
    for (const d of ['4', '3', '2', '1']) await act(async () => press(d));
    expect(verifyPin).toHaveBeenCalledTimes(1);
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});

describe('④ خريطةُ الخدمات تقرأ آخرَ قائمةٍ مفلترة', () => {
  const src = read('src/components/maps/ServicesMapHub.tsx');

  it('🚨 `syncData` تقرأ من المرجع لا من متغيّر الرسم', () => {
    const body = src.slice(src.indexOf('function syncData()'), src.indexOf('// تهيئة الخريطة'));
    expect(body).toMatch(/filteredRef\.current/);
    expect(body).not.toMatch(/toGeoJSON\(filteredLocations\)/);
  });

  it('المرجعُ يُحدَّث في أثر، لا أثناء الرسم', () => {
    expect(src).not.toMatch(/^\s{2}locationsByIdRef\.current = /m);
    expect(src).toMatch(/useEffect\(\(\) => \{\n\s+filteredRef\.current = filteredLocations;/);
  });
});

describe('⑤ ESLint: ما أُصلح يبقى مُصلَحاً', () => {
  const cfg = read('eslint.config.mjs');

  it.each([
    'react-hooks/refs',
    'react-hooks/immutability',
    'react-hooks/static-components',
    'react-hooks/use-memo',
    'react-hooks/purity',
  ])('🚨 %s خطأٌ لا تحذير', (rule) => {
    expect(cfg).toMatch(new RegExp(`'${rule}': 'error'`));
  });
});

describe('🧹 دُرجُ الإدارة يُغلق بالانتقال بلا أثر (18 تشرين الأول)', () => {
  it('🚨 حالةٌ مشتقّةٌ من المسار لا setState في useEffect', () => {
    const s = read('src/app/admin/_components/AdminSidebar.tsx');
    expect(s).not.toMatch(/useEffect\(\(\) => \{ setOpen\(false\); \}, \[pathname\]\)/);
    expect(s).toMatch(/const open = openOn === pathname;/);
  });
});
