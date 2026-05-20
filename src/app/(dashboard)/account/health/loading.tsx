import { Skeleton } from '@/components/ui/Skeleton';

export default function HealthLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-56 h-3 mb-4" />

        {/* Vitals grid - 7 cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Skeleton variant="circle" className="w-7 h-7" />
                <Skeleton className="w-16 h-2.5" />
              </div>
              <Skeleton className="w-20 h-6 mb-1" />
              <Skeleton className="w-12 h-2" />
            </div>
          ))}
        </div>

        {/* Add button */}
        <Skeleton variant="rect" className="w-full h-12 rounded-xl mb-4" />

        {/* Recent entries */}
        <Skeleton className="w-32 h-3 mb-2" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Skeleton variant="circle" className="w-8 h-8" />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-24 h-3 mb-1" />
              <Skeleton className="w-16 h-2" />
            </div>
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>
    </main>
  );
}
