'use client';

import { useState, useTransition } from 'react';
import { createTemplate, updateTemplate, deleteTemplate } from './actions';
import { useConfirm } from '@/components/ui';
import {
  Zap, AlertTriangle, BarChart3, Pencil, Trash2,
} from 'lucide-react';

interface Template {
  id: string;
  shortcut: string;
  content: string;
  category: string;
  use_count: number;
}

export default function TemplatesClient({ templates }: { templates: Template[] }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('عام');

  function resetForm() {
    setShortcut(''); setContent(''); setCategory('عام');
    setEditingId(null); setShowForm(false); setError('');
  }

  function startEdit(t: Template) {
    setEditingId(t.id);
    setShortcut(t.shortcut);
    setContent(t.content);
    setCategory(t.category);
    setShowForm(true);
  }

  function handleSubmit() {
    setError('');
    if (!shortcut.trim() || !content.trim()) {
      setError('الاختصار والمحتوى إلزاميان');
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateTemplate(editingId, { shortcut, content, category })
        : await createTemplate({ shortcut, content, category });

      if (!result.ok) {
        setError(result.error || 'حدث خطأ');
        return;
      }
      resetForm();
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: 'حذف القالب',
      message: 'هل تريد حذف هذا القالب؟',
      variant: 'danger',
      confirmText: 'احذف',
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteTemplate(id);
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--line)',
    borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
  };

  return (
    <>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="scr-empty-cta"
          style={{ display: 'block', width: '100%', marginTop: 16 }}
        >
          + إضافة قالب جديد
        </button>
      ) : (
        <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, marginTop: 16 }}>
          <div className="scr-section-title" style={{ marginBottom: 12 }}>
            {editingId ? 'تعديل القالب' : 'قالب جديد'}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
              الاختصار (مثال: /سلام)
            </label>
            <input
              type="text"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              placeholder="/سلام"
              style={inputStyle}
              dir="ltr"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
              التصنيف
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="عام · تحية · موعد"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
              نص الرد
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="السلام عليكم، كيف يمكنني مساعدتك؟"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ background: 'var(--rose-soft)', color: 'var(--rose)', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} strokeWidth={2.4} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSubmit} disabled={isPending} className="scr-empty-cta" style={{ flex: 1 }}>
              {isPending ? 'جارٍ الحفظ...' : (editingId ? 'حفظ التعديل' : 'إضافة')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--white)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="scr-empty" style={{ marginTop: 32 }}>
          <div className="scr-empty-icon">
            <Zap size={42} strokeWidth={1.5} />
          </div>
          <h2 className="scr-empty-title">لا توجد قوالب</h2>
          <p className="scr-empty-desc">أضف قوالب الردود السريعة لتسريع محادثاتك مع المرضى.</p>
        </div>
      ) : (
        <>
          <div className="scr-section-head" style={{ marginTop: 20 }}>
            <div className="scr-section-title">قوالبك ({templates.length})</div>
          </div>
          <div className="scr-list-stack">
            {templates.map((t) => (
              <article key={t.id} className="scr-list-item">
                <div className="scr-list-item-icon">
                  <Zap size={22} strokeWidth={2} />
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title" dir="ltr" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--emerald)' }}>
                    {t.shortcut}
                  </div>
                  <div className="scr-list-item-subtitle">{t.content}</div>
                  <div className="scr-list-item-tags" style={{ marginTop: 8 }}>
                    <span className="scr-tag">{t.category}</span>
                    {t.use_count > 0 && (
                      <span className="scr-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <BarChart3 size={11} strokeWidth={2.4} />
                        استُخدم {t.use_count} مرة
                      </span>
                    )}
                  </div>
                  <div className="scr-list-item-actions">
                    <button type="button" onClick={() => startEdit(t)} className="scr-action-btn">
                      <Pencil size={14} strokeWidth={2.2} />
                      <span>تعديل</span>
                    </button>
                    <button type="button" onClick={() => handleDelete(t.id)} className="scr-action-btn" style={{ color: 'var(--rose)' }}>
                      <Trash2 size={14} strokeWidth={2.2} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <ConfirmDialog />
    </>
  );
}
