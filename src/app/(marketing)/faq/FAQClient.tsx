'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, ChevronDown, Search, HelpCircle, MessageCircle,
} from 'lucide-react';

interface FAQ {
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  // الحجوزات
  {
    category: 'الحجوزات',
    question: 'كيف أحجز سحب دم منزلي؟',
    answer: 'من الصفحة الرئيسية اختر "سحب دم"، اختر الفحص المطلوب، حدّد العنوان والوقت، ثم أكّد الحجز. سيصلك تأكيد فوري عبر الإشعار والـ WhatsApp.',
  },
  {
    category: 'الحجوزات',
    question: 'كم يستغرق وصول المختص؟',
    answer: 'الوقت المعتاد ٣٠-٦٠ دقيقة لوقت الذروة، و١٥-٣٠ دقيقة للحالات العاجلة. تختلف المدة حسب المنطقة وحركة المرور.',
  },
  {
    category: 'الحجوزات',
    question: 'هل يمكنني إلغاء الحجز؟',
    answer: 'نعم، يمكنك إلغاء الحجز قبل وصول المختص بـ ٣٠ دقيقة على الأقل بدون رسوم. الإلغاء المتأخر قد يفرض رسوم انتقال.',
  },
  {
    category: 'الحجوزات',
    question: 'هل يمكنني حجز خدمة لأحد أفراد عائلتي؟',
    answer: 'نعم، يمكنك إضافة أفراد العائلة في صفحة "عائلتي" واختيارهم عند الحجز. كل خدمة ستُسجّل باسم الفرد المعني.',
  },

  // الدفع
  {
    category: 'الدفع',
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'حالياً نقبل الدفع نقداً (كاش) فقط للمختص عند وصوله. الدفع الإلكتروني قيد التطوير وسيُضاف قريباً.',
  },
  {
    category: 'الدفع',
    question: 'هل الأسعار ثابتة؟',
    answer: 'نعم، الأسعار معروضة بوضوح قبل تأكيد الحجز. لا توجد رسوم خفية. قد تُضاف رسوم الطوارئ أو الليل للخدمات خارج الساعات المعتادة.',
  },
  {
    category: 'الدفع',
    question: 'هل أحصل على فاتورة؟',
    answer: 'نعم، تُرسل فاتورة إلكترونية لكل حجز عبر البريد الإلكتروني والتطبيق. يمكن طباعتها أو حفظها.',
  },

  // الاستشارات
  {
    category: 'الاستشارات',
    question: 'كيف تعمل الاستشارة الطبية؟',
    answer: 'اختر طبيب من قائمة الأطباء، ابدأ استشارة، واكتب سؤالك. الطبيب يردّ خلال الساعات المُعلنة. يمكنك مشاركة صور وسجلات طبية.',
  },
  {
    category: 'الاستشارات',
    question: 'هل الاستشارة سرية؟',
    answer: 'نعم، جميع الاستشارات مُشفّرة وسرية تماماً. لا يمكن لأي شخص رؤيتها إلا الطبيب المعني وأنت.',
  },
  {
    category: 'الاستشارات',
    question: 'ما الفرق بين الاستشارة العامة وطبيب العائلة؟',
    answer: 'الاستشارة العامة: سؤال لمرة واحدة. طبيب العائلة: اشتراك شهري أو سنوي مع طبيب محدّد، يتابع حالتك ويعرف تاريخك الطبي بالكامل.',
  },

  // الأطباء والمستشفيات
  {
    category: 'الأطباء والمستشفيات',
    question: 'كيف أعرف أن الطبيب موثوق؟',
    answer: 'كل الأطباء يمرّون بعملية تحقق صارمة. الموثّقون لديهم علامة ✓ خضراء بجانب أسمائهم. يمكنك أيضاً مراجعة تقييمات المرضى السابقين.',
  },
  {
    category: 'الأطباء والمستشفيات',
    question: 'هل قائمة المستشفيات شاملة؟',
    answer: 'نسعى لتغطية جميع المستشفيات الحكومية والخاصة الرئيسية في العراق. إذا لاحظت غياب مستشفى، يرجى إبلاغنا.',
  },
  {
    category: 'الأطباء والمستشفيات',
    question: 'هل يمكنني حجز موعد في المستشفى عبر التطبيق؟',
    answer: 'حالياً نُتيح فقط معلومات الاتصال والموقع. حجز المواعيد المباشر مع المستشفيات قيد التطوير.',
  },

