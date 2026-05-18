'use client';

import { useState, useTransition } from 'react';
import { updateUserSettings } from '@/lib/services/user-settings';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar, Pill, TestTube, MessageCircle, Newspaper,
  CheckCircle2, Info,
} from 'lucide-react';

const SETTINGS_LIST: Array<{ id: string; icon: LucideIcon; label: string; desc: string }> = [
  { id: 'appointments', icon: Calendar,      label: 'المواعيد',              desc: 'تنبيه قبل الموعد بساعة' },
  { id: 'meds',         icon: Pill,          label: 'أوقات الدواء',           desc: 'تذكير بمواعيد الأدوية' },
  { id: 'results',      icon: TestTube,      label: 'نتائج التحاليل',         desc: 'عند جاهزية النتائج' },
  { id: 'messages',     icon: MessageCircle, label: 'الرسائل والاستشارات',  desc: 'عند الرد من الطبيب' },
  { id: 'news',         icon: Newspaper,     label: 'أخبار طبية',            desc: 'تحديثات صحية مفيدة' },
] as const;

type NotifKey = typeof SETTINGS_LIST[number]['id'];

export default function NotificationsClient({ initial }: { initial: Record<string, boolean> }) {
  const [settings, setSettings] = useState<Record<string, boolean>>({ ...initial });
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function toggle(id: NotifKey) {
    const next = { ...settings, [id]: !settings[id] };
    setSettings(next);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateUserSettings({ notifications: next });
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    });
  }

  return (
    <>
      <div className="scr-section-head" style={{ marginTop: 8 }}>
        <div className="scr-section-title">أنواع الإشعارات</div>
      </div>

      <div className="scr-list-stack">
        {SETTINGS_LIST.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.id} className="scr-list-item">
              <div className="scr-list-item-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2} />
              </div>
              <div className="scr-list-item-content">
                <div className="scr-list-item-title">{s.label}</div>
                <div className="scr-list-item-subtitle">{s.desc}</div>
              </div>
              <label className="scr-toggle">
                <input
                  type="checkbox"
                  checked={!!settings[s.id]}
                  onChange={() => toggle(s.id as NotifKey)}
                  disabled={isPending}
                />
                <span className="scr-toggle-slider"></span>
              </label>
            </div>
          );
        })}
      </div>

      {success && (
        <div style={{ background: 'var(--emerald-soft)', color: 'var(--emerald-deep)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginTop: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <CheckCircle2 size={14} strokeWidth={2.4} />
          تم الحفظ
        </div>
      )}

      <div className="scr-info-banner" style={{ marginTop: 16 }}>
        <Info size={14} strokeWidth={2.2} aria-hidden />
        <span>تأكد من السماح بالإشعارات في إعدادات هاتفك.</span>
      </div>
    </>
  );
}
