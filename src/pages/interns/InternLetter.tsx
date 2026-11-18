import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as employeesApi from '../../api/employees';
import * as signaturesApi from '../../api/signatures';
import type { InternLetter as Kind } from '../../api/employees';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../../components/ui/Button';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Loading } from '../../components/ui/Spinner';
import { fmtDate } from '../../lib/format';
import { todayKey } from '../../lib/leave';
import { P } from '../../lib/permissions';

const TABS: [Kind, string][] = [['acceptance-letter', 'Internship acceptance letter'], ['proposal-form', 'Proposal acceptance form (Polytechnic)']];

export default function InternLetter() {
  const id = Number(useParams().id);
  const qc = useQueryClient();
  const { can } = useAuth();
  const [kind, setKind] = useState<Kind>('acceptance-letter');
  const [date, setDate] = useState(todayKey());
  const [weeks, setWeeks] = useState('');
  const opts = { date, weeks: weeks ? Number(weeks) : undefined };

  const intern = useQuery({ queryKey: ['employees', id], queryFn: () => employeesApi.get(id) });
  const pdf = useQuery({
    queryKey: ['interns', id, kind, opts],
    queryFn: () => employeesApi.internLetterBlob(id, kind, opts),
    enabled: intern.isSuccess,
    retry: false,
  });
  const url = useMemo(() => (pdf.data ? URL.createObjectURL(pdf.data) : null), [pdf.data]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const sign = useMutation({
    mutationFn: (signed: boolean) => employeesApi.update(id, { letterSignedAt: signed ? todayKey() : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees', id] });
      qc.invalidateQueries({ queryKey: ['interns'] });
    },
  });
  const requests = useQuery({ queryKey: ['signatures', id], queryFn: () => signaturesApi.list(id), enabled: intern.isSuccess });
  const send = useMutation({
    mutationFn: () => signaturesApi.send(id, kind),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signatures', id] }),
  });
  const cancelRequest = useMutation({
    mutationFn: (requestId: number) => signaturesApi.cancel(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signatures', id] }),
  });
  const downloadSignedCopy = useMutation({ mutationFn: (requestId: number) => signaturesApi.downloadSigned(requestId) });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  function copyLink(requestId: number, token: string) {
    void navigator.clipboard.writeText(`${window.location.origin}/sign/${token}`);
    setCopiedId(requestId);
  }
  const download = useMutation({ mutationFn: () => employeesApi.internLetterDownload(id, kind, opts) });

  if (intern.isLoading) return <Loading />;
  if (intern.error || !intern.data) return <ErrorMessage error={intern.error ?? 'Intern not found'} />;
  const i = intern.data;

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-10">
      <div>
        <p className="text-xs text-slate-500"><Link to="/interns" className="hover:underline">Interns</Link> / {i.firstName} {i.lastName} / Acceptance letter</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Acceptance letter</h1>
        <p className="mt-1 text-sm text-slate-500">Generated from the intern's details. Edit the intern and it updates here.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => setKind(k)}
            className={clsx('rounded-full border px-3 py-1 text-xs font-medium', kind === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600')}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pdf.isLoading && <Loading />}
          {pdf.error && <div className="p-5"><ErrorMessage error="The letter could not be generated. Check that the intern has a department and start and end dates." /></div>}
          {url && <iframe title="Letter preview" src={`${url}#toolbar=0`} className="h-[80vh] w-full" />}
        </div>

        <aside className="h-fit space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Status</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
              <span className={clsx('h-2 w-2 rounded-full', i.letterSignedAt ? 'bg-green-500' : 'bg-amber-500')} />
              {i.letterSignedAt ? `Signed on ${fmtDate(i.letterSignedAt)}` : 'Draft · print, sign and stamp'}
            </p>
          </div>
          {kind === 'acceptance-letter' && (
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="label">Letter date</span>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value || todayKey())} />
              </label>
              <label className="block"><span className="label">Weeks</span>
                <input className="input" inputMode="numeric" placeholder="Auto" value={weeks} onChange={(e) => setWeeks(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </label>
            </div>
          )}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-sm font-semibold text-slate-800">Signatures</p>
            {can(P.documentUpload) && (
              <Button variant="secondary" className="w-full" loading={send.isPending} disabled={!url} onClick={() => send.mutate()}>
                Send for signature
              </Button>
            )}
            <ul className="space-y-2">
              {(requests.data ?? []).map((r) => {
                const st = signaturesApi.signatureStatus(r);
                return (
                  <li key={r.id} className="rounded-lg border border-slate-200 p-2 text-xs">
                    <p className="font-medium text-slate-800">{r.title}</p>
                    <p className="mt-0.5 text-slate-500">Sent {fmtDate(r.createdAt)} · <span className={clsx('rounded-full px-1.5 py-0.5', st.cls)}>{st.label}</span></p>
                    {r.signedAt && <p className="text-slate-500">Signed by {r.signerName} on {fmtDate(r.signedAt)}</p>}
                    {r.status === 'signed' && (
                      <button type="button" className="mt-1 text-brand-600 hover:underline"
                        onClick={() => downloadSignedCopy.mutate(r.id)}>Download signed copy</button>
                    )}
                    {r.token && (
                      <div className="mt-1 flex gap-3">
                        <button type="button" className="text-brand-600 hover:underline" onClick={() => copyLink(r.id, r.token!)}>
                          {copiedId === r.id ? 'Link copied' : 'Copy link'}
                        </button>
                        <button type="button" className="text-slate-500 hover:underline" onClick={() => cancelRequest.mutate(r.id)}>Cancel</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {!requests.data?.length && <p className="text-xs text-slate-500">Nothing sent yet.</p>}
            <ErrorMessage error={send.error || cancelRequest.error || downloadSignedCopy.error} />
          </div>
          <Button className="w-full" loading={download.isPending} disabled={!url} onClick={() => download.mutate()}>Download PDF</Button>
          {can(P.employeeEdit) && (
            <>
              <Button variant="secondary" className="w-full" loading={sign.isPending} onClick={() => sign.mutate(!i.letterSignedAt)}>
                {i.letterSignedAt ? 'Mark as not signed' : 'Mark as signed'}
              </Button>
              <Link to={`/interns/${i.id}/edit`} className="block"><Button variant="secondary" className="w-full">Edit intern details</Button></Link>
            </>
          )}
          <ErrorMessage error={download.error || sign.error} />
        </aside>
      </div>
    </div>
  );
}
