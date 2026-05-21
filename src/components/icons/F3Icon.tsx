'use client';

import React from 'react';
import {
  // Services
  Syringe, Droplet, Stethoscope, Building2, Pill, MessageCircle,
  Heart, FlaskConical, Activity, Bone, Brain, Eye, Smile,
  // Tools
  Calculator, AlertTriangle, BookOpen, BarChart3, Wallet,
  // Account
  User, Users, Settings, FileText, Bell, MapPin, Lock,
  // Actions
  Plus, Search, Filter, Edit3, Trash2, Check, X, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, ArrowRight, ArrowLeft,
  RefreshCw, Send, Download, Upload, Share2, Copy, ExternalLink,
  // Status
  CheckCircle2, XCircle, AlertCircle, Info, Clock, Loader2,
  // Media
  Camera, Image as ImageIcon, Video, Mic, Paperclip,
  // Navigation
  Home, Menu, MoreHorizontal, MoreVertical,
  // Misc
  Star, Award, Gift, Sparkles, Zap, Shield, ThumbsUp,
  Calendar, type LucideIcon,
} from 'lucide-react';

/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 F3 Icons System (V25.13)
 * ═══════════════════════════════════════════════════════════════
 *
 * نظام أيقونات موحّد للمشروع كله.
 * يُوحّد استخدام lucide-react مع إعدادات افتراضية.
 *
 * مزايا:
 *   ✓ حجم موحّد بحسب الـ context (sm, md, lg, xl)
 *   ✓ stroke-width موحّد للوضوح
 *   ✓ ألوان من design tokens
 *   ✓ تطابق بين emoji و lucide (للتدرّج)
 *
 * Usage:
 *   <F3Icon name="syringe" size="md" />
 *   <F3Icon name="hospital" color="emerald" />
 *   <F3Icon name="appointment" />
 *
 * Mapping emoji → lucide:
 *   💉 → Syringe        🩸 → Droplet
 *   🩺 → Stethoscope    🏥 → Building2
 *   💊 → Pill           💬 → MessageCircle
 *   ❤️ → Heart          🧪 → FlaskConical
 *   📊 → BarChart3      📋 → FileText
 * ═══════════════════════════════════════════════════════════════
 */

export type F3IconName =
  // ─── Services ───
  | 'blood-draw'      // 🩸
  | 'syringe'         // 💉
  | 'nursing'         // 🩹
  | 'doctor'          // 👨‍⚕️
  | 'hospital'        // 🏥
  | 'pharmacy'        // 💊
  | 'consultation'    // 💬
  | 'lab-test'        // 🧪
  | 'cardiology'      // ❤️
  | 'orthopedics'     // 🦴
  | 'neurology'       // 🧠
  | 'eye-care'        // 👁️
  | 'dentistry'       // 🦷
  | 'physio'          // 🦾
  | 'home-visit'      // 🏠
  // ─── Tools ───
  | 'calculator'      // 🧮
  | 'first-aid'       // 🩹
  | 'guide'           // 📖
  | 'health-stats'    // 📊
  | 'wallet'          // 💰
  | 'symptoms'        // 🩺
  // ─── Account ───
  | 'profile'
  | 'family'
  | 'settings'
  | 'records'
  | 'notifications'
  | 'location'
  | 'security'
  // ─── Actions ───
  | 'add' | 'search' | 'filter' | 'edit' | 'delete'
  | 'check' | 'close' | 'arrow-back' | 'arrow-forward'
  | 'arrow-left' | 'arrow-right'
  | 'chevron-down' | 'chevron-up'
  | 'refresh' | 'send' | 'download' | 'upload'
  | 'share' | 'copy' | 'external'
  // ─── Status ───
  | 'success' | 'error' | 'warning' | 'info'
  | 'pending' | 'loading' | 'emergency'
  // ─── Media ───
  | 'camera' | 'image' | 'video' | 'mic' | 'attach'
  // ─── Navigation ───
  | 'home' | 'menu' | 'more-h' | 'more-v'
  // ─── Misc ───
  | 'star' | 'award' | 'gift' | 'sparkles' | 'fast'
  | 'shield' | 'thumbs-up' | 'calendar';

