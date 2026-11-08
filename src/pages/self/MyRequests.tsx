import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Download } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as documentsApi from '../../api/documents';
import * as requestsApi from '../../api/requests';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState, ErrorMessage } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/PageHeader';
import { Loading } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtDate } from '../../lib/format';
import type { EmployeeRequest, RequestType } from '../../types';

// Letters first, then the other request types, in the design's order (p.68)
const ORDER = ['SALARY_CERT', 'EMPLOYMENT_CERT', 'EXPERIENCE_CERT', 'NOC', 'SALARY_TRANSFER', 'REIMBURSEMENT', 'SALARY_ADVANCE', 'BANK_CHANGE', 'DETAILS_CHANGE', 'DOCUMENT_REQUEST', 'OTHER'];
const rank = (code: string) => (ORDER.indexOf(code) === -1 ? 99 : ORDER.indexOf(code));

// What the employee sees for each status
const STATUS_TEXT: Record<string, string> = { pending: 'With HR', in_progress: 'In progress', approved: 'Approved', completed: 'Ready', rejected: 'Rejected', cancelled: 'Cancelled' };

export default function MyRequests() {
  const [params, setParams] = useSearchParams();
  const { data: types = [], isLoading: typesLoading } = useQuery({ queryKey: ['requests', 'types'], queryFn: requestsApi.types });
  const { data: mine = [], isLoading, error } = useQuery({ queryKey: ['requests', 'me'], queryFn: requestsApi.mine });

  const active = types.filter((t) => t.active).sort((a, b) => rank(a.code) - rank(b.code));
  const selected = active.find((t) => t.code === params.get('type')) ?? active[0];

  return (
    <>
      <PageHeader title="HR requests" subtitle="Ask HR for letters, changes and claims. You'll be notified at each step." />
      {typesLoading && <Loading />}

      <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {active.map((t) => (
          <button key={t.id} onClick={() => setParams({ type: t.code }, { replace: true })}
            className={clsx('rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition',
              t.id === selected?.id ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200 hover:border-brand-200')}>
            <p className="text-sm font-semibold text-slate-900">{t.name}</p>
            {t.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{t.description}</p>}
          </button>
        ))}
      </div>

      {selected && <RequestForm key={selected.id} type={selected} />}

      <Card title="My requests" className="mt-6">
        {isLoading && <Loading />}
        <ErrorMessage error={error} />
        {!isLoading && mine.length === 0 && <EmptyState title="You haven't made any requests yet" />}
        <ul className="divide-y divide-slate-100">
          {mine.map((r) => <RequestRow key={r.id} r={r} />)}
        </ul>
      </Card>
    </>
  );
}

function RequestForm({ type }: { type: RequestType }) {
  const qc = useQueryClient();
  const isLetter = type.category === 'letter';
  const [addressedTo, setAddressedTo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: async () => {
      let attachmentId: number | undefined;
      if (file) attachmentId = (await documentsApi.upload({ file, category: 'request_attachment', title: `${type.name} attachment` })).id;
      return requestsApi.create({ typeId: type.id, purpose, details: details || undefined, addressedTo: addressedTo || undefined, attachmentId });
    },
    onSuccess: (r) => {
      setSent(`${r.reference ?? 'Request'} sent to HR.`);
      setAddressedTo(''); setPurpose(''); setDetails(''); setFile(null);
      qc.invalidateQueries({ queryKey: ['requests', 'me'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSent(null);
    if (purpose.trim().length < 3) return setFormError('Please state the purpose');
    if (type.requiresAttachment && !file) return setFormError('Please attach the supporting document');
    if (file && file.size > 5 * 1024 * 1024) return setFormError('The file must be 5 MB or smaller');
    setFormError(null);
    submit.mutate();
  }

  return (
    <Card title={type.name}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {isLetter && (
            <div>
              <label className="label" htmlFor="addressedTo">Addressed to</label>
              <input id="addressedTo" className="input" placeholder="e.g. National Bank of Bahrain" value={addressedTo} onChange={(e) => setAddressedTo(e.target.value)} maxLength={150} />
            </div>
          )}
          <div className={isLetter ? '' : 'sm:col-span-2'}>
            <label className="label" htmlFor="purpose">Purpose</label>
            <input id="purpose" className="input" placeholder={isLetter ? 'e.g. personal loan' : 'What do you need?'} value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={255} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="details">Note to HR</label>
          <textarea id="details" className="input min-h-20" placeholder="Optional" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
        </div>
        <div>
          <label className="label" htmlFor="file">Attachment {type.requiresAttachment ? '(required)' : '(optional)'}</label>
          <input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <p className="mt-1 text-xs text-slate-500">PDF, JPEG or PNG, up to 5 MB.</p>
        </div>

        <ErrorMessage error={formError ?? submit.error} />
        {sent && <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{sent}</p>}

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{isLetter ? 'Letters are usually ready within 1 working day.' : 'HR will review your request.'}</p>
          <Button type="submit" loading={submit.isPending}>Submit request</Button>
        </div>
      </form>
    </Card>
  );
}

function RequestRow({ r }: { r: EmployeeRequest }) {
  const qc = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => requestsApi.cancel(r.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests', 'me'] }),
  });
  const ready = r.status === 'completed' && r.resultDocument?.visibleToEmployee;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{r.type?.name}</p>
        <p className="text-xs text-slate-500">{r.reference} · {fmtDate(r.createdAt)} · {r.purpose}</p>
        {r.status === 'rejected' && r.decisionComment && <p className="mt-1 text-xs text-red-600">Reason: {r.decisionComment}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span title={STATUS_TEXT[r.status]}><StatusBadge status={r.status} /></span>
        {ready && r.resultDocument && (
          <Button variant="secondary" className="px-3 py-1" onClick={() => documentsApi.download(r.resultDocument!)}><Download className="h-4 w-4" /> Download</Button>
        )}
        {r.status === 'pending' && (
          <Button variant="ghost" className="px-3 py-1" loading={cancel.isPending} onClick={() => cancel.mutate()}>Cancel</Button>
        )}
      </div>
    </li>
  );
}
