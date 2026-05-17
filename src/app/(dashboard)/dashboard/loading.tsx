import { SkeletonDashboard } from '@/components/skeletons/Skeleton';

export default function Loading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <SkeletonDashboard />
      </div>
    </main>
  );
}
