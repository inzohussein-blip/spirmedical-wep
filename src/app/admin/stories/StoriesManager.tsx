'use client';

import { useState, useTransition } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  Check,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  createStory,
  updateStory,
  toggleStoryActive,
  deleteStory,
} from './actions';
import type { Story, StoryColorTheme, StoryInput } from '@/types/story';
import { COLOR_THEMES } from '@/types/story';
import { useConfirm } from '@/components/ui';

interface Props {
  initialStories: Story[];
}

const EMPTY_FORM: StoryInput = {
  title: '',
  icon: '💉',
  description: '',
  href: '/',
  color_theme: 'emerald',
  sort_order: 0,
  is_active: true,
};

export default function StoriesManager({ initialStories }: Props) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<StoryInput>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  /* ─── Handlers ───────────────────────────────────────── */

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createStory(formData);
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.success ? result.message : result.errors?.join(' · ') ?? result.message,
      });
      if (result.success) {
        // إعادة تحميل الصفحة لجلب البيانات الجديدة
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  const handleEdit = (story: Story) => {
    setEditingId(story.id);
    setFormData({
      title: story.title,
      icon: story.icon,
      description: story.description ?? '',
      href: story.href,
      color_theme: story.color_theme,
      sort_order: story.sort_order,
      is_active: story.is_active,
    });
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    startTransition(async () => {
      const result = await updateStory(editingId, formData);
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.success ? result.message : result.errors?.join(' · ') ?? result.message,
      });
      if (result.success) {
        setTimeout(() => window.location.reload(), 800);
      }
    });
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const result = await toggleStoryActive(id, !currentActive);
      if (result.success) {
        setStories((prev) =>
          prev.map((s) => (s.id === id ? { ...s, is_active: !currentActive } : s))
        );
      }
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
    });
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'حذف القصة',
      message: 'سيتم حذف القصة نهائياً.',
      variant: 'danger',
      confirmText: 'احذف',
    });
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteStory(id);
      if (result.success) {
        setStories((prev) => prev.filter((s) => s.id !== id));
      }
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
    });
  };

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <div className="stories-manager">
      {/* Header */}
      <div className="sm-header">
        <div>
          <h1>📸 إدارة القصص الترويجية</h1>
          <p>القصص تظهر في dashboard المستخدم كصف من الـ circles</p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
            setFormData({ ...EMPTY_FORM, sort_order: (stories.length + 1) * 10 });
          }}
        >
          قصة جديدة
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`sm-feedback ${
            feedback.type === 'success' ? 'sm-feedback-success' : 'sm-feedback-error'
          }`}
        >
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="sm-feedback-close"
            aria-label="إخفاء"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="sm-form-card">
          <div className="sm-form-header">
            <h2>{editingId ? '✏️ تعديل القصة' : '➕ قصة جديدة'}</h2>
            <button
              type="button"
              onClick={resetForm}
              className="sm-close-btn"
              aria-label="إلغاء"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={editingId ? handleUpdate : handleCreate}>
            <div className="sm-form-grid">
              {/* Title */}
              <div className="sm-field sm-field-full">
                <label>العنوان *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="مثال: لقاحات الأطفال"
                  maxLength={30}
                  required
                  disabled={isPending}
                />
              </div>

              {/* Icon */}
              <div className="sm-field">
                <label>الأيقونة (emoji) *</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💉"
                  maxLength={4}
                  required
                  disabled={isPending}
                  className="sm-icon-input"
                />
              </div>

              {/* Sort order */}
              <div className="sm-field">
                <label>الترتيب</label>
                <input
                  type="number"
                  value={formData.sort_order ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                  disabled={isPending}
                />
              </div>

              {/* Color */}
              <div className="sm-field sm-field-full">
                <label>اللون</label>
                <div className="sm-colors">
                  {COLOR_THEMES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color_theme: c.value })}
                      className={`sm-color ${
                        formData.color_theme === c.value ? 'sm-color-selected' : ''
                      }`}
                      style={{ background: c.bg, color: c.fg }}
                      disabled={isPending}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Href */}
              <div className="sm-field sm-field-full">
                <label>الرابط (href) *</label>
                <input
                  type="text"
                  value={formData.href}
                  onChange={(e) => setFormData({ ...formData, href: e.target.value })}
                  placeholder="/tools/vaccinations"
                  required
                  disabled={isPending}
                />
              </div>

              {/* Description */}
              <div className="sm-field sm-field-full">
                <label>الوصف (اختياري)</label>
                <textarea
                  value={formData.description ?? ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  maxLength={120}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="sm-form-actions">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={isPending}
                leftIcon={!isPending ? <Save size={16} /> : undefined}
              >
                {editingId ? 'حفظ التغييرات' : 'إضافة القصة'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={resetForm}
                disabled={isPending}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Stories List */}
      <div className="sm-list">
        {stories.length === 0 ? (
          <div className="sm-empty">
            <div className="sm-empty-icon">📸</div>
            <h3>لا توجد قصص</h3>
            <p>اضغط &laquo;قصة جديدة&raquo; لإضافة أول قصة</p>
          </div>
        ) : (
          stories.map((story) => (
            <StoryRow
              key={story.id}
              story={story}
              onEdit={handleEdit}
              onToggle={handleToggleActive}
              onDelete={handleDelete}
              disabled={isPending}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .stories-manager { display: flex; flex-direction: column; gap: 16px; max-width: 900px; }
        .sm-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 14px; padding: 20px;
          background: linear-gradient(135deg, var(--emerald-deep), var(--emerald));
          color: var(--paper-3); border-radius: 16px;
          box-shadow: 0 8px 22px -8px rgba(7, 59, 48, 0.4);
        }
        .sm-header h1 { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
        .sm-header p { font-size: 12px; margin: 0; opacity: 0.9; }
        .sm-feedback {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 700;
        }
        .sm-feedback-success { background: var(--emerald-soft); color: var(--emerald-deep); }
        .sm-feedback-error { background: var(--rose-soft); color: var(--rose); }
        .sm-feedback-close {
          margin-right: auto; background: transparent; border: 0;
          cursor: pointer; padding: 4px; color: inherit; opacity: 0.7;
        }
        .sm-feedback-close:hover { opacity: 1; }
        .sm-form-card {
          background: #fff; border-radius: 14px; padding: 20px;
          border: 1px solid var(--line);
        }
        .sm-form-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .sm-form-header h2 { font-size: 16px; font-weight: 800; margin: 0; }
        .sm-close-btn {
          background: var(--paper-3); border: 0; border-radius: 8px;
          padding: 8px; cursor: pointer; color: var(--ink-3);
          display: flex; align-items: center; justify-content: center;
        }
        .sm-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;
        }
        .sm-field { display: flex; flex-direction: column; gap: 6px; }
        .sm-field-full { grid-column: 1 / -1; }
        .sm-field label {
          font-size: 12px; font-weight: 700; color: var(--ink-2);
        }
        .sm-field input, .sm-field textarea {
          padding: 10px 12px; font-size: 13px; border-radius: 10px;
          border: 1px solid var(--line); background: var(--paper-3);
          font-family: inherit; color: var(--ink); width: 100%;
          box-sizing: border-box;
        }
        .sm-field input:focus, .sm-field textarea:focus {
          outline: none; border-color: var(--emerald);
        }
        .sm-icon-input { text-align: center; font-size: 24px !important; }
        .sm-colors { display: flex; flex-wrap: wrap; gap: 6px; }
        .sm-color {
          padding: 8px 14px; font-size: 12px; font-weight: 700;
          border: 2px solid transparent; border-radius: 10px;
          cursor: pointer; transition: all 0.15s;
        }
        .sm-color-selected { border-color: var(--ink); transform: scale(1.05); }
        .sm-form-actions { display: flex; gap: 10px; }
        .sm-list { display: flex; flex-direction: column; gap: 8px; }
        .sm-empty {
          background: #fff; border-radius: 14px; padding: 50px 20px;
          text-align: center; border: 1px solid var(--line);
        }
        .sm-empty-icon { font-size: 48px; margin-bottom: 12px; }
        .sm-empty h3 { font-size: 16px; font-weight: 800; margin: 0 0 6px; }
        .sm-empty p { font-size: 13px; color: var(--ink-3); margin: 0; }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}

/* ─── Story Row Component ──────────────────────────────────── */

interface StoryRowProps {
  story: Story;
  onEdit: (s: Story) => void;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string, title: string) => void;
  disabled?: boolean;
}

function StoryRow({ story, onEdit, onToggle, onDelete, disabled }: StoryRowProps) {
  const colorConfig = COLOR_THEMES.find((c) => c.value === story.color_theme);

  return (
    <div className={`story-row ${!story.is_active ? 'story-row-inactive' : ''}`}>
      <div className="story-row-drag" aria-hidden>
        <GripVertical size={16} />
      </div>

      <div
        className="story-row-preview"
        style={{ background: colorConfig?.bg, color: colorConfig?.fg }}
      >
        <span style={{ fontSize: 22 }}>{story.icon}</span>
      </div>

      <div className="story-row-info">
        <div className="story-row-title">{story.title}</div>
        <div className="story-row-meta">
          <span className="story-row-href">{story.href}</span>
          <span>·</span>
          <span>ترتيب: {story.sort_order}</span>
        </div>
      </div>

      <div className="story-row-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(story.id, story.is_active)}
          disabled={disabled}
          aria-label={story.is_active ? 'إخفاء' : 'إظهار'}
          title={story.is_active ? 'إخفاء' : 'إظهار'}
        >
          {story.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(story)}
          disabled={disabled}
          aria-label="تعديل"
          title="تعديل"
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(story.id, story.title)}
          disabled={disabled}
          aria-label="حذف"
          title="حذف"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <style jsx>{`
        .story-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; background: #fff;
          border-radius: 12px; border: 1px solid var(--line);
          transition: all 0.15s;
        }
        .story-row:hover { border-color: var(--line-2); }
        .story-row-inactive { opacity: 0.55; }
        .story-row-drag {
          color: var(--ink-4); cursor: grab; flex-shrink: 0;
        }
        .story-row-preview {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .story-row-info { flex: 1; min-width: 0; }
        .story-row-title { font-size: 14px; font-weight: 800; margin-bottom: 2px; }
        .story-row-meta {
          font-size: 11px; color: var(--ink-3);
          display: flex; align-items: center; gap: 6px;
        }
        .story-row-href {
          font-family: 'JetBrains Mono', monospace;
          background: var(--paper-3); padding: 2px 6px; border-radius: 4px;
        }
        .story-row-actions { display: flex; gap: 4px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
