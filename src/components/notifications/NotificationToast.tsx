'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { MessageCircle, ClipboardList, Bell, X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  body: string;
  href?: string;
  type: 'message' | 'order' | 'system';
  titleIcon?: 'message' | 'order' | 'bell';
}

interface Props {
  userId: string;
  userRole: 'patient' | 'specialist';
}

export default function NotificationToast({ userId, userRole }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // الاستماع لرسائل جديدة
    const messagesChannel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            chat_id: string;
            sender_id: string;
            content: string;
            type: string;
          };

          // تجاهل رسائل المستخدم نفسه
          if (msg.sender_id === userId) return;
          if (msg.type === 'system') return;

          // تحقق أن المستخدم هو طرف في المحادثة
          const { data: chat } = await supabase
            .from('chats')
            .select('patient_id, specialist_id')
            .eq('id', msg.chat_id)
            .single();

          if (!chat) return;
          const isParty = chat.patient_id === userId || chat.specialist_id === userId;
          if (!isParty) return;

          // جلب اسم المرسل
          const { data: sender } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', msg.sender_id)
            .single();

          const senderName = sender?.full_name || 'مستخدم';
          const href = userRole === 'specialist'
            ? `/specialist/inbox/${msg.chat_id}`
            : `/messages/${msg.chat_id}`;

          showToast({
            id: msg.id,
            title: senderName,
            titleIcon: 'message',
            body: msg.content.slice(0, 80),
            href,
            type: 'message',
          });

          // Push notification (إذا مُسموح)
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification(senderName, {
                body: msg.content.slice(0, 100),
                icon: '/icon.svg',
                badge: '/icon.svg',
                tag: msg.chat_id,
              });
            }
          }
        }
      )
      .subscribe();

    // للأخصائي: استمع للمواعيد الجديدة
    let appointmentsChannel: ReturnType<typeof supabase.channel> | null = null;
    if (userRole === 'specialist') {
      appointmentsChannel = supabase
        .channel('new-appointments')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments',
            filter: `specialist_id=eq.${userId}`,
          },
          (payload) => {
            const appt = payload.new as {
              id: string;
              service_type: string;
            };
            showToast({
              id: appt.id,
              title: 'طلب جديد',
              titleIcon: 'order',
              body: `لديك طلب جديد: ${appt.service_type}`,
              href: `/specialist/orders/${appt.id}`,
              type: 'order',
            });
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(messagesChannel);
      if (appointmentsChannel) supabase.removeChannel(appointmentsChannel);
    };
  }, [userId, userRole]);

  const showToast = (toast: Toast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(toast => {
        const Icon = toast.titleIcon === 'message' ? MessageCircle
                   : toast.titleIcon === 'order' ? ClipboardList
                   : Bell;
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <div className="toast-title">
                <Icon size={14} strokeWidth={2.2} aria-hidden />
                <span>{toast.title}</span>
              </div>
              <div className="toast-body">{toast.body}</div>
            </div>
            {toast.href && (
              <Link
                href={toast.href}
                onClick={() => dismissToast(toast.id)}
                className="toast-action"
              >
                عرض ←
              </Link>
            )}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="toast-close"
              aria-label="إغلاق"
            >
              <X size={14} strokeWidth={2.4} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
