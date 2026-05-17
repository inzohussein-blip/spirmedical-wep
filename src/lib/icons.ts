/**
 * Icon Registry — مكتبة أيقونات Spir Medical موحّدة (V24)
 *
 * كل أيقونة مُعرّفة هنا مع:
 *   - مكتبتها المصدر (Lucide / Phosphor / Tabler)
 *   - دلالتها الطبية الواضحة
 *
 * استخدم: import { Icons } from '@/lib/icons';
 *         <Icons.BloodDraw size={20} />
 */

import {
  // — Medical & Services —
  Droplet,         // سحب الدم
  Heart,           // الصحة العامة
  Stethoscope,    // الاستشارات الطبية
  Pill,            // الأدوية / الوصفات
  Syringe,         // الحقن / التطعيمات
  TestTube,        // التحاليل المختبرية
  ScanLine,        // الفحوصات
  Activity,        // المؤشرات الحيوية
  HeartPulse,      // التمريض / النبض
  Bandage,         // الإسعافات الأولية
  Brain,           // الصحة النفسية
  Bone,            // العظام / الفيزياء العلاجية
  Apple,           // التغذية

  // — Appointments —
  Calendar,
  CalendarCheck,
  CalendarClock,
  Clock,
  ClipboardList,
  ClipboardCheck,
  FileText,

  // — Status & States —
  CircleCheck,
  CircleX,
  CircleAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,

  // — Navigation —
  Home,
  Search,
  Bell,
  User,
  Users,
  Settings,
  LogOut,
  Menu,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,

  // — Communication —
  MessageCircle,
  MessageSquare,
  Send,
  Phone,
  PhoneCall,
  Mail,
  AtSign,

  // — Money & Payments —
  Wallet,
  CreditCard,
  Banknote,
  Receipt,
  Tag,
  Gift,
  Percent,

  // — Location & Map —
  MapPin,
  Map,
  Navigation,
  Compass,

  // — Actions —
  Plus,
  Minus,
  Edit,
  Edit2,
  Trash2,
  Copy,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Filter,
  SortAsc,
  Eye,
  EyeOff,

  // — Time —
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Timer,

  // — Misc —
  Star,
  Sparkles,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Award,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Loader2,
  CheckSquare,
  Square,
  Camera,
  Image as ImageIcon,
  Paperclip,
  Mic,
  ChartLine,
  ListChecks,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Zap,
  PartyPopper,
  Flame,
  Bookmark,
  type LucideIcon,
} from 'lucide-react';

/**
 * Mapping دلالي يستخدمه المشروع
 * كل اسم يعكس المعنى الطبي/الوظيفي بدلاً من الشكل
 */
export const Icons = {
  // — Medical Services —
  BloodDraw: Droplet,
  BloodTest: TestTube,
  Health: Heart,
  HealthPulse: HeartPulse,
  Consultation: Stethoscope,
  Medication: Pill,
  Injection: Syringe,
  Vaccination: Syringe,
  LabTest: TestTube,
  Scan: ScanLine,
  Vitals: Activity,
  Nursing: HeartPulse,
  FirstAid: Bandage,
  Psychology: Brain,
  Physio: Bone,
  Nutrition: Apple,

  // — Appointments —
  Appointment: Calendar,
  AppointmentConfirmed: CalendarCheck,
  AppointmentTime: CalendarClock,
  Time: Clock,
  Timer,
  Prescription: ClipboardList,
  Document: FileText,
  Checklist: ClipboardCheck,

  // — Status —
  Success: CircleCheck,
  Error: CircleX,
  Warning: AlertTriangle,
  Info,
  CheckCircle: CheckCircle2,
  XCircle,
  Alert: CircleAlert,

  // — Navigation —
  Home,
  Search,
  Bell,
  User,
  Users,
  Settings,
  Logout: LogOut,
  Menu,
  ArrowRight,
  ArrowLeft,
  Next: ChevronRight,
  Prev: ChevronLeft,
  ChevronDown,
  ChevronUp,
  Close: X,

  // — Communication —
  Chat: MessageCircle,
  Message: MessageSquare,
  Send,
  Phone,
  PhoneCall,
  Email: Mail,
  AtSign,

  // — Money —
  Wallet,
  CreditCard,
  Cash: Banknote,
  Receipt,
  Tag,
  Gift,
  Percent,

  // — Location —
  Location: MapPin,
  Map,
  Navigation,
  Compass,

  // — Actions —
  Add: Plus,
  Remove: Minus,
  Edit,
  EditAlt: Edit2,
  Delete: Trash2,
  Copy,
  Share: Share2,
  Download,
  Upload,
  Refresh: RefreshCw,
  Filter,
  Sort: SortAsc,
  Show: Eye,
  Hide: EyeOff,
  CheckBox: CheckSquare,
  UncheckedBox: Square,
  Camera,
  ImageIcon,
  Attach: Paperclip,
  Mic,

  // — Time of Day —
  Morning: Sunrise,
  Day: Sun,
  Evening: Sunset,
  Night: Moon,

  // — Quality —
  Star,
  Sparkles,
  Award,
  Bookmark,

  // — Security —
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,

  // — Analytics —
  TrendingUp,
  TrendingDown,
  BarChart: BarChart3,
  PieChart,
  Chart: ChartLine,

  // — Misc —
  Loading: Loader2,
  Tasks: ListChecks,
  Book: BookOpen,
  Help: HelpCircle,
  External: ExternalLink,
  Zap,
  Celebrate: PartyPopper,
  Hot: Flame,
} as const;

export type IconName = keyof typeof Icons;
export type { LucideIcon };

/**
 * Helper لاستخدام موحّد
 * 
 * مثال:
 *   <SpirIcon name="BloodDraw" size={20} className="text-rose-600" />
 */
export interface SpirIconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
}

import { createElement } from 'react';

export function SpirIcon({
  name,
  size = 20,
  className,
  strokeWidth = 2,
  ...rest
}: SpirIconProps) {
  const IconComponent = Icons[name];
  return createElement(IconComponent, {
    size,
    className,
    strokeWidth,
    'aria-hidden': true,
    ...rest,
  });
}
