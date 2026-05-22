import { Skeleton } from '@/components/ui/Skeleton';

export default function AuthLoading() {
  return (
    <main className="auth-screen">
      <div className="auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <Skeleton variant="circle" className="w-16 h-16" />
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-24 h-3" />
      </div>

      <div style={{ marginTop: 30 }}>
        <Skeleton className="w-48 h-5 mb-2" style={{ margin: '0 auto 8px' }} />
        <Skeleton className="w-64 h-3" style={{ margin: '0 auto 24px' }} />

        <Skeleton variant="rect" className="w-full h-12 rounded-xl mb-3" />
        <Skeleton variant="rect" className="w-full h-12 rounded-xl mb-3" />
        <Skeleton variant="rect" className="w-full h-14 rounded-2xl mt-4" />
      </div>
    </main>
  );
}
