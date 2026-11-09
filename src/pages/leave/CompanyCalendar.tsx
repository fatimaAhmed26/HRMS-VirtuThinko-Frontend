import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import * as leaveApi from '../../api/leave';
import { LegendItem, MonthCalendar } from '../../components/leave/MonthCalendar';
import { useLeaveSetup } from '../../components/leave/useLeaveSetup';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { gridRange, inRange, todayKey, typeColor } from '../../lib/leave';

// Company calendar (design screen 33): who is on leave, plus public holidays
export default function CompanyCalendar() {
  const [month, setMonth] = useState(todayKey().slice(0, 7));
  const { start, end } = gridRange(month);
  const { holidays } = useLeaveSetup();
  const { data, error } = useQuery({ queryKey: ['leave', 'calendar', start, end], queryFn: () => leaveApi.calendar(start, end) });
  const legend = useMemo(() => {
    const seen = new Map<string, string>();
    (data?.leave ?? []).forEach((l) => seen.set(l.type, l.typeName));
    return [...seen];
  }, [data]);

  return (
    <>
      <PageHeader title="Company calendar" subtitle="Approved leave, reserved dates and public holidays" />
      <ErrorMessage error={error} />
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        holidays={holidays}
        renderDay={(k) => {
          const entries = [
            ...(data?.leave ?? []).filter((l) => inRange(k, l.startDate, l.endDate)).map((l) => ({ ...l, reserved: false })),
            ...(data?.reservations ?? []).filter((r) => inRange(k, r.startDate, r.endDate)).map((r) => ({ ...r, reserved: true })),
          ];
          return (
            <div className="space-y-0.5">
              {entries.slice(0, 4).map((e) => (
                <p key={`${e.reserved ? 'r' : 'l'}${e.id}`} title={`${e.name}${e.department ? ` (${e.department})` : ''} - ${e.typeName}${e.reserved ? ' (reserved)' : ''}`}
                  className={clsx('truncate rounded border px-1 text-[11px]', e.reserved ? 'border-dashed border-purple-300 bg-white text-purple-700' : typeColor(e.type))}>
                  {e.name}
                </p>
              ))}
              {entries.length > 4 && <p className="text-[11px] text-slate-500">+{entries.length - 4} more</p>}
            </div>
          );
        }}
        legend={<>
          {legend.map(([code, name]) => <LegendItem key={code} className={typeColor(code)} label={name} />)}
          <LegendItem className="border-dashed border-purple-300 bg-white" label="Reserved" />
          <LegendItem className="border-red-200 bg-red-50" label="Public holiday" />
        </>}
      />
    </>
  );
}
