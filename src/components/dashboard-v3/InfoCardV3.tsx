/**
 * ════════════════════════════════════════════════════════════════════
 * 📄 InfoCardV3 - V26.3
 * ════════════════════════════════════════════════════════════════════
 * 
 * Section/Card موحّد للمحتوى المعلوماتي في صفحات التفاصيل
 * ════════════════════════════════════════════════════════════════════
 */

import type { Icon as TablerIcon } from '@tabler/icons-react';

interface Props {
  title?: string;
  titleIcon?: TablerIcon;
  titleColor?: string;
  variant?: 'default' | 'warning' | 'info' | 'success';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<string, { bg: string; border: string; color?: string }> = {
  default: { bg: '#FFFFFF', border: '#DADCE0' },
  warning: { bg: '#FEF7E0', border: '#FBBC04', color: '#B06000' },
  info: { bg: '#E8F0FE', border: '#1A73E8', color: '#1967D2' },
  success: { bg: '#E6F3EF', border: '#01875F', color: '#04342C' },
};

export default function InfoCardV3({
  title,
  titleIcon: TitleIcon,
  titleColor,
  variant = 'default',
  children,
  className,
  style,
}: Props) {
  const v = VARIANT_STYLES[variant];
  
  return (
    <div
      className={className}
      style={{
        margin: '0 14px 12px',
        padding: 14,
        background: v.bg,
        border: `0.5px solid ${v.border}`,
        borderRadius: 14,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: v.color || titleColor || '#5F6368',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {TitleIcon && <TitleIcon size={14} stroke={2.2} />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
