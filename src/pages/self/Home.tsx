import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../../api/dashboard';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';

// Employee home. No payroll information: employees don't see payslips or salary.
export default function EmployeeHome() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard', 'me'], queryFn: dashboardApi.employeeHome });
  const latest = data?.announcements[0];

  return (
    <>
      <PageHeader title={data?.employee ? `Welcome, ${data.employee.firstName}` : 'Welcome'} subtitle={data?.employee?.jobTitle ?? undefined} />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />

      {data && (
        <div className="space-y-6">
          {latest && (
            <Link to="/my/announcements" className="block rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 p-5 text-white shadow-sm">
              <p className="text-xs uppercase tracking-wide text-white/70">Latest announcement</p>
              <p className="mt-1 text-lg font-semibold">{latest.title}</p>
            </Link>
          )}

          {!data.employee && (
            <Card><EmptyState title="Your account is not linked to an employee record">Ask HR to link it to see your leave and requests.</EmptyState></Card>
          )}

          {data.cards && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Annual leave left" value={data.cards.remainingLeave ?? '-'} hint="days" to="/leave" />
              <StatCard label="Pending requests" value={data.cards.pendingRequests} to="/my/requests" />
              <StatCard label="Contract"
                value={data.cards.contract?.daysLeft != null ? `${data.cards.contract.daysLeft} days` : data.cards.contract ? 'Open-ended' : '-'}
                hint={data.cards.contract?.endDate ? `Ends ${fmtDate(data.cards.contract.endDate)}` : undefined} to="/my/contract" />
            </div>
          )}

          {data.leaveBalances && data.leaveBalances.length > 0 && (
            <Card title="Leave balances" action={<Link to="/leave/request" className="text-sm text-brand-600 hover:underline">Request leave</Link>}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.leaveBalances.map((b) => (
                  <div key={b.leaveTypeId} className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">{b.name}</p>
                    <p className="mt-1 text-xl font-semibold">{b.remaining} <span className="text-sm font-normal text-slate-500">/ {b.entitlement}</span></p>
                    {!!b.pending && <p className="text-xs text-amber-600">{b.pending} pending</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
