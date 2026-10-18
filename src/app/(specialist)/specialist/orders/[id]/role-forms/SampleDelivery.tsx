'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { IconDroplet as Droplet, IconBuildingHospital as Lab, IconAlertTriangle as AlertTriangle } from '@tabler/icons-react';
import { markSampleCollected, deliverSampleToLab } from '../actions';

export interface DeliveryLab {
  id: string;
  name: string;
  city: string | null;
  covered: number;
  total: number;
}

interface Props {
  appointmentId: string;
  /** حالةُ طلب التحاليل: pending | sample_collected */
  status: string;
  /** المختبرُ الذي اختاره المريض (null = «لا يهم») */
  chosenLab: { id: string; name: string } | null;
  /** المختبراتُ المعتمَدة التي تُجري شيئاً من التحاليل، مرتّبةً (للاختيار حين قال المريض «لا يهم») */
  labs: DeliveryLab[];
  testNames: string[];
  /** إدخالُ النتائج بنفسه — يُعرض حين لا مختبرَ مسجَّلاً في التطبيق */
  fallbackEditor: ReactNode;
}

/**
 * 🩸 المحلّلُ يسحب ويسلّم (الدفعة 2): «تمّ السحب» ← «سلّمتُ العيّنة للمختبر». والنتائجُ يرفعها المختبر.
 */
export default function SampleDelivery({ appointmentId, status, chosenLab, labs, testNames, fallbackEditor }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(chosenLab ? null : labs[0]?.id ?? null);
  const collected = status === 'sample_collected';
  const noNetwork = !chosenLab && labs.length === 0;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? 'تعذّر الحفظ');
      else router.refresh();
    });

  return (
    <section className="sd" aria-label="سحبُ العيّنة وتسليمها">
      <div className="scr-section-head">
        <div className="scr-section-title sd-title">
          <Droplet size={16} strokeWidth={2.2} /> العيّنة
        </div>
      </div>

      {testNames.length > 0 && (
        <p className="sd-tests">التحاليل: {testNames.join('، ')}</p>
      )}

      <ol className="sd-steps">
        <li className={collected ? 'sd-step sd-done' : 'sd-step sd-now'}>
          <span className="sd-num" aria-hidden="true">{collected ? '✓' : '1'}</span>
          <div className="sd-body">
            <div className="sd-step-title">اسحب العيّنة</div>
            {!collected && (
              <button type="button" className="sd-btn" disabled={pending} onClick={() => run(() => markSampleCollected(appointmentId))}>
                تمّ السحب
              </button>
            )}
          </div>
        </li>

        <li className={collected ? 'sd-step sd-now' : 'sd-step'}>
          <span className="sd-num" aria-hidden="true">2</span>
          <div className="sd-body">
            <div className="sd-step-title">سلّمها للمختبر</div>
            {chosenLab ? (
              <p className="sd-note">
                <Lab size={14} aria-hidden="true" /> اختار المريض: <strong>{chosenLab.name}</strong>
              </p>
            ) : labs.length > 0 ? (
              <fieldset className="sd-labs">
                <legend className="sd-note">قال المريض «لا يهم» — اختر المختبر:</legend>
                {labs.map((l) => (
                  <label key={l.id} className={picked === l.id ? 'sd-lab sd-lab-on' : 'sd-lab'}>
                    <input type="radio" name="lab" value={l.id} checked={picked === l.id} onChange={() => setPicked(l.id)} />
                    <span className="sd-lab-name">{l.name}</span>
                    <span className="sd-lab-meta">
                      {l.city ? `${l.city} · ` : ''}
                      {l.covered === l.total ? 'يُجري كلَّ التحاليل' : `يُجري ${l.covered} من ${l.total}`}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            {collected && !noNetwork && (
              <button
                type="button"
                className="sd-btn sd-btn-primary"
                disabled={pending || (!chosenLab && !picked)}
                onClick={() => run(() => deliverSampleToLab(appointmentId, chosenLab ? null : picked))}
              >
                {pending ? 'جارٍ الحفظ…' : 'سلّمتُ العيّنة'}
              </button>
            )}
          </div>
        </li>
      </ol>

      {error && (
        <p className="sd-error" role="alert">
          <AlertTriangle size={14} aria-hidden="true" /> {error}
        </p>
      )}

      {noNetwork && (
        <>
          <p className="sd-note sd-fallback">
            لا مختبرَ مسجَّلاً في التطبيق بعد — أدخل النتائج بنفسك كما كان، ويراها المريض فوراً.
          </p>
          {fallbackEditor}
        </>
      )}
    </section>
  );
}
