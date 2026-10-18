'use client';

import { useState, useTransition } from 'react';
import { saveProviderProfile } from './actions';

export default function ProviderAccountForm(props: {
  clinicName: string;
  city: string;
  governorate: string;
  ownerName: string;
  nameLabel: string;
}) {
  const [v, setV] = useState({ clinicName: props.clinicName, city: props.city, governorate: props.governorate, ownerName: props.ownerName });
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const field = (k: keyof typeof v, label: string, max: number) => (
    <label className="pv-field">
      <span>{label}</span>
      <input value={v[k]} maxLength={max} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </label>
  );
  return (
    <form
      className="pv-card pv-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setMsg(await saveProviderProfile(v)));
      }}
    >
      {field('clinicName', props.nameLabel, 80)}
      {field('city', 'المدينة', 40)}
      {field('governorate', 'المحافظة', 40)}
      {field('ownerName', 'اسمُ المسؤول', 80)}
      <button type="submit" className="pv-btn" disabled={pending}>{pending ? 'جارٍ الحفظ…' : 'حفظ'}</button>
      {msg && <p className={msg.ok ? 'pv-ok' : 'pv-err'} role="status">{msg.message}</p>}
    </form>
  );
}