const ICON_MAP: Record<F3IconName, LucideIcon> = {
  // Services
  'blood-draw':    Droplet,
  syringe:         Syringe,
  nursing:         Heart,
  doctor:          Stethoscope,
  hospital:        Building2,
  pharmacy:        Pill,
  consultation:    MessageCircle,
  'lab-test':      FlaskConical,
  cardiology:      Heart,
  orthopedics:     Bone,
  neurology:       Brain,
  'eye-care':      Eye,
  dentistry:       Smile,
  physio:          Activity,
  'home-visit':    Home,
  // Tools
  calculator:      Calculator,
  'first-aid':     AlertTriangle,
  guide:           BookOpen,
  'health-stats':  BarChart3,
  wallet:          Wallet,
  symptoms:        Stethoscope,
  // Account
  profile:         User,
  family:          Users,
  settings:        Settings,
  records:         FileText,
  notifications:   Bell,
  location:        MapPin,
  security:        Lock,
  // Actions
  add:             Plus,
  search:          Search,
  filter:          Filter,
  edit:            Edit3,
  delete:          Trash2,
  check:           Check,
  close:           X,
  'arrow-back':    ChevronLeft,
  'arrow-forward': ChevronRight,
  'arrow-left':    ArrowLeft,
  'arrow-right':   ArrowRight,
  'chevron-down':  ChevronDown,
  'chevron-up':    ChevronUp,
  refresh:         RefreshCw,
  send:            Send,
  download:        Download,
  upload:          Upload,
  share:           Share2,
  copy:            Copy,
  external:        ExternalLink,
  // Status
  success:         CheckCircle2,
  error:           XCircle,
  warning:         AlertCircle,
  info:            Info,
  pending:         Clock,
  loading:         Loader2,
  emergency:       AlertTriangle,
  // Media
  camera:          Camera,
  image:           ImageIcon,
  video:           Video,
  mic:             Mic,
  attach:          Paperclip,
  // Navigation
  home:            Home,
  menu:            Menu,
  'more-h':        MoreHorizontal,
  'more-v':        MoreVertical,
  // Misc
  star:            Star,
  award:           Award,
  gift:            Gift,
  sparkles:        Sparkles,
  fast:            Zap,
  shield:          Shield,
  'thumbs-up':     ThumbsUp,
  calendar:        Calendar,
};

// ─── Color mapping (design tokens) ───
const COLOR_MAP = {
  emerald:  'var(--emerald)',
  amber:    'var(--amber)',
  rose:     'var(--rose)',
  ink:      'var(--ink)',
  'ink-2':  'var(--ink-2)',
  'ink-3':  'var(--ink-3)',
  white:    'var(--paper-3)',
  current:  'currentColor',
} as const;

export type F3IconColor = keyof typeof COLOR_MAP;

// ─── Size presets ───
const SIZE_MAP = {
  xs: 12,   // للنصوص الصغيرة
  sm: 14,   // داخل الأزرار الصغيرة
  md: 18,   // الافتراضي
  lg: 24,   // العناوين
  xl: 32,   // البطاقات الكبيرة
  '2xl': 48, // Empty states
} as const;

export type F3IconSize = keyof typeof SIZE_MAP;

interface Props {
  name: F3IconName;
  size?: F3IconSize | number;
  color?: F3IconColor | string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

export default function F3Icon({
  name,
  size = 'md',
  color = 'current',
  strokeWidth = 2,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}: Props) {
  const Icon = ICON_MAP[name];

  if (!Icon) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(`F3Icon: unknown icon "${name}"`);
    }
    return null;
  }

  const finalSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const finalColor = color in COLOR_MAP
    ? COLOR_MAP[color as F3IconColor]
    : color;

  return (
    <Icon
      size={finalSize}
      color={finalColor}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
}

// ─── Helper: emoji → F3IconName (للتدرّج التدريجي) ───
const EMOJI_TO_ICON: Record<string, F3IconName> = {
  '🩸': 'blood-draw',
  '💉': 'syringe',
  '🩹': 'first-aid',
  '👨‍⚕️': 'doctor',
  '👩‍⚕️': 'doctor',
  '🏥': 'hospital',
  '💊': 'pharmacy',
  '💬': 'consultation',
  '🧪': 'lab-test',
  '❤️': 'cardiology',
  '🦴': 'orthopedics',
  '🧠': 'neurology',
  '👁️': 'eye-care',
  '🦷': 'dentistry',
  '🦾': 'physio',
  '🏠': 'home-visit',
  '🧮': 'calculator',
  '📖': 'guide',
  '📊': 'health-stats',
  '💰': 'wallet',
  '🩺': 'symptoms',
  '👤': 'profile',
  '👨‍👩‍👧‍👦': 'family',
  '⚙️': 'settings',
  '📋': 'records',
  '🔔': 'notifications',
  '📍': 'location',
  '🔒': 'security',
  '🚨': 'emergency',
  '⏰': 'pending',
  '⭐': 'star',
  '🎁': 'gift',
  '✨': 'sparkles',
  '⚡': 'fast',
  '🛡️': 'shield',
  '👍': 'thumbs-up',
  '📅': 'calendar',
};

/**
 * Helper: تحويل emoji إلى F3 icon name
 * مفيد للهجرة التدريجية
 */
export function emojiToIconName(emoji: string): F3IconName | null {
  return EMOJI_TO_ICON[emoji] || null;
}

/**
 * Component مساعد: يقرأ emoji ويُحوّله لـ F3Icon تلقائياً
 *
 * <F3IconFromEmoji emoji="🩸" />
 */
export function F3IconFromEmoji({
  emoji,
  ...props
}: Omit<Props, 'name'> & { emoji: string }) {
  const iconName = emojiToIconName(emoji);
  if (!iconName) {
    // Fallback: عرض الـ emoji كما هو
    return <span aria-hidden={props['aria-hidden']}>{emoji}</span>;
  }
  return <F3Icon name={iconName} {...props} />;
}
