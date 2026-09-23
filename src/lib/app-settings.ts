/**
 * مفاتيح `app_settings` (الترحيل 0042).
 *
 * في ملفٍّ عاديّ لا في ملفّ `'use server'`: ذاك لا يُصدّر إلّا دوالَّ
 * غير متزامنة، وتصديرُ ثابتٍ منه يكسر `next build` — ولا يلتقطه `tsc`
 * ولا `jest`. وقعتُ في هذا مرّةً فتوقّف النشرُ كلُّه.
 */
export const AUTO_REJECT_KEY = 'pending_auto_reject_hours';
