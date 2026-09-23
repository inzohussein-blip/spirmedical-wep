import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 📱 حارس تجربة الهاتف
 *
 * كلُّ ما هنا قِيس في متصفّحٍ حقيقيّ بعرض 360px و390px (Playwright)، لا
 * في الكود وحده:
 *
 * ① شعارُ الكوكيز غطّى ثلثَ الشاشة **في صفحة الطوارئ** فوق أرقام الإسعاف،
 *    وأعلن `aria-modal="true"` وهو ليس مشروطاً — فحبس قارئ الشاشة داخله —
 *    وسرق التركيز بـ`autoFocus` بعد ١.٥ ثانية إلى «قبول الكل». وكان خيارُ
 *    التحليلات مُعلَّماً مسبقاً خلافاً لنصّه «الضرورية فقط مُفعّلة افتراضياً».
 *
 * ② الصنفُ الدلاليّ `outline` يصطدم بأداة Tailwind `.outline{outline-style:
 *    solid}` فيرسم حلقةً سوداء سميكة حول الزرّ.
 *
 * ③ نموذجا الدخول وتسجيل المريض: لا وسمَ مرتبطٌ بحقله، ولا `autoComplete`
 *    — فلا يملأ الهاتف الاسمَ والبريد ولا يقترح مديرُ كلمات المرور.
 *
 * ④ نصٌّ دون 12px في كلّ صفحةٍ تقريباً، منه **تسمياتُ شريط التنقّل السفليّ**.
 *    والرموز نفسها كانت `--text-2xs: 9px` و`--text-xs: 11px`.
 *
 * ⑤ مربّعُ البحث ~٥٠px وحقلُه ~٢٦px: اللمسُ على حافّته لم يُركّز الحقل.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function walk(dir: string, ext: RegExp, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (ext.test(n)) out.push(p);
  }
  return out;
}

