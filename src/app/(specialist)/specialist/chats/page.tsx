// ═══════════════════════════════════════════════════════════════
// 💬 محادثات المختص (V25.11) - DB حقيقي
// ═══════════════════════════════════════════════════════════════
// تم استبدال Mock Data بقاعدة بيانات حقيقية
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle, Clock, AlertCircle, CheckCircle2,
  ChevronLeft, Pin, Archive,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'المحادثات - لوحة الأخصائي' };

const STATUS_META: Record<string, { label: string; color: string; emoji: string }> = {
  open: { label: 'مفتوحة', color: 'var(--emerald)', emoji: '🟢' },
  pending: { label: 'بانتظار', color: 'var(--amber)', emoji: '⏳' },
  resolved: { label: 'محلولة', color: 'var(--ink-3)', emoji: '✓' },
  archived: { label: 'مؤرشفة', color: 'var(--ink-4)', emoji: '📦' },
};

const PRIORITY_META: Record<string, { color: string; label: string }> = {
  urgent: { color: 'var(--rose)', label: 'عاجل' },
  high: { color: 'var(--amber)', label: 'مهم' },
  normal: { color: 'var(--ink-3)', label: 'عادي' },
  low: { color: 'var(--ink-4)', label: 'منخفض' },
};

const QUICK_REPLIES = [
  { icon: '✓', text: 'سأكون عندك خلال 30 دقيقة' },
  { icon: '📅', text: 'هل يناسبك التأجيل؟' },
  { icon: '💊', text: 'لا تنسَ إحضار الأدوية' },
  { icon: '🩺', text: 'كم درجة حرارتك الآن؟' },
];

export default async function SpecialistChatsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // تحقّق من أنه specialist
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'specialist') {
    redirect('/dashboard');
  }

  // جلب المحادثات
  const { data: chats } = await supabase
    .from('chats')
    .select('*')
    .eq('specialist_id', user.id)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(50);

  // جلب أسماء المرضى
  const patientIds = [...new Set((chats || []).map(c => c.patient_id).filter(Boolean))];
  const { data: patients } = patientIds.length > 0
    ? await supabase.from('users').select('id, full_name').in('id', patientIds)
    : { data: [] };

  const patientsMap = Object.fromEntries((patients || []).map(p => [p.id, p]));

  const totalUnread = (chats || []).reduce((sum, c) => sum + (c.specialist_unread_count || 0), 0);

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/specialist" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">المحادثات</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {!chats || chats.length === 0
            ? 'لا توجد محادثات حالياً'
            : `${chats.length} ${chats.length === 1 ? 'محادثة' : 'محادثات'}${totalUnread > 0 ? ` · ${totalUnread} غير مقروءة` : ''}`}
        </p>

        {/* Quick replies info */}
        <div
          style={{
            background: 'var(--emerald-soft)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
            fontSize: 11,
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            💡 الردود السريعة المتاحة:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {QUICK_REPLIES.map((q, i) => (
              <span
                key={i}
                style={{
                  padding: '3px 8px',
                  background: 'var(--white)',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--ink-2)',
                }}
              >
                {q.icon} {q.text}
              </span>
            ))}
          </div>
        </div>

        {/* Chats list */}
        {!chats || chats.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon" aria-hidden="true">
              <MessageCircle size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد محادثات</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              ستظهر هنا المحادثات بعد قبول الطلبات
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {chats.map((chat) => {
              const patient = patientsMap[chat.patient_id];
              const statusMeta = STATUS_META[chat.status] || STATUS_META.open;
              const priorityMeta = PRIORITY_META[chat.priority] || PRIORITY_META.normal;
              const hasUnread = (chat.specialist_unread_count || 0) > 0;
              const lastMsg = chat.last_message_at
                ? new Date(chat.last_message_at)
                : new Date(chat.created_at);
              const diffHours = (Date.now() - lastMsg.getTime()) / (1000 * 60 * 60);

              return (
                <Link
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article
                    style={{
                      background: 'var(--white)',
                      border: '1px solid',
                      borderColor: hasUnread ? statusMeta.color : 'var(--line)',
                      borderRadius: 12,
                      padding: 12,
                      borderInlineStartWidth: 4,
                      borderInlineStartStyle: 'solid',
                      borderInlineStartColor: statusMeta.color,
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'var(--paper-3)',
                          fontSize: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        👤
                        {chat.is_pinned && (
                          <Pin
                            size={11}
                            style={{
                              position: 'absolute',
                              top: -2,
                              insetInlineStart: -2,
                              color: 'var(--amber)',
                              background: 'var(--white)',
                              borderRadius: '50%',
                              padding: 1,
                            }}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: hasUnread ? 900 : 800,
                              color: 'var(--ink)',
                            }}
                          >
                            {patient?.full_name || 'مريض'}
                          </span>
                          {chat.priority !== 'normal' && (
                            <span
                              style={{
                                fontSize: 9,
                                padding: '1px 5px',
                                background: `${priorityMeta.color}15`,
                                color: priorityMeta.color,
                                borderRadius: 3,
                                fontWeight: 800,
                              }}
                            >
                              {priorityMeta.label}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: hasUnread ? 'var(--ink)' : 'var(--ink-3)',
                            fontWeight: hasUnread ? 700 : 400,
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {chat.last_message || 'لا توجد رسائل بعد'}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 4,
                            fontSize: 9,
                            color: 'var(--ink-3)',
                          }}
                        >
                          <Clock size={9} />
                          <span>
                            {diffHours < 1
                              ? 'الآن'
                              : diffHours < 24
                              ? `قبل ${Math.floor(diffHours)} ساعة`
                              : lastMsg.toLocaleDateString('ar-IQ', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                          </span>
                          <span
                            style={{
                              padding: '1px 5px',
                              background: `${statusMeta.color}15`,
                              color: statusMeta.color,
                              borderRadius: 3,
                              fontWeight: 700,
                              marginInlineStart: 4,
                            }}
                          >
                            {statusMeta.emoji} {statusMeta.label}
                          </span>
                        </div>
                      </div>

                      {/* Unread count + arrow */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {hasUnread && (
                          <div
                            style={{
                              minWidth: 22,
                              height: 22,
                              padding: '0 6px',
                              background: statusMeta.color,
                              color: 'var(--paper-3)',
                              borderRadius: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              fontWeight: 900,
                            }}
                          >
                            {chat.specialist_unread_count}
                          </div>
                        )}
                        <ChevronLeft size={14} color="var(--ink-3)" />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
