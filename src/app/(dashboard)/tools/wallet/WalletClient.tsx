'use client';

import Link from 'next/link';
import {
  ArrowRight, ArrowDownCircle, ArrowUpCircle, RotateCcw,
  Gift, Star, TrendingUp, Award, Info,
} from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: 'credit' | 'debit' | 'refund' | 'reward' | 'points_redeem';
  amount: number;
  points: number;
  description: string;
  reference_type: string | null;
  status: string;
  created_at: string;
}

interface Props {
  walletBalance: number;
  loyaltyPoints: number;
  loyaltyTier: string;
  transactions: Transaction[];
}

const TIERS = [
  { id: 'silver',   name: 'فضي',    threshold: 0,    color: '#888780', discount: '0%',  emoji: '🥈' },
  { id: 'gold',     name: 'ذهبي',   threshold: 100,  color: 'var(--amber)',  discount: '5%',  emoji: '🥇' },
  { id: 'platinum', name: 'بلاتيني', threshold: 500,  color: 'var(--emerald)', discount: '10%', emoji: '💎' },
  { id: 'diamond',  name: 'الماس',   threshold: 1000, color: '#534AB7', discount: '15%', emoji: '💠' },
];

const TRANSACTION_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  credit:        { icon: <ArrowDownCircle size={18} />, label: 'إيداع',        color: 'var(--emerald)' },
  debit:         { icon: <ArrowUpCircle size={18} />,   label: 'دفع',          color: 'var(--rose)' },
  refund:        { icon: <RotateCcw size={18} />,       label: 'استرداد',      color: 'var(--emerald)' },
  reward:        { icon: <Gift size={18} />,            label: 'مكافأة',       color: 'var(--amber)' },
  points_redeem: { icon: <Star size={18} />,            label: 'استبدال نقاط', color: 'var(--ink-2)' },
};

export default function WalletClient({
  walletBalance, loyaltyPoints, loyaltyTier, transactions,
}: Props) {
  const currentTier = TIERS.find((t) => t.id === loyaltyTier) || TIERS[0];
  const tierIndex = TIERS.indexOf(currentTier);
  const nextTier = TIERS[tierIndex + 1];
  const progressToNext = nextTier
    ? Math.min(100, Math.round(((loyaltyPoints - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100))
    : 100;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">المحفظة</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Balance card */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--emerald) 0%, var(--emerald-deep) 100%)',
            color: 'var(--paper-3)',
            borderRadius: 18,
            padding: 20,
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(15, 107, 88, 0.2)',
          }}
        >
          <div style={{
            position: 'absolute',
            top: -30,
            insetInlineEnd: -30,
            width: 140,
            height: 140,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
          }} />

          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
              الرصيد الحالي
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 900 }}>
                {walletBalance.toLocaleString('ar-IQ')}
              </span>
              <span style={{ fontSize: 14, opacity: 0.85 }}>د.ع</span>
            </div>
            <p style={{
              fontSize: 11,
              opacity: 0.8,
              marginTop: 8,
              lineHeight: 1.5,
            }}>
              يُستخدم للاستردادات والخصومات. الدفع للخدمات يبقى كاش حالياً.
            </p>
          </div>
        </div>

        {/* Loyalty tier card */}
        <div
          style={{
            background: 'var(--white)',
            border: `2px solid ${currentTier.color}`,
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: `${currentTier.color}15`,
                fontSize: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentTier.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>مستواك الحالي</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: currentTier.color }}>
                {currentTier.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                خصم <strong style={{ color: currentTier.color }}>{currentTier.discount}</strong> على كل الخدمات
              </div>
            </div>
            <div style={{ textAlign: 'end' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>نقاطك</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--amber)' }}>
                {loyaltyPoints}
              </div>
            </div>
          </div>

          {nextTier && (
            <>
              <div style={{ marginBottom: 6 }}>
                <div style={{
                  height: 8,
                  background: 'var(--paper-3)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progressToNext}%`,
                    background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
                {nextTier.threshold - loyaltyPoints} نقطة للوصول إلى <strong>{nextTier.name}</strong> {nextTier.emoji}
              </div>
            </>
          )}
        </div>

        {/* How to earn */}
        <div
          style={{
            background: 'var(--amber-soft)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 800,
            margin: '0 0 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <TrendingUp size={14} />
            كيف تكسب النقاط؟
          </h3>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>💉 كل حجز خدمة</span>
              <strong>+10 نقاط</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>💬 إكمال استشارة</span>
              <strong>+5 نقاط</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>⭐ تقييم خدمة</span>
              <strong>+3 نقاط</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>👥 دعوة صديق</span>
              <strong>+50 نقطة</strong>
            </div>
          </div>
        </div>

        {/* All tiers preview */}
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 8px' }}>المستويات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {TIERS.map((tier) => {
              const isCurrent = tier.id === loyaltyTier;
              const isAchieved = TIERS.indexOf(tier) <= tierIndex;
              return (
                <div
                  key={tier.id}
                  style={{
                    padding: 10,
                    background: isCurrent ? `${tier.color}15` : 'var(--white)',
                    border: '1px solid',
                    borderColor: isCurrent ? tier.color : 'var(--line)',
                    borderRadius: 10,
                    textAlign: 'center',
                    opacity: isAchieved ? 1 : 0.6,
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 2 }}>{tier.emoji}</div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: isCurrent ? tier.color : 'var(--ink-2)',
                  }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>
                    {tier.threshold === 0 ? 'البداية' : `${tier.threshold}+`}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: tier.color,
                    fontWeight: 800,
                    marginTop: 2,
                  }}>
                    {tier.discount}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions */}
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>
          آخر المعاملات
        </h3>

        {transactions.length === 0 ? (
          <div
            style={{
              background: 'var(--white)',
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
              border: '1px solid var(--line)',
            }}
          >
            <Award size={48} color="var(--ink-4)" style={{ opacity: 0.5, marginBottom: 12 }} />
            <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px' }}>
              ابدأ رحلتك!
            </h4>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
              احجز خدمة لتكسب أول نقاطك
            </p>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                marginTop: 14,
                padding: '8px 16px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                borderRadius: 100,
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              تصفّح الخدمات →
            </Link>
          </div>
        ) : (
          <div style={{
            background: 'var(--white)',
            borderRadius: 12,
            border: '1px solid var(--line)',
            overflow: 'hidden',
          }}>
            {transactions.map((t, i) => {
              const meta = TRANSACTION_META[t.transaction_type] || TRANSACTION_META.credit;
              const isPositive = ['credit', 'refund', 'reward'].includes(t.transaction_type);
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderBottom: i < transactions.length - 1 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${meta.color}15`,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>
                      {new Date(t.created_at).toLocaleDateString('ar-IQ', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    {t.amount > 0 && (
                      <div style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: isPositive ? 'var(--emerald)' : 'var(--rose)',
                      }}>
                        {isPositive ? '+' : '-'}{t.amount.toLocaleString('ar-IQ')} د.ع
                      </div>
                    )}
                    {t.points > 0 && (
                      <div style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'var(--amber)',
                      }}>
                        +{t.points} ⭐
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: 'var(--paper-3)',
            borderRadius: 10,
            display: 'flex',
            gap: 8,
            fontSize: 11,
            color: 'var(--ink-3)',
            lineHeight: 1.7,
          }}
        >
          <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            الدفع للخدمات يتم كاش حالياً.
            النقاط والمحفظة تُستخدم للمكافآت والاستردادات.
            ميزة الشحن الإلكتروني ستُضاف لاحقاً.
          </div>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
