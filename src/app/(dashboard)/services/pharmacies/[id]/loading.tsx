import { Skeleton } from '@/components/ui/Skeleton';

export default function PharmacyDetailLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-48 h-5" />
        </div>

        {/* Hero card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <Skeleton variant="rect" className="w-16 h-16 rounded-xl" />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-40 h-4 mb-2" />
              <Skeleton className="w-32 h-3 mb-1" />
              <Skeleton className="w-24 h-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" className="h-12 rounded-md" />
            ))}
          </div>
        </div>

        {/* Search */}
        <Skeleton variant="rect" className="w-full h-11 rounded-xl mb-3" />

        {/* Pills */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[60, 80, 70, 75].map((w, i) => (
            <Skeleton
              key={i}
              variant="rect"
              className="h-8 rounded-full flex-shrink-0"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Medication list */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <Skeleton className="w-32 h-3 mb-1" />
              <Skeleton className="w-20 h-2" />
            </div>
            <Skeleton className="w-12 h-4" />
          </div>
        ))}
      </div>
    </main>
  );
}
