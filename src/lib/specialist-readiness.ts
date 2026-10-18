/**
 * 🧭 جاهزيّةُ المختصّ الجديد — ما يلزمه كي تصله الطلباتُ فعلاً ويثق به المريض.
 *
 * طابورُ المختصّ لا يُرشِّح إلّا بالنوع، فالمختصُّ المعتمَد يرى الطلباتِ فوراً. لكنّه
 * لا **يعلم** بها إلّا بدفع الويب: واتساب معطّل (توكن Meta)، والمختصُّ لا يفتح
 * التطبيقَ طوالَ اليوم. وطلبٌ لا يُلتقط يُلغيه الرفضُ التلقائيّ بعد 48 ساعة.
 *
 * دالّةٌ خالصة كي تُختبر بلا قاعدة.
 */

export interface ReadinessProfile {
  full_name: string | null;
  governorate: string | null;
  specialist_bio: string | null;
}

export interface ReadinessStep {
  key: 'push' | 'name' | 'governorate' | 'bio' | 'labTests';
  done: boolean;
  title: string;
  desc: string;
  href?: string;
}

/** الاسمُ الذي يضعه إنشاءُ الحساب بالرمز قبل أن يكتب صاحبُه اسمه */
const PLACEHOLDER_NAMES = new Set(['مستخدم', 'أخصائي', '']);

/**
 * `labTests`: عددُ تحاليل المختبر لمختصّ التحاليل وحده (0055) — بدونها لا يظهر مختبرُه للمريض في
 * «سحب الدم». يُترك `undefined` لغيره فلا تظهر الخطوة.
 */
export function specialistReadiness(
  profile: ReadinessProfile,
  activePushSubscriptions: number,
  labTests?: number,
): ReadinessStep[] {
  const name = (profile.full_name ?? '').trim();
  const labStep: ReadinessStep[] = labTests === undefined ? [] : [{
    key: 'labTests',
    done: labTests > 0,
    title: 'حدّد تحاليلَ مختبرك',
    desc: 'يظهر مختبرُك للمريض حين يختار تحاليلَ يُجريها.',
    href: '/specialist/lab-tests',
  }];
  return [
    {
      key: 'push',
      done: activePushSubscriptions > 0,
      title: 'فعّل إشعارات الطلبات الجديدة',
      desc: 'بدونها لن تعلم بالطلب حتى تفتح التطبيق، والطلبُ الذي لا يُستلم يُلغى بعد 48 ساعة.',
    },
    ...labStep,
    {
      key: 'name',
      done: name.length >= 2 && !PLACEHOLDER_NAMES.has(name),
      title: 'اكتب اسمك الكامل',
      desc: 'يراه المريض قبل أن تصل إليه.',
      href: '/specialist/account/edit',
    },
    {
      key: 'governorate',
      done: !!profile.governorate?.trim(),
      title: 'حدّد محافظتك',
      desc: 'كي تُعرض عليك طلباتُ منطقتك.',
      href: '/specialist/account/edit',
    },
    {
      key: 'bio',
      done: !!profile.specialist_bio?.trim(),
      title: 'أضف نبذةً عن خبرتك',
      desc: 'سطران عن تخصّصك وسنوات خبرتك.',
      href: '/specialist/account/edit',
    },
  ];
}
