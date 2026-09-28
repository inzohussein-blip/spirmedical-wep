/**
 * 🧭 جاهزيّةُ المختصّ الجديد — ما يلزمه كي تصله الطلباتُ فعلاً ويثق به المريض.
 *
 * طابورُ المختصّ لا يُرشِّح إلّا بالنوع، فالمختصُّ المعتمَد يرى الطلباتِ فوراً. لكنّه
 * لا **يعلم** بها إلّا بدفع الويب: واتساب معطّل (توكن Meta)، والمختصُّ لا يفتح
 * التطبيقَ طوالَ اليوم. وطلبٌ لا يُلتقط يُلغيه الرفضُ التلقائيّ بعد ٤٨ ساعة.
 *
 * دالّةٌ خالصة كي تُختبر بلا قاعدة.
 */

export interface ReadinessProfile {
  full_name: string | null;
  governorate: string | null;
  specialist_bio: string | null;
}

export interface ReadinessStep {
  key: 'push' | 'name' | 'governorate' | 'bio';
  done: boolean;
  title: string;
  desc: string;
  href?: string;
}

/** الاسمُ الذي يضعه إنشاءُ الحساب بالرمز قبل أن يكتب صاحبُه اسمه */
const PLACEHOLDER_NAMES = new Set(['مستخدم', 'أخصائي', '']);

export function specialistReadiness(profile: ReadinessProfile, activePushSubscriptions: number): ReadinessStep[] {
  const name = (profile.full_name ?? '').trim();
  return [
    {
      key: 'push',
      done: activePushSubscriptions > 0,
      title: 'فعّل إشعارات الطلبات الجديدة',
      desc: 'بدونها لن تعلم بالطلب حتى تفتح التطبيق، والطلبُ الذي لا يُستلم يُلغى بعد ٤٨ ساعة.',
    },
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
