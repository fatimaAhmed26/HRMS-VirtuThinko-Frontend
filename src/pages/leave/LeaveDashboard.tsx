import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as leaveApi from '../../api/leave';
import { useAuth } from '../../auth/useAuth';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate } from '../../lib/format';
import { addDays, dateKey, todayKey, typeColor } from '../../lib/leave';
import { P } from '../../lib/permissions';
import type { LeaveBalance } from '../../types';

// Leave dashboard (design screen 30): balances, special entitlements, upcoming leave, who is off
export default function LeaveDashboard() {
  const { can, user } = useAuth();
  const today = todayKey();
  const weekEnd = addDays(today, 6);
  const { data, isLoading, error } = useQuery({ queryKey: ['leave', 'balances', 'me'], queryFn: leaveApi.myBalances });
  const { data: requests = [] } = useQuery({ queryKey: ['leave', 'requests', 'me'], queryFn: leaveApi.myRequests });
  const { data: team } = useQuery({ queryKey: ['leave', 'calendar', today, weekEnd], queryFn: () => leaveApi.calendar(today, weekEnd) });

  const yearly = data?.balances.filter((b) => b.allowance === 'yearly') ?? [];
  const special = data?.balances.filter((b) => b.allowance === 'per_event') ?? [];
  const upcoming = requests.filter((r) => dateKey(r.endDate) >= today && ['pending_manager', 'pending_hr', 'approved'].includes(r.status));
  const offThisWeek = (team?.leave ?? []).filter((l) => l.employeeId !== user?.employeeId);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leave</h1>
          <p className="mt-1 text-sm text-slate-500">{dayjs().format('dddd, D MMMM YYYY')}</p>
        </div>
        {can(P.leaveRequest) && (
          <Link to="/leave/request" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Request leave
          </Link>
        )}
      </div>
      {isLoading && <Loading />}
      <ErrorMessage error={error} />

      {data && (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Leave balances {data.year}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{yearly.map((b) => <BalanceCard key={b.leaveTypeId} b={b} />)}</div>
          </section>

          {special.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Special leave entitlements</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {special.map((b) => (
                  <div key={b.leaveTypeId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-slate-500">{b.name}</p>
                    <p className="mt-1 text-xl font-semibold">{b.daysPerEvent}d <span className="text-sm font-normal text-slate-400">per event</span></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="My upcoming leave" action={<Link to="/leave/data" className="text-sm text-brand-600 hover:underline">History</Link>}>
              {upcoming.length === 0 ? <EmptyState title="No upcoming leave" /> : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {upcoming.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2.5">
                      <span><span className="font-medium">{r.leaveType.name}</span> <span className="text-slate-500">· {fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.days}d</span></span>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Who's off this week" action={<Link to="/leave/calendar" className="text-sm text-brand-600 hover:underline">Calendar</Link>}>
              {offThisWeek.length === 0 ? <EmptyState title="Everyone is in this week" /> : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {offThisWeek.map((l) => (
                    <li key={l.id} className="flex items-center justify-between py-2.5">
                      <span><span className="font-medium">{l.name}</span> <span className="text-slate-500">· {fmtDate(l.startDate)} – {fmtDate(l.endDate)}</span></span>
                      <span className={`rounded border px-2 py-0.5 text-xs ${typeColor(l.type)}`}>{l.typeName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function BalanceCard({ b }: { b: LeaveBalance }) {
  const pct = b.entitlement ? Math.max(0, Math.min(100, ((b.remaining ?? 0) / b.entitlement) * 100)) : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{b.name}</p>
      <p className="mt-1 text-2xl font-semibold">{b.remaining} <span className="text-sm font-normal text-slate-400">/ {b.entitlement} days</span></p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 text-xs text-slate-500">{b.used} used{b.pending ? ` · ${b.pending} pending` : ''}</p>
    </div>
  );
}
