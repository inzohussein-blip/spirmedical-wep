import { SkeletonChatList, Skeleton } from '@/components/ui/Skeleton';

export default function ConsultationsLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-40 h-5" />
        </div>
        <Skeleton className="w-60 h-3 mb-4" />

        <SkeletonChatList count={4} />
      </div>
    </main>
  );
}
