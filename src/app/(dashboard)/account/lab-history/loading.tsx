import { Skeleton } from '@/components/ui/Skeleton';

export default function LabHistoryLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-56 h-3 mb-4" />

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[60, 80, 70, 90].map((w, i) => (
            <Skeleton
              key={i}
              variant="rect"
              className="h-8 rounded-full flex-shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Lab cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <article
              key={i}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Skeleton className="w-32 h-4" />
                <Skeleton variant="rect" className="w-16 h-5 rounded" />
              </div>
              <Skeleton className="w-48 h-3 mb-2" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} variant="rect" className="h-10 rounded-md" />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
