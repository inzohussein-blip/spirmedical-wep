/**
 * ════════════════════════════════════════════════════════════════════
 * 🚨 EmergencyCardV3 - V26.2
 * ════════════════════════════════════════════════════════════════════
 * بطاقة الطوارئ الأحمر - بارزة في الأسفل
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconAlertOctagon, IconPhone } from '@tabler/icons-react';
import { EMERGENCY_SERVICE } from '@/lib/services-v3';

export default function EmergencyCardV3() {
  return (
    <div style={{ padding: '0 14px 14px' }}>
      <h2 style={{ 
        fontSize: 13, fontWeight: 700, color: '#3C4043', 
        margin: '0 0 8px',
      }}>
        طوارئ
      </h2>
      
      <Link
        href={EMERGENCY_SERVICE.route}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: 16,
          background: 'linear-gradient(135deg, #8B0000 0%, #6B0000 100%)',
          color: '#FFFFFF',
          borderRadius: 16,
          textDecoration: 'none',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(139, 0, 0, 0.25)',
        }}
      >
        <div aria-hidden style={{
          position: 'absolute', width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', top: -40, left: -40,
        }} />
        
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'rgba(255,255,255,0.2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative',
        }}>
          <IconAlertOctagon size={28} stroke={2} />
        </div>
        
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 2 }}>
            {EMERGENCY_SERVICE.title}
          </div>
          <div style={{ fontSize: 11, opacity: 0.9 }}>
            {EMERGENCY_SERVICE.description}
          </div>
        </div>
        
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative',
        }}>
          <IconPhone size={22} stroke={2.2} />
        </div>
      </Link>
    </div>
  );
}
