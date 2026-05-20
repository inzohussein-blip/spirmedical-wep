import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

export default function DoctorDetailLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>

        {/* Doctor card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <SkeletonAvatar size={80} />
          </div>
          <Skeleton className="w-40 h-5 mb-2 mx-auto" />
          <Skeleton className="w-32 h-3 mb-3 mx-auto" />

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            <Skeleton variant="rect" className="w-16 h-6 rounded-full" />
            <Skeleton variant="rect" className="w-20 h-6 rounded-full" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" className="h-14 rounded-md" />
            ))}
          </div>
        </div>

        {/* Subscription plans */}
        <Skeleton className="w-32 h-4 mb-3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rect" className="w-full h-24 rounded-xl mb-2" />
        ))}

        {/* Action button */}
        <Skeleton variant="rect" className="w-full h-12 rounded-xl mt-4" />
      </div>
    </main>
  );
}
