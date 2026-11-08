import type { ReactNode } from 'react';
import { Inbox, TriangleAlert } from 'lucide-react';
import { errorMessage } from '../../lib/api';

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{typeof error === 'string' ? error : errorMessage(error)}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-500">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="font-medium text-slate-600">{title}</p>
      {children && <div className="text-sm">{children}</div>}
    </div>
  );
}
