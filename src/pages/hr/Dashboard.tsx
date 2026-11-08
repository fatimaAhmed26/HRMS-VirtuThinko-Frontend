import { useQuery } from '@tanstack/react-query';
import { UserPlus, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../../api/dashboard';
import { useAuth } from '../../auth/useAuth';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { COUNTRY_NAMES, fmtDate, fmtMoney } from '../../lib/format';
import { P } from '../../lib/permissions';

export default function HrDashboard() {
  const { can } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: dashboardApi.admin });

  return (
    <>
      <PageHeader
        title="HR dashboard"
        subtitle={data ? `Showing ${data.entities.map((e) => COUNTRY_NAMES[e]).join(' and ')}` : undefined}
        actions={can(P.employeeCreate) && (
          <>
            <Link to="/employees/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              <UserPlus className="h-4 w-4" /> Add employee
            </Link>
            <Link to="/interns/new" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <GraduationCap className="h-4 w-4" /> Add intern
            </Link>
          </>
        )}
      />
      {isLoading && <Loading />}
      <ErrorMessage error={error} />

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active employees" value={data.employees.active} hint={`${data.employees.newHiresThisMonth} joined this month`} to="/employees" />
            <StatCard label="Off today" value={data.employees.onLeaveToday} to="/leave/calendar" />
            <StatCard label="Leave to approve" value={data.pending.leaveWithHr} hint={`${data.pending.leaveWithManager} with managers`} to="/leave/approvals" />
            <StatCard label="HR requests open" value={data.pending.hrRequests} to="/requests" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Needs your attention" className="lg:col-span-2">
              <ul className="divide-y divide-slate-100 text-sm">
                <Row label="Leave requests waiting for HR" value={data.pending.leaveWithHr} to="/leave/approvals" />
                <Row label="HR requests and letters" value={data.pending.hrRequests} to="/requests" />
                <Row label={`Contracts ending in ${data.expiring.withinDays} days`} value={data.expiring.contracts} to="/contracts" />
                <Row label={`Documents expiring in ${data.expiring.withinDays} days`} value={data.expiring.documents} to="/employees" />
                {can(P.payrollView) && <Row label="Allowances & deductions to approve" value={data.pending.payItemsToApprove} to="/payroll/payslips" />}
              </ul>
            </Card>

            <Card title="Headcount by department">
              {data.headcountByDepartment.length === 0 ? <EmptyState title="No employees yet" /> : (
                <ul className="space-y-2 text-sm">
                  {data.headcountByDepartment.map((d) => (
                    <li key={d.department} className="flex justify-between"><span>{d.department}</span><span className="font-medium">{d.employees}</span></li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {can(P.payrollView) && (
              <Card title={`Payroll (${data.payroll.currentPeriod})`} action={<Link to="/payroll" className="text-sm text-brand-600 hover:underline">Open payroll</Link>}>
                {data.payroll.latestRuns.length === 0 ? <EmptyState title="No payroll runs yet" /> : (
                  <ul className="space-y-3 text-sm">
                    {data.payroll.latestRuns.map((r) => (
                      <li key={r.id} className="flex items-center justify-between">
                        <Link to={`/payroll/runs/${r.id}`} className="font-medium hover:text-brand-600">{COUNTRY_NAMES[r.entity]} · {r.period}</Link>
                        <span className="flex items-center gap-3">
                          {r.totals.map((t) => <span key={t.currency}>{fmtMoney(t.net, t.currency)}</span>)}
                          <StatusBadge status={r.status} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
            <Card title="Recent announcements" action={<Link to="/announcements" className="text-sm text-brand-600 hover:underline">Manage</Link>}>
              {data.recentAnnouncements.length === 0 ? <EmptyState title="No announcements" /> : (
                <ul className="space-y-3 text-sm">
                  {data.recentAnnouncements.map((a) => (
                    <li key={a.id}><p className="font-medium">{a.title}</p><p className="text-xs text-slate-500">{fmtDate(a.publishAt)}</p></li>
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

function Row({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <li>
      <Link to={to} className="flex items-center justify-between py-2.5 hover:text-brand-600">
        <span>{label}</span>
        <span className={value > 0 ? 'rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700' : 'text-slate-400'}>{value}</span>
      </Link>
    </li>
  );
}
