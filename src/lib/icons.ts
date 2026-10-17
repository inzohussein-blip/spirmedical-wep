/**
 * 🎯 مصدرُ الأيقونات الواحد — Lucide وحده، باسمٍ لكلّ مفهوم.
 *
 * كانت الواجهة تخلط الإيموجي (1,434 موضعاً في 230 ملفّاً) بمكتبتين: Lucide (165 ملفّاً) وTabler (22).
 * والإيموجي يُرسم بخطّ النظام: شكلٌ في آيفون وآخر في أندرويد، ولونٌ لا يتبع الوضعَ الليليّ ولا لونَ
 * العلامة، ولا يقرؤه قارئُ الشاشة بمعنى. هنا الاسمُ يُختار مرّةً («hospitals»)، والأيقونةُ تتبدّل في
 * موضعٍ واحد.
 */
import {
  Accessibility, BarChart3, Bug, Camera, ClipboardList, Compass, Database, Droplet, Gift, Glasses,
  Hospital, Hourglass, Inbox, LayoutDashboard, LineChart, Lock, Mail, MapPin, MessageCircle,
  MessagesSquare, Microscope, Palette, Pill, Power, Rocket, Salad, ScrollText, Settings, ShieldCheck,
  Siren, Smile, Sparkles, Stethoscope, Syringe, Ticket, UserPlus, UserRound, Users, Brain, BadgeCheck,
  CircleCheck, Ban, BriefcaseMedical, Map, Flag, Package, type LucideIcon,
} from 'lucide-react';

export const ICONS = {
  // ─── الإدارة ───
  dashboard: LayoutDashboard,
  createUser: UserPlus,
  seedData: Database,
  emergency: Siren,
  pending: Hourglass,
  specialists: BriefcaseMedical,
  doctors: Stethoscope,
  hospitals: Hospital,
  pharmacies: Pill,
  medications: ClipboardList,
  dental: Smile,
  optical: Glasses,
  mentalHealth: Brain,
  nutrition: Salad,
  nurses: Syringe,
  physio: Accessibility,
  labs: Microscope,
  cosmetic: Sparkles,
  locations: MapPin,
  map: Map,
  serviceAreas: Compass,
  services: Power,
  patients: Users,
  patient: UserRound,
  orders: ClipboardList,
  notifications: MessagesSquare,
  whatsapp: MessageCircle,
  stories: Camera,
  reports: LineChart,
  campaigns: Mail,
  analytics: BarChart3,
  coupons: Gift,
  launch: Rocket,
  betaCodes: Ticket,
  feedback: MessagesSquare,
  bugs: Bug,
  auditLog: ScrollText,
  admins: ShieldCheck,
  settings: Settings,
  theme: Palette,
  // ─── الحالات والأرقام ───
  inbox: Inbox,
  done: CircleCheck,
  cancelled: Ban,
  rate: BarChart3,
  empty: Package,
  // ─── الخدمات والثقة (الموقع) ───
  bloodDraw: Droplet,
  nursing: Syringe,
  secure: Lock,
  certified: BadgeCheck,
  local: Flag,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** قياسٌ واحد للأيقونات: 20 في القوائم، وخطٌّ بسماكة 1.9 يناسب Plex Arabic */
export const ICON_STROKE = 1.9;
