'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { signOut } from '../../../(auth)/login/actions';
import { updateUserSettings } from '@/lib/services/user-settings';
import type { UserSettings } from '@/lib/services/user-settings-types';
import { exportUserData } from './actions';
import PinSection from './PinSection';
import {
  ArrowRight, Globe, Bell, Lock, BarChart3, Download, Loader2,
  ScrollText, FileText, HelpCircle, AlertTriangle, Info, LogOut,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  initial: UserSettings;
  pinEnabled: boolean;
}

export default function SettingsClient({ initial, pinEnabled }: Props) {
  const [autoLock, setAutoLock] = useState(initial.auto_lock ?? true);
  const [analytics, setAnalytics] = useState(initial.analytics ?? true);
  const [, startTransition] = useTransition();
  const [isExporting, startExportTransition] = useTransition();
  const [exportMsg, setExportMsg] = useState('');

  function save(partial: UserSettings) {
    startTransition(async () => {
      await updateUserSettings(partial);
    });
  }

  function handleExport() {
    setExportMsg('');
    startExportTransition(async () => {
      const result = await exportUserData();
      if (!result.ok || !result.data) {
        setExportMsg(result.error || 'تعذّر تصدير البيانات');
        return;
      }
      // تنزيل JSON كملف
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `spir-medical-data-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMsg('تم تنزيل بياناتك بنجاح');
      setTimeout(() => setExportMsg(''), 3000);
    });
  }

  const isSuccess = exportMsg && !exportMsg.includes('تعذّر');

  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/account" className="scr-back-btn" aria-label="العودة">
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </Link>
          <h1 className="scr-page-title">الإعدادات</h1>
          <div className="scr-page-spacer" />
        </div>

        {/* اللغة */}
        <div className="scr-section-head" style={{ marginTop: 8 }}>
          <div className="scr-section-title">اللغة</div>
        </div>

        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Globe size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">العربية</div>
              <div className="scr-list-item-subtitle">اللغة الحالية</div>
            </div>
            <div style={{ color: 'var(--emerald)' }} aria-hidden="true">
              <CheckCircle2 size={20} strokeWidth={2.4} />
            </div>
          </div>
        </div>

        <div className="scr-info-banner" style={{ marginTop: 8 }}>
          <Globe size={14} strokeWidth={2.2} aria-hidden />
          <span>سيتم دعم الإنجليزية والكردية قريباً</span>
        </div>

        {/* الإشعارات - رابط */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">الإشعارات</div>
        </div>

        <div className="scr-list-stack">
          <Link href="/account/notifications" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Bell size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">إعدادات التنبيهات</div>
              <div className="scr-list-item-subtitle">تخصيص أنواع الإشعارات</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
        </div>

        {/* الأمان والخصوصية */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">الأمان والخصوصية</div>
        </div>

        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Lock size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">القفل التلقائي</div>
              <div className="scr-list-item-subtitle">يقفل التطبيق بعد دقيقتين من الخمول</div>
            </div>
            <label className="scr-toggle">
              <input
                type="checkbox"
                checked={autoLock}
                onChange={() => {
                  const next = !autoLock;
                  setAutoLock(next);
                  save({ auto_lock: next });
                }}
              />
              <span className="scr-toggle-slider"></span>
            </label>
          </div>

          <PinSection pinEnabled={pinEnabled} />
        </div>

        {/* البيانات */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">البيانات والخصوصية</div>
        </div>

        <div className="scr-list-stack">
          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">
              <BarChart3 size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">المشاركة في التحليلات</div>
              <div className="scr-list-item-subtitle">لتحسين التطبيق (بيانات مجهولة الهوية)</div>
            </div>
            <label className="scr-toggle">
              <input
                type="checkbox"
                checked={analytics}
                onChange={() => {
                  const next = !analytics;
                  setAnalytics(next);
                  save({ analytics: next });
                }}
              />
              <span className="scr-toggle-slider"></span>
            </label>
          </div>

          <button
            type="button"
            className="scr-list-item scr-list-item-clickable"
            style={{ width: '100%', textAlign: 'right', border: 'none', cursor: 'pointer', background: 'transparent' }}
            onClick={handleExport}
            disabled={isExporting}
          >
            <div className="scr-list-item-icon" aria-hidden="true">
              {isExporting ? <Loader2 size={22} strokeWidth={2} style={{ animation: 'spin-smooth 1s linear infinite' }} /> : <Download size={22} strokeWidth={2} />}
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">{isExporting ? 'جارٍ التحضير...' : 'تحميل بياناتي'}</div>
              <div className="scr-list-item-subtitle">احصل على نسخة من كل بياناتك (JSON)</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </button>

          <Link href="/legal/privacy" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <ScrollText size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">سياسة الخصوصية</div>
              <div className="scr-list-item-subtitle">كيف نتعامل مع بياناتك</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>

          <Link href="/legal/terms" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <FileText size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">شروط الاستخدام</div>
              <div className="scr-list-item-subtitle">الاتفاقية القانونية</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>
        </div>

        {exportMsg && (
          <div style={{
            background: isSuccess ? 'var(--emerald-soft)' : 'var(--rose-soft)',
            color: isSuccess ? 'var(--emerald-deep)' : 'var(--rose)',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            marginTop: 12,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            {isSuccess && <CheckCircle2 size={14} strokeWidth={2.4} />}
            {exportMsg}
          </div>
        )}

        {/* حول التطبيق */}
        <div className="scr-section-head" style={{ marginTop: 24 }}>
          <div className="scr-section-title">حول التطبيق</div>
        </div>

        <div className="scr-list-stack">
          <Link href="/account/help" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <HelpCircle size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">المساعدة والدعم</div>
              <div className="scr-list-item-subtitle">أسئلة شائعة وتواصل</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>

          <Link href="/legal/disclaimer" className="scr-list-item scr-list-item-clickable">
            <div className="scr-list-item-icon" aria-hidden="true">
              <AlertTriangle size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">إخلاء المسؤولية الطبية</div>
              <div className="scr-list-item-subtitle">تنويهات صحية مهمة</div>
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 18 }} aria-hidden="true">←</div>
          </Link>

          <div className="scr-list-item">
            <div className="scr-list-item-icon" aria-hidden="true">
              <Info size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title">الإصدار</div>
              <div className="scr-list-item-subtitle">v1.0.0 (Beta)</div>
            </div>
          </div>
        </div>

        {/* تسجيل الخروج */}
        <form action={signOut}>
          <button
            type="submit"
            className="scr-list-item scr-list-item-clickable"
            style={{
              width: '100%',
              textAlign: 'right',
              border: 'none',
              cursor: 'pointer',
              background: 'var(--rose-soft)',
              color: 'var(--rose)',
              marginTop: 24,
            }}
          >
            <div className="scr-list-item-icon" aria-hidden="true">
              <LogOut size={22} strokeWidth={2} />
            </div>
            <div className="scr-list-item-content">
              <div className="scr-list-item-title" style={{ color: 'var(--rose)' }}>تسجيل الخروج</div>
              <div className="scr-list-item-subtitle" style={{ color: 'var(--rose)' }}>الخروج من حسابك</div>
            </div>
          </button>
        </form>
      </div>
    </main>
  );
}
