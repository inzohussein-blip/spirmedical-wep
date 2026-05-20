import { Skeleton } from '@/components/ui/Skeleton';

export default function MedicalRecordLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-48 h-3 mb-4" />

        {/* Sections */}
        {[
          { title: 'البيانات الأساسية', items: 5 },
          { title: 'الحساسيات', items: 3 },
          { title: 'الأمراض المزمنة', items: 2 },
          { title: 'الأدوية الحالية', items: 4 },
        ].map((section, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Skeleton className="w-28 h-4" />
              <Skeleton variant="rect" className="w-6 h-6 rounded-md" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: section.items }).map((_, i) => (
                <Skeleton key={i} className="w-full h-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
