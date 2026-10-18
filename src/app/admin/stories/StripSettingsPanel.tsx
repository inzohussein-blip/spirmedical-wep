'use client';

import { useState, useTransition } from 'react';
import { IconDeviceFloppy, IconEye, IconEyeOff } from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';
import StoriesStrip from '@/components/stories/StoriesStrip';
import {
  SHAPE_LABELS, STRIP_SHAPES, STRIP_THEMES, THEME_LABELS, type StripSettings,
} from '@/lib/stories/strip-settings';
import type { Story } from '@/types/story';
import { saveStripSettings } from './actions';

/**
 * ⚙️ التحكّمُ بشريط القصص لجميع المستخدمين: إظهارُه أو إخفاؤه، وشكلُه، وثيمُه — بمعاينةٍ حيّة
 * من القصص المنشورة نفسها (الضغطُ على قصّةٍ في المعاينة يفتحها كما يراها المريض).
 */
export default function StripSettingsPanel({ initial, stories }: { initial: StripSettings; stories: Story[] }) {
  const [settings, setSettings] = useState<StripSettings>(initial);
  const [saved, setSaved] = useState<StripSettings>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved);

  const save = (next: StripSettings) => {
    startTransition(async () => {
      try {
        const res = await saveStripSettings(next);
        setMsg({ ok: res.success, text: res.message });
        if (res.success) {
          setSaved(next);
          setSettings(next);
        }
      } catch {
        setMsg({ ok: false, text: 'تعذّر الاتصال. حاول مرة أخرى.' });
      }
    });
  };

  return (
    <section className="ssp" aria-labelledby="ssp-title">
      <div className="ssp-head">
        <div>
          <h2 id="ssp-title" className="ssp-title">شريطُ القصص</h2>
          <p className="ssp-sub">
            {saved.enabled ? 'ظاهرٌ لجميع المستخدمين في رئيسية التطبيق وصفحة الزائر.' : 'مخفيٌّ عن جميع المستخدمين.'}
          </p>
        </div>
        <Button
          variant={saved.enabled ? 'secondary' : 'primary'}
          size="md"
          loading={isPending}
          leftIcon={saved.enabled ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          onClick={() => save({ ...saved, enabled: !saved.enabled })}
        >
          {saved.enabled ? 'إخفاء عن الجميع' : 'إظهار للجميع'}
        </Button>
      </div>

      <fieldset className="ssp-group">
        <legend>الشكل</legend>
        <div className="ssp-options">
          {STRIP_SHAPES.map((s) => (
            <label key={s} className={`ssp-option ${settings.shape === s ? 'ssp-selected' : ''}`}>
              <input type="radio" name="ssp-shape" checked={settings.shape === s} onChange={() => setSettings({ ...settings, shape: s })} />
              <strong>{SHAPE_LABELS[s].label}</strong>
              <span>{SHAPE_LABELS[s].hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="ssp-group">
        <legend>الثيم</legend>
        <div className="ssp-options">
          {STRIP_THEMES.map((t) => (
            <label key={t} className={`ssp-option ${settings.theme === t ? 'ssp-selected' : ''}`}>
              <input type="radio" name="ssp-theme" checked={settings.theme === t} onChange={() => setSettings({ ...settings, theme: t })} />
              <strong>{THEME_LABELS[t].label}</strong>
              <span>{THEME_LABELS[t].hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="ssp-preview">
        <span className="ssp-label">معاينة {stories.length === 0 && '(لا قصصَ منشورة بعد)'}</span>
        <div className="ssp-preview-frame">
          {stories.length > 0 && <StoriesStrip stories={stories} shape={settings.shape} theme={settings.theme} />}
        </div>
      </div>

      <div className="ssp-actions">
        <Button
          variant="primary"
          size="md"
          loading={isPending}
          disabled={!dirty}
          leftIcon={<IconDeviceFloppy size={16} />}
          onClick={() => save(settings)}
        >
          حفظ الشكل والثيم
        </Button>
        {msg && <span className={msg.ok ? 'ssp-ok' : 'ssp-err'} role="status">{msg.text}</span>}
      </div>

      <style jsx>{`
        .ssp { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 16px; }
        .ssp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .ssp-title { font-size: 16px; font-weight: 800; margin: 0 0 4px; }
        .ssp-sub { font-size: 13px; color: var(--ink-3); margin: 0; }
        .ssp-group { border: 0; padding: 0; margin: 0; min-width: 0; }
        .ssp-group legend { font-size: 13px; font-weight: 700; color: var(--ink-2); margin-bottom: 8px; padding: 0; }
        .ssp-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: 8px; }
        .ssp-option {
          display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 12px;
          border: 2px solid var(--line); cursor: pointer; background: var(--paper-3);
        }
        .ssp-option input { position: absolute; opacity: 0; pointer-events: none; }
        .ssp-option strong { font-size: 13px; }
        .ssp-option span { font-size: 12px; color: var(--ink-3); }
        .ssp-option:focus-within { outline: 2px solid var(--emerald); outline-offset: 2px; }
        .ssp-selected { border-color: var(--emerald); background: var(--emerald-soft); }
        .ssp-label { font-size: 13px; font-weight: 700; color: var(--ink-2); }
        .ssp-preview { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .ssp-preview-frame { background: var(--paper-2); border-radius: 12px; padding: 14px 12px 0; min-height: 60px; overflow: hidden; }
        .ssp-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .ssp-ok { font-size: 13px; font-weight: 700; color: var(--emerald-deep); }
        .ssp-err { font-size: 13px; font-weight: 700; color: var(--rose); }
      `}</style>
    </section>
  );
}
