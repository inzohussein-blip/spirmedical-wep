import { Skeleton } from '@/components/ui/Skeleton';

export default function HospitalDetailLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-48 h-5" />
        </div>

        {/* Hero image */}
        <Skeleton variant="rect" className="w-full h-44 rounded-xl mb-4" />

        {/* Title block */}
        <Skeleton className="w-3/4 h-5 mb-2" />
        <Skeleton className="w-1/2 h-3 mb-4" />

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" className="h-12 rounded-xl" />
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" className="h-16 rounded-xl" />
          ))}
        </div>

        {/* Info cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            background: 'var(--white)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
          }}>
            <Skeleton className="w-1/3 h-4 mb-2" />
            <Skeleton className="w-full h-3 mb-1" />
            <Skeleton className="w-4/5 h-3" />
          </div>
        ))}
      </div>
    </main>
  );
}
