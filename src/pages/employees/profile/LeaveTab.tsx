// Profile tab "Leave" (design screen 6): balances and leave history from the Leave module
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as leaveApi from '../../../api/leave';
import { useAuth } from '../../../auth/useAuth';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { fmtDate } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { Employee } from '../../../types';
import { Panel } from './ui';

export function LeaveTab({ emp }: { emp: Employee }) {
  const { can } = useAuth();
  const balances = useQuery({ queryKey: ['leave', 'balances', emp.id], queryFn: () => leaveApi.employeeBalances(emp.id) });
  const requests = useQuery({
    queryKey: ['leave', 'requests', { employeeId: emp.id }],
    queryFn: () => leaveApi.listRequests({ employeeId: emp.id, pageSize: 50 }),
    enabled: can(P.leaveManage),
  });
  const yearly = balances.data?.balances.filter((b) => b.allowance === 'yearly') ?? [];

  return (
    <div className="space-y-4">
      <ErrorMessage error={balances.error} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {yearly.map((b) => {
          const left = Math.max(0, b.remaining ?? 0);
          const pct = b.entitlement ? Math.min(100, (left / b.entitlement) * 100) : 0;
          return (
            <div key={b.leaveTypeId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{b.name}</p>
              <p className="mt-1 text-sm text-slate-600"><span className="text-2xl font-semibold text-slate-900">{left}</span> of {b.entitlement} days left</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
              {!!b.pending && <p className="mt-1.5 text-xs text-amber-700">{b.pending} day(s) waiting for approval</p>}
            </div>
          );
        })}
        {balances.isLoading && <p className="text-sm text-slate-500">Loading balances…</p>}
      </div>

      {can(P.leaveManage) && (
        <Panel title="Leave requests" action={<Link to="/leave/data" className="text-sm font-medium text-brand-600 hover:underline">Open in Leave</Link>}>
          <ErrorMessage error={requests.error} />
          {requests.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !requests.data?.items.length ? (
            <p className="text-sm text-slate-500">No leave requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Type</th><th>Dates</th><th className="text-right">Days</th><th>Status</th></tr></thead>
                <tbody>
                  {requests.data.items.map((r) => (
                    <tr key={r.id}>
                      <td>{r.leaveType.name}</td>
                      <td>{fmtDate(r.startDate)}{r.endDate !== r.startDate && ` – ${fmtDate(r.endDate)}`}</td>
                      <td className="text-right">{r.days}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
