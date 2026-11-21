import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as requestsApi from '../../api/requests';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDateTime, fullName } from '../../lib/format';
import type { RequestStatus } from '../../types';

const STATUS_FILTERS: { value: RequestStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

// HR queue: every request sent from the employee view, newest first. Open one to process it.
export default function HrRequests() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [typeId, setTypeId] = useState('');
  const [page, setPage] = useState(1);

  const { data: types = [] } = useQuery({ queryKey: ['requests', 'types'], queryFn: requestsApi.types });
  const { data, isLoading, error } = useQuery({
    queryKey: ['requests', 'queue', status, typeId, page],
    queryFn: () => requestsApi.list({ status: status || undefined, typeId: typeId ? Number(typeId) : undefined, page, pageSize: 20 }),
  });
  const rows = data?.items ?? [];

  const pickStatus = (value: RequestStatus | '') => {
    setStatus(value);
    setPage(1);
  };
  const pickType = (value: string) => {
    setTypeId(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="HR requests" subtitle="Letters and requests from employees. Open one to start it, generate the letter, then approve or reject it." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => pickStatus(f.value)}
              className={clsx('rounded-md px-3 py-1.5 text-sm', status === f.value ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900')}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select className="input w-auto" value={typeId} onChange={(e) => pickType(e.target.value)} aria-label="Request type">
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <Card>
        {isLoading && <Loading />}
        <ErrorMessage error={error} />
        {!isLoading && !error && rows.length === 0 && <EmptyState title="No requests here" />}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-medium">Reference</th>
                  <th className="py-2 pr-4 font-medium">Employee</th>
                  <th className="py-2 pr-4 font-medium">Request</th>
                  <th className="py-2 pr-4 font-medium">Purpose</th>
                  <th className="py-2 pr-4 font-medium">Submitted</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)} className="cursor-pointer hover:bg-slate-50">
                    <td className="py-3 pr-4">
                      <Link to={`/requests/${r.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-brand-600 hover:underline">{r.reference}</Link>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-slate-900">{r.employee ? fullName(r.employee) : '-'}</p>
                      <p className="text-xs text-slate-500">{r.employee?.employeeCode}</p>
                    </td>
                    <td className="py-3 pr-4 text-slate-900">{r.type?.name ?? '-'}</td>
                    <td className="max-w-xs truncate py-3 pr-4 text-slate-600">{r.purpose}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-600">{fmtDateTime(r.createdAt)}</td>
                    <td className="py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {data.page} of {data.totalPages} · {data.total} requests</span>
            <div className="flex gap-2">
              <Button variant="secondary" className="px-3 py-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" className="px-3 py-1" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
