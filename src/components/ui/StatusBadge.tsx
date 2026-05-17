/**
 * StatusBadge - عرض حالة بصرية احترافية
 * يحلّ محل النمط القديم: <span>[checkmark] معتمد</span>
 */
import type { LucideIcon } from 'lucide-react';
import {
  Clock, CheckCircle2, Loader2, BadgeCheck, XCircle, Ban,
  AlertCircle, CircleDashed,
} from 'lucide-react';

export type StatusVariant =
  | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  | 'approved' | 'rejected' | 'suspended' | 'active' | 'inactive'
  | 'success' | 'warning' | 'danger' | 'info';

interface VariantConfig {
  icon: LucideIcon;
  bg: string;
  color: string;
  label: string;
}

const VARIANTS: Record<StatusVariant, VariantConfig> = {
  // طلبات
  pending:     { icon: Clock,         bg: 'rgba(184, 84, 12, 0.12)',  color: '#6B3A08', label: 'جديد' },
  confirmed:   { icon: CheckCircle2,  bg: 'rgba(14, 92, 77, 0.12)',   color: '#0E5C4D', label: 'مؤكّد' },
  in_progress: { icon: Loader2,       bg: 'rgba(184, 84, 12, 0.12)',  color: '#6B3A08', label: 'جارٍ' },
  completed:   { icon: BadgeCheck,    bg: 'rgba(14, 92, 77, 0.12)',   color: '#0E5C4D', label: 'مكتمل' },
  cancelled:   { icon: XCircle,       bg: 'rgba(168, 46, 61, 0.10)',  color: '#A82E3D', label: 'ملغى' },

  // اعتماد
  approved:    { icon: BadgeCheck,    bg: 'rgba(14, 92, 77, 0.12)',   color: '#0E5C4D', label: 'معتمد' },
  rejected:    { icon: XCircle,       bg: 'rgba(168, 46, 61, 0.10)',  color: '#A82E3D', label: 'مرفوض' },

  // مستخدم
  suspended:   { icon: Ban,           bg: 'rgba(168, 46, 61, 0.10)',  color: '#A82E3D', label: 'معلّق' },
  active:      { icon: CheckCircle2,  bg: 'rgba(14, 92, 77, 0.12)',   color: '#0E5C4D', label: 'نشط' },
  inactive:    { icon: CircleDashed,  bg: 'rgba(15, 26, 28, 0.06)',   color: '#6E7878', label: 'غير نشط' },

  // عام
  success:     { icon: CheckCircle2,  bg: 'rgba(14, 92, 77, 0.12)',   color: '#0E5C4D', label: 'ناجح' },
  warning:     { icon: AlertCircle,   bg: 'rgba(184, 84, 12, 0.12)',  color: '#6B3A08', label: 'تحذير' },
  danger:      { icon: XCircle,       bg: 'rgba(168, 46, 61, 0.10)',  color: '#A82E3D', label: 'خطأ' },
  info:        { icon: AlertCircle,   bg: 'rgba(83, 74, 183, 0.10)',  color: '#322B7A', label: 'معلومة' },
};

export type StatusSize = 'sm' | 'md' | 'lg';

interface Props {
  status: StatusVariant;
  label?: string;
  size?: StatusSize;
  showIcon?: boolean;
}

const SIZE_CONFIG = {
  sm: { padding: '3px 8px', fontSize: 10, iconSize: 11, gap: 4 },
  md: { padding: '4px 10px', fontSize: 11, iconSize: 13, gap: 5 },
  lg: { padding: '6px 14px', fontSize: 13, iconSize: 15, gap: 6 },
};

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
}: Props) {
  const config = VARIANTS[status];
  const sizeConf = SIZE_CONFIG[size];
  const Icon = config.icon;
  const displayLabel = label ?? config.label;
  const isAnimated = status === 'in_progress';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: sizeConf.gap,
      padding: sizeConf.padding,
      borderRadius: 100,
      background: config.bg,
      color: config.color,
      fontSize: sizeConf.fontSize,
      fontWeight: 800,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      {showIcon && (
        <Icon
          size={sizeConf.iconSize}
          strokeWidth={2.4}
          style={isAnimated ? { animation: 'spin-smooth 1s linear infinite' } : undefined}
        />
      )}
      {displayLabel}
    </span>
  );
}
