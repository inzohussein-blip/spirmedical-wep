/**
 * @jest-environment node
 */
import { execSync } from 'child_process';

/**
 * ⏳ واجهاتُ الطلب غير المتزامنة (Next 15/16).
 *
 * `cookies()` و`headers()` و`params` و`searchParams` صارت Promise. Next 15 يقبل الوصولَ المتزامن
 * بتحذير، وNext 16 يُسقطه — فخطأٌ هنا لا يظهر في البناء بل في التشغيل.
 *   • `createClient()` لـSupabase من الخادم يقرأ الكعكات، فصار async (301 موضعاً).
 *   • أداةُ Next الآليّة تترك `UnsafeUnwrapped…` في الدوالّ المتزامنة — ممنوعة هنا.
 */
const grep = (cmd: string) => {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
};

describe('واجهاتُ الطلب غير المتزامنة', () => {
  it('🚨 لا UnsafeUnwrapped (يعمل في 15 وينكسر في 16)', () => {
    expect(grep(`grep -rn "UnsafeUnwrapped" src`)).toEqual([]);
  });

  it('🚨 cookies() وheaders() تُنتظَران', () => {
    expect(grep(`grep -rnE "\\b(cookies|headers)\\(\\)" src --include=*.ts --include=*.tsx | grep -vE "await (cookies|headers)\\(\\)"`)).toEqual([]);
  });

  it('🚨 كلُّ createClient() من الخادم مسبوقٌ بـawait', () => {
    const files = grep(`grep -rlE "import \\{[^}]*\\bcreateClient\\b[^}]*\\} from '@/lib/supabase/server'" src`);
    expect(files.length).toBeGreaterThan(100);
    const bad = files.flatMap((f) =>
      grep(`grep -nE "createClient\\(\\)" "${f}" | grep -v "await createClient()" | grep -v "function createClient" | sed "s|^|${f}:|"`),
    );
    expect(bad).toEqual([]);
  });

  it('createClient في الخادم async', () => {
    expect(grep(`grep -n "export async function createClient" src/lib/supabase/server.ts`)).toHaveLength(1);
  });
});
