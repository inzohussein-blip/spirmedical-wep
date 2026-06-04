'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, Send, Image as ImageIcon, FileText, X,
  Paperclip, Stethoscope, User as UserIcon, Loader2,
  ChevronDown, ChevronUp, CheckCircle2, Eye,
} from 'lucide-react';
import { toast } from '@/components/ui/Toaster';
import { useConfirm } from '@/components/ui';
import { sendMessage, attachMedicalRecord, closeConsultation } from './actions';

interface Consultation {
  id: string;
  title: string;
  status: 'open' | 'awaiting_doctor' | 'awaiting_patient' | 'closed';
  shared_medical_data: Record<string, unknown> | null;
  created_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_role: 'patient' | 'doctor' | 'system';
  message_type: 'text' | 'image' | 'medical_record' | 'voice';
  content: string | null;
  image_url: string | null;
  attached_record_id: string | null;
  attached_record_type: string | null;
  created_at: string;
}

interface DoctorInfo {
  id: string;
  full_name: string;
  title: string;
  avatar_url: string | null;
  gender: 'male' | 'female' | null;
}

interface PatientInfo {
  id: string;
  full_name: string | null;
}

interface FamilyMember {
  id: string;
  full_name: string;
  relation: string;
  avatar_emoji: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
}

interface Props {
  consultation: Consultation;
  messages: Message[];
  doctor: DoctorInfo | null;
  patient: PatientInfo | null;
  familyMember: FamilyMember | null;
  userRole: 'patient' | 'doctor';
  currentUserId: string;
}

