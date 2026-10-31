/**
 * @jest-environment node
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🖥️ الاستضافةُ الذاتيّة (طلبُ المالك، 31 تشرين الأول): «جهّز المشروع بحيث يعمل احتياطيّاً — سأستعمل جهازي أو سيرفراً مستأجراً».
 * الموقعُ نفسُه بـ`node server.js` من نسخةٍ مستقلّة، خلف نفق Cloudflare على origin.spir-medical.com، والبوّابةُ تسأله ثالثاً.
 * قِيس: بناءٌ مستقلّ + تشغيلُ server.js ← الصفحاتُ والأنماطُ وصورةُ المشاركة 200، والنطاقُ المباشر يُحوَّل، وما جاء من البوّابة يُخدَم.
 */
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('🖥️ الاستضافةُ الذاتيّة', () => {
  it('🚨 النسخةُ المستقلّة بالمتغيّر وحده — Vercel وNetlify يبنيان بطريقتهما', () => {
    expect(read('next.config.js')).toMatch(/process\.env\.NEXT_OUTPUT === 'standalone' \? \{ output: 'standalone' \} : \{\}/);
  });

  it('🚨 الصورةُ تنسخ public والملفّاتِ الساكنة بجانب server.js (النسخةُ المستقلّة لا تحملها)، وتعمل بغير الجذر', () => {
    const d = read('Dockerfile');
    expect(d).toMatch(/ENV NEXT_OUTPUT=standalone/);
    expect(d).toMatch(/COPY --from=build [^\n]*\/app\/\.next\/standalone \.\//);
    expect(d).toMatch(/COPY --from=build [^\n]*\/app\/\.next\/static \.\/\.next\/static/);
    expect(d).toMatch(/COPY --from=build [^\n]*\/app\/public \.\/public/);
    expect(d).toMatch(/HOSTNAME=0\.0\.0\.0/);
    expect(d).toMatch(/USER spir/);
    expect(d).toMatch(/CMD \["node", "server\.js"\]/);
    for (const s of ['selfhost/start.sh', 'selfhost/start.ps1']) {
      const src = read(s);
      expect(src).toMatch(/NEXT_OUTPUT/);
      expect(src).toMatch(/\.next\/static/);
      expect(src).toMatch(/server\.js/);
    }
  });

  it('🚨 الأسرارُ لا تُرفع، و.env.production يدخل البناءَ (قيمُ NEXT_PUBLIC_ تُضمَّن عنده)', () => {
    const gi = read('.gitignore').split('\n').map((l) => l.trim());
    expect(gi).toContain('.env.production');
    expect(gi).toContain('selfhost/.env');
    const di = read('.dockerignore').split('\n').map((l) => l.trim());
    expect(di).toEqual(expect.arrayContaining(['node_modules', '.next', '.git']));
    expect(di).not.toContain('.env.production');
    expect(di).not.toContain('.env*');
  });

  it('🚨 النفقُ والموقعُ معاً، والمنفذُ على الجهاز وحده — الزوّارُ يصلون عبر النفق', () => {
    const c = read('selfhost/docker-compose.yml');
    expect(c).toMatch(/env_file: \.\.\/\.env\.production/);
    expect(c).toMatch(/cloudflare\/cloudflared/);
    expect(c).toMatch(/TUNNEL_TOKEN=\$\{TUNNEL_TOKEN:\?/);
    expect(c).toMatch(/"127\.0\.0\.1:3000:3000"/);
  });

  it('🚨 الاحتياطيُّ الثالث في كلّ موضع: البوّابة، والوسيط، والكرون، وتقريرُ الأعطال', () => {
    const { SELFHOST_HOST, PLATFORM_HOSTS } = require('@/lib/seo/origin');
    expect(SELFHOST_HOST).toBe('origin.spir-medical.com');
    expect(PLATFORM_HOSTS.at(-1)).toBe(SELFHOST_HOST);
    expect(read('wrangler.jsonc')).toMatch(/"ORIGINS": "[^"]*,origin\.spir-medical\.com"/);
    expect(read('.github/workflows/scheduled-jobs.yml')).toMatch(/HOSTS: [^\n]*origin\.spir-medical\.com/);
    expect(read('.github/workflows/report-failures.yml')).toMatch(/"https:\/\/origin\.spir-medical\.com\/api\/ops\/ingest"/);
  });
});
