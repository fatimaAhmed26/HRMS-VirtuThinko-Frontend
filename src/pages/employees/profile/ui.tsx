// Small building blocks shared by the employee profile tabs
import clsx from 'clsx';
import type { ReactNode } from 'react';

// White card with a title and an optional action on the right
export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// One label / value pair; empty values show a dash
export function Item({ label, value, dir, className }: { label: string; value: ReactNode; dir?: 'rtl'; className?: string }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div className={className}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={clsx('mt-0.5 text-sm', empty ? 'text-slate-400' : 'text-slate-900')} dir={dir}>{empty ? '-' : value}</dd>
    </div>
  );
}

export function Grid({ children, cols = 5 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  return (
    <dl className={clsx('grid gap-x-6 gap-y-4 sm:grid-cols-2', cols === 3 ? 'lg:grid-cols-3' : cols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5')}>
      {children}
    </dl>
  );
}
