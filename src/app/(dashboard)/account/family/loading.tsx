import { Skeleton } from '@/components/ui/Skeleton';

export default function FamilyLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-56 h-3 mb-4" />

        {/* Info banner */}
        <Skeleton variant="rect" className="w-full h-16 rounded-xl mb-4" />

        {/* Add button */}
        <Skeleton variant="rect" className="w-full h-12 rounded-xl mb-4" />

        {/* Members list */}
        <Skeleton className="w-32 h-3 mb-2" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Skeleton variant="circle" className="w-12 h-12" />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-28 h-3 mb-1" />
              <Skeleton className="w-20 h-2" />
            </div>
            <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          </div>
        ))}
      </div>
    </main>
  );
}
