import { Skeleton } from '@/components/ui/Skeleton';

export default function AppointmentDetailLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-40 h-5" />
        </div>

        {/* Status banner */}
        <Skeleton variant="rect" className="w-full h-16 rounded-xl mb-4" />

        {/* Stepper / Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <Skeleton variant="circle" className="w-10 h-10 mx-auto mb-2" />
              <Skeleton className="w-16 h-2 mx-auto" />
            </div>
          ))}
        </div>

        {/* Main info card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
        }}>
          <Skeleton className="w-2/3 h-5 mb-3" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="w-20 h-2 mb-1" />
                  <Skeleton className="w-32 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tests / Services */}
        <Skeleton className="w-24 h-3 mb-2" />
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 12,
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: i > 1 ? 10 : 0,
              paddingBottom: 10,
              borderBottom: i < 3 ? '1px solid var(--line)' : 'none',
            }}>
              <Skeleton className="w-40 h-3" />
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>

        {/* Total */}
        <Skeleton variant="rect" className="w-full h-14 rounded-xl mb-4" />

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton variant="rect" className="flex-1 h-12 rounded-xl" />
          <Skeleton variant="rect" className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
