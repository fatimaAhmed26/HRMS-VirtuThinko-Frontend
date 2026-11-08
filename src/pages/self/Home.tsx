import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as dashboardApi from '../../api/dashboard';
import * as documentsApi from '../../api/documents';
import * as requestsApi from '../../api/requests';
import { AnnouncementCard } from '../../components/AnnouncementCard';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate } from '../../lib/format';
import { expiryStatus } from './docStatus';
import { ServiceTile } from './ServiceTile';
import { HOME_SHORTCUTS } from './services';

const THIS_YEAR = new Date().getFullYear();

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

// Employee home (design p.65). No payroll information: employees don't see payslips or salary.
export default function EmployeeHome() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard', 'me'], queryFn: dashboardApi.employeeHome });
  const linked = !!data?.employee;
  const { data: requests = [] } = useQuery({ queryKey: ['requests', 'me'], queryFn: requestsApi.mine, enabled: linked });
  const { data: documents = [] } = useQuery({ queryKey: ['documents', 'me'], queryFn: documentsApi.mine, enabled: linked });

  const [latest, ...others] = data?.announcements ?? [];
  const expiring = documents
    .map((d) => ({ d, s: expiryStatus(d) }))
    .filter(({ s }) => s.tone !== 'ok');

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{greeting()}{data?.employee ? `, ${data.employee.firstName}` : ''}</h1>
          <p className="mt-1 text-sm text-slate-500">{dayjs().format('dddd, D MMMM YYYY')}</p>
        </div>
        {linked && (
          <Link to="/leave/request" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Request leave
          </Link>
        )}
      </div>

      {isLoading && <Loading />}
      <ErrorMessage error={error} />

      {data && (
        <div className="space-y-6">
          {latest && (
            <div>
              <AnnouncementCard a={latest} compact />
              <div className="mt-2 text-right"><Link to="/my/announcements" className="text-sm font-medium text-brand-600 hover:underline">All announcements</Link></div>
            </div>
          )}

          {!linked && (
            <Card><EmptyState title="Your account is not linked to an employee record">Ask HR to link it to see your leave, requests and documents.</EmptyState></Card>
          )}

          {expiring.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="mb-2 text-sm font-semibold text-amber-900">To do</h2>
              <ul className="space-y-2 text-sm text-amber-900">
                {expiring.map(({ d, s }) => (
                  <li key={d.id} className="flex items-center justify-between gap-3">
                    <span>Your <b>{d.title}</b> {s.daysLeft! < 0 ? `expired on ${fmtDate(d.expiryDate)}` : `expires in ${s.daysLeft} days`}: upload the renewed copy.</span>
                    <Link to="/my/documents?upload=1" className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium hover:bg-amber-100">Upload</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {linked && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Self-service</h2>
                <Link to="/my/self-service" className="text-sm font-medium text-brand-600 hover:underline">All services</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {HOME_SHORTCUTS.map((s) => <ServiceTile key={s.title} s={s} />)}
              </div>
            </section>
          )}

          {linked && (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card title={`Leave balance ${THIS_YEAR}`} action={<Link to="/leave" className="text-sm text-brand-600 hover:underline">View all</Link>}>
                {(data.leaveBalances ?? []).length === 0 ? <EmptyState title="No leave balances" /> : (
                  <ul className="space-y-4">
                    {data.leaveBalances!.map((b) => {
                      const pct = b.entitlement ? Math.max(0, Math.min(100, ((b.remaining ?? 0) / b.entitlement) * 100)) : 0;
                      return (
                        <li key={b.leaveTypeId}>
                          <div className="flex justify-between text-sm"><span>{b.name}</span><span className="font-medium">{b.remaining} / {b.entitlement} days</span></div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
                          {!!b.pending && <p className="mt-0.5 text-xs text-amber-600">{b.pending} days pending approval</p>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <Card title="My requests" action={<Link to="/my/requests" className="text-sm text-brand-600 hover:underline">New request</Link>}>
                {requests.length === 0 ? <EmptyState title="No requests yet" /> : (
                  <ul className="space-y-3 text-sm">
                    {requests.slice(0, 4).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2">
                        <span>{r.type?.name}</span><StatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card title="Announcements" action={<Link to="/my/announcements" className="text-sm text-brand-600 hover:underline">All</Link>}>
                {others.length === 0 ? <EmptyState title="Nothing else new" /> : (
                  <ul className="space-y-3 text-sm">
                    {others.slice(0, 4).map((a) => (
                      <li key={a.id}><p className="font-medium">{a.title}</p><p className="text-xs text-slate-500">Posted {fmtDate(a.publishAt)} · HR</p></li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
