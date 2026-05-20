import { SkeletonChatList, Skeleton } from '@/components/ui/Skeleton';

export default function SpecialistChatsLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-48 h-3 mb-4" />

        {/* Quick replies banner */}
        <Skeleton variant="rect" className="w-full h-16 rounded-xl mb-4" />

        <SkeletonChatList count={5} />
      </div>
    </main>
  );
}
