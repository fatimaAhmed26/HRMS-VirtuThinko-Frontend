import clsx from 'clsx';
import { useState } from 'react';

// The company logo lives in public/logo.png (the file VirtuThinko gave you).
// Until that file exists, the company name is shown as text instead.
export function Logo({ className }: { className?: string }) {
  const [missing, setMissing] = useState(false);
  if (missing) return <span className={clsx('font-semibold text-brand-700', className)}>VirtuThinko</span>;
  return <img src="/logo.png" alt="VirtuThinko" className={clsx('object-contain', className)} onError={() => setMissing(true)} />;
}
