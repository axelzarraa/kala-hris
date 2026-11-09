export default function Loading() {
  return (
    <div className="max-w-3xl animate-pulse" role="status" aria-live="polite">
      <div className="h-7 w-48 rounded-lg bg-slate-200" />
      <div className="mt-6 h-32 rounded-xl bg-slate-200" />
      <div className="mt-4 h-32 rounded-xl bg-slate-200" />
      <span className="sr-only">Memuat...</span>
    </div>
  );
}