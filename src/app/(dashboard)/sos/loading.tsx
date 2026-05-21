import { Skeleton } from '@/components/ui/Skeleton';

export default function SOSLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-24 h-5" />
        </div>

        {/* Warning banner */}
        <Skeleton variant="rect" className="w-full h-20 rounded-xl mb-4" />

        {/* GPS card (big) */}
        <Skeleton variant="rect" className="w-full h-40 rounded-2xl mb-4" />

        {/* Emergency numbers title */}
        <Skeleton className="w-32 h-3 mb-2" />

        {/* Emergency numbers grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" className="h-20 rounded-xl" />
          ))}
        </div>

        {/* Tips */}
        <Skeleton variant="rect" className="w-full h-32 rounded-xl" />
      </div>
    </main>
  );
}
