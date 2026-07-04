import { Skeleton } from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <Skeleton className="w-48 h-6 mb-2" />
        <Skeleton className="w-64 h-3" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 20,
      }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rect" className="h-24 rounded-xl" />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Skeleton variant="rect" className="flex-1 h-11 rounded-xl" />
        <Skeleton variant="rect" className="w-32 h-11 rounded-xl" />
      </div>

      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderBottom: i < 6 ? '1px solid var(--line)' : 'none',
          }}>
            <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-40 h-3 mb-1" />
              <Skeleton className="w-24 h-2" />
            </div>
            <Skeleton className="w-16 h-4" />
            <Skeleton variant="rect" className="w-20 h-7 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
