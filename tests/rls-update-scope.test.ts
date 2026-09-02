import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * 🔐 حارس نطاق التعديل في سياسات RLS
 *
 * ═══ الثغرة التي وُلد منها ═══
 *
 * كانت سياسةُ القراءة على `appointments` تشترط في ذراع «الطابور المفتوح»
 * أن يكون الموعد بلا إسناد:
 *
 *     assigned_specialist_id IS NULL
 *     AND private.current_user_is_approved_specialist_type(required_specialist_type)
 *
 * وسياسةُ التعديل تحمل الذراع نفسها **بلا هذا الشرط**. فأيّ مختصٍّ معتمَدٍ
 * من النوع المطلوب كان يعدّل كلّ موعدٍ من نوعه، حتى المُسنَد لزميله.
 *
 * ═══ ولماذا لم تظهر في أوّل فحص ═══
 *
 * `UPDATE … WHERE id = '…'` أرجع صفراً فظننتُها موهومة. والسبب أنّ
 * Postgres يُطبّق سياسةَ **القراءة** أيضاً متى قرأت العبارةُ أعمدةً — وشرطُ
 * `WHERE` قراءة. فحرستها القراءةُ الأضيق.
 *
 * ثمّ جرّبتُ تعديلاً **بلا شرطٍ ولا RETURNING**:
 *
 *     UPDATE public.appointments SET status = 'cancelled';
 *
 * فلا تُستدعى سياسةُ القراءة، وتبقى سياسةُ التعديل وحدها. النتيجة: موعدٌ
 * لا يراه المهاجم أصلاً صار `cancelled`. ويبلغه من PostgREST بطلبٍ واحد:
 * `PATCH /appointments` بجسم `{"status":"cancelled"}` بلا مُرشِّح.
 *
 * ═══ الدرس المُعمَّم ═══
 *
 * **لا يجوز أن تكون سياسةُ التعديل أوسع من سياسة القراءة**، لأنّ التعديل
 * غير المُرشَّح يتخطّى القراءة. أُصلح في الترحيل 0036.
 */

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');

function stripComments(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*--.*$/gm, '');
}

interface Policy { file: string; name: string; table: string; cmd: string; body: string }

function policies(): Policy[] {
  const out: Policy[] = [];
  for (const f of readdirSync(MIGRATIONS).filter((x) => x.endsWith('.sql')).sort()) {
    const sql = stripComments(readFileSync(join(MIGRATIONS, f), 'utf8'));
    const re = /CREATE\s+POLICY\s+"?([\w]+)"?\s+ON\s+(?:public\.)?"?(\w+)"?/gi;
    for (const m of sql.matchAll(re)) {
      let i = m.index! + m[0].length;
      let depth = 0;
      const start = i;
      while (i < sql.length) {
        const c = sql[i];
        if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) depth--;
        else if (c === ';' && depth <= 0) break;
        i++;
      }
      const body = sql.slice(start, i);
      const cmd = body.match(/\bFOR\s+(ALL|SELECT|INSERT|UPDATE|DELETE)\b/i)?.[1].toUpperCase() ?? 'ALL';
      out.push({ file: f, name: m[1], table: m[2], cmd, body });
    }
  }
  return out;
}

const OPEN_POOL = /current_user_is_approved_specialist_type/;
const ASSIGN_GUARD = /assigned_specialist_id\s+IS\s+NULL/i;

describe('نطاق التعديل لا يتجاوز نطاق القراءة', () => {
  const all = policies();

  it('يقرأ سياسات الترحيلات قراءةً صحيحة', () => {
    // حارسُ الحارس: محلّلٌ مكسورٌ يجد صفراً فيمرّ الفحصُ التالي بلا معنى
    expect(all.length).toBeGreaterThan(50);
    expect(all.some((p) => p.table === 'appointments' && p.cmd === 'UPDATE')).toBe(true);
  });

  it('ذراعُ «الطابور المفتوح» في التعديل تشترط عدم الإسناد', () => {
    // من يستطيع التعديل بحكم نوع اختصاصه وحده — بلا إسناد ولا ملكية —
    // يجب أن يكون الصفُّ حرّاً. وإلّا استولى على عمل زميله أو ألغاه.
    //
    // ويُفحص `USING` و`WITH CHECK` **كلٌّ على حدة**. أوّل صياغةٍ فحصت جسم
    // السياسة كلّه، فمرّت نسخةٌ ثغرتُها في `USING` وشرطُها في `WITH CHECK`
    // — وهي ثغرةٌ كاملة: `USING` هو الذي يحدّد أيَّ الصفوف تُمسّ أصلاً،
    // و`WITH CHECK` لا يحكم إلّا القيمَ الجديدة.
    const offenders: string[] = [];
    for (const p of all) {
      if (!['UPDATE', 'ALL', 'DELETE'].includes(p.cmd)) continue;

      const ci = p.body.search(/WITH\s+CHECK/i);
      const usingPart = ci >= 0 ? p.body.slice(0, ci) : p.body;
      const checkPart = ci >= 0 ? p.body.slice(ci) : '';

      for (const [label, part] of [['USING', usingPart], ['WITH CHECK', checkPart]] as const) {
        if (!part) continue;
        if (OPEN_POOL.test(part) && !ASSIGN_GUARD.test(part)) {
          offenders.push(`${p.file}: ${p.table} → ${p.name} (${p.cmd} / ${label})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('السياسة المُصحَّحة في 0036 تحمل الشرط في USING وفي WITH CHECK معاً', () => {
    const sql = readFileSync(join(MIGRATIONS, '0036_appointments_update_scope.sql'), 'utf8');
    const using = sql.slice(sql.indexOf('USING'), sql.indexOf('WITH CHECK'));
    const check = sql.slice(sql.indexOf('WITH CHECK'));
    // `WITH CHECK` يمنع كذلك إسنادَ موعدٍ حرٍّ إلى **شخصٍ آخر**
    expect(ASSIGN_GUARD.test(using)).toBe(true);
    expect(ASSIGN_GUARD.test(check)).toBe(true);
  });
});
