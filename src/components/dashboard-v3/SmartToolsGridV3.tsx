/**
 * ════════════════════════════════════════════════════════════════════
 * 🛠️ SmartToolsGridV3 - V26.2
 * ════════════════════════════════════════════════════════════════════
 * قسم منفصل للأدوات الذكية (مفصول عن الخدمات الرئيسية)
 * ════════════════════════════════════════════════════════════════════
 */

import Link from 'next/link';
import { IconArrowLeft, IconSparkles } from '@tabler/icons-react';
import { SMART_TOOLS, type ServiceConfig } from '@/lib/services-v3';

export default function SmartToolsGridV3() {
  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <h2 style={{ 
          fontSize: 13, fontWeight: 700, color: '#3C4043', margin: 0,
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <IconSparkles size={14} stroke={2.2} color="#FBBC04" />
          أدوات الصحة الذكية
        </h2>
        <span style={{ fontSize: 11, color: '#5F6368' }}>
          {SMART_TOOLS.length} أداة
        </span>
      </div>
      
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {SMART_TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: ServiceConfig }) {
  const Icon = tool.icon;
  
  return (
    <Link 
      href={tool.route}
      style={{
        background: '#FFFFFF',
        border: '0.5px solid #DADCE0',
        borderRadius: 14,
        padding: 14,
        position: 'relative',
        overflow: 'hidden',
        minHeight: 110,
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
      }}
    >
      <div aria-hidden style={{
        position: 'absolute', width: 70, height: 70, borderRadius: '50%',
        background: tool.softBg, opacity: 0.7, top: -12, left: -12,
      }} />
      
      <div style={{ marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <Icon size={26} stroke={1.75} color={tool.color} />
      </div>
      
      <div style={{
        fontSize: 12, fontWeight: 600, color: '#202124',
        marginBottom: 3, position: 'relative', zIndex: 1,
        lineHeight: 1.3,
      }}>
        {tool.title}
      </div>
      
      <div style={{
        fontSize: 10, color: '#5F6368', lineHeight: 1.4,
        position: 'relative', zIndex: 1,
      }}>
        {tool.description}
      </div>
      
      <div style={{
        position: 'absolute', bottom: 10, left: 10, color: '#80868B',
      }}>
        <IconArrowLeft size={14} stroke={2} />
      </div>
    </Link>
  );
}
