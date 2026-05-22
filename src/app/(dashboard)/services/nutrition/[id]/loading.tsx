import { Skeleton } from '@/components/ui/Skeleton';

export default function DetailLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Skeleton variant="circle" className="w-9 h-9" />
          <Skeleton className="w-32 h-4" />
          <div className="scr-page-spacer" />
        </div>

        {/* Hero card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
            <Skeleton variant="rect" className="w-18 h-18 rounded-xl flex-shrink-0" style={{ width: 72, height: 72 }} />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-40 h-5 mb-2" />
              <Skeleton className="w-56 h-3 mb-1" />
              <Skeleton className="w-32 h-3" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-20 h-3" />
            ))}
          </div>
        </div>

        {/* Sections */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <Skeleton className="w-32 h-4 mb-3" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6,
            }}>
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} variant="rect" className="h-10 rounded-lg" />
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <Skeleton variant="rect" className="w-full h-14 rounded-2xl" style={{ marginTop: 20 }} />
      </div>
    </main>
  );
}
