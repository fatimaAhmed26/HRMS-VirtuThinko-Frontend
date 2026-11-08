import clsx from 'clsx';
import { humanize } from '../../lib/format';

const colors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  approved: 'bg-green-50 text-green-700 ring-green-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  processed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_manager: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_hr: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  under_review: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  draft: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  terminated: 'bg-red-50 text-red-700 ring-red-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  expired: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', colors[key] ?? colors.draft)}>
      {humanize(key)}
    </span>
  );
}
