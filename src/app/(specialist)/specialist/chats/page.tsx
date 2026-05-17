import Link from 'next/link';

export const metadata = {
  title: 'المحادثات · لوحة الأخصائي',
};

// بيانات تجريبية للمحادثات (سيتم ربطها بـ DB لاحقاً)
const MOCK_CHATS: Array<{
  id: string;
  patientName: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  avatar: string;
}> = [];

const QUICK_REPLIES = [
  { icon: '✓', text: 'سأكون عندك خلال 30 دقيقة' },
  { icon: '📅', text: 'هل يناسبك التأجيل؟' },
  { icon: '💊', text: 'لا تنسَ إحضار الأدوية' },
  { icon: '🩺', text: 'كم درجة حرارتك الآن؟' },
];

export default function SpecialistChatsPage() {
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
          {MOCK_CHATS.length === 0 ? 'لا توجد محادثات حالياً' : `${MOCK_CHATS.length} محادثة نشطة`}
        </p>

        {/* بانر معلوماتي */}
        <div className="scr-info-banner">
          <span aria-hidden="true">💡</span>
          <span>تواصل مع مرضاك مباشرة بعد قبول الطلب. الرسائل مُشفّرة.</span>
        </div>

        {MOCK_CHATS.length === 0 ? (
          <>
            <div className="scr-empty" style={{ marginTop: 32 }}>
              <div className="scr-empty-icon" aria-hidden="true">✉</div>
              <h2 className="scr-empty-title">ابدأ محادثاتك</h2>
              <p className="scr-empty-desc">
                عند قبول طلب، ستتمكّن من بدء محادثة مع المريض هنا.
                الرسائل تتضمن نصوص، صور، وملفات طبية.
              </p>
              <Link href="/specialist/orders?filter=pending" className="scr-empty-cta">
                عرض الطلبات الجديدة ←
              </Link>
            </div>

            {/* الإجابات السريعة */}
            <div className="scr-section-head" style={{ marginTop: 32 }}>
              <div className="scr-section-title">إجابات سريعة جاهزة</div>
            </div>

            <p className="scr-page-subtitle" style={{ textAlign: 'right' }}>
              قوالب جاهزة لتسريع ردودك على المرضى:
            </p>

            <div className="scr-list-stack">
              {QUICK_REPLIES.map((reply, i) => (
                <div key={i} className="scr-list-item">
                  <div className="scr-list-item-icon" aria-hidden="true">{reply.icon}</div>
                  <div className="scr-list-item-content">
                    <div className="scr-list-item-title">{reply.text}</div>
                    <div className="scr-list-item-subtitle">انقر للاستخدام لاحقاً</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ميزات قادمة */}
            <div className="scr-section-head" style={{ marginTop: 24 }}>
              <div className="scr-section-title">المميزات</div>
            </div>

            <div className="services-grid">
              <div className="service-card service-default">
                <div className="service-icon" aria-hidden="true">📝</div>
                <div className="service-title">نصوص</div>
                <div className="service-desc">رسائل سريعة</div>
              </div>
              <div className="service-card service-amber">
                <div className="service-icon" aria-hidden="true">📷</div>
                <div className="service-title">صور</div>
                <div className="service-desc">تحاليل وأشعة</div>
              </div>
              <div className="service-card service-default">
                <div className="service-icon" aria-hidden="true">📄</div>
                <div className="service-title">ملفات</div>
                <div className="service-desc">PDF وأكثر</div>
              </div>
              <div className="service-card service-rose">
                <div className="service-icon" aria-hidden="true">🎤</div>
                <div className="service-title">صوتي</div>
                <div className="service-desc">رسائل صوتية</div>
              </div>
            </div>
          </>
        ) : (
          <div className="scr-list-stack">
            {MOCK_CHATS.map((chat) => (
              <Link
                key={chat.id}
                href={`/specialist/chats/${chat.id}`}
                className="scr-list-item scr-list-item-clickable"
              >
                <div className="spec-chat-avatar" aria-hidden="true">
                  {chat.avatar}
                  {chat.online && <span className="spec-chat-online" aria-hidden="true"></span>}
                </div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{chat.patientName}</div>
                  <div className="scr-list-item-subtitle">{chat.lastMessage}</div>
                  <div className="scr-list-item-meta">{chat.time}</div>
                </div>
                {chat.unread > 0 && (
                  <span className="spec-chat-badge">{chat.unread}</span>
                )}
              </Link>
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
