import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as leaveApi from '../../api/leave';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate, fullName } from '../../lib/format';
import { typeColor } from '../../lib/leave';
import { P } from '../../lib/permissions';
import type { LeaveRequest, LeaveStatus } from '../../types';

const STATUSES: { value: LeaveStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending_manager', label: 'With manager' },
  { value: 'pending_hr', label: 'With HR' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Leaves data (design screen 32): your own history and balance. HR also gets an "All employees" tab.
export default function LeavesData() {
  const { can } = useAuth();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const submitted = params.get('submitted') === '1';

  return (
    <>
      <PageHeader title="Leaves data" subtitle="Your leave history and balances"
        actions={can(P.leaveRequest) && <Link to="/leave/request"><Button><Plus className="h-4 w-4" /> Request leave</Button></Link>} />
      {submitted && <p className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">Your leave request was sent. You'll be notified when it's decided.</p>}
      {can(P.leaveManage) && (
        <div className="mb-4 flex gap-1 border-b border-slate-200">
          {(['mine', 'all'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={clsx('-mb-px border-b-2 px-4 py-2 text-sm font-medium', tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700')}>
              {t === 'mine' ? 'My leave' : 'All employees'}
            </button>
          ))}
        </div>
      )}
      {tab === 'mine' ? <MyLeave /> : <AllLeave />}
    </>
  );
}

function MyLeave() {
  const qc = useQueryClient();
  const { data: bal } = useQuery({ queryKey: ['leave', 'balances', 'me'], queryFn: leaveApi.myBalances });
  const { data: requests = [], isLoading, error } = useQuery({ queryKey: ['leave', 'requests', 'me'], queryFn: leaveApi.myRequests });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const cancel = useMutation({ mutationFn: leaveApi.cancel, onSuccess: () => qc.invalidateQueries({ queryKey: ['leave'] }) });

  const annual = bal?.balances.find((b) => b.code === 'ANNUAL');
  const typeNames = [...new Set(requests.map((r) => r.leaveType.name))];
  const shown = requests.filter((r) => (!typeFilter || r.leaveType.name === typeFilter) && (!statusFilter || r.status === statusFilter));
  const pct = (n = 0) => (annual?.entitlement ? (n / annual.entitlement) * 100 : 0);

  return (
    <div className="space-y-4">
      {annual && (
        <Card title={`Annual leave balance ${bal?.year}`}>
          <p className="text-2xl font-semibold text-brand-700">{annual.remaining} <span className="text-sm font-normal text-slate-500">/ {annual.entitlement} days remaining</span></p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-brand-600" style={{ width: `${pct(annual.used)}%` }} />
            <div className="bg-amber-400" style={{ width: `${pct(annual.pending)}%` }} />
          </div>
          <p className="mt-2 flex gap-4 text-xs text-slate-600">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand-600" />Used: {annual.used}d</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Pending: {annual.pending}d</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-slate-200" />Available: {annual.remaining}d</span>
          </p>
        </Card>
      )}

      <div className="flex gap-3">
        <select className="input max-w-48" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {typeNames.map((n) => <option key={n}>{n}</option>)}
        </select>
        <select className="input max-w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <Card title={`Leave history · ${shown.length} record${shown.length === 1 ? '' : 's'}`}>
        {isLoading && <Loading />}
        <ErrorMessage error={error ?? cancel.error} />
        {!isLoading && shown.length === 0 && <EmptyState title="No leave yet" />}
        <ul className="divide-y divide-slate-100">
          {shown.map((r) => <HistoryRow key={r.id} r={r} onCancel={['pending_manager', 'pending_hr'].includes(r.status) ? () => cancel.mutate(r.id) : undefined} />)}
        </ul>
      </Card>
    </div>
  );
}

function HistoryRow({ r, onCancel, showName = false }: { r: LeaveRequest; onCancel?: () => void; showName?: boolean }) {
  const lastComment = [...r.approvals].reverse().find((a) => a.comment)?.comment;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="flex items-start gap-3">
        <span className={clsx('mt-1 h-8 w-1 rounded border', typeColor(r.leaveType.code))} />
        <div>
          <p className="text-sm font-medium text-slate-900">{showName ? `${fullName(r.employee)} · ` : ''}{r.leaveType.name}</p>
          <p className="text-xs text-slate-500">{fmtDate(r.startDate)} – {fmtDate(r.endDate)} · {r.days}d{r.reason ? ` · ${r.reason}` : ''}</p>
          {lastComment && <p className="text-xs text-slate-500">Comment: {lastComment}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={r.status} />
        {onCancel && <Button variant="ghost" className="px-3 py-1" onClick={onCancel}>Cancel</Button>}
      </div>
    </li>
  );
}

function AllLeave() {
  const [status, setStatus] = useState<LeaveStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave', 'requests', 'all', status, page],
    queryFn: () => leaveApi.listRequests({ status: status || undefined, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });
  return (
    <div className="space-y-4">
      <select className="input max-w-48" value={status} onChange={(e) => { setStatus(e.target.value as LeaveStatus | ''); setPage(1); }}>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <Card title={data ? `${data.total} request${data.total === 1 ? '' : 's'}` : 'Requests'}>
        {isLoading && <Loading />}
        <ErrorMessage error={error} />
        {data && data.items.length === 0 && <EmptyState title="No requests" />}
        <ul className="divide-y divide-slate-100">{data?.items.map((r) => <HistoryRow key={r.id} r={r} showName />)}</ul>
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-between text-sm">
            <span>Page {data.page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
