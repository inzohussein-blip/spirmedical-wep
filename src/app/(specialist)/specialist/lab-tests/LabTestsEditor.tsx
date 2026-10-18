'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { IconArrowRight, IconDeviceFloppy, IconSearch } from '@tabler/icons-react';
import { BLOOD_TESTS, TEST_CATEGORIES, type TestCategory } from '@/lib/services/blood-tests-data';
import EmojiIcon from '@/components/ui/EmojiIcon';
import { saveLabTests } from './actions';

/**
 * 🧪 قائمةُ تحاليل المختبر: اسمُ المختبر ومدينتُه، ثمّ التحاليلُ مجموعةً بفئاتها مع «تحديد الكلّ» لكلّ فئة.
 * أصنافُها بالبادئة `lt-` (styled-jsx لا يحمي من الأصناف العامّة).
 */
export default function LabTestsEditor({ initialTests, initialName, initialCity }: {
  initialTests: string[];
  initialName: string;
  initialCity: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialTests));
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (t: (typeof BLOOD_TESTS)[number]) =>
      !q || t.nameAr.includes(q) || t.code.toLowerCase().includes(q) || t.keywords.some((k) => k.toLowerCase().includes(q));
    const byCat = new Map<TestCategory, typeof BLOOD_TESTS>();
    for (const t of BLOOD_TESTS.filter(match)) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t]);
    return [...byCat.entries()];
  }, [query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleGroup = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  const save = () =>
    startTransition(async () => {
      try {
        const res = await saveLabTests({ testIds: [...selected], labName: name, labCity: city });
        setMsg({ ok: res.ok, text: res.message });
      } catch {
        setMsg({ ok: false, text: 'تعذّر الاتصال. حاول مرّةً أخرى.' });
      }
    });

  return (
    <main className="app-screen">
      <div className="scr-content lt">
        <div className="lt-head">
          <Link href="/specialist" className="lt-back" aria-label="العودة">
            <IconArrowRight size={20} stroke={2} aria-hidden />
          </Link>
          <h1 className="lt-title">تحاليل مختبري</h1>
        </div>
        <p className="lt-sub">
          اختر التحاليلَ التي يُجريها مختبرُك. يظهر مختبرُك للمريض حين يختار تحاليلَ منها في «سحب الدم».
        </p>

        <div className="lt-card">
          <label className="lt-field">
            <span>اسمُ المختبر *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="مثال: مختبر النور" />
          </label>
          <label className="lt-field">
            <span>المدينة</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} placeholder="مثال: النجف" />
          </label>
        </div>

        <label className="lt-search">
          <IconSearch size={16} stroke={2} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن تحليل…"
            aria-label="ابحث عن تحليل"
          />
        </label>

        {groups.map(([cat, tests]) => {
          const ids = tests.map((t) => t.id);
          const all = ids.every((id) => selected.has(id));
          return (
            <section key={cat} className="lt-group" aria-label={TEST_CATEGORIES[cat].name}>
              <div className="lt-group-head">
                <h2><EmojiIcon e={TEST_CATEGORIES[cat].emoji} /> {TEST_CATEGORIES[cat].name}</h2>
                <button type="button" className="lt-all" onClick={() => toggleGroup(ids, !all)}>
                  {all ? 'إلغاء الكلّ' : 'تحديد الكلّ'}
                </button>
              </div>
              {tests.map((t) => (
                <label key={t.id} className={`lt-test ${selected.has(t.id) ? 'lt-on' : ''}`}>
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                  <span className="lt-test-name">{t.nameAr}</span>
                  <span className="lt-test-code">{t.code}</span>
                </label>
              ))}
            </section>
          );
        })}

        <div className="lt-bar">
          <span className="lt-count">{selected.size} تحليلاً مختاراً</span>
          <button type="button" className="lt-save" onClick={save} disabled={isPending}>
            <IconDeviceFloppy size={18} stroke={2} aria-hidden />
            {isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </div>
        {msg && <p className={msg.ok ? 'lt-ok' : 'lt-err'} role="status">{msg.text}</p>}
      </div>

      <style jsx>{`
        .lt { padding-bottom: 24px; }
        .lt-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .lt-back {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          background: var(--paper-2); color: var(--ink);
        }
        .lt-title { font-size: 20px; font-weight: 700; margin: 0; }
        .lt-sub { font-size: 13px; color: var(--ink-3); line-height: 1.7; margin: 0 0 14px; }
        .lt-card { background: var(--white); border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: grid; gap: 12px; margin-bottom: 14px; }
        .lt-field { display: grid; gap: 6px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
        .lt-field input, .lt-search input {
          font: inherit; font-size: 16px; min-width: 0; width: 100%; box-sizing: border-box;
          padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--paper-3); color: var(--ink);
        }
        .lt-search { position: relative; display: flex; align-items: center; gap: 8px; margin-bottom: 14px; color: var(--ink-3); }
        .lt-group { background: var(--white); border: 1px solid var(--line); border-radius: 14px; padding: 6px 12px 10px; margin-bottom: 12px; }
        .lt-group-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; }
        .lt-group-head h2 { font-size: 14px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px; }
        .lt-all { border: 0; background: transparent; color: var(--emerald); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; min-height: 36px; }
        .lt-test {
          display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 4px 6px; border-radius: 10px; cursor: pointer;
        }
        .lt-test + .lt-test { border-top: 1px solid var(--paper-2); }
        .lt-test input { width: 20px; height: 20px; accent-color: var(--emerald); flex-shrink: 0; }
        .lt-test-name { flex: 1; min-width: 0; font-size: 14px; }
        .lt-test-code { font-size: 12px; color: var(--ink-3); direction: ltr; }
        .lt-on .lt-test-name { font-weight: 600; }
        /* لاصقٌ داخل المحتوى فوق شريط التنقّل السفليّ (لا fixed على bottom: 0 فيختفي خلفه) */
        .lt-bar {
          position: sticky; bottom: calc(76px + env(safe-area-inset-bottom, 0px)); z-index: 5;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-top: 12px; padding: 10px 12px;
          background: var(--white); border: 1px solid var(--line); border-radius: 14px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }
        .lt-count { font-size: 13px; font-weight: 600; color: var(--ink-2); }
        .lt-save {
          display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 20px;
          border: 0; border-radius: 12px; background: var(--emerald); color: #fff; font: inherit; font-weight: 700; cursor: pointer;
        }
        .lt-save:disabled { opacity: 0.6; }
        .lt-ok, .lt-err { font-size: 13px; font-weight: 700; margin: 8px 0 0; }
        .lt-ok { color: var(--emerald-deep); }
        .lt-err { color: var(--rose); }
      `}</style>
    </main>
  );
}
