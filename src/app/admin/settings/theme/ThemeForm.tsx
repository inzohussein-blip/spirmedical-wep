'use client';

import { useState, useTransition } from 'react';
import { Palette, Save, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { updateTheme, resetThemeToDefault } from './actions';
import { isValidHexColor, type ThemeSettings } from '@/types/theme';
import { useConfirm } from '@/components/ui';

interface ThemeFormProps {
  initialTheme: ThemeSettings;
}

interface ColorField {
  key: keyof Pick<
    ThemeSettings,
    'primary_color' | 'primary_dark' | 'primary_soft' | 'accent_color' | 'danger_color'
  >;
  label: string;
  description: string;
  icon: string;
}

const COLOR_FIELDS: ColorField[] = [
  {
    key: 'primary_color',
    label: 'اللون الأساسي',
    description: 'الأزرار الرئيسية، العناوين، الـ CTAs',
    icon: '🎯',
  },
  {
    key: 'primary_dark',
    label: 'الأساسي الداكن',
    description: 'حالات الـ hover للأزرار الرئيسية',
    icon: '🌑',
  },
  {
    key: 'primary_soft',
    label: 'الأساسي الناعم',
    description: 'خلفيات التمييز، العناصر المختارة',
    icon: '✨',
  },
  {
    key: 'accent_color',
    label: 'لون التنبيه',
    description: 'التنبيهات، الـ warnings، التحذيرات',
    icon: '⚠️',
  },
  {
    key: 'danger_color',
    label: 'لون الخطأ',
    description: 'الأخطاء، الحذف، العمليات الخطيرة',
    icon: '🚨',
  },
];

export default function ThemeForm({ initialTheme }: ThemeFormProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [colors, setColors] = useState({
    primary_color: initialTheme.primary_color,
    primary_dark: initialTheme.primary_dark,
    primary_soft: initialTheme.primary_soft,
    accent_color: initialTheme.accent_color,
    danger_color: initialTheme.danger_color,
  });
  const [themeName, setThemeName] = useState(initialTheme.theme_name);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleColorChange = (key: ColorField['key'], value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validate all
    for (const field of COLOR_FIELDS) {
      if (!isValidHexColor(colors[field.key])) {
        setFeedback({
          type: 'error',
          message: `${field.label} يجب أن يكون hex code صالح (#RRGGBB)`,
        });
        return;
      }
    }

    startTransition(async () => {
      const result = await updateTheme({
        ...colors,
        theme_name: themeName,
      });

      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        // إعادة تحميل الصفحة بعد ثانية لرؤية الألوان الجديدة
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'إعادة الألوان',
      message: 'ستفقد التخصيصات الحالية.',
      variant: 'warning',
      confirmText: 'إعادة',
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await resetThemeToDefault();
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (result.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="theme-form">
      {/* Header */}
      <div className="theme-header">
        <div className="theme-header-icon">
          <Palette size={28} strokeWidth={2} />
        </div>
        <div>
          <h1>تخصيص ألوان المنصة</h1>
          <p>غيّر الألوان وستظهر التغييرات على كل صفحات Spir Medical فوراً</p>
        </div>
      </div>

      {/* Theme Name */}
      <div className="theme-card">
        <label className="theme-label">
          <span>اسم الـ Theme</span>
          <input
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            placeholder="مثل: Default, Winter, Ramadan"
            className="theme-input"
            maxLength={50}
            disabled={isPending}
          />
        </label>
      </div>

      {/* Color Fields */}
      <div className="theme-card">
        <h2 className="theme-section-title">
          <Palette size={18} strokeWidth={2.2} />
          الألوان
        </h2>

        <div className="theme-colors-grid">
          {COLOR_FIELDS.map((field) => (
            <ColorRow
              key={field.key}
              field={field}
              value={colors[field.key]}
              onChange={(v) => handleColorChange(field.key, v)}
              disabled={isPending}
            />
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="theme-card">
        <h2 className="theme-section-title">معاينة مباشرة</h2>
        <div
          className="theme-preview"
          style={
            {
              '--preview-primary': colors.primary_color,
              '--preview-dark': colors.primary_dark,
              '--preview-soft': colors.primary_soft,
              '--preview-accent': colors.accent_color,
              '--preview-danger': colors.danger_color,
            } as React.CSSProperties
          }
        >
          <button type="button" className="preview-btn preview-btn-primary">
            زر رئيسي
          </button>
          <button type="button" className="preview-btn preview-btn-secondary">
            زر ثانوي
          </button>
          <button type="button" className="preview-btn preview-btn-danger">
            حذف
          </button>
          <div className="preview-tag preview-tag-soft">⭐ مميز</div>
          <div className="preview-tag preview-tag-accent">⚠️ تنبيه</div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`theme-feedback ${
            feedback.type === 'success' ? 'theme-feedback-success' : 'theme-feedback-error'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check size={18} strokeWidth={2.4} />
          ) : (
            <AlertCircle size={18} strokeWidth={2.2} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Actions */}
      <div className="theme-actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isPending}
          leftIcon={!isPending ? <Save size={18} /> : undefined}
        >
          {isPending ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleReset}
          disabled={isPending}
          leftIcon={<RotateCcw size={18} />}
        >
          إعادة للافتراضي
        </Button>
      </div>

      <style jsx>{`
        .theme-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 900px;
        }
        .theme-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px;
          background: linear-gradient(135deg, var(--emerald-deep), var(--emerald));
          color: var(--paper-3);
          border-radius: 16px;
          box-shadow: 0 8px 22px -8px rgba(7, 59, 48, 0.4);
        }
        .theme-header-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .theme-header h1 {
          font-size: 18px;
          font-weight: 800;
          margin: 0 0 4px;
        }
        .theme-header p {
          font-size: 12px;
          margin: 0;
          opacity: 0.9;
          line-height: 1.5;
        }
        .theme-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          border: 1px solid var(--line);
        }
        .theme-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 800;
          margin: 0 0 14px;
          color: var(--ink);
        }
        .theme-label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-2);
        }
        .theme-input {
          padding: 10px 12px;
          font-size: 13px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--paper-3);
          font-family: inherit;
          color: var(--ink);
          width: 100%;
          box-sizing: border-box;
        }
        .theme-input:focus {
          outline: none;
          border-color: var(--emerald);
        }
        .theme-colors-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .theme-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 20px;
          background: var(--paper-3);
          border-radius: 12px;
          align-items: center;
        }
        .preview-btn {
          padding: 10px 20px;
          border: 0;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.15s;
        }
        .preview-btn-primary {
          background: var(--preview-primary);
          color: #FAF6EB;
        }
        .preview-btn-primary:hover {
          background: var(--preview-dark);
        }
        .preview-btn-secondary {
          background: var(--paper);
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .preview-btn-danger {
          background: var(--preview-danger);
          color: #FAF6EB;
        }
        .preview-tag {
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
        }
        .preview-tag-soft {
          background: var(--preview-soft);
          color: var(--preview-dark);
        }
        .preview-tag-accent {
          background: var(--preview-accent);
          color: #FAF6EB;
        }
        .theme-feedback {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
        }
        .theme-feedback-success {
          background: var(--emerald-soft);
          color: var(--emerald-deep);
        }
        .theme-feedback-error {
          background: var(--rose-soft);
          color: var(--rose);
        }
        .theme-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }
      `}</style>
      <ConfirmDialog />
    </form>
  );
}

/* ─── Color Row Component ──────────────────────────────────── */

interface ColorRowProps {
  field: ColorField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ColorRow({ field, value, onChange, disabled }: ColorRowProps) {
  const isValid = isValidHexColor(value);

  return (
    <div className="color-row">
      <div className="color-row-info">
        <div className="color-row-icon">{field.icon}</div>
        <div className="color-row-text">
          <div className="color-row-label">{field.label}</div>
          <div className="color-row-desc">{field.description}</div>
        </div>
      </div>
      <div className="color-row-input">
        <input
          type="color"
          value={isValid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="color-picker"
          aria-label={`اختر ${field.label}`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#RRGGBB"
          maxLength={7}
          disabled={disabled}
          className={`color-text ${!isValid ? 'color-text-invalid' : ''}`}
        />
      </div>

      <style jsx>{`
        .color-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: var(--paper-3);
          border-radius: 10px;
        }
        .color-row-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        .color-row-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        .color-row-text {
          min-width: 0;
        }
        .color-row-label {
          font-size: 13px;
          font-weight: 800;
          color: var(--ink);
          margin-bottom: 2px;
        }
        .color-row-desc {
          font-size: 11px;
          color: var(--ink-3);
        }
        .color-row-input {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .color-picker {
          width: 48px;
          height: 36px;
          padding: 0;
          border: 1px solid var(--line);
          border-radius: 8px;
          cursor: pointer;
          background: transparent;
        }
        .color-picker:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .color-text {
          width: 110px;
          padding: 8px 10px;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: #fff;
          color: var(--ink);
          text-transform: uppercase;
        }
        .color-text-invalid {
          border-color: var(--rose);
          color: var(--rose);
        }
        .color-text:focus {
          outline: none;
          border-color: var(--emerald);
        }
      `}</style>
    </div>
  );
}
