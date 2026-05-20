import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

export default function AccountLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Profile header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 20,
          padding: 16,
          background: 'var(--white)',
          borderRadius: 14,
          border: '1px solid var(--line)',
        }}>
          <SkeletonAvatar size={64} />
          <div style={{ flex: 1 }}>
            <Skeleton className="w-40 h-4 mb-2" />
            <Skeleton className="w-32 h-3 mb-1" />
            <Skeleton className="w-24 h-2.5" />
          </div>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
        </div>

        {/* Tier card */}
        <Skeleton variant="rect" className="w-full h-20 rounded-xl mb-4" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" className="h-16 rounded-xl" />
          ))}
        </div>

        {/* Menu sections */}
        {[1, 2, 3].map((section) => (
          <div key={section} style={{ marginBottom: 20 }}>
            <Skeleton className="w-24 h-3 mb-2" />
            <div style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    borderBottom: i < 4 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
                  <Skeleton className="flex-1 h-3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
