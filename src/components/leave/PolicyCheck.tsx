import clsx from 'clsx';
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react';

export interface Check {
  ok: 'ok' | 'warn' | 'bad';
  text: string;
}

// The live rule check under the date picker ("Policy check" in the design)
export function PolicyCheck({ checks, empty }: { checks: Check[]; empty: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-2 text-sm font-semibold">Policy check</h3>
      {checks.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : (
        <ul className="space-y-1.5 text-sm">
          {checks.map((c) => {
            const Icon = c.ok === 'ok' ? CircleCheck : c.ok === 'warn' ? CircleAlert : CircleX;
            return (
              <li key={c.text} className={clsx('flex items-start gap-2', c.ok === 'ok' ? 'text-green-700' : c.ok === 'warn' ? 'text-amber-700' : 'text-red-700')}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" /> {c.text}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
