import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { render, screen } from '@testing-library/react';
import { maskPhone, isDialable } from '@/lib/format/phone';
import PhoneLink from '@/components/ui/PhoneLink';

/**
 * 📞 أرقام المنشآت المُختلَقة — مُقنَّعةٌ ولا تُطلب.
 *
 * ١٠٢ رقماً في الإنتاج (0045) وكلُّ أرقام البذور وقوائم الزائر كانت كتلاً
 * متسلسلة مقرونةً بأسماء منشآتٍ حقيقية. قرار المالك: «0770 xxx xxxx» حتى
 * يُدخَل الرقمُ الموثَّق. وزرُّ الاتصال لا يطلب رقماً مبتوراً.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const walk = (d: string, out: string[] = []) => {
  for (const f of readdirSync(join(process.cwd(), d))) {
    const p = `${d}/${f}`;
    if (statSync(join(process.cwd(), p)).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
};

describe('maskPhone / isDialable', () => {
  it('يُبقي بادئة الشبكة ويُخفي الباقي', () => {
    expect(maskPhone('07712345001')).toBe('0771 xxx xxxx');
    expect(maskPhone('+9647707000001')).toBe('+964 770 xxx xxxx');
    expect(maskPhone('9647501234567')).toBe('964 750 xxx xxxx');
  });

  it('رقمُ الإسعاف القصير لا يُمسّ', () => {
    expect(maskPhone('122')).toBe('122');
    expect(isDialable('122')).toBe(true);
  });

  it('🚨 المُقنَّع والفارغ لا يُطلبان، والحقيقيّ يُطلب', () => {
    expect(isDialable('0770 xxx xxxx')).toBe(false);
    expect(isDialable('+964 770 xxx xxxx')).toBe(false);
    expect(isDialable('')).toBe(false);
    expect(isDialable(null)).toBe(false);
    expect(isDialable('07803993585')).toBe(true);
    expect(isDialable('+964 780 399 3585')).toBe(true);
  });
});

describe('PhoneLink', () => {
  it('رقمٌ حقيقيّ: رابطُ اتصال', () => {
    render(<PhoneLink phone="07803993585" href="tel:07803993585" className="btn">اتصل</PhoneLink>);
    expect(screen.getByRole('link', { name: 'اتصل' })).toHaveAttribute('href', 'tel:07803993585');
  });

  it('🚨 رقمٌ مُقنَّع: نصٌّ معطّلٌ بلا href', () => {
    const { container } = render(
      <PhoneLink phone="0770 xxx xxxx" href="tel:0770 xxx xxxx" className="btn">اتصل</PhoneLink>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    const el = container.querySelector('.btn')!;
    expect(el).toHaveAttribute('aria-disabled', 'true');
    expect(el).not.toHaveAttribute('href');
  });
});

describe('لا رابطَ اتصالٍ خامٍ لرقم منشأة', () => {
  it('🚨 كلُّ tel:/wa.me ديناميكيّ في صفحات الخدمات يمرّ بـ PhoneLink', () => {
    const files = [
      ...walk('src/app/(dashboard)/services'),
      ...walk('src/app/(dashboard)/account'),
      ...walk('src/app/guest/services'),
      'src/app/admin/pharmacies/PharmaciesAdminClient.tsx',
    ];
    const raw: string[] = [];
    for (const f of files) {
      const s = read(f);
      for (const m of s.matchAll(/href=\{`(?:tel:|https:\/\/wa\.me\/)\$\{/g)) {
        const tagStart = Math.max(s.lastIndexOf('<a', m.index!), s.lastIndexOf('<PhoneLink', m.index!));
        if (!s.startsWith('<PhoneLink', tagStart)) raw.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
      }
    }
    expect(raw).toEqual([]);
  });

  it('🚨 لا رقمَ جوّالٍ كاملٍ في البذور وقوائم الزائر', () => {
    const files = [
      ...walk('src/lib/seed'),
      'src/app/guest/services/hospitals/GuestHospitalsClient.tsx',
      'src/app/guest/services/pharmacies/GuestPharmaciesClient.tsx',
    ];
    const hits = files.flatMap((f) =>
      [...read(f).matchAll(/'((?:\+?964|07)[\d\s-]{8,16})'/g)]
        .filter((m) => m[1].replace(/\D/g, '').length >= 10)
        .map((m) => `${f}: ${m[1]}`),
    );
    expect(hits).toEqual([]);
  });

  it('الترحيل يستثني أرقام الطوارئ القصيرة ويُعاد بلا أثر', () => {
    const sql = read('supabase/migrations/0045_mask_fabricated_facility_phones.sql');
    expect(sql).toMatch(/v ~ 'x' OR length\(regexp_replace\(v, '\\D', '', 'g'\)\) <= 4 THEN v/);
  });
});
