'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { HOSPITAL_TYPES, type ListingKind } from '@/lib/provider-listings';
import { claimListing, proposeNewListing, withdrawClaim } from './actions';

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
