import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import * as leaveApi from '../../api/leave';
import { useAuth } from '../../auth/useAuth';
import { fmtDate } from '../../lib/format';
import { gridRange, inRange, todayKey, typeColor } from '../../lib/leave';
import { LegendItem, MonthCalendar } from './MonthCalendar';

export interface Range {
  start: string | null;
  end: string | null;
}

// Start/end inputs plus a clickable month: first click = start, second click = end (end is included).
// Colleagues' approved leave and reserved dates are shown so overlaps are easy to spot.
export function DateRangeSection({ value, onChange, holidays, minDate }: {
  value: Range;
  onChange: (r: Range) => void;
  holidays: Map<string, string>;
  minDate?: string; // e.g. tomorrow for the planner
}) {
  const { user } = useAuth();
  const [month, setMonth] = useState((value.start ?? todayKey()).slice(0, 7));
  const { start, end } = gridRange(month);
  const { data } = useQuery({ queryKey: ['leave', 'calendar', start, end], queryFn: () => leaveApi.calendar(start, end) });
  const others = [...(data?.leave ?? []), ...(data?.reservations ?? []).map((r) => ({ ...r, reserved: true }))].filter((e) => e.employeeId !== user?.employeeId);

  function click(k: string) {
    if (!value.start || value.end || k < value.start) onChange({ start: k, end: null });
    else onChange({ start: value.start, end: k });
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="startDate">Start date</label>
          <input id="startDate" type="date" className="input" min={minDate} value={value.start ?? ''}
            onChange={(e) => { const s = e.target.value || null; onChange({ start: s, end: value.end && s && value.end >= s ? value.end : null }); if (s) setMonth(s.slice(0, 7)); }} />
        </div>
        <div>
          <label className="label" htmlFor="endDate">End date</label>
          <input id="endDate" type="date" className="input" disabled={!value.start} min={value.start ?? undefined} value={value.end ?? ''}
            placeholder="Select a start date first" onChange={(e) => onChange({ start: value.start, end: e.target.value || null })} />
        </div>
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        {value.start && value.end ? `${fmtDate(value.start)} to ${fmtDate(value.end)} selected. Click a date to start again.`
          : value.start ? 'Now click the end date. The end date is included.' : 'Click a start date, then click an end date. The end date is included.'}
      </p>
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        holidays={holidays}
        selected={value}
        onDayClick={click}
        disabled={minDate ? (k) => k < minDate : undefined}
        renderDay={(k) => (
          <div className="space-y-0.5">
            {others.filter((e) => inRange(k, e.startDate, e.endDate)).slice(0, 3).map((e) => (
              <p key={`${'reserved' in e ? 'r' : 'l'}${e.id}`} title={`${e.name} - ${e.typeName}${'reserved' in e ? ' (reserved)' : ''}`}
                className={clsx('truncate rounded border px-1 text-[11px]', 'reserved' in e ? 'border-dashed border-purple-300 bg-white text-purple-700' : typeColor(e.type))}>
                {e.name.split(' ')[0]}
              </p>
            ))}
          </div>
        )}
        legend={<>
          <LegendItem className="border-brand-500 bg-brand-50" label="Your selection" />
          <LegendItem className="border-dashed border-purple-300 bg-white" label="Reserved by colleague" />
          <LegendItem className="border-blue-200 bg-blue-100" label="Colleague on leave" />
          <LegendItem className="border-red-200 bg-red-50" label="Public holiday" />
          <LegendItem className="border-slate-200 bg-slate-50" label="Weekend" />
        </>}
      />
    </div>
  );
}
