/**
 * ════════════════════════════════════════════════════════════════════
 * 📋 ServiceDetailHeader - V26.3
 * ════════════════════════════════════════════════════════════════════
 * 
 * Header موحّد للصفحات: زر العودة + العنوان + Actions يمين
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';

interface Props {
  backHref: string;
  title: string;
  rightAction?: React.ReactNode;
}

export default function ServiceDetailHeader({
  backHref,
  title,
  rightAction,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E8EAED',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Link
        href={backHref}
        aria-label="العودة"
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: '#F1F3F4',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#202124',
          textDecoration: 'none',
        }}
      >
        <IconArrowLeft size={20} stroke={2.2} style={{ transform: 'scaleX(-1)' }} />
      </Link>
      
      <h1
        style={{
          fontSize: 15,
          fontWeight: 800,
          margin: 0,
          color: '#202124',
          textAlign: 'center',
          flex: 1,
          padding: '0 8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </h1>
      
      {rightAction ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {rightAction}
        </div>
      ) : (
        <div style={{ width: 38 }} />
      )}
    </div>
  );
}
