import { Skeleton } from '@/components/ui/Skeleton';

export default function ConsultationLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-48 h-3 mb-4" />

        {/* Info banner */}
        <Skeleton variant="rect" className="w-full h-20 rounded-xl mb-4" />

        {/* Doctors list title */}
        <Skeleton className="w-36 h-4 mb-3" />

        {/* Doctor cards */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              display: 'flex',
              gap: 12,
            }}
          >
            <Skeleton variant="circle" className="w-14 h-14" />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-32 h-3 mb-1" />
              <Skeleton className="w-24 h-2 mb-2" />
              <div className="flex gap-1">
                <Skeleton variant="rect" className="w-12 h-5 rounded-full" />
                <Skeleton variant="rect" className="w-16 h-5 rounded-full" />
              </div>
            </div>
            <Skeleton variant="rect" className="w-20 h-8 rounded-md self-center" />
          </div>
        ))}
      </div>
    </main>
  );
}
