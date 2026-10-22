'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HOSPITAL_TYPES, type ListingKind } from '@/lib/provider-listings';
import { claimListing, proposeNewListing, updateMyListing, withdrawClaim } from './actions';

type Result = { ok: boolean; message: string };

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Result | null>(null);
  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (r.ok) router.refresh();
    });
  const note = msg && <p className={msg.ok ? 'pv-ok' : 'pv-err'} role="status">{msg.message}</p>;
  return { pending, run, note };
}

export function ClaimButton({ id, name }: { id: string; name: string }) {
  const { pending, run, note } = useAction();
  return (
    <>
      <button type="button" className="pv-btn pv-btn-ghost pv-btn-sm" disabled={pending} aria-label={`طلب ربط ${name}`}
        onClick={() => run(() => claimListing(id))}>
        هذه منشأتي
      </button>
      {note}
    </>
  );
}

export function WithdrawButton() {
  const { pending, run, note } = useAction();
  return (
    <>
      <button type="button" className="pv-btn pv-btn-ghost" disabled={pending} onClick={() => run(withdrawClaim)}>سحبُ الطلب</button>
      {note}
    </>
  );
}

/** منشأةٌ غيرُ موجودة في الدليل: حقولُها حسب النوع */
export function NewListingForm({ kind }: { kind: ListingKind }) {
  const { pending, run, note } = useAction();
  return (
    <form
      className="pv-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget).entries());
        run(() => proposeNewListing(data));
      }}
    >
      <label className="pv-field">اسمُ المنشأة<input name="name" required maxLength={120} /></label>
      {kind === 'doctor' && (
        <>
          <label className="pv-field">اسمُ الطبيب<input name="doctorName" required maxLength={120} /></label>
          <label className="pv-field">الاختصاص<input name="specialty" required maxLength={80} placeholder="مثال: باطنية" /></label>
        </>
      )}
      {kind === 'hospital' && (
        <label className="pv-field">النوع
          <select name="hospitalType" required defaultValue="">
            <option value="" disabled>اختر</option>
            {Object.entries(HOSPITAL_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      )}
      <label className="pv-field">المدينة<input name="city" required maxLength={60} /></label>
      {kind === 'pharmacy' && <label className="pv-field">الحيّ / المنطقة<input name="district" required maxLength={60} /></label>}
      <label className="pv-field">العنوان (اختياري)<input name="address" maxLength={200} /></label>
      <label className="pv-field">هاتفُ المنشأة<input name="phone" required inputMode="tel" dir="ltr" maxLength={20} /></label>
      <button type="submit" className="pv-btn" disabled={pending}>{pending ? 'جارٍ الإرسال…' : 'أرسِل للمراجعة'}</button>
      {note}
    </form>
  );
}

/** بياناتُ المنشأة التي يراها المريضُ في الدليل ويتواصل بها — يحرّرها مالكُها */
export function EditListingForm({ kind, values }: { kind: ListingKind; values: Record<string, unknown> }) {
  const { pending, run, note } = useAction();
  const v = (k: string) => (typeof values[k] === 'string' ? (values[k] as string) : '');
  const hhmm = (k: string) => v(k).slice(0, 5);
  return (
    <form
      className="pv-form"
      onSubmit={(e) => {
        e.preventDefault();
        const data: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget).entries());
        run(() => updateMyListing(data));
      }}
    >
      <label className="pv-field">الهاتف<input name="phone" required inputMode="tel" dir="ltr" maxLength={20}
        defaultValue={kind === 'doctor' ? v('clinic_phone') : v('phone')} /></label>
      {kind !== 'doctor' && (
        <label className="pv-field">واتساب (اختياري)<input name="whatsapp" inputMode="tel" dir="ltr" maxLength={20} defaultValue={v('whatsapp')} /></label>
      )}
      <label className="pv-field">العنوان<input name="address" maxLength={200}
        defaultValue={kind === 'doctor' ? v('clinic_address') : v('address')} /></label>
      {kind === 'pharmacy' && (
        <>
          <label className="pv-check-row"><input type="checkbox" name="is24h" defaultChecked={values.is_24h === true} /> مفتوحة 24 ساعة</label>
          <div className="pv-row">
            <label className="pv-field">تفتح<input type="time" name="opensAt" defaultValue={hhmm('opens_at')} /></label>
            <label className="pv-field">تغلق<input type="time" name="closesAt" defaultValue={hhmm('closes_at')} /></label>
          </div>
          <label className="pv-check-row"><input type="checkbox" name="hasDelivery" defaultChecked={values.has_delivery === true} /> توصيل</label>
        </>
      )}
      {kind === 'hospital' && (
        <label className="pv-field">أوقات الزيارة<input name="visitingHours" maxLength={120} defaultValue={v('visiting_hours')} /></label>
      )}
      <label className="pv-field">{kind === 'doctor' ? 'نبذة' : 'وصف المنشأة'}
        <textarea name="about" rows={3} maxLength={600} defaultValue={kind === 'doctor' ? v('bio') : v('description')} /></label>
      <button type="submit" className="pv-btn" disabled={pending}>{pending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
      {note}
    </form>
  );
}
