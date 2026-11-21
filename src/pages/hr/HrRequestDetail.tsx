import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as requestsApi from '../../api/requests';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDateTime, fullName, humanize } from '../../lib/format';
import type { EmployeeRequest } from '../../types';

// Labels for the audit steps the backend records (request.<action>)
const HISTORY_LABEL: Record<string, string> = {
  create: 'Submitted',
  in_progress: 'In progress',
  generated: 'Letter generated',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

// One request as HR sees it: the details, the letter or file, the next steps and the history
export default function HrRequestDetail() {
  const { id } = useParams();
  const requestId = Number(id);
  const validId = Number.isInteger(requestId) && requestId > 0;
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data: r, isLoading, error } = useQuery({
    queryKey: ['requests', 'detail', requestId],
    queryFn: () => requestsApi.get(requestId),
    enabled: validId,
  });

  // Every step (start, generate, approve, complete, reject) goes through here and refreshes the request
  const act = useMutation({
    mutationFn: (step: () => Promise<EmployeeRequest>) => step(),
    onSuccess: () => {
      setComment('');
      setFile(null);
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });

  // Releasing a general request can attach a file for the employee first; letters are already in the request
  async function release(): Promise<EmployeeRequest> {
    if (!r) throw new Error('The request has not loaded yet');
    let documentId: number | undefined;
    if (file && !isLetter) {
      const title = `${r.type?.name ?? 'Request'} ${r.reference ?? ''}`.trim();
      documentId = (await documentsApi.upload({ file, employeeId: r.employeeId, category: 'other', title })).id;
    }
    return requestsApi.complete(requestId, { documentId, comment: comment.trim() || undefined });
  }

  if (!validId) return <ErrorMessage error="This request does not exist" />;

  const isLetter = r?.type?.category === 'letter';
  const open = r?.status === 'pending' || r?.status === 'in_progress';
  const doc = r?.resultDocument ?? null;
  const attachment = r?.attachment ?? null;
  const history = r?.history ?? [];

  const canStart = r?.status === 'pending';
  const canGenerate = isLetter && open;
  const canApprove = open && (!isLetter || !!doc);
  const canRelease = isLetter ? r?.status === 'approved' : open || r?.status === 'approved';
  const canReject = open;
  const hasNextSteps = canStart || canGenerate || canApprove || canRelease || canReject;

  return (
    <>
      <Link to="/requests" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> All HR requests
      </Link>

      {isLoading && <Loading />}
      <ErrorMessage error={error ?? act.error} />

      {r && (
        <>
          <PageHeader
            title={`${r.type?.name ?? 'Request'} · ${r.reference ?? ''}`}
            subtitle={`Submitted ${fmtDateTime(r.createdAt)}`}
            actions={<StatusBadge status={r.status} />}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card title="Request">
                <dl className="grid gap-5 text-sm sm:grid-cols-2">
                  <Field label="Employee">
                    {r.employee ? (
                      <Link to={`/employees/${r.employeeId}`} className="font-medium text-brand-600 hover:underline">{fullName(r.employee)}</Link>
                    ) : '-'}
                    <span className="block text-xs text-slate-500">
                      {r.employee?.employeeCode}{r.employee?.department?.name ? ` · ${r.employee.department.name}` : ''}
                    </span>
                  </Field>
                  <Field label="Type">{r.type?.name ?? '-'}</Field>
                  <Field label="Purpose">{r.purpose}</Field>
                  <Field label="Addressed to">{r.addressedTo || '-'}</Field>
                  <Field label="Note from the employee" wide>{r.details || '-'}</Field>
                  <Field label="Supporting document" wide>
                    {attachment ? (
                      <Button variant="secondary" className="px-3 py-1" onClick={() => documentsApi.download(attachment)}>
                        <Download className="h-4 w-4" /> {attachment.originalName}
                      </Button>
                    ) : 'None'}
                  </Field>
                  {r.decisionComment && (
                    <Field label={r.status === 'rejected' ? 'Reason for rejection' : 'Comment'} wide>{r.decisionComment}</Field>
                  )}
                </dl>
              </Card>

              <Card title={isLetter ? 'Letter' : 'File for the employee'}>
                {doc ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{doc.originalName}</p>
                      <p className="text-xs text-slate-500">
                        {doc.visibleToEmployee ? 'Released to the employee' : 'Only HR can see this until it is released'}
                      </p>
                    </div>
                    <Button variant="secondary" className="px-3 py-1" onClick={() => documentsApi.download(doc)}>
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </div>
                ) : (
                  <EmptyState title={isLetter ? 'No letter generated yet' : 'No file attached yet'}>
                    {isLetter ? 'Generate the letter to review it before you approve.' : 'You can attach a file when you complete the request.'}
                  </EmptyState>
                )}
              </Card>
            </div>

            <div className="space-y-6">
              {hasNextSteps && (
                <Card title="Next steps">
                  <div className="space-y-4">
                    {isLetter && open && !doc && (
                      <p className="text-sm text-slate-500">Generate the letter before you approve it.</p>
                    )}

                    {!isLetter && canRelease && (
                      <div>
                        <label className="label" htmlFor="req-file">File for the employee (optional)</label>
                        <input id="req-file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        <p className="mt-1 text-xs text-slate-500">PDF, JPEG or PNG, up to 5 MB.</p>
                      </div>
                    )}

                    {(canApprove || canRelease || canReject) && (
                      <div>
                        <label className="label" htmlFor="req-comment">Comment</label>
                        <textarea
                          id="req-comment"
                          className="input min-h-20"
                          maxLength={500}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={canReject ? 'Required to reject. The employee sees it.' : 'Optional'}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {canStart && (
                        <Button variant="secondary" loading={act.isPending} onClick={() => act.mutate(() => requestsApi.start(requestId))}>
                          Start processing
                        </Button>
                      )}
                      {canGenerate && (
                        <Button variant="secondary" loading={act.isPending} onClick={() => act.mutate(() => requestsApi.generate(requestId))}>
                          {doc ? 'Regenerate letter' : 'Generate letter'}
                        </Button>
                      )}
                      {canApprove && (
                        <Button variant="secondary" loading={act.isPending} onClick={() => act.mutate(() => requestsApi.approve(requestId, comment))}>
                          Approve
                        </Button>
                      )}
                      {canRelease && (
                        <Button loading={act.isPending} onClick={() => act.mutate(release)}>
                          {isLetter ? 'Release letter to employee' : 'Mark as completed'}
                        </Button>
                      )}
                      {canReject && (
                        <Button variant="danger" loading={act.isPending} disabled={!comment.trim()} onClick={() => act.mutate(() => requestsApi.reject(requestId, comment.trim()))}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <Card title="History">
                {history.length === 0 ? <EmptyState title="No steps yet" /> : (
                  <ol className="space-y-4 text-sm">
                    {history.map((h, i) => (
                      <li key={`${h.at}-${i}`} className="border-l-2 border-slate-200 pl-4">
                        <p className="font-medium text-slate-900">{HISTORY_LABEL[h.action] ?? humanize(h.action)}</p>
                        <p className="text-xs text-slate-500">{fmtDateTime(h.at)}</p>
                        {h.comment && <p className="mt-1 text-slate-600">{h.comment}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{children}</dd>
    </div>
  );
}
