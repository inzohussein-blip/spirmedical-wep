/**
 * 🧪 أيُّ مختبرٍ يُجري تحاليلَ المريض؟ — منطقٌ خالص يُستعمل في العميل والخادم.
 *
 * المختبرُ = مختصّ تحاليل (lab_analyst) معتمَد غيرُ موقوف، وتحاليلُه ما اختاره هو (0055).
 * يُعرض للمريض ما يُجري **كلَّ** تحاليله أوّلاً، ثمّ ما يُجري بعضَها مع عدد الناقص.
 * مختبرٌ لا يُجري أيّاً منها لا يُعرض.
 */
export interface LabOffer {
  /** معرّفُ المختصّ — هو ما يُحفظ في lab_orders.lab_specialist_id */
  id: string;
  name: string;
  city: string | null;
  tests: string[];
}

export interface RankedLab {
  lab: LabOffer;
  covered: number;
  missing: string[];
  complete: boolean;
}

export function rankLabsForTests(labs: LabOffer[], testIds: string[]): RankedLab[] {
  if (testIds.length === 0) return [];
  return labs
    .map((lab) => {
      const have = new Set(lab.tests);
      const missing = testIds.filter((t) => !have.has(t));
      const covered = testIds.length - missing.length;
      return { lab, covered, missing, complete: missing.length === 0 };
    })
    .filter((r) => r.covered > 0)
    .sort((a, b) => b.covered - a.covered || a.lab.name.localeCompare(b.lab.name, 'ar'));
}
