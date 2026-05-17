'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'reward';
  amount: number;
  description: string;
  date: string;
  icon: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [];

const LOYALTY_TIERS = [
  { name: 'فضي', threshold: 0, color: '#888780', discount: '0%' },
  { name: 'ذهبي', threshold: 100, color: '#B8540C', discount: '5%' },
  { name: 'بلاتيني', threshold: 500, color: '#0E5C4D', discount: '10%' },
  { name: 'الماس', threshold: 1000, color: '#534AB7', discount: '15%' },
];

export default function WalletPage() {
  const [balance] = useState(0);
  const [loyaltyPoints] = useState(0);
  const currentTier = LOYALTY_TIERS.find((t, i) =>
    loyaltyPoints >= t.threshold &&
    (i === LOYALTY_TIERS.length - 1 || loyaltyPoints < LOYALTY_TIERS[i + 1].threshold)
  ) || LOYALTY_TIERS[0];

  const nextTier = LOYALTY_TIERS[LOYALTY_TIERS.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? Math.round(((loyaltyPoints - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)) * 100)
    : 100;

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">المحفظة</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Coming Soon Banner */}
        <div className="scr-info-banner" style={{ background: 'linear-gradient(135deg, #B8540C 0%, #854F0B 100%)', color: 'var(--white)', borderColor: 'transparent' }}>
          <span aria-hidden="true">🚧</span>
          <span><strong>قريباً!</strong> ميزة المحفظة قيد التطوير - تابع التحديثات</span>
        </div>

        {/* Balance Card */}
        <div className="account-profile-card" style={{ marginTop: 12 }}>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 8 }}>الرصيد المتاح</div>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4, letterSpacing: 1 }}>
              {balance.toLocaleString('ar-IQ')}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>دينار عراقي</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="account-edit-btn"
              onClick={() => alert('شحن المحفظة قيد التطوير')}
              style={{ flex: 1 }}
            >
              <span aria-hidden="true">💳</span>
              <span>شحن</span>
            </button>
            <button
              type="button"
              className="account-edit-btn"
              onClick={() => alert('تحويل قيد التطوير')}
              style={{ flex: 1 }}
            >
              <span aria-hidden="true">📤</span>
              <span>تحويل</span>
            </button>
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">نقاط الولاء</div>
          <div className="scr-section-link" style={{ color: currentTier.color, fontWeight: 800 }}>
            {currentTier.name}
          </div>
        </div>

        <div className="scr-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>نقاطك الحالية</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--emerald)' }}>
                {loyaltyPoints.toLocaleString('ar-IQ')} نقطة
              </div>
            </div>
            <div style={{ fontSize: 32 }} aria-hidden="true">⭐</div>
          </div>

          {nextTier && (
            <>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
                {nextTier.threshold - loyaltyPoints} نقطة للوصول إلى مستوى <strong>{nextTier.name}</strong>
              </div>
              <div style={{ height: 8, background: 'var(--paper-3)', borderRadius: 100, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressToNext}%`,
                    background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier.color})`,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Tier Benefits */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">مستويات الولاء</div>
        </div>

        <div className="services-grid">
          {LOYALTY_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`service-card ${tier.name === currentTier.name ? 'service-featured' : 'service-default'}`}
              style={tier.name === currentTier.name ? {} : { borderColor: tier.color }}
            >
              <div className="service-icon" aria-hidden="true">
                {tier.name === 'فضي' ? '🥈' : tier.name === 'ذهبي' ? '🥇' : tier.name === 'بلاتيني' ? '💎' : '👑'}
              </div>
              <div className="service-title" style={tier.name === currentTier.name ? {} : { color: tier.color }}>
                {tier.name}
              </div>
              <div className="service-desc">خصم {tier.discount}</div>
              <div className="service-desc" style={{ fontSize: 9, marginTop: 2 }}>
                {tier.threshold > 0 ? `${tier.threshold}+ نقطة` : 'مستوى مبدئي'}
              </div>
            </div>
          ))}
        </div>

        {/* كيف تربح النقاط */}
        <div className="scr-section-head" style={{ marginTop: 20 }}>
          <div className="scr-section-title">كيف تربح النقاط؟</div>
        </div>

        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">📅</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">إكمال موعد</div>
              <div className="scr-list-item-subtitle">+10 نقاط لكل موعد</div>
            </div>
          </div>
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">⭐</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">تقييم الخدمة</div>
              <div className="scr-list-item-subtitle">+5 نقاط لكل تقييم</div>
            </div>
          </div>
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">👥</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">دعوة صديق</div>
              <div className="scr-list-item-subtitle">+50 نقطة عند تسجيل صديقك</div>
            </div>
          </div>
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">💎</div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">باقات العضوية</div>
              <div className="scr-list-item-subtitle">+100 نقطة شهرياً</div>
            </div>
          </div>
        </div>

        {/* المعاملات */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">آخر المعاملات</div>
        </div>

        {MOCK_TRANSACTIONS.length === 0 ? (
          <div className="scr-empty" style={{ marginTop: 16 }}>
            <div className="scr-empty-icon" aria-hidden="true">💳</div>
            <h2 className="scr-empty-title">لا معاملات بعد</h2>
            <p className="scr-empty-desc">ستظهر هنا كل عملياتك المالية</p>
          </div>
        ) : (
          <div className="scr-list-stack">
            {MOCK_TRANSACTIONS.map((t) => (
              <div key={t.id} className="scr-list-item">
                <div className="scr-list-item-icon" aria-hidden="true">{t.icon}</div>
                <div className="scr-list-item-content">
                  <div className="scr-list-item-title">{t.description}</div>
                  <div className="scr-list-item-meta">{t.date}</div>
                </div>
                <div style={{
                  fontWeight: 800,
                  color: t.type === 'debit' ? 'var(--rose)' : 'var(--emerald)',
                  fontSize: 14,
                }}>
                  {t.type === 'debit' ? '-' : '+'}{t.amount.toLocaleString('ar-IQ')}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </main>
  );
}
