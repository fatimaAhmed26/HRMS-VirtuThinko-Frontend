import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Paperclip } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as leaveApi from '../../api/leave';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate, fullName } from '../../lib/format';
import { P } from '../../lib/permissions';

// One leave request: who, when, why, the document and the approval trail. Notifications link here.
export default function LeaveRequestDetail() {
  const { id } = useParams();
  const requestId = Number(id);
  const { can, user } = useAuth();
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const { data: r, isLoading, error } = useQuery({ queryKey: ['leave', 'requests', 'detail', requestId], queryFn: () => leaveApi.getRequest(requestId) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['leave'] });
  const approve = useMutation({ mutationFn: () => leaveApi.approve(requestId), onSuccess: refresh });
  const reject = useMutation({ mutationFn: () => leaveApi.reject(requestId, comment.trim()), onSuccess: refresh });

  const isApprover = can(P.leaveApprove) || can(P.leaveManage);
  const pending = r?.status === 'pending_manager' || r?.status === 'pending_hr';
  const canDecide = !!r && pending && isApprover && r.employeeId !== user?.employeeId;

  return (
    <>
      <PageHeader
        title={r ? `${r.leaveType.name} · ${fullName(r.employee)}` : 'Leave request'}
        subtitle={r ? `${r.employee.department?.name ?? '-'} · ${r.employee.country}` : undefined}
      />
      <Link to={isApprover ? '/leave/approvals' : '/leave/data'} className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        {isApprover ? 'Back to approvals' : 'Back to my leave'}
      </Link>
      {isLoading && <Loading />}
      <ErrorMessage error={error ?? approve.error ?? reject.error} />

      {r && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Request" className="lg:col-span-2">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Item label="Dates" value={`${fmtDate(r.startDate)} – ${fmtDate(r.endDate)}`} />
              <Item label="Days" value={r.days} />
              <Item label="Status" value={<StatusBadge status={r.status} />} />
              <Item label="Submitted" value={fmtDate(r.createdAt)} />
              <Item label="Reason" value={r.reason ?? '-'} wide />
            </dl>
            {r.attachment && (
              <button onClick={() => documentsApi.download({ id: r.attachment!.id, originalName: r.attachment!.originalName })}
                className="mt-5 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
                <Paperclip className="h-4 w-4" /> {r.attachment.originalName}
              </button>
            )}
          </Card>

          <Card title="Approval trail">
            {r.approvals.length === 0 && <p className="text-sm text-slate-500">No decisions yet.</p>}
            <ul className="space-y-4 text-sm">
              {r.approvals.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.stage === 'manager' ? 'Line manager' : 'HR'} · {a.decision}</p>
                  <p className="text-xs text-slate-500">{a.approverName} · {fmtDate(a.createdAt)}</p>
                  {a.comment && <p className="mt-1 text-slate-600">{a.comment}</p>}
                </li>
              ))}
            </ul>
          </Card>

          {canDecide && (
            <Card title="Decision" className="lg:col-span-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <textarea className="input min-h-20 flex-1" placeholder="Comment (needed to reject)" value={comment} maxLength={500}
                  onChange={(e) => setComment(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="secondary" loading={reject.isPending} disabled={!comment.trim()} onClick={() => reject.mutate()}>Reject</Button>
                  <Button loading={approve.isPending} onClick={() => approve.mutate()}>Approve</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

function Item({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
