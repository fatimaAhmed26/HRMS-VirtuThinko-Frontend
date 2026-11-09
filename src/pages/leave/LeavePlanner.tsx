import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as leaveApi from '../../api/leave';
import { DateRangeSection, type Range } from '../../components/leave/DateRangeSection';
import { PolicyCheck, type Check } from '../../components/leave/PolicyCheck';
import { useLeaveSetup } from '../../components/leave/useLeaveSetup';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import { addDays, countDays, daysBetween, dateKey, todayKey } from '../../lib/leave';

const RESERVABLE = ['ANNUAL', 'HAJJ'];
const REMINDER_DAYS = 20;

// Leave planner (design screen 36): reserve Annual or Hajj dates ahead of time
export default function LeavePlanner() {
  const qc = useQueryClient();
  const { balances, types, holidays, holidaySet, isLoading, error } = useLeaveSetup();
  const options = types.filter((t) => RESERVABLE.includes(t.code) && balances.some((b) => b.leaveTypeId === t.id));
  const [typeId, setTypeId] = useState<number | null>(null);
  const type = options.find((t) => t.id === typeId) ?? options[0];
  const balance = balances.find((b) => b.leaveTypeId === type?.id);
  const [range, setRange] = useState<Range>({ start: null, end: null });
  const tomorrow = addDays(todayKey(), 1);

  const { data: mine = [] } = useQuery({ queryKey: ['leave', 'reservations', 'me'], queryFn: leaveApi.myReservations });
  const refresh = () => qc.invalidateQueries({ queryKey: ['leave'] });
  const reserve = useMutation({
    mutationFn: () => leaveApi.reserve({ leaveTypeId: type!.id, startDate: range.start!, endDate: range.end! }),
    onSuccess: () => { setRange({ start: null, end: null }); refresh(); },
  });
  const remove = useMutation({ mutationFn: leaveApi.cancelReservation, onSuccess: refresh });

  const days = type && range.start && range.end ? countDays(range.start, range.end, type.countWorkingDays, holidaySet) : 0;
  const checks: Check[] = [];
  if (type && range.start && range.end) {
    checks.push({ ok: days > 0 ? 'ok' : 'bad', text: `${days} ${type.countWorkingDays ? 'working' : 'calendar'} days` });
    if (balance?.remaining !== undefined) {
      checks.push(days <= balance.remaining ? { ok: 'ok', text: `${balance.remaining} days available this year` } : { ok: 'warn', text: `Only ${balance.remaining} days available this year` });
    }
    const reminder = addDays(range.start, -REMINDER_DAYS);
    checks.push({ ok: 'ok', text: reminder > todayKey() ? `You'll be reminded on ${fmtDate(reminder)} to submit the request` : 'This starts within 20 days: submit the real request soon' });
  }

  return (
    <>
      <PageHeader title="Leave planner" subtitle={`Reserve Annual or Hajj leave dates. ${REMINDER_DAYS} days before the start date you're reminded to submit the request.`} />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />

      {type && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <label className="label" htmlFor="resType">Reservation type</label>
            <select id="resType" className="input" value={type.id} onChange={(e) => setTypeId(Number(e.target.value))}>
              {options.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">A reservation is not a leave request. Your manager approves only the real request.</p>
          </div>

          <DateRangeSection value={range} onChange={setRange} holidays={holidays} minDate={tomorrow} />
          <PolicyCheck checks={checks} empty="Pick your dates on the calendar." />
          <ErrorMessage error={reserve.error} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setRange({ start: null, end: null })}>Reset</Button>
            <Button className="flex-1" disabled={!range.end || days === 0} loading={reserve.isPending} onClick={() => reserve.mutate()}>Reserve dates</Button>
          </div>
        </div>
      )}

      <Card title="My reserved dates" className="mt-6">
        {mine.length === 0 ? <EmptyState title="No reservations" /> : (
          <ul className="divide-y divide-slate-100">
            {mine.map((r) => {
              const start = dateKey(r.startDate), end = dateKey(r.endDate);
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{r.leaveType.name}: {fmtDate(start)} – {fmtDate(end)}</p>
                    <p className="text-xs text-slate-500">Starts in {daysBetween(todayKey(), start)} days{r.remindedAt ? ' · reminder sent' : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/leave/request?type=${r.leaveType.code}&start=${start}&end=${end}`}><Button variant="secondary" className="px-3 py-1">Submit request</Button></Link>
                    <Button variant="ghost" className="px-2 py-1" onClick={() => remove.mutate(r.id)} aria-label="Remove reservation"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
