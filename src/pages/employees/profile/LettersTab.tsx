// Profile tab "Letters & certificates" (design screen 10): HR issues letters from the company templates
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import * as documentsApi from '../../../api/documents';
import * as requestsApi from '../../../api/requests';
import { useAuth } from '../../../auth/useAuth';
import { Button } from '../../../components/ui/Button';
import { ErrorMessage } from '../../../components/ui/Feedback';
import { Modal } from '../../../components/ui/Modal';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { fmtDate } from '../../../lib/format';
import { P } from '../../../lib/permissions';
import type { Employee, EmployeeRequest, RequestType } from '../../../types';
import { Panel } from './ui';

function IssueDialog({ emp, type, onClose }: { emp: Employee; type: RequestType | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [purpose, setPurpose] = useState('');
  const [addressedTo, setAddressedTo] = useState('');
  const [issued, setIssued] = useState<EmployeeRequest | null>(null);

  const issue = useMutation({
    mutationFn: () => requestsApi.issue({ employeeId: emp.id, typeId: type!.id, purpose: purpose.trim(), addressedTo: addressedTo.trim() || undefined }),
    onSuccess: async (r) => {
      setIssued(r);
      qc.invalidateQueries({ queryKey: ['requests'] });
      qc.invalidateQueries({ queryKey: ['employees', emp.id, 'history'] });
      if (r.resultDocumentId) await documentsApi.download({ id: r.resultDocumentId, originalName: `${type!.code.toLowerCase()}-${r.reference}.pdf` });
    },
  });

  function close() {
    setPurpose(''); setAddressedTo(''); setIssued(null); issue.reset();
    onClose();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (purpose.trim().length >= 2) issue.mutate();
  }

  return (
    <Modal title={type ? `${type.name} for ${emp.firstName} ${emp.lastName}` : ''} open={!!type} onClose={close}>
      {issued ? (
        <div className="space-y-3 text-sm">
          <p className="text-slate-700">Letter <b>{issued.reference}</b> was issued and downloaded. It is saved in the employee's documents (HR only).</p>
          <div className="flex justify-end"><Button onClick={close}>Done</Button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {type?.description && <p className="text-sm text-slate-500">{type.description}</p>}
          <label className="block"><span className="label">Addressed to</span>
            <input className="input" value={addressedTo} maxLength={150} onChange={(e) => setAddressedTo(e.target.value)} placeholder="e.g. National Bank of Bahrain (empty = To whom it may concern)" />
          </label>
          <label className="block"><span className="label">Purpose</span>
            <input className="input" value={purpose} maxLength={255} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Opening a bank account" required />
          </label>
          <p className="text-xs text-slate-500">Uses the company letterhead and this letter's template. The PDF downloads straight away and is kept for HR only.</p>
          <ErrorMessage error={issue.error} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" loading={issue.isPending} disabled={purpose.trim().length < 2}>Generate letter</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function LettersTab({ emp, initialType }: { emp: Employee; initialType?: boolean }) {
  const { can } = useAuth();
  const canIssue = can(P.requestProcess);
  const [chosen, setChosen] = useState<RequestType | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const types = useQuery({ queryKey: ['requests', 'types'], queryFn: requestsApi.types });
  const issued = useQuery({
    queryKey: ['requests', { employeeId: emp.id }],
    queryFn: () => requestsApi.list({ employeeId: emp.id, pageSize: 50 }),
    enabled: can(P.requestView) || canIssue,
  });
  const letterTypes = (types.data ?? []).filter((t) => t.category === 'letter' && t.active);
  const letters = (issued.data?.items ?? []).filter((r) => r.type?.category === 'letter');

  async function download(r: EmployeeRequest) {
    if (!r.resultDocumentId) return;
    setBusy(r.id);
    try { await documentsApi.download({ id: r.resultDocumentId, originalName: r.resultDocument?.originalName ?? `${r.reference}.pdf` }); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      {canIssue && (
        <Panel title="Generate an HR letter or certificate">
          <ErrorMessage error={types.error} />
          <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${initialType ? 'rounded-lg ring-2 ring-brand-200 ring-offset-4' : ''}`}>
            {letterTypes.map((t) => (
              <div key={t.id} className="flex flex-col justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                  {t.description && <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>}
                </div>
                <div className="mt-3"><Button variant="secondary" onClick={() => setChosen(t)}>Generate</Button></div>
              </div>
            ))}
            {types.isSuccess && letterTypes.length === 0 && <p className="text-sm text-slate-500">No letter types are set up. Add them in Settings › Request types.</p>}
          </div>
        </Panel>
      )}

      <Panel title="Issued letters & certificates">
        <ErrorMessage error={issued.error} />
        {issued.isLoading ? <p className="text-sm text-slate-500">Loading…</p> : !letters.length ? (
          <p className="text-sm text-slate-500">No letters issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Letter</th><th>Date</th><th>Addressed to</th><th>Ref</th><th>Status</th><th /></tr></thead>
              <tbody>
                {letters.map((r) => (
                  <tr key={r.id}>
                    <td>{r.type?.name}</td>
                    <td>{fmtDate(r.completedAt ?? r.createdAt)}</td>
                    <td>{r.addressedTo || 'To whom it may concern'}</td>
                    <td className="font-mono text-xs">{r.reference}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-right">
                      {r.resultDocumentId && <Button variant="secondary" loading={busy === r.id} onClick={() => download(r)}>Download</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <IssueDialog emp={emp} type={chosen} onClose={() => setChosen(null)} />
    </div>
  );
}
