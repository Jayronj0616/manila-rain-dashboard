export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-accent" />
        <p className="text-sm font-medium text-white">Thinking…</p>
      </div>
    </div>
  );
}