/** وسومُ JSX بسماتها كاملةً — يوازن الأقواس فلا يتوقّف عند `>` في `=>` */
function jsxTags(src: string, names: string[]): { tag: string; attrs: string; at: number }[] {
  const out: { tag: string; attrs: string; at: number }[] = [];
  const re = new RegExp(`<(${names.join('|')})\\b`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 0, q: string | null = null;
    for (; i < src.length; i++) {
      const c = src[i];
      if (q) { if (c === q && src[i - 1] !== '\\') q = null; continue; }
      if (c === '"' || c === "'" || c === '`') q = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    out.push({ tag: m[1], attrs: src.slice(m.index + m[0].length, i), at: m.index });
  }
  return out;
}

describe('🍪 شعار الكوكيز', () => {
  const src = read('src/components/legal/CookieConsent.tsx');

  it('🚨 لا يظهر في صفحات الطوارئ', async () => {
    const { isEmergencyPath } = await import('@/components/legal/CookieConsent');
    for (const p of ['/sos', '/guest/sos', '/sos/', '/guest/sos/map']) expect(isEmergencyPath(p)).toBe(true);
    for (const p of ['/', '/guest', '/services', '/sosyal', '/account/sos-contacts']) expect(isEmergencyPath(p)).toBe(false);
    expect(src).toMatch(/if \(!mounted \|\| !show \|\| isEmergencyPath\(pathname\)\) return null/);
  });

  it('🚨 ليس نافذةً مشروطة ولا يسرق التركيز', () => {
    expect(src).not.toMatch(/aria-modal=["{]?\s*["']?true/);
    expect(src).not.toMatch(/\bautoFocus\b/);
  });

  it('🚨 التحليلات غيرُ مُعلَّمةٍ مسبقاً — كما يَعِد النصّ', () => {
    expect(src).toMatch(/الضرورية فقط مُفعّلة بشكل افتراضي/);
    expect(src).toMatch(/const \[analytics, setAnalytics\] = useState\(false\)/);
  });
});

describe('🎨 لا اصطدامَ بأدوات Tailwind', () => {
  it("🚨 لا يُستعمل `outline` صنفاً دلاليّاً", () => {
    const offenders: string[] = [];
    for (const f of walk(SRC, /\.tsx$/)) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const cls = (m[1] ?? m[2] ?? '').split(/\s+/);
        if (cls.includes('outline')) offenders.push(`${f.replace(ROOT + '/', '')}: "${(m[1] ?? m[2]).slice(0, 40)}"`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('📝 نماذج المصادقة تعمل مع الملء التلقائيّ وقارئ الشاشة', () => {
  const files = walk(join(SRC, 'app', '(auth)'), /\.tsx$/);

  it('يجد الحقول (حارسُ الحارس)', () => {
    const n = files.reduce((a, f) => a + jsxTags(readFileSync(f, 'utf8'), ['input', 'select', 'textarea']).length, 0);
    expect(n).toBeGreaterThan(20);
  });

  it('🚨 لكلّ حقلٍ اسمٌ مُتاح، وللبريد وكلمة المرور والهاتف `autoComplete`', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const s = readFileSync(f, 'utf8');
      const fors = new Set([...s.matchAll(/htmlFor=(?:"([^"]+)"|\{([^}]+)\})/g)].map((m) => m[1] ?? m[2]));
      for (const { tag, attrs, at } of jsxTags(s, ['input', 'select', 'textarea'])) {
        const type = attrs.match(/\btype="([^"]+)"/)?.[1];
        if (type === 'hidden' || type === 'submit') continue;
        const id = attrs.match(/\bid=(?:"([^"]+)"|\{([^}]+)\})/);
        const idVal = id ? id[1] ?? id[2] : null;
        // مُلفوفٌ داخل <label> مفتوحٍ لم يُغلق قبله: اسمٌ ضمنيّ
        const lastOpen = s.lastIndexOf('<label', at);
        const wrapped = lastOpen >= 0 && s.indexOf('</label>', lastOpen) > at;
        const named = /aria-label(ledby)?=/.test(attrs) || (idVal !== null && fors.has(idVal)) || wrapped;
        const where = `${f.replace(ROOT + '/', '')}: <${tag}${type ? ` type=${type}` : ''}${idVal ? ` #${idVal}` : ''}>`;
        if (!named && type !== 'radio' && type !== 'file') offenders.push(`${where} بلا اسم`);
        if (type && ['email', 'password', 'tel'].includes(type) && !/\bautoComplete=/.test(attrs)) {
          offenders.push(`${where} بلا autoComplete`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('🚨 كلمةُ مرور الدخول current-password، والتسجيل new-password', () => {
    expect(read('src/app/(auth)/login/page.tsx')).toMatch(/autoComplete="current-password"/);
    const reg = read('src/app/(auth)/register/patient/page.tsx');
    expect(reg.match(/autoComplete="new-password"/g)?.length).toBe(2);
  });
});

describe('🔤 أرضيّةُ الخطّ', () => {
  it('🚨 الرموز: 2xs ≥ 11px و xs ≥ 12px', () => {
    const css = read('src/app/styles/shared.css');
    expect(Number(css.match(/--text-2xs:\s*(\d+)px/)![1])).toBeGreaterThanOrEqual(11);
    expect(Number(css.match(/--text-xs:\s*(\d+)px/)![1])).toBeGreaterThanOrEqual(12);
  });

  it('🚨 لا خطَّ دون 11px في أيّ CSS أو نمطٍ مضمَّن', () => {
    const offenders: string[] = [];
    for (const f of walk(SRC, /\.(css|tsx)$/)) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px|fontSize:\s*(\d+(?:\.\d+)?)\b/g)) {
        const v = Number(m[1] ?? m[2]);
        if (v > 0 && v < 11) offenders.push(`${f.replace(ROOT + '/', '')}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('🚨 تسمياتُ التنقّل السفليّ ولافتاتُ الخدمات ≥ 12px', () => {
    const all = read('src/app/styles/app.css') + read('src/app/styles/shared.css') + read('src/app/styles/marketing.css');
    // ومحتوى الصفحات لا زخرفتُها: وصفُ أرقام الطوارئ، وعناوينُ أقسام صفحات
    // التسويق ونصوصُ قوائمها (كانت صفحة سحب الدم كلُّها بـ١١px).
    for (const c of ['app-bottom-label', 'story-label', 'service-sub', 'service-badge', 'scr-banner-cta',
                     'emergency-desc', 'app-logo-sub', 'mkt-section-title', 'mkt-list-item-subtitle',
                     'scr-account-cta', 'scr-account-desc', 'service-desc']) {
      const blocks = [...all.matchAll(new RegExp(`(?:^|\\n)\\s*\\.${c}\\b[^{]*\\{([^}]*)\\}`, 'g'))];
      expect(blocks.length).toBeGreaterThan(0);
      for (const b of blocks) {
        const fs = b[1].match(/font-size:\s*(\d+)px/);
        if (fs) expect(`${c}:${Number(fs[1]) >= 12}`).toBe(`${c}:true`);
      }
    }
  });
});

describe('👆 أهدافُ اللمس', () => {
  it('🚨 مربّعاتُ البحث: اللمسُ في أيّ موضعٍ منها يُركّز الحقل', () => {
    for (const f of ['src/app/guest/GuestClient.tsx', 'src/app/guest/services/hospitals/GuestHospitalsClient.tsx', 'src/app/guest/services/pharmacies/GuestPharmaciesClient.tsx']) {
      expect(`${f}:${/<label className="scr-search"/.test(read(f))}`).toBe(`${f}:true`);
    }
    expect(read('src/app/(marketing)/faq/FAQClient.tsx')).toMatch(/<label className="mkt-search"/);
    // وحيث يبقى الغلاف div (البحث العامّ: role=search وزرُّ مسحٍ داخله) يملأ
    // الحقلُ ارتفاعَ المربّع — والقاعدة بعد تعريفَي `.scr-search` كليهما
    const css = read('src/app/styles/app.css');
    const fill = css.lastIndexOf('.scr-search input { align-self: stretch;');
    expect(fill).toBeGreaterThan(css.lastIndexOf('.scr-search {\n'));
    expect(fill).toBeGreaterThan(0);
  });

  it('🚨 لا «⌕» أيقونةً — كثيرٌ من خطوط أندرويد لا تحويه', () => {
    for (const f of walk(SRC, /\.tsx$/)) expect(`${f}:${readFileSync(f, 'utf8').includes('⌕')}`).toBe(`${f}:false`);
  });

  it('🚨 مربّعُ الموافقة ≥ 24px', () => {
    expect(read('src/app/(auth)/register/patient/page.tsx')).toMatch(/id="agreeTerms"[\s\S]{0,300}w-6 h-6/);
  });

  it('🚨 زرُّ التنقّل في الرئيسية لا ينكسر على سطرين في الهاتف', () => {
    const css = read('src/app/styles/marketing.css');
    // ليس ضمن مجموعة أزرار البطل الكبيرة
    const group = css.slice(css.indexOf('/* CTA buttons - bigger, full width'), css.indexOf('.landing-hero-cta {', css.indexOf('/* CTA buttons - bigger, full width')));
    expect(group).not.toMatch(/\.landing-nav-cta,/);
    expect(css).toMatch(/@media \(max-width: 480px\) \{\s*\.landing-nav-cta \{\s*white-space: nowrap;/);
  });
});
