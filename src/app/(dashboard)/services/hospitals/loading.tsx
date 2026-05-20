import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton';

export default function HospitalsLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-40 h-5" />
        </div>
        <Skeleton className="w-60 h-3 mb-4" />

        {/* Tab pills */}
        <div className="flex gap-2 mb-3">
          {[80, 90, 70].map((w, i) => (
            <Skeleton
              key={i}
              variant="rect"
              className="h-8 rounded-full"
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Search */}
        <Skeleton variant="rect" className="w-full h-11 rounded-xl mb-4" />

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
