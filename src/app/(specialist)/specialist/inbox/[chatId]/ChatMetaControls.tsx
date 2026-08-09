'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, PinOff } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { updateChatStatus, updateChatPriority, toggleChatPin } from '../actions';

/**
 * 🎛️ حالة المحادثة وأولويّتها وتثبيتها
 *
 * صندوق وارد المختصّ **يقرأ** هذه الحقول ويعتمد عليها: يفرز بـ`is_pinned`،
 * ويعدّ «العاجل» بـ`priority`، ويعرض `status` — ولم تكن فيه أيّ وسيلة
 * لتغيير أيٍّ منها. الإجراءات الثلاثة كانت مبنيّة بلا واجهة.
 */

const STATUSES = [
  { value: 'open', label: 'مفتوحة' },
  { value: 'pending', label: 'بانتظار ردّ' },
  { value: 'resolved', label: 'مُنجَزة' },
  { value: 'archived', label: 'مؤرشفة' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'منخفضة' },
  { value: 'normal', label: 'عادية' },
  { value: 'high', label: 'مرتفعة' },
  { value: 'urgent', label: 'عاجلة' },
] as const;

type Status = (typeof STATUSES)[number]['value'];
type Priority = (typeof PRIORITIES)[number]['value'];

export default function ChatMetaControls({
  chatId,
  initialStatus,
  initialPriority,
  initialIsPinned,
}: {
  chatId: string;
  initialStatus: string;
  initialPriority: string;
  initialIsPinned: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [isPinned, setIsPinned] = useState(initialIsPinned);
  const [pending, startTransition] = useTransition();

  /** يُطبّق التغيير تفاؤلياً ويتراجع عند الفشل */
  function apply<T>(
    next: T,
    prev: T,
    setLocal: (v: T) => void,
    action: () => Promise<{ success?: boolean; error?: string }>,
    okMsg: string
  ) {
    setLocal(next);
    startTransition(async () => {
      try {
        const res = await action();
        if (res.error) {
          setLocal(prev);
          toast.error(res.error);
          return;
        }
        toast.success(okMsg);
        router.refresh();
      } catch {
        // إجراءات الخادم ترمي عند انقطاع الشبكة ولا تُرجع خطأً في الكائن
        setLocal(prev);
        toast.error('تعذّر الاتصال. حاول مرة أخرى.');
      }
    });
  }

  return (
    <div className="chat-patient-section">
      <div className="chat-patient-section-title">إدارة المحادثة</div>

      <label className="chat-meta-label" htmlFor="chat-status">الحالة</label>
      <select
        id="chat-status"
        className="chat-meta-select"
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Status;
          apply(next, status, setStatus, () => updateChatStatus(chatId, next), 'تم تحديث الحالة');
        }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <label className="chat-meta-label" htmlFor="chat-priority">الأولوية</label>
      <select
        id="chat-priority"
        className="chat-meta-select"
        value={priority}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as Priority;
          apply(next, priority, setPriority, () => updateChatPriority(chatId, next), 'تم تحديث الأولوية');
        }}
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <button
        type="button"
        className="chat-patient-action"
        disabled={pending}
        aria-pressed={isPinned}
        onClick={() =>
          apply(!isPinned, isPinned, setIsPinned, () => toggleChatPin(chatId),
            isPinned ? 'أُلغي التثبيت' : 'تم التثبيت')
        }
        style={{ marginTop: 10, width: '100%' }}
      >
        {isPinned
          ? <><PinOff size={14} strokeWidth={2.2} aria-hidden /><span>إلغاء التثبيت</span></>
          : <><Pin size={14} strokeWidth={2.2} aria-hidden /><span>تثبيت المحادثة</span></>}
      </button>
    </div>
  );
}
