import { Skeleton } from '@/components/ui/Skeleton';

export default function AppointmentsNewLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-56 h-3 mb-4" />

        {/* Service selector */}
        <Skeleton className="w-20 h-3 mb-2" />
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rect" className="h-24 rounded-xl" />
          ))}
        </div>

        {/* Form fields */}
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <Skeleton className="w-20 h-3 mb-1" />
            <Skeleton variant="rect" className="w-full h-11 rounded-xl" />
          </div>
        ))}

        {/* Date/time */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <Skeleton className="w-12 h-3 mb-1" />
            <Skeleton variant="rect" className="h-11 rounded-xl" />
          </div>
          <div>
            <Skeleton className="w-12 h-3 mb-1" />
            <Skeleton variant="rect" className="h-11 rounded-xl" />
          </div>
        </div>

        {/* Submit */}
        <Skeleton variant="rect" className="w-full h-12 rounded-xl" />
      </div>
    </main>
  );
}
