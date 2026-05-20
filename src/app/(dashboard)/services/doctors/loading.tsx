import { SkeletonDoctorCard, Skeleton } from '@/components/ui/Skeleton';

export default function DoctorsLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-40 h-5" />
        </div>

        {/* Subtitle */}
        <Skeleton className="w-60 h-3 mb-4" />

        {/* Search */}
        <Skeleton variant="rect" className="w-full h-11 rounded-xl mb-3" />

        {/* Specialty filters */}
        <div className="flex gap-2 mb-4 overflow-hidden">
          {[60, 80, 70, 90, 75].map((w, i) => (
            <Skeleton
              key={i}
              variant="rect"
              className={`h-8 rounded-full flex-shrink-0`}
              style={{ width: w }}
            />
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonDoctorCard key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
