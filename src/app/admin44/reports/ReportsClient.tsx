'use client';

import { useState, useTransition } from 'react';
import { exportPatientsCSV, exportSpecialistsCSV, exportOrdersCSV } from './actions';

interface Props {
  fromDate: string;
  toDate: string;
}

export default function ReportsClient({ fromDate, toDate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPatients() {
    startTransition(async () => {
      const result = await exportPatientsCSV();
      if (result.ok) {
        downloadCSV(result.csv, result.filename);
        setShowMenu(false);
      } else {
        alert('فشل التصدير: ' + result.error);
      }
    });
  }

  function exportSpecialists() {
    startTransition(async () => {
      const result = await exportSpecialistsCSV();
      if (result.ok) {
        downloadCSV(result.csv, result.filename);
        setShowMenu(false);
      } else {
        alert('فشل التصدير: ' + result.error);
      }
    });
  }

  function exportOrders() {
    startTransition(async () => {
      const result = await exportOrdersCSV(fromDate, toDate);
      if (result.ok) {
        downloadCSV(result.csv, result.filename);
        setShowMenu(false);
      } else {
        alert('فشل التصدير: ' + result.error);
      }
    });
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowMenu(!showMenu)} disabled={isPending} style={{
        padding: '10px 20px', background: 'var(--emerald-deep)', color: 'var(--white)',
        border: 0, borderRadius: 10, fontSize: 13, fontWeight: 800,
        cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        📥 تصدير CSV {isPending && '...'}
      </button>

      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{
            position: 'fixed', inset: 0, zIndex: 10,
          }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', insetInlineEnd: 0,
            background: 'var(--white)', borderRadius: 12, padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 220, zIndex: 11,
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <button onClick={exportPatients} disabled={isPending} style={menuBtnStyle}>
              👤 قائمة المرضى
            </button>
            <button onClick={exportSpecialists} disabled={isPending} style={menuBtnStyle}>
              👨‍⚕️ قائمة الاختصاصيين
            </button>
            <button onClick={exportOrders} disabled={isPending} style={menuBtnStyle}>
              📋 طلبات الفترة المحددة
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const menuBtnStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'transparent', border: 0,
  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  textAlign: 'right', color: 'var(--ink)',
};