export default function ConsultationClient({
  consultation,
  messages: initialMessages,
  doctor,
  patient,
  familyMember,
  userRole,
  currentUserId,
}: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showInfoExpanded, setShowInfoExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSendText = () => {
    const text = messageText.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await sendMessage({
        consultationId: consultation.id,
        messageType: 'text',
        content: text,
      });

      if (result.success && result.message) {
        setMessages([...messages, result.message as Message]);
        setMessageText('');
      } else {
        toast.error(result.error || 'فشل الإرسال');
      }
    });
  };

  const handleSendImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('الصورة كبيرة جداً (الحد 5 ميجا)');
      return;
    }

    // قراءة الملف كـ base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      startTransition(async () => {
        const result = await sendMessage({
          consultationId: consultation.id,
          messageType: 'image',
          imageDataUrl: dataUrl,
        });

        if (result.success && result.message) {
          setMessages([...messages, result.message as Message]);
        } else {
          toast.error(result.error || 'فشل رفع الصورة');
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCloseConsultation = async () => {
    const ok = await confirm({
      title: 'إغلاق الاستشارة',
      message: 'هل تريد إغلاق هذه الاستشارة؟',
      confirmText: 'إغلاق',
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await closeConsultation(consultation.id);
      if (result.success) {
        toast.success('تم إغلاق الاستشارة');
        router.refresh();
      } else {
        toast.error(result.error || 'فشل الإغلاق');
      }
    });
  };

  const isClosed = consultation.status === 'closed';
  const otherParty = userRole === 'patient'
    ? (doctor ? `${doctor.title} ${doctor.full_name}` : 'الطبيب')
    : (familyMember?.full_name || patient?.full_name || 'المريض');

  // معلومات الفرد المعالَج
  const targetAge = familyMember?.date_of_birth
    ? Math.floor((Date.now() - new Date(familyMember.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <main className="app-screen">
      <div className="scr-content" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', padding: 0 }}>
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--paper)',
            borderBottom: '1px solid var(--line)',
            padding: '10px 14px',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              href="/consultations"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--paper-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-2)',
                textDecoration: 'none',
              }}
            >
              <ArrowRight size={18} />
            </Link>

            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: userRole === 'patient'
                  ? (doctor?.gender === 'female' ? '#FDE7E9' : 'var(--emerald-soft)')
                  : (familyMember?.gender === 'female' ? '#FDE7E9' : 'var(--emerald-soft)'),
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {userRole === 'patient'
                ? (doctor?.gender === 'female' ? '👩‍⚕️' : '👨‍⚕️')
                : (familyMember?.avatar_emoji || '👤')}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                {otherParty}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                {isClosed ? '✓ مغلقة' : 'مفتوحة · رد خلال 24 ساعة'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoExpanded(!showInfoExpanded)}
              aria-label="معلومات"
              style={{
                width: 32,
                height: 32,
                background: 'var(--paper-3)',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showInfoExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Patient info (for doctor view) */}
          {showInfoExpanded && userRole === 'doctor' && (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: 'var(--amber-soft)',
                borderRadius: 10,
                fontSize: 11,
              }}
            >
              {familyMember ? (
                <>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>
                    {familyMember.avatar_emoji} {familyMember.full_name}
                  </div>
                  <div style={{ color: 'var(--ink-3)' }}>
                    {familyMember.relation}
                    {targetAge !== null && ` · ${targetAge} سنة`}
                    {familyMember.gender && ` · ${familyMember.gender === 'male' ? 'ذكر' : 'أنثى'}`}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 800 }}>{patient?.full_name || 'المريض'}</div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 14,
            background: 'var(--paper-3)',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--ink-3)',
              }}
            >
              <Stethoscope size={48} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                ابدأ المحادثة
              </p>
              <p style={{ fontSize: 11, marginTop: 4 }}>
                {userRole === 'patient'
                  ? 'اكتب أعراضك أو سؤالك للطبيب'
                  : 'انتظر رسالة المريض'}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            const isSystem = msg.sender_role === 'system';

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    color: 'var(--ink-3)',
                    margin: '12px 0',
                    fontStyle: 'italic',
                  }}
                >
                  {msg.content}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: 10,
                    background: isMine ? 'var(--emerald)' : 'var(--white)',
                    color: isMine ? 'var(--paper-3)' : 'var(--ink)',
                    borderRadius: 14,
                    borderBottomRightRadius: isMine ? 4 : 14,
                    borderBottomLeftRadius: isMine ? 14 : 4,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  {msg.message_type === 'image' && msg.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.image_url}
                      alt="صورة"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 240,
                        borderRadius: 10,
                        marginBottom: msg.content ? 6 : 0,
                        display: 'block',
                      }}
                    />
                  )}
                  {msg.message_type === 'medical_record' && (
                    <div
                      style={{
                        padding: 10,
                        background: isMine ? 'rgba(255,255,255,0.15)' : 'var(--paper-3)',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: msg.content ? 6 : 0,
                      }}
                    >
                      <FileText size={20} />
                      <div style={{ flex: 1, fontSize: 11 }}>
                        <div style={{ fontWeight: 800 }}>سجل طبي مُشارَك</div>
                        <div style={{ opacity: 0.85 }}>
                          {msg.attached_record_type === 'appointment' && '📋 موعد سابق'}
                          {msg.attached_record_type === 'lab_result' && '🧪 نتيجة تحليل'}
                          {msg.attached_record_type === 'prescription' && '💊 وصفة طبية'}
                          {msg.attached_record_type === 'nursing_visit' && '💉 زيارة تمريض'}
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.content && (
                    <div style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 9,
                      opacity: 0.7,
                      marginTop: 4,
                      textAlign: 'end',
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('ar-IQ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        {!isClosed && (
          <div
            style={{
              padding: 10,
              background: 'var(--paper)',
              borderTop: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              {/* Attach buttons */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSendImage(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                aria-label="صورة"
                style={attachBtn()}
              >
                <ImageIcon size={20} color="var(--emerald)" />
              </button>

              {userRole === 'patient' && (
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  disabled={isPending}
                  aria-label="مشاركة سجل طبي"
                  style={attachBtn()}
                >
                  <FileText size={20} color="var(--amber)" />
                </button>
              )}

              {/* Text input */}
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="اكتب رسالتك..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--paper-3)',
                  border: '1px solid var(--line)',
                  borderRadius: 20,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'none',
                  minHeight: 40,
                  maxHeight: 120,
                }}
              />

              <button
                type="button"
                onClick={handleSendText}
                disabled={isPending || !messageText.trim()}
                aria-label="إرسال"
                style={{
                  width: 44,
                  height: 44,
                  background: messageText.trim() ? 'var(--emerald)' : 'var(--ink-4)',
                  color: 'var(--paper-3)',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>

            {/* Close button */}
            {messages.length > 2 && (
              <button
                type="button"
                onClick={handleCloseConsultation}
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: 6,
                  background: 'transparent',
                  color: 'var(--ink-3)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 10,
                }}
              >
                إغلاق الاستشارة
              </button>
            )}
          </div>
        )}

        {isClosed && (
          <div
            style={{
              padding: 14,
              background: 'var(--ink-3)',
              color: 'var(--paper-3)',
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={14} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4 }} />
            الاستشارة مغلقة - لا يمكن إرسال رسائل جديدة
          </div>
        )}
      </div>

      {/* Share medical record modal */}
      {showShareModal && (
        <ShareRecordModal
          consultationId={consultation.id}
          onClose={() => setShowShareModal(false)}
          onShared={(newMsg) => {
            setMessages([...messages, newMsg]);
            setShowShareModal(false);
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <ConfirmDialog />
    </main>
  );
}

function attachBtn(): React.CSSProperties {
  return {
    width: 40,
    height: 40,
    background: 'var(--paper-3)',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// Modal: مشاركة سجل طبي
// ═══════════════════════════════════════════════════════════════
function ShareRecordModal({
  consultationId,
  onClose,
  onShared,
}: {
  consultationId: string;
  onClose: () => void;
  onShared: (msg: Message) => void;
}) {
  const [records, setRecords] = useState<Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    summary?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/consultations/my-records')
      .then(r => r.json())
      .then(data => {
        setRecords(data.records || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleShare = () => {
    if (selectedIds.size === 0) {
      toast.error('اختر سجلاً واحداً على الأقل');
      return;
    }

    startTransition(async () => {
      for (const recordKey of Array.from(selectedIds)) {
        const [type, id] = recordKey.split(':');
        const result = await attachMedicalRecord({
          consultationId,
          recordType: type,
          recordId: id,
        });
        if (result.success && result.message) {
          onShared(result.message as Message);
        }
      }
      onClose();
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          width: '100%',
          maxWidth: 500,
          maxHeight: '85vh',
          borderRadius: '20px 20px 0 0',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, flex: 1 }}>
            <FileText size={16} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 6 }} />
            مشاركة سجل طبي
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              width: 32,
              height: 32,
              background: 'var(--paper-3)',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 12px' }}>
          اختر السجلات الطبية التي تريد مشاركتها مع الطبيب
        </p>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--ink-3)', fontSize: 12 }}>
              لا توجد سجلات طبية بعد
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {records.map((r) => {
                const key = `${r.type}:${r.id}`;
                const isSelected = selectedIds.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 12,
                      background: isSelected ? 'var(--emerald-soft)' : 'var(--white)',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--emerald)' : 'var(--line)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'start',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isSelected ? 'var(--emerald)' : 'var(--paper-3)',
                        color: isSelected ? 'var(--paper-3)' : 'var(--ink-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {r.type === 'appointment' && '📋'}
                      {r.type === 'lab_result' && '🧪'}
                      {r.type === 'prescription' && '💊'}
                      {r.type === 'nursing_visit' && '💉'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{r.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>
                        {new Date(r.date).toLocaleDateString('ar-IQ')}
                        {r.summary && ` · ${r.summary}`}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} color="var(--emerald)" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleShare}
          disabled={isPending || selectedIds.size === 0}
          style={{
            marginTop: 12,
            padding: 14,
            background: selectedIds.size > 0 ? 'var(--emerald)' : 'var(--ink-4)',
            color: 'var(--paper-3)',
            border: 'none',
            borderRadius: 12,
            cursor: selectedIds.size > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {isPending ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={14} />
          )}
          مشاركة {selectedIds.size > 0 && `(${selectedIds.size})`}
        </button>
      </div>
    </div>
  );
}
