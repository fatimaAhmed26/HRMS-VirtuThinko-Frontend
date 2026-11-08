export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} aria-label="Loading" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center text-brand-600">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
      <Spinner className="h-4 w-4" /> {text}
    </div>
  );
}
