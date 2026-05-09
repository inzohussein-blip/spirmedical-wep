// مولّد فترات زمنية للحجوزات
export interface TimeSlot {
  id: string; // ISO date
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  displayDate: string; // عربي مثل: "غداً" أو "الخميس ٢٢"
  displayTime: string; // عربي مثل: "١٠:٠٠ ص"
  available: boolean;
  isPopular?: boolean;
}

// أسماء الأيام بالعربية
const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

// تحويل الأرقام الإنجليزية لعربية
export function toArabicDigits(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => arabicDigits[parseInt(d)]);
}

// عرض الوقت بصيغة ١٢ ساعة عربية
export function formatTimeArabic(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const minuteStr = minute === 0 ? '٠٠' : toArabicDigits(minute.toString().padStart(2, '0'));
  return `${toArabicDigits(displayHour)}:${minuteStr} ${period}`;
}

// عرض التاريخ نسبياً (اليوم/غداً/بعد غد) أو الاسم
export function formatDateRelative(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'اليوم';
  if (diffDays === 1) return 'غداً';
  if (diffDays === 2) return 'بعد غد';
  if (diffDays < 7) return ARABIC_DAYS[date.getDay()];

  return `${ARABIC_DAYS[date.getDay()]} ${toArabicDigits(date.getDate())}`;
}

// إنشاء قائمة الأيام المتاحة (٧ أيام قادمة)
export function generateAvailableDates(daysAhead: number = 7): Date[] {
  const dates: Date[] = [];
  const now = new Date();

  // ابدأ من الغد
  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    dates.push(date);
  }

  return dates;
}

// إنشاء فترات زمنية ليوم محدد (٨ صباحاً - ٨ مساءً، كل ٣٠ دقيقة)
export function generateTimeSlotsForDate(date: Date, serviceDuration: number = 60): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayName = formatDateRelative(date);

  // فترات شائعة (تظهر بشكل بارز)
  const popularHours = [9, 10, 11, 16, 17, 18];

  // من ٨ صباحاً إلى ٨ مساءً
  for (let hour = 8; hour < 20; hour++) {
    for (let minute of [0, 30]) {
      const slotDate = new Date(date);
      slotDate.setHours(hour, minute, 0, 0);

      // محاكاة: بعض الفترات محجوزة (للعرض)
      const isBooked = Math.random() < 0.2;

      slots.push({
        id: slotDate.toISOString(),
        date: slotDate.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        displayDate: dayName,
        displayTime: formatTimeArabic(hour, minute),
        available: !isBooked,
        isPopular: popularHours.includes(hour) && minute === 0,
      });
    }
  }

  return slots;
}

// تجميع الفترات في مجموعات (صباح/ظهر/مساء)
export interface TimeGroup {
  label: string;
  emoji: string;
  slots: TimeSlot[];
}

export function groupTimeSlots(slots: TimeSlot[]): TimeGroup[] {
  const morning = slots.filter((s) => {
    const h = parseInt(s.time.split(':')[0]);
    return h >= 8 && h < 12;
  });
  const afternoon = slots.filter((s) => {
    const h = parseInt(s.time.split(':')[0]);
    return h >= 12 && h < 16;
  });
  const evening = slots.filter((s) => {
    const h = parseInt(s.time.split(':')[0]);
    return h >= 16 && h < 20;
  });

  return [
    { label: 'صباحاً', emoji: '🌅', slots: morning },
    { label: 'ظهراً', emoji: '☀️', slots: afternoon },
    { label: 'مساءً', emoji: '🌙', slots: evening },
  ];
}

// تنسيق ملخّص الموعد للعرض
export function formatAppointmentSummary(slot: TimeSlot): string {
  return `${slot.displayDate} · ${slot.displayTime}`;
}
