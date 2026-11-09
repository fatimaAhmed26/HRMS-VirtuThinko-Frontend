import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import * as documentsApi from '../../api/documents';
import * as leaveApi from '../../api/leave';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card, StatCard } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate, fullName } from '../../lib/format';
import { daysBetween, dateKey } from '../../lib/leave';
import { P } from '../../lib/permissions';
import type { LeaveRequest, LeaveType } from '../../types';

// The "Policy check" column: what the approver should look at
function policyCheck(r: LeaveRequest, type?: LeaveType): { tone: string; text: string } {
  if (type?.requiresAttachment && !r.attachment) return { tone: 'bg-red-50 text-red-700', text: 'Document missing' };
  if (type?.noticeDays && r.days > type.noticeFreeDays && daysBetween(dateKey(r.createdAt), dateKey(r.startDate)) < type.noticeDays) {
    return { tone: 'bg-amber-50 text-amber-700', text: `Short notice (<${type.noticeDays} days)` };
  }
  if (r.attachment) return { tone: 'bg-green-50 text-green-700', text: 'Document attached' };
  if (r.reason) return { tone: 'bg-green-50 text-green-700', text: 'Reason given' };
  return { tone: 'bg-green-50 text-green-700', text: 'Within policy' };
}

// Approvals (design screen 37): managers approve their team first, then HR gives the final decision
export default function Approvals() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const isHr = can(P.leaveManage);
  const { data: pending = [], isLoading, error } = useQuery({ queryKey: ['leave', 'requests', 'pending'], queryFn: leaveApi.pendingApprovals });
  const { data: bhTypes = [] } = useQuery({ queryKey: ['leave', 'types', 'BH'], queryFn: () => leaveApi.types('BH') });
  const { data: saTypes = [] } = useQuery({ queryKey: ['leave', 'types', 'SA'], queryFn: () => leaveApi.types('SA') });
  // HR also sees how many were approved / rejected overall
  const { data: approved } = useQuery({ queryKey: ['leave', 'count', 'approved'], queryFn: () => leaveApi.listRequests({ status: 'approved', pageSize: 1 }), enabled: isHr });
  const { data: rejected } = useQuery({ queryKey: ['leave', 'count', 'rejected'], queryFn: () => leaveApi.listRequests({ status: 'rejected', pageSize: 1 }), enabled: isHr });
  const typeOf = (id: number) => [...bhTypes, ...saTypes].find((t) => t.id === id);

  const refresh = () => { qc.invalidateQueries({ queryKey: ['leave'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); };
  const approve = useMutation({ mutationFn: (id: number) => leaveApi.approve(id), onSuccess: refresh });
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);

  return (
    <>
      <PageHeader title="Approvals" subtitle={isHr ? 'Requests waiting for you as line manager or HR.' : 'Leave requests from your team.'} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={pending.length} />
        {isHr && <StatCard label="Approved" value={approved?.total ?? '-'} hint="all time" />}
        {isHr && <StatCard label="Rejected" value={rejected?.total ?? '-'} hint="all time" />}
      </div>

      <Card>
        {isLoading && <Loading />}
        <ErrorMessage error={error ?? approve.error} />
        {!isLoading && pending.length === 0 && <EmptyState title="Nothing waiting for you" />}
        {pending.length > 0 && (
          <div className="-mx-5 -my-5 overflow-x-auto">
            <table className="table">
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Policy check</th><th>Status</th><th /></tr></thead>
              <tbody>
                {pending.map((r) => {
                  const check = policyCheck(r, typeOf(r.leaveTypeId));
                  return (
                    <tr key={r.id}>
                      <td>
                        <p className="font-medium">{fullName(r.employee)}</p>
                        <p className="text-xs text-slate-500">{r.employee.department?.name ?? '-'} · {r.employee.country}</p>
                      </td>
                      <td>{r.leaveType.name}{r.reason && <p className="max-w-48 truncate text-xs text-slate-500" title={r.reason}>{r.reason}</p>}</td>
                      <td className="whitespace-nowrap">{fmtDate(r.startDate)}{r.days > 1 && <> – {fmtDate(r.endDate)}</>}</td>
                      <td>{r.days}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${check.tone}`}>{check.text}</span>
                        {r.attachment && (
                          <button onClick={() => documentsApi.download({ id: r.attachment!.id, originalName: r.attachment!.originalName })}
                            className="ml-2 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"><Paperclip className="h-3 w-3" />View</button>
                        )}
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="whitespace-nowrap text-right">
                        <Button variant="secondary" className="mr-2 px-3 py-1" onClick={() => setRejecting(r)}>Reject</Button>
                        <Button className="px-3 py-1" loading={approve.isPending && approve.variables === r.id} onClick={() => approve.mutate(r.id)}>Approve</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-slate-500">Approved unpaid and half-paid leave is deducted in that month's payroll.</p>

      <Modal title="Reject leave request" open={!!rejecting} onClose={() => setRejecting(null)}>
        {rejecting && <RejectForm r={rejecting} onDone={() => { setRejecting(null); refresh(); }} />}
      </Modal>
    </>
  );
}

function RejectForm({ r, onDone }: { r: LeaveRequest; onDone: () => void }) {
  const [comment, setComment] = useState('');
  const reject = useMutation({ mutationFn: () => leaveApi.reject(r.id, comment.trim()), onSuccess: onDone });
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (comment.trim()) reject.mutate();
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">{fullName(r.employee)} · {r.leaveType.name} · {fmtDate(r.startDate)} – {fmtDate(r.endDate)}</p>
      <div>
        <label className="label" htmlFor="rejectReason">Reason (the employee will see this)</label>
        <textarea id="rejectReason" className="input min-h-24" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} autoFocus />
      </div>
      <ErrorMessage error={reject.error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="danger" loading={reject.isPending} disabled={!comment.trim()}>Reject request</Button>
      </div>
    </form>
  );
}