  // الحساب
  {
    category: 'الحساب',
    question: 'كيف أنشئ حساباً؟',
    answer: 'اضغط "تسجيل" وأدخل اسمك ورقم هاتفك وكلمة المرور. سيصلك رمز تحقّق عبر WhatsApp أو SMS لإكمال التسجيل.',
  },
  {
    category: 'الحساب',
    question: 'نسيت كلمة المرور، ماذا أفعل؟',
    answer: 'من صفحة تسجيل الدخول، اضغط "نسيت كلمة المرور" وأدخل رقم هاتفك. سنرسل لك رابط إعادة تعيين عبر WhatsApp.',
  },
  {
    category: 'الحساب',
    question: 'كيف أحذف حسابي؟',
    answer: 'من الإعدادات > الحساب > "حذف الحساب". الحذف نهائي ولا يمكن التراجع عنه. ستُحذف كل بياناتك خلال ٧ أيام.',
  },

  // الخصوصية
  {
    category: 'الخصوصية',
    question: 'كيف تحمون بياناتي الطبية؟',
    answer: 'بياناتك مشفّرة بمعايير AES-256. لا نشارك معلوماتك مع أي طرف ثالث بدون إذنك. اقرأ <a href="/legal/privacy">سياسة الخصوصية</a> للتفاصيل.',
  },
  {
    category: 'الخصوصية',
    question: 'من يمكنه رؤية سجلي الطبي؟',
    answer: 'فقط أنت والطبيب الذي تشاركه معه يدوياً في استشارة محدّدة. لا يوجد وصول تلقائي من أي طرف.',
  },

  // المحفظة والنقاط
  {
    category: 'المحفظة والنقاط',
    question: 'ما هي نقاط الولاء؟',
    answer: 'تكسب نقاط مع كل حجز أو استشارة أو دعوة صديق. تتراكم النقاط لتترقّى إلى مستويات أعلى (فضي → ذهبي → بلاتيني → ألماس) مع خصومات تصل لـ ١٥٪.',
  },
  {
    category: 'المحفظة والنقاط',
    question: 'كيف أستخدم رصيد المحفظة؟',
    answer: 'الرصيد يُستخدم حالياً للاستردادات. عند إلغاء حجز أو خصم، يُضاف الرصيد لمحفظتك. ميزة الدفع المباشر بالرصيد قيد التطوير.',
  },
];

const CATEGORIES = Array.from(new Set(FAQS.map((f) => f.category)));

export default function FAQClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filtered = FAQS.filter((faq) => {
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">الأسئلة الشائعة</h1>
          <div className="scr-page-spacer" />
        </div>

        <p className="scr-page-subtitle">
          {FAQS.length} سؤال شائع · إذا لم تجد إجابتك، تواصل معنا
        </p>

        {/* Search */}
        <div className="scr-search" style={{ marginBottom: 12 }}>
          <div className="scr-search-icon">
            <Search size={16} strokeWidth={2.4} />
          </div>
          <input
            type="search"
            placeholder="ابحث عن سؤالك..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            marginBottom: 14,
            paddingBottom: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={pillStyle(selectedCategory === 'all')}
          >
            🗂️ الكل ({FAQS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = FAQS.filter((f) => f.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={pillStyle(selectedCategory === cat)}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* FAQs */}
        {filtered.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 32 }}>
            <div className="scr-empty-icon">
              <HelpCircle size={42} strokeWidth={1.5} />
            </div>
            <h2 className="scr-empty-title">لا توجد إجابات</h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>
              جرّب كلمات أخرى أو
              <Link href="/contact" style={{ color: 'var(--emerald)', fontWeight: 800, marginInline: 4 }}>
                تواصل معنا
              </Link>
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <article
                  key={idx}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid',
                    borderColor: isExpanded ? 'var(--emerald)' : 'var(--line)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    style={{
                      width: '100%',
                      padding: 14,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'start',
                      fontFamily: 'inherit',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--ink-3)',
                        marginBottom: 4,
                      }}>
                        {faq.category}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                        {faq.question}
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      color="var(--ink-3)"
                      style={{
                        flexShrink: 0,
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 14px 14px',
                        fontSize: 12,
                        color: 'var(--ink-2)',
                        lineHeight: 1.8,
                        borderTop: '1px solid var(--line)',
                        paddingTop: 12,
                      }}
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--emerald-soft), var(--amber-soft))',
            borderRadius: 14,
            padding: 16,
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>💬</div>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px' }}>
            لم تجد إجابتك؟
          </h3>
          <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: '0 0 12px' }}>
            فريق الدعم جاهز لمساعدتك في أي وقت
          </p>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'var(--emerald)',
              color: 'var(--paper-3)',
              borderRadius: 100,
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <MessageCircle size={14} />
            تواصل معنا
          </Link>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </main>
  );
}

function pillStyle(isActive: boolean): React.CSSProperties {
  return {
    padding: '8px 14px',
    background: isActive ? 'var(--emerald)' : 'var(--white)',
    color: isActive ? 'var(--paper-3)' : 'var(--ink-2)',
    border: '1px solid',
    borderColor: isActive ? 'var(--emerald)' : 'var(--line)',
    borderRadius: 100,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}
