import { Skeleton } from '@/components/ui/Skeleton';

export default function HelpLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-48 h-3 mb-4" />

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} variant="rect" className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Search */}
        <Skeleton variant="rect" className="w-full h-11 rounded-xl mb-4" />

        {/* FAQ categories */}
        <Skeleton className="w-32 h-4 mb-3" />
        {[1, 2, 3, 4, 5].map((i) => (
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
            <Skeleton variant="rect" className="w-10 h-10 rounded-md" />
            <div style={{ flex: 1 }}>
              <Skeleton className="w-32 h-3 mb-1" />
              <Skeleton className="w-48 h-2" />
            </div>
            <Skeleton variant="rect" className="w-4 h-4" />
          </div>
        ))}

        {/* Contact buttons */}
        <div style={{ marginTop: 16 }}>
          <Skeleton className="w-24 h-3 mb-2" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Skeleton variant="rect" className="flex-1 h-12 rounded-xl" />
            <Skeleton variant="rect" className="flex-1 h-12 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
