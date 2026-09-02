import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔐 حارس طرفَي الصفّ المُشترَك
 *
 * ═══ الثغرة التي وُلد منها ═══
 *
 * سياسةُ تعديلٍ بلا `WITH CHECK` تستعمل تعبير `USING` مكانه. فإن كان الشرطُ
 * `user_id = auth.uid()` فالصفُّ الجديد محكومٌ به أيضاً ولا ثغرة — قِسْتُه
 * ولم أظنّه: حقنُ وصفةٍ في سجلّ ضحيّة رُفض 42501، وخطفُ اشتراك إشعاراتها
 * رُفض 42501.
 *
 * لكنّ الشرطَ حين يكون **أذرعاً بـ`OR`**:
 *
 *     auth.uid() = patient_id OR auth.uid() = specialist_id
 *
 * يكفي المهاجمَ أن يُبقي ذراعَه صحيحةً ويُبدّل عمودَ الطرف الآخر. فالمريض
 * يكتب `specialist_id = <غريب>` ويبقى `patient_id` هو، فيمرّ الشرطُ ويصير
 * الغريبُ طرفاً في المحادثة يقرأ كلَّ ما فيها.
 *
 *     ①_تحويلٌ بلا مُرشِّح ......... نجح، صفوف=١
 *     ②_مختصّ المحادثة الآن ....... الغريب ← اختراق
 *     ③_الغريب يقرأ الرسائل ....... ١
 *
 * ═══ ولماذا لا يكفي `WITH CHECK` ═══
 *
 * لأنّه لا يرى إلّا الصفَّ الجديد، ولا سبيل له إلى `OLD`. وشرطُ «أنا طرفٌ
 * في الصفّ الجديد» يمرّ في هذا الهجوم بعينه. فالمنعُ لا يكون إلّا
 * بمُشغِّلٍ يقارن الجديد بالقديم — وهو ما يحرسه هذا الملفّ.
 *
 * أُصلح في 0038 (`chats`) و0039 (`consultations` و`lab_orders`).
 */

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');

function files(): { name: string; sql: string }[] {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS, name), 'utf8') }));
}

/** كلُّ الترحيلات نصّاً واحداً — الحارسُ يسأل «أفي المخطَّط هذا؟» لا «في أيّ ملفّ؟» */
const ALL = files()
  .map((f) => f.sql)
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*--.*$/gm, '');

/** جداولٌ يتشارك صفَّها طرفان مختلفان، وعمودا الطرفين فيها */
const SHARED: Record<string, [string, string]> = {
  chats: ['patient_id', 'specialist_id'],
  consultations: ['patient_user_id', 'doctor_user_id'],
};

describe('طرفا الصفّ المُشترَك لا يُبدَّلان بعد الإنشاء', () => {
  it('يقرأ الترحيلات قراءةً صحيحة', () => {
    // حارسُ الحارس: نصٌّ فارغٌ يُمرّر كلَّ ما بعده بلا معنى
    expect(ALL.length).toBeGreaterThan(50_000);
    expect(ALL).toMatch(/CREATE\s+POLICY/i);
  });

  for (const [table, [a, b]] of Object.entries(SHARED)) {
    it(`\`${table}\` يحرسه مُشغِّلٌ يُجمِّد ${a} و${b}`, () => {
      const trg = new RegExp(
        String.raw`CREATE\s+TRIGGER\s+(\w+)[\s\S]{0,80}?BEFORE\s+UPDATE\s+ON\s+public\.${table}\b[\s\S]{0,200}?EXECUTE\s+FUNCTION\s+(private\.\w+)\s*\(`,
        'i',
      );
      const m = ALL.match(trg);
      expect(m).not.toBeNull();

      // ولا يكفي وجودُ المُشغِّل: يجب أن يقارن العمودين فعلاً ويرفض
      const fn = m![2].split('.')[1];
      const body = ALL.match(
        new RegExp(String.raw`CREATE\s+OR\s+REPLACE\s+FUNCTION\s+private\.${fn}\b[\s\S]*?\$\$;`, 'i'),
      );
      expect(body).not.toBeNull();
      for (const col of [a, b]) {
        expect(body![0]).toMatch(
          new RegExp(String.raw`NEW\.${col}\s+IS\s+DISTINCT\s+FROM\s+OLD\.${col}`, 'i'),
        );
      }
      expect(body![0]).toMatch(/RAISE\s+EXCEPTION/i);
    });
  }

  it('`lab_orders` تربط صاحبَ الطلب بصاحب الموعد في الشرطين معاً', () => {
    // هنا `USING` لا يذكر `user_id` أصلاً، فالمختصّ كان ينقل الطلبَ إلى
    // حسابٍ يملكه: «نجح صفوف=١ — صاحبه: الغريب». والربطُ يُغلقها بلا مُشغِّل.
    const pol = [...ALL.matchAll(/CREATE\s+POLICY\s+lab_orders_specialist_update[\s\S]*?;/gi)].pop();
    expect(pol).toBeDefined();
    const body = pol![0];
    const ci = body.search(/WITH\s+CHECK/i);
    expect(ci).toBeGreaterThan(0);
    const halves = [body.slice(0, ci), body.slice(ci)];
    for (const half of halves) {
      expect(half).toMatch(/a\.user_id\s*=\s*lab_orders\.user_id/i);
    }
  });

  it('تعديلُ الرسالة يُعيد فحصَ عضويّة المحادثة في `WITH CHECK`', () => {
    // بلا هذا كان `chat_id` عموداً يُعدَّل، فتُنقل الرسالة إلى محادثةِ غيرك.
    const pol = [...ALL.matchAll(/CREATE\s+POLICY\s+"Users update own messages"[\s\S]*?;\n/gi)].pop();
    expect(pol).toBeDefined();
    const ci = pol![0].search(/WITH\s+CHECK/i);
    expect(ci).toBeGreaterThan(0);
    expect(pol![0].slice(ci)).toMatch(/c\.id\s*=\s*messages\.chat_id/i);
  });
});
