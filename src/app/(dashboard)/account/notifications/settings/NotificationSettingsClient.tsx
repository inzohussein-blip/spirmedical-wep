'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  Calendar,
  Beaker,
  MessageCircle,
  Gift,
  Megaphone,
  Moon,
  Smartphone,
  Trash2,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { Card, useConfirm, toast } from '@/components/ui';
import {
  updateNotificationPreferences,
  removeSubscription,
  type NotificationPreferences,
  type ActiveSubscription,
} from './actions';
import {
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  isSubscribed,
  getPushPermission,
  isPushSupported,
  type PushPermission,
} from '@/lib/push-client';

interface Props {
  initialSubscriptions: ActiveSubscription[];
  initialPreferences: NotificationPreferences;
}

export default function NotificationSettingsClient({
  initialSubscriptions,
  initialPreferences,
}: Props) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isPending, startTransition] = useTransition();
  const [prefs, setPrefs] = useState(initialPreferences);
  const [subs, setSubs] = useState(initialSubscriptions);
  const [permission, setPermission] = useState<PushPermission>('default');
  const [thisDeviceSubscribed, setThisDeviceSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setPermission('unsupported');
      return;
    }
    setPermission(getPushPermission());
    isSubscribed().then(setThisDeviceSubscribed);
  }, []);

  /* ─── Handlers ─── */

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    const result = await subscribeToPush();
    setIsSubscribing(false);

    if (result.success) {
      toast.success('🎉 تم تفعيل الإشعارات على هذا الجهاز');
      setThisDeviceSubscribed(true);
      setPermission('granted');
      router.refresh();
    } else {
      toast.error(result.error || 'فشل التفعيل');
      setPermission(getPushPermission());
    }
  };

  const handleUnsubscribe = async () => {
    const ok = await confirm({
      title: 'إلغاء الإشعارات',
      message: 'لن تصلك إشعارات على هذا الجهاز. يمكنك التفعيل مجدداً لاحقاً.',
      variant: 'warning',
      confirmText: 'إلغاء التفعيل',
    });
    if (!ok) return;

    const result = await unsubscribeFromPush();
    if (result.success) {
      toast.success('تم إلغاء الإشعارات على هذا الجهاز');
      setThisDeviceSubscribed(false);
      router.refresh();
    } else {
      toast.error(result.error || 'فشل الإلغاء');
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    const result = await sendTestPush();
    setIsTesting(false);

    if (result.success) {
      toast.success('تم الإرسال! تحقّق من إشعاراتك');
    } else {
      toast.error(result.error || 'فشل الإرسال');
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const newValue = !prefs[key];
    setPrefs({ ...prefs, [key]: newValue });

    startTransition(async () => {
      const result = await updateNotificationPreferences({ [key]: newValue });
      if (!result.success) {
        toast.error(result.error || 'فشل التحديث');
        setPrefs({ ...prefs, [key]: !newValue }); // rollback
      }
    });
  };

  const handleRemoveSubscription = async (sub: ActiveSubscription) => {
    const ok = await confirm({
      title: 'حذف الجهاز',
      message: `سيتوقف هذا الجهاز عن استقبال الإشعارات (${sub.device_label || 'جهاز غير معروف'})`,
      variant: 'danger',
      confirmText: 'حذف',
    });
    if (!ok) return;

    const result = await removeSubscription(sub.id);
    if (result.success) {
      setSubs(subs.filter((s) => s.id !== sub.id));
      toast.success('تم حذف الجهاز');
      router.refresh();
    } else {
      toast.error(result.error || 'فشل الحذف');
    }
  };

  /* ─── Render ─── */

  if (permission === 'unsupported') {
    return (
      <main className="scr" style={{ padding: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 16px' }}>
          🔔 الإشعارات
        </h1>
        <Card>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <BellOff size={48} color="var(--ink-3)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 14, fontWeight: 800 }}>متصفحك لا يدعم الإشعارات</h3>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
              جرّب فتح الموقع من Chrome على Android أو Safari على iPhone
            </p>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="scr" style={{ padding: 20, paddingBottom: 60 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🔔 الإشعارات</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 0' }}>
          إدارة إشعارات المواعيد والنتائج
        </p>
      </div>

      {/* ─── Subscribe/Unsubscribe Card ─── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: thisDeviceSubscribed ? 'var(--emerald-soft)' : 'var(--paper-3)',
              color: thisDeviceSubscribed ? 'var(--emerald)' : 'var(--ink-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {thisDeviceSubscribed ? <Bell size={22} /> : <BellOff size={22} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px' }}>
              {thisDeviceSubscribed
                ? 'الإشعارات مفعّلة على هذا الجهاز ✓'
                : 'لم تفعّل الإشعارات على هذا الجهاز'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>
              {thisDeviceSubscribed
                ? 'ستصلك إشعارات بالمواعيد والنتائج والرسائل'
                : 'فعّل الإشعارات لتصلك تذكيرات بمواعيدك ونتائج تحاليلك فوراً'}
            </p>

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {thisDeviceSubscribed ? (
                <>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    disabled={isTesting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      background: 'var(--emerald)',
                      color: 'var(--paper-3)',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isTesting ? 'wait' : 'pointer',
                      opacity: isTesting ? 0.6 : 1,
                    }}
                  >
                    <Send size={12} />
                    <span>{isTesting ? 'جارٍ الإرسال...' : 'أرسل تجريبي'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUnsubscribe}
                    style={{
                      padding: '8px 14px',
                      background: 'transparent',
                      color: 'var(--rose)',
                      border: '1px solid var(--rose)',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    إلغاء التفعيل
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={isSubscribing || permission === 'denied'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    background: 'var(--emerald)',
                    color: 'var(--paper-3)',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: isSubscribing ? 'wait' : 'pointer',
                    opacity: isSubscribing || permission === 'denied' ? 0.5 : 1,
                  }}
                >
                  <Bell size={14} />
                  <span>{isSubscribing ? 'جارٍ التفعيل...' : 'فعّل الإشعارات'}</span>
                </button>
              )}
            </div>

            {permission === 'denied' && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  background: 'var(--amber-soft)',
                  color: 'var(--amber)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                ⚠️ رفضت الإشعارات سابقاً. فعّلها من إعدادات المتصفح ثم أعد تحميل الصفحة.
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─── Categories ─── */}
      {thisDeviceSubscribed && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '16px 0 8px' }}>
            أنواع الإشعارات
          </h2>
          <Card style={{ marginBottom: 16 }}>
            <CategoryToggle
              icon={<Calendar size={16} />}
              title="تذكيرات المواعيد"
              desc="قبل ساعة من موعدك"
              checked={prefs.appointment_reminders}
              onChange={() => handleTogglePref('appointment_reminders')}
              disabled={isPending}
            />
            <CategoryToggle
              icon={<Beaker size={16} />}
              title="نتائج التحاليل"
              desc="عند صدور النتائج"
              checked={prefs.test_results}
              onChange={() => handleTogglePref('test_results')}
              disabled={isPending}
            />
            <CategoryToggle
              icon={<MessageCircle size={16} />}
              title="الرسائل"
              desc="من الأخصائيين والمختبرات"
              checked={prefs.messages}
              onChange={() => handleTogglePref('messages')}
              disabled={isPending}
            />
            <CategoryToggle
              icon={<Gift size={16} />}
              title="عروض ترويجية"
              desc="خصومات وعروض خاصة"
              checked={prefs.promotions}
              onChange={() => handleTogglePref('promotions')}
              disabled={isPending}
            />
            <CategoryToggle
              icon={<Megaphone size={16} />}
              title="تحديثات النظام"
              desc="إعلانات مهمة من المنصة"
              checked={prefs.system_updates}
              onChange={() => handleTogglePref('system_updates')}
              disabled={isPending}
              isLast
            />
          </Card>

          {/* ─── Quiet hours ─── */}
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '16px 0 8px' }}>
            وقت السكون
          </h2>
          <Card style={{ marginBottom: 16 }}>
            <CategoryToggle
              icon={<Moon size={16} />}
              title="لا إشعارات في الليل"
              desc={`من ${prefs.quiet_hours_start.slice(0, 5)} إلى ${prefs.quiet_hours_end.slice(0, 5)}`}
              checked={prefs.quiet_hours_enabled}
              onChange={() => handleTogglePref('quiet_hours_enabled')}
              disabled={isPending}
              isLast
            />
          </Card>
        </>
      )}

      {/* ─── الأجهزة المُسجّلة ─── */}
      {subs.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '16px 0 8px' }}>
            الأجهزة المُسجّلة ({subs.length})
          </h2>
          <Card>
            {subs.map((sub, idx) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom:
                    idx < subs.length - 1 ? '1px solid var(--line)' : 'none',
                }}
              >
                <Smartphone size={18} color="var(--ink-3)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {sub.device_label || 'جهاز غير معروف'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    آخر استخدام:{' '}
                    {new Date(sub.last_used_at).toLocaleDateString('ar-IQ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSubscription(sub)}
                  style={{
                    width: 32,
                    height: 32,
                    background: 'var(--rose-soft)',
                    color: 'var(--rose)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="حذف"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </Card>
        </>
      )}

      <ConfirmDialog />
    </main>
  );
}

interface CategoryToggleProps {
  icon: React.ReactElement;
  title: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  isLast?: boolean;
}

function CategoryToggle({
  icon,
  title,
  desc,
  checked,
  onChange,
  disabled,
  isLast,
}: CategoryToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--line)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: checked ? 'var(--emerald-soft)' : 'var(--paper-3)',
          color: checked ? 'var(--emerald)' : 'var(--ink-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{desc}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        aria-label={checked ? 'إيقاف' : 'تفعيل'}
        style={{
          width: 44,
          height: 26,
          padding: 2,
          background: checked ? 'var(--emerald)' : 'var(--ink-4)',
          border: 'none',
          borderRadius: 100,
          cursor: disabled ? 'wait' : 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            display: 'block',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--paper-3)',
            transition: 'transform 0.2s',
            transform: checked ? 'translateX(18px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}
