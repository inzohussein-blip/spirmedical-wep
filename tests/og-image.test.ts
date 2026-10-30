/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🖼️ صورةُ المشاركة (/api/og) — رصدُ الأخطاء (20 تشرين الأول): «failed to pipe response». بلا خطٍّ كان `ImageResponse` يجلب
 * محارفَ العربيّة من الشبكة أثناء البثّ، فيسقط بعد أن يبدأ الردّ (خارج try). والمدوّنةُ ترسل `?title=` فكان يُهمَل.
 */
jest.mock('next/og', () => ({ ImageResponse: class {} }));
const { loadOgFonts } = require('@/app/api/og/route');

describe('🖼️ /api/og', () => {
  it('🚨 الخطُّ العربيّ واللاتينيّ يُقرأ من assets/og (woff — Satori لا يقرأ woff2)', async () => {
    const fonts = await loadOgFonts();
    expect(fonts.map((f: { weight: number }) => f.weight)).toEqual([400, 700, 400, 700]);
    for (const f of fonts) expect(f.data.subarray(0, 4).toString('latin1')).toBe('wOFF');
  });

  it('🚨 عنوانُ المقال (`title`) هو العنوانُ الظاهر، والملفّاتُ مضمَّنةٌ في حزمة الدالّة', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/api/og/route.tsx'), 'utf8');
    expect(src).toMatch(/param\(searchParams, 'title', \d+\) \?\? param\(searchParams, 'headline'/);
    expect(src).toMatch(/fonts,\n\s*\}/);
    // Satori يرصّ كلماتِ العربيّة من اليسار — كلُّ نصٍّ عربيّ يمرّ بـ<Rtl> (صفٌّ معكوس يلتفّ)
    for (const t of ['titleAr', 'headline', 'meta']) expect(src).toMatch(new RegExp(`<Rtl\\s+text=\\{${t}\\}`));
    expect(src).toMatch(/flexDirection: 'row-reverse', flexWrap: 'wrap'/);
    expect(readFileSync(join(process.cwd(), 'next.config.js'), 'utf8')).toMatch(/'\/api\/og': \['\.\/assets\/og\/\*\.woff'\]/);
  });
});
