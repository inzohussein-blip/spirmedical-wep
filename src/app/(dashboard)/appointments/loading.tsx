import { SkeletonAppointmentsList } from '@/components/skeletons/Skeleton';
import Link from 'next/link';

export default function Loading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div className="scr-page-header">
          <Link href="/dashboard" className="scr-back-btn" aria-label="العودة">
            <span aria-hidden="true">→</span>
          </Link>
          <h1 className="scr-page-title">مواعيدي</h1>
          <div className="scr-page-spacer" />
        </div>
        <SkeletonAppointmentsList />
      </div>
    </main>
  );
}
