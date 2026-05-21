'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Copy, Share2, Gift, TrendingUp,
  Trophy, Users, CheckCircle2, Sparkles,
} from 'lucide-react';
import { haptic } from '@/lib/haptic';
import { toast } from '@/components/ui/Toaster';
import { generateMyReferralCode } from './actions';

interface Milestone {
  id: string;
  tier: 'silver' | 'gold' | 'platinum' | 'diamond';
  name_ar: string;
  min_points: number;
  discount_percent: number;
  free_consultations_per_month: number;
  priority_support: boolean;
  free_delivery: boolean;
  badge_color: string;
  badge_icon: string;
  description_ar: string | null;
}

interface Referral {
  id: string;
  status: string;
  created_at: string;
  referrer_reward: number;
}

interface Props {
  userId: string;
  userName: string;
  loyaltyPoints: number;
  currentTier: string;
  walletBalance: number;
  milestones: Milestone[];
  referralCode: string | null;
  referrals: Referral[];
  referralCount: number;
}

export default function RewardsClient({
  userId,
  userName,
  loyaltyPoints,
  currentTier,
  walletBalance,
  milestones,
  referralCode: initialCode,
  referrals,
  referralCount,
}: Props) {
  const [referralCode, setReferralCode] = useState(initialCode);
  const [, startTransition] = useTransition();

  // الـ tier الحالي
  const currentMilestone = milestones.find(m => m.tier === currentTier);
  const nextMilestone = milestones.find(m => m.min_points > loyaltyPoints);
  const progress = nextMilestone
    ? Math.round((loyaltyPoints / nextMilestone.min_points) * 100)
    : 100;
  const pointsToNext = nextMilestone ? nextMilestone.min_points - loyaltyPoints : 0;

  const handleGenerateCode = () => {
    haptic.medium();
    startTransition(async () => {
      const result = await generateMyReferralCode();
      if (result.ok) {
        setReferralCode(result.code!);
        haptic.success();
        toast.success(result.alreadyExists ? 'هذا كودك!' : '🎉 تم إنشاء كودك!');
      } else {
        toast.error(result.error || 'فشل');
      }
    });
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      haptic.success();
      toast.success('📋 تم النسخ');
    } catch {
      toast.error('فشل النسخ');
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;
    haptic.light();
    const shareUrl = `${window.location.origin}/?ref=${referralCode}`;
    const shareText = `🎁 جرّب Spir Medical - منصة طبية رقمية في العراق\n\nاستخدم كود الدعوة الخاص بي: ${referralCode}\n\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spir Medical',
          text: shareText,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('📋 نُسخ - شاركه');
    }
  };

  return (
    <main className="app-screen">
      <div className="scr-content" style={{ paddingBottom: 40 }}>
        {/* Header */}
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} />
          </Link>
          <h1 className="scr-page-title">المكافآت والإحالات</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* Hero - Current Tier */}
        <div style={{
          background: `linear-gradient(135deg, ${currentMilestone?.badge_color || '#9CA3AF'} 0%, ${currentMilestone?.badge_color || '#9CA3AF'}cc 100%)`,
          borderRadius: 18,
          padding: 18,
          marginBottom: 14,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: -20,
            insetInlineEnd: -20,
            fontSize: 120,
            opacity: 0.2,
          }}>
            {currentMilestone?.badge_icon}
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.9, marginBottom: 4 }}>
              مستواك الحالي
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
              {currentMilestone?.badge_icon} {currentMilestone?.name_ar || 'سيلفر'}
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 900,
              lineHeight: 1,
              marginBottom: 8,
            }}>
              {loyaltyPoints.toLocaleString('ar-IQ')}
            </div>
            <div style={{ fontSize: 11, opacity: 0.9 }}>نقطة ولاء</div>

            {nextMilestone && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  fontSize: 11,
                  opacity: 0.9,
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <span>الترقية إلى {nextMilestone.name_ar} {nextMilestone.badge_icon}</span>
                  <strong>{progress}%</strong>
                </div>
                <div style={{
                  height: 8,
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: 100,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: '#fff',
                    borderRadius: 100,
                  }} />
                </div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>
                  تحتاج {pointsToNext.toLocaleString('ar-IQ')} نقطة أخرى
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wallet balance */}
        <div style={{
          background: 'var(--emerald-soft)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>
              💰 رصيد المحفظة
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--emerald)' }}>
              {walletBalance.toLocaleString('ar-IQ')} د.ع
            </div>
          </div>
          <Sparkles size={28} color="var(--emerald)" />
        </div>

        {/* Current tier benefits */}
        {currentMilestone && (
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 14,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
              🎁 مزاياك الحالية
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {currentMilestone.discount_percent > 0 && (
                <Benefit icon="💎" text={`خصم ${currentMilestone.discount_percent}% على كل الخدمات`} />
              )}
              {currentMilestone.free_consultations_per_month > 0 && (
                <Benefit icon="💬" text={`${currentMilestone.free_consultations_per_month} استشارة مجانية شهرياً`} />
              )}
              {currentMilestone.priority_support && (
                <Benefit icon="⭐" text="دعم أولوية VIP" />
              )}
              {currentMilestone.free_delivery && (
                <Benefit icon="🚚" text="توصيل مجاني للأدوية" />
              )}
              {currentMilestone.tier === 'silver' && (
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  استمر باستخدام التطبيق لرفع مستواك! 💪
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Tiers Roadmap */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>
            🏆 مستويات الولاء
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {milestones.map((m) => {
              const achieved = loyaltyPoints >= m.min_points;
              const isCurrent = m.tier === currentTier;
              return (
                <div key={m.id} style={{
                  background: isCurrent ? `${m.badge_color}22` : 'var(--white)',
                  border: '2px solid',
                  borderColor: isCurrent ? m.badge_color : (achieved ? 'var(--emerald)' : 'var(--line)'),
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: achieved ? 1 : 0.6,
                }}>
                  <div style={{ fontSize: 28 }}>{m.badge_icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 900,
                      color: m.badge_color,
                    }}>
                      {m.name_ar}
                      {isCurrent && <span style={{ fontSize: 10, marginInlineStart: 8 }}>← الحالي</span>}
                      {achieved && !isCurrent && <CheckCircle2 size={12} color="var(--emerald)" style={{ marginInlineStart: 8 }} />}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                      {m.min_points.toLocaleString('ar-IQ')} نقطة
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 2 }}>
                      {m.description_ar}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral Section */}
        <div style={{
          background: 'var(--white)',
          border: '2px dashed var(--emerald)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 14,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
          }}>
            <Users size={20} color="var(--emerald)" />
            <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>
              ادعُ صديقاً واربح
            </h3>
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 14px', lineHeight: 1.6 }}>
            شارك كودك مع أصدقائك. عند تسجيل أحدهم واستخدام الخدمة، تحصلان معاً على رصيد إضافي 🎁
          </p>

          {referralCode ? (
            <>
              {/* Code display */}
              <div style={{
                background: 'var(--emerald-soft)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>
                  كودك الخاص
                </div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: 'var(--emerald)',
                  letterSpacing: 4,
                  fontFamily: 'monospace',
                }}>
                  {referralCode}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'var(--white)',
                    color: 'var(--emerald)',
                    border: '1px solid var(--emerald)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Copy size={14} />
                  نسخ
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    flex: 2,
                    padding: '10px 14px',
                    background: 'var(--emerald)',
                    color: 'var(--paper-3)',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Share2 size={14} />
                  شارك كودك
                </button>
              </div>

              {referralCount > 0 && (
                <div style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  background: 'var(--paper-3)',
                  borderRadius: 10,
                  fontSize: 12,
                  color: 'var(--ink-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <TrendingUp size={14} color="var(--emerald)" />
                  <span>دعوت <strong>{referralCount}</strong> صديق · تم منحك مكافآت 🎉</span>
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleGenerateCode}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--emerald)',
                color: 'var(--paper-3)',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Gift size={16} />
              أنشئ كود الإحالة الخاص بي
            </button>
          )}
        </div>

        {/* Recent referrals */}
        {referrals.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              📊 إحالاتي الأخيرة
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {referrals.map((r) => (
                <div key={r.id} style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--ink-2)' }}>
                      {r.status === 'rewarded' && '✓ مُكافأة'}
                      {r.status === 'qualified' && '⏳ قيد المعالجة'}
                      {r.status === 'pending' && '📝 سجّل لكن لم يستخدم'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                      {new Date(r.created_at).toLocaleDateString('ar-IQ')}
                    </div>
                  </div>
                  {r.referrer_reward > 0 && (
                    <div style={{ fontWeight: 900, color: 'var(--emerald)' }}>
                      +{r.referrer_reward.toLocaleString('ar-IQ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Benefit({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: 'var(--ink-2)',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
