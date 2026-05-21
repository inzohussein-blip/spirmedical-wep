import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

export default function ChatLoading() {
  return (
    <main className="app-screen">
      <div className="scr-content">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: '1px solid var(--line)',
        }}>
          <Skeleton variant="rect" className="w-8 h-8 rounded-md" />
          <SkeletonAvatar size={40} />
          <div style={{ flex: 1 }}>
            <Skeleton className="w-32 h-3 mb-1" />
            <Skeleton className="w-16 h-2" />
          </div>
        </div>

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { side: 'right', w: '55%' },
            { side: 'left', w: '70%' },
            { side: 'left', w: '40%' },
            { side: 'right', w: '60%' },
            { side: 'right', w: '35%' },
            { side: 'left', w: '50%' },
          ].map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.side === 'right' ? 'flex-end' : 'flex-start',
              }}
            >
              <Skeleton
                variant="rect"
                className="rounded-2xl"
                style={{ width: msg.w, height: 38 }}
              />
            </div>
          ))}
        </div>

        {/* Input */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <Skeleton variant="rect" className="w-full h-11 rounded-full" />
        </div>
      </div>
    </main>
  );
}
