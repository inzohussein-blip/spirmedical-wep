export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-soft border-t-emerald" />
        <p className="text-sm text-ink-3">جاري التحميل...</p>
      </div>
    </div>
  );
}
