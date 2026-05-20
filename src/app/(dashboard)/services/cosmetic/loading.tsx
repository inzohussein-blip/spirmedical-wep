import { SkeletonProductGrid, Skeleton } from '@/components/ui/Skeleton';

export default function CosmeticLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-40 h-5" />
        </div>
        <Skeleton className="w-60 h-3 mb-4" />

        <Skeleton variant="rect" className="w-full h-11 rounded-xl mb-3" />

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

        <SkeletonProductGrid count={6} />
      </div>
    </main>
  );
}
