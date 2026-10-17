/**
 * 🎯 مصدرُ الأيقونات الواحد — Tabler بأسلوب تطبيق المريض، باسمٍ ولونٍ لكلّ مفهوم.
 *
 * كانت الواجهة تخلط الإيموجي (1,434 موضعاً في 230 ملفّاً) بمكتبتين: Lucide (169 ملفّاً) وTabler (23).
 * وُحّدت أوّلاً على Lucide، ثمّ رأى المالكُ أيقوناتِ تطبيق المريض — Tabler ملوّنةً على دائرةٍ فاتحة —
 * وفضّلها (17 تشرين الأول)، فصارت Tabler وحدها في المشروع كلّه، وlucide-react أُزيلت.
 *
 * هنا الاسمُ يُختار مرّةً («hospitals»)، ومعه لونُه من لوحة تطبيق المريض نفسها (`services-v3.ts`):
 * المستشفى أزرق، والصيدلية بنفسجيّة، وسحبُ الدم أحمر… فيرى المستخدمُ اللونَ نفسَه للمفهوم نفسه في
 * الموقع والتطبيق ولوحة الإدارة. اللونُ للبلاطات والبطاقات؛ القوائمُ والأزرار بلون النصّ.
 */
import {
  IconAccessible, IconAlertTriangle, IconBan, IconBrain, IconBug, IconBuildingHospital, IconCalendarEvent,
  IconCamera, IconChartBar, IconChartLine, IconCircleCheck, IconClipboardList, IconCompass, IconDatabase,
  IconDental, IconDroplet, IconEye, IconFlag, IconGift, IconHourglass, IconInbox, IconLayoutDashboard,
  IconLock, IconMail, IconMap, IconMapPin, IconMedicalCross, IconMessageCircle, IconMessages, IconMicroscope,
  IconPackage, IconPalette, IconPill, IconPower, IconRocket, IconRosetteDiscountCheck, IconRun, IconSalad,
  IconScript, IconSettings, IconShieldCheck, IconSparkles, IconStethoscope, IconTicket, IconUrgent, IconUser,
  IconUserPlus, IconUsers, IconVaccine,
} from '@tabler/icons-react';
import type { Icon as TablerIcon } from '@tabler/icons-react';

export const ICONS = {
  // ─── الإدارة ───
  dashboard: IconLayoutDashboard,
  createUser: IconUserPlus,
  seedData: IconDatabase,
  emergency: IconUrgent,
  pending: IconHourglass,
  specialists: IconMedicalCross,
  doctors: IconStethoscope,
  hospitals: IconBuildingHospital,
  pharmacies: IconPill,
  medications: IconClipboardList,
  dental: IconDental,
  optical: IconEye,
  mentalHealth: IconBrain,
  nutrition: IconSalad,
  nurses: IconVaccine,
  physio: IconRun,
  labs: IconMicroscope,
  cosmetic: IconSparkles,
  locations: IconMapPin,
  map: IconMap,
  serviceAreas: IconCompass,
  services: IconPower,
  patients: IconUsers,
  patient: IconUser,
  orders: IconClipboardList,
  notifications: IconMessages,
  whatsapp: IconMessageCircle,
  stories: IconCamera,
  reports: IconChartLine,
  campaigns: IconMail,
  analytics: IconChartBar,
  coupons: IconGift,
  launch: IconRocket,
  betaCodes: IconTicket,
  feedback: IconMessages,
  bugs: IconBug,
  auditLog: IconScript,
  admins: IconShieldCheck,
  settings: IconSettings,
  theme: IconPalette,
  schedule: IconCalendarEvent,
  // ─── الحالات والأرقام ───
  inbox: IconInbox,
  done: IconCircleCheck,
  cancelled: IconBan,
  rate: IconChartBar,
  empty: IconPackage,
  warning: IconAlertTriangle,
  // ─── الخدمات والثقة (الموقع) ───
  bloodDraw: IconDroplet,
  nursing: IconVaccine,
  accessible: IconAccessible,
  secure: IconLock,
  certified: IconRosetteDiscountCheck,
  local: IconFlag,
} satisfies Record<string, TablerIcon>;

export type IconName = keyof typeof ICONS;

/**
 * لوحةُ الألوان — قيمُ `services-v3.ts` نفسُها (اللونُ وخلفيّتُه الفاتحة).
 * `fg` للأيقونة، و`bg` للدائرة/البلاطة خلفها.
 */
export const ICON_TONES = {
  emerald: { fg: '#01875F', bg: '#E6F3EF' },
  green: { fg: '#34A853', bg: '#E8F5E9' },
  teal: { fg: '#00897B', bg: '#E0F2F1' },
  cyan: { fg: '#00838F', bg: '#E0F7FA' },
  blue: { fg: '#1A73E8', bg: '#E8F0FE' },
  purple: { fg: '#9334E6', bg: '#F3E8FD' },
  violet: { fg: '#7C4DFF', bg: '#EDE7F6' },
  red: { fg: '#EA4335', bg: '#FCE8E6' },
  rose: { fg: '#C71C56', bg: '#FCE8E6' },
  orange: { fg: '#FF6D00', bg: '#FFF3E0' },
  amber: { fg: '#B06000', bg: '#FEF7E0' },
  yellow: { fg: '#E8A200', bg: '#FEF7E0' },
  gray: { fg: '#5F6368', bg: '#F1F3F4' },
} as const;

export type IconTone = keyof typeof ICON_TONES;

/** لونُ كلّ مفهوم — كما في بطاقات تطبيق المريض حيث يوجد مقابل */
export const ICON_COLOR: Record<IconName, IconTone> = {
  dashboard: 'emerald',
  createUser: 'emerald',
  seedData: 'gray',
  emergency: 'red',
  pending: 'amber',
  specialists: 'teal',
  doctors: 'emerald',
  hospitals: 'blue',
  pharmacies: 'purple',
  medications: 'gray',
  dental: 'cyan',
  optical: 'orange',
  mentalHealth: 'rose',
  nutrition: 'green',
  nurses: 'amber',
  physio: 'violet',
  labs: 'blue',
  cosmetic: 'purple',
  locations: 'red',
  map: 'teal',
  serviceAreas: 'teal',
  services: 'emerald',
  patients: 'blue',
  patient: 'blue',
  orders: 'gray',
  notifications: 'cyan',
  whatsapp: 'green',
  stories: 'rose',
  reports: 'green',
  campaigns: 'orange',
  analytics: 'blue',
  coupons: 'rose',
  launch: 'violet',
  betaCodes: 'amber',
  feedback: 'cyan',
  bugs: 'red',
  auditLog: 'gray',
  admins: 'violet',
  settings: 'gray',
  theme: 'purple',
  schedule: 'teal',
  inbox: 'blue',
  done: 'green',
  cancelled: 'rose',
  rate: 'violet',
  empty: 'gray',
  warning: 'yellow',
  bloodDraw: 'red',
  nursing: 'amber',
  accessible: 'violet',
  secure: 'blue',
  certified: 'blue',
  local: 'emerald',
};

/** سماكةُ الخطّ في تطبيق المريض (1.75) — واحدةٌ في المشروع كلّه */
export const ICON_STROKE = 1.75;

/** لونُ المفهوم وخلفيّتُه لحاويةِ أيقونة (بلاطة) — نمطٌ سطريّ يغلب ألوانَ الأصناف العامّة */
export function conceptTileStyle(name: IconName): { color: string; background: string } {
  const t = ICON_TONES[ICON_COLOR[name]];
  return { color: t.fg, background: t.bg };
}
