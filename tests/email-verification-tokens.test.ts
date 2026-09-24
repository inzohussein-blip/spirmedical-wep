import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔐 حارس رموز التحقّق من البريد
 *
 * ═══ الثغرة التي وُلد منها ═══
 *
 * كانت على `email_verification_tokens` سياسةٌ اسمُها يصف نفسه:
 *
 *     CREATE POLICY "anyone_can_create_token" … FOR INSERT WITH CHECK (true)
 *
 * فأيّ مستخدمٍ مُسجَّلٍ يُدرج صفّاً بـ`user_id` من يشاء و`token` يختاره
 * و`expires_at` يمدّه عشر سنين، ثمّ يزور `/auth/verify-email?token=…`
 * فيُصدّق الخادمُ بريداً لا يملكه:
 *
 *     ①_مستخدمٌ يزرع رمزاً لحسابِ غيره ... نجح، صفوف=١
 *     ②_الخادم يجد الرمز ويُصدّقه ....... صاحبه: الضحيّة، صالحٌ حتى ٢٠٣٦
 *
 * و`anon` لم يكن يبلغها — لا لأنّ السياسة منعته بل لأنّ المنحة لم تُعطَ له.
 * فالبوّابتان مستقلّتان، والحارسُ يفحصهما معاً: السياسةَ **والمنحة**.
 *
 * وكان الرمزُ يُقرأ ولا يُستهلَك: `used_at` تُكتب بعد التصديق ولا تُفحص
 * قطّ، فالرابطُ يُعاد استعماله ما بقي صالحاً.
 *
 * أُصلح في 0040 وفي `verifyEmailToken`.
 */

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');
const ALL = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(MIGRATIONS, f), 'utf8'))
  .join('\n');

const AUTH = readFileSync(join(process.cwd(), 'src', 'lib', 'auth', 'email-auth.ts'), 'utf8');

describe('رموز التحقّق من البريد لا تُزرع من العميل', () => {
  it('يقرأ المصادر قراءةً صحيحة', () => {
    expect(ALL).toMatch(/email_verification_tokens/);
    expect(AUTH).toMatch(/verifyEmailToken/);
  });

  it('لا سياسةَ إدراجٍ مفتوحةٍ على الجدول', () => {
    const policies = [
      ...ALL.matchAll(
        /CREATE\s+POLICY\s+"?[\w ]+"?\s+ON\s+public\.email_verification_tokens[\s\S]*?;/gi,
      ),
    ];
    for (const p of policies) {
      const isInsert = /FOR\s+(INSERT|ALL)/i.test(p[0]);
      if (!isInsert) continue;
      // إدراجٌ من العميل لا داعيَ له أصلاً: الخادم يكتب بمفتاح الخدمة
      expect(p[0]).not.toMatch(/WITH\s+CHECK\s*\(\s*true\s*\)/i);
    }
  });

  it('والمنحةُ مسحوبةٌ كذلك — البوّابتان معاً', () => {
    // السياسةُ وحدها لا تكفي إن عادت منحةٌ يوماً، والعكس بالعكس.
    expect(ALL).toMatch(
      /REVOKE\s+[^;]*INSERT[^;]*ON\s+public\.email_verification_tokens\s+FROM\s+[^;]*authenticated/i,
    );
  });

  it('`service_role` ممنوحٌ صراحةً — لا يُفترض أنّه «يتجاوز البوّابتين»', () => {
    // 0016 افترض ذلك فبقي الخادمُ عاجزاً حتى عن قراءة `users` (42501).
    expect(ALL).toMatch(
      /GRANT\s+[^;]*INSERT[^;]*ON\s+ALL\s+TABLES\s+IN\s+SCHEMA\s+public\s+TO\s+[^;]*service_role/i,
    );
    expect(ALL).toMatch(
      /ALTER\s+DEFAULT\s+PRIVILEGES\s+IN\s+SCHEMA\s+public\s+GRANT[^;]*ON\s+TABLES\s+TO\s+service_role/i,
    );
  });

  it('الرمز يُستهلَك قبل الوثوق به، بشرطٍ في عبارة الكتابة نفسها', () => {
    const fn = AUTH.slice(AUTH.indexOf('export async function verifyEmailToken'));
    const body = fn.slice(0, fn.indexOf('\n}\n') + 3);

    const claim = body.indexOf(".is('used_at', null)");
    const trust = body.indexOf('email_verified: true');
    expect(claim).toBeGreaterThan(0);
    expect(trust).toBeGreaterThan(0);
    // الاستهلاك أوّلاً: وإلّا بقي الرابطُ يُعاد استعماله
    expect(claim).toBeLessThan(trust);
  });
});
