export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-paper-2" />
        <div className="h-4 w-64 animate-pulse rounded bg-paper-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-paper-2" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-paper-2" />
    </div>
  );
}
