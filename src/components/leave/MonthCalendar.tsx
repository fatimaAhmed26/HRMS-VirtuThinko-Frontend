import clsx from 'clsx';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { addDays, gridRange, isWeekend, todayKey } from '../../lib/leave';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  month: string; // "2026-11"
  onMonthChange: (month: string) => void;
  renderDay?: (key: string) => ReactNode; // chips inside a day
  selected?: { start: string | null; end: string | null };
  onDayClick?: (key: string) => void;
  holidays?: Map<string, string>; // date -> holiday name
  disabled?: (key: string) => boolean;
  legend?: ReactNode;
}

export function MonthCalendar({ month, onMonthChange, renderDay, selected, onDayClick, holidays, disabled, legend }: Props) {
  const { start, end } = gridRange(month);
  const days: string[] = [];
  for (let k = start; k <= end; k = addDays(k, 1)) days.push(k);
  const today = todayKey();
  const move = (n: number) => onMonthChange(dayjs(`${month}-01`).add(n, 'month').format('YYYY-MM'));
  const sel = (k: string) => !!selected?.start && (k === selected.start || (!!selected.end && k >= selected.start && k <= selected.end));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <button type="button" onClick={() => move(-1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
        <p className="font-semibold">{dayjs(`${month}-01`).format('MMMM YYYY')}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => onMonthChange(today.slice(0, 7))} className="rounded-lg border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50">Today</button>
          <button type="button" onClick={() => move(1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50" aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-medium text-slate-500">
        {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((k) => {
          const outside = !k.startsWith(month);
          const holiday = holidays?.get(k);
          const off = disabled?.(k) ?? false;
          const clickable = !!onDayClick && !outside && !off;
          return (
            <div
              key={k}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onDayClick!(k) : undefined}
              onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onDayClick!(k) : undefined}
              className={clsx(
                'min-h-20 border-b border-r border-slate-100 p-1.5 text-xs',
                outside ? 'bg-slate-50/60 text-slate-300' : isWeekend(k) ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700',
                clickable && 'cursor-pointer hover:bg-brand-50/50',
                off && !outside && 'opacity-50',
                sel(k) && !outside && 'bg-brand-50 ring-2 ring-inset ring-brand-500',
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={clsx('inline-flex h-6 w-6 items-center justify-center rounded-full', k === today && 'bg-brand-600 font-semibold text-white')}>{Number(k.slice(8))}</span>
              </div>
              {!outside && holiday && <p className="mb-0.5 truncate rounded border border-red-200 bg-red-50 px-1 text-[11px] text-red-700" title={holiday}>{holiday}</p>}
              {!outside && renderDay?.(k)}
            </div>
          );
        })}
      </div>
      {legend && <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-600">{legend}</div>}
    </div>
  );
}

export function LegendItem({ className, label }: { className: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={clsx('h-3 w-3 rounded border', className)} />{label}</span>;
}
